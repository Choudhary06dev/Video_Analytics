import cv2
import numpy as np
import time
import threading
import requests
from datetime import datetime
import os
from config import BACKEND_URL

# Optimize OpenCV/FFmpeg for low-latency RTSP reads.
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = (
    "rtsp_transport;tcp|rtsp_flags;prefer_tcp|fflags;nobuffer|flags;low_delay|"
    "max_delay;0|stimeout;10000000"
)

import torch
from pipelines.model_manager import ModelManager

# Select device automatically
device = "cuda" if torch.cuda.is_available() else "cpu"

CONF_THRESHOLD = 0.25
IOU_THRESHOLD = 0.45
INFERENCE_IMAGE_SIZE = 640
STREAM_JPEG_QUALITY = 85
SNAPSHOT_JPEG_QUALITY = 98
STREAM_MAX_WIDTH = 1280

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")


def _resize_for_stream(frame):
    height, width = frame.shape[:2]
    if width <= STREAM_MAX_WIDTH:
        return frame
    scale = STREAM_MAX_WIDTH / width
    return cv2.resize(frame, (STREAM_MAX_WIDTH, int(height * scale)), interpolation=cv2.INTER_AREA)


class InferenceEngine:
    def __init__(self, camera_id: int, source):
        if isinstance(source, str) and source.isdigit():
            source = int(source)
        self.camera_id = camera_id
        self.source = source
        self.video = None
        
        self.scene_state = {}
        self.placeholder_frame = self._build_placeholder_frame(f"CAMERA {camera_id} - NO SIGNAL")
        self.latest_intelligence = {
            "person_count": 0,
            "objects": [],
            "stable_objects": [],
            "last_update": 0.0
        }
        
        self.enabled_scenarios = set()
        self.scenario_configs = {}
        self._load_initial_config()

        # Instantiate and register all working scenarios
        from pipelines.scenarios.restricted_entry import UnauthorizedEntryScenario
        from pipelines.scenarios.weapon_detection import WeaponDetectionScenario
        from pipelines.scenarios.mobile_phone import MobilePhoneUsageScenario
        from pipelines.scenarios.vehicle_tracking import VehicleTrackingScenario
        from pipelines.scenarios.fire_smoke import FireSmokeDetectionScenario
        from pipelines.scenarios.unauthorized_parking import UnauthorizedParkingScenario
        from pipelines.scenarios.visitor_limit import VisitorLimitScenario
        from pipelines.scenarios.face_recognition import FaceRecognitionScenario

        self.scenarios = [
            UnauthorizedEntryScenario(),
            WeaponDetectionScenario(),
            MobilePhoneUsageScenario(),
            VehicleTrackingScenario(),
            FireSmokeDetectionScenario(),
            UnauthorizedParkingScenario(),
            VisitorLimitScenario(),
            FaceRecognitionScenario("BLACKLISTED_PERSON_ALERT_FACIAL_RECOGNITION"),
            FaceRecognitionScenario("ENTRY_EXIT_TRACKING_OF_VISITORS_FACE_RECOGNITION")
        ]

        # Register required models dynamically
        self._register_required_models()

        from logger import logger
        logger.info(f"[CAMERA {camera_id}] ENGINE START | Source: {source} | Enabled Scenarios: {self.enabled_scenarios}")
        
        self.latest_raw_frame = None
        self.processed_frame_bytes = self.placeholder_frame
        self.snapshot_frame_bytes = self.placeholder_frame
        self.processed_events = []
        self.running = True
        
        # Exponential backoff for reconnection
        self._reconnect_delay = 5
        self._max_reconnect_delay = 30
        self._consecutive_failures = 0
        
        # Two threads: One for Capture, one for Inference
        self.capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.inference_thread = threading.Thread(target=self._inference_loop, daemon=True)
        
        self.capture_thread.start()
        self.inference_thread.start()

    def _register_required_models(self):
        base_model_name = "custom_yolov8.pt" if os.path.exists(os.path.join(MODELS_DIR, "custom_yolov8.pt")) else "yolov8n.pt"
        required = set()
        for scenario in self.scenarios:
            if scenario.key in self.enabled_scenarios:
                model_name = scenario.required_model
                if model_name == "yolov8n.pt":
                    model_name = base_model_name
                # Only register standard YOLO models; face recognition uses MTCNN/resnet loaded internally
                if model_name != "yolov8n-face.pt":
                    required.add(model_name)
        
        # Fallback to keep at least base model loaded
        if not required:
            required.add(base_model_name)
            
        ModelManager.register_camera_models(self.camera_id, required)

    def _load_initial_config(self):
        try:
            response = requests.get(f"{BACKEND_URL}/internal/cameras/{self.camera_id}/scenarios/enabled", timeout=2)
            if response.status_code == 200:
                data = response.json()
                self.enabled_scenarios = set(data.get("enabled_scenarios", []))
                self.scenario_configs = data.get("scenario_configs", {})
        except:
            pass

    def update_config(self, enabled_names: list, scenario_configs: dict = None):
        self.enabled_scenarios = set(enabled_names)
        if scenario_configs is not None:
            self.scenario_configs = scenario_configs
        
        # Update ModelManager registrations dynamically
        self._register_required_models()
        
        from logger import logger
        logger.info(f"[CAMERA {self.camera_id}] CONFIG RELOADED | Enabled: {self.enabled_scenarios}")

    def _capture_loop(self):
        """Thread 1: Keeps the OpenCV buffer empty and always has the LATEST frame ready."""
        while self.running:
            if not self._ensure_camera():
                wait_time = min(self._reconnect_delay * (2 ** min(self._consecutive_failures, 4)), self._max_reconnect_delay)
                self._consecutive_failures += 1
                time.sleep(wait_time)
                continue
            
            success, frame = self.video.read()
            if success:
                self.latest_raw_frame = frame
                self._consecutive_failures = 0
            else:
                self._consecutive_failures += 1
                self.video.release()
                time.sleep(1)
            time.sleep(0.001)

    def _inference_loop(self):
        """Thread 2: Processes the latest available frame for AI."""
        while self.running:
            if self.latest_raw_frame is not None:
                # Use a local copy to avoid mutation during processing
                frame = self.latest_raw_frame.copy()
                frame_bytes, events, snapshot_bytes = self._perform_inference(frame)
                self.processed_frame_bytes = frame_bytes
                self.snapshot_frame_bytes = snapshot_bytes
                self.processed_events = events
            else:
                time.sleep(0.1)
            # Minimal yield to keep CPU responsive but fast
            time.sleep(0.001)

    def _ensure_camera(self) -> bool:
        if self.video is None or not self.video.isOpened():
            if self.video is not None:
                try: self.video.release()
                except: pass
            
            # Use default backend for local hardware cameras (integer indices)
            # Use CAP_FFMPEG for RTSP/Network streams
            if isinstance(self.source, int):
                self.video = cv2.VideoCapture(self.source)
            else:
                self.video = cv2.VideoCapture(self.source, cv2.CAP_FFMPEG)
                
            self.video.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            self.video.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 15000)
            self.video.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 15000)
        return self.video is not None and self.video.isOpened()

    def process_frame(self):
        events = self.processed_events
        self.processed_events = []  # Clear events atomically to prevent duplicate dispatches
        return self.processed_frame_bytes, events, self.snapshot_frame_bytes

    def _perform_inference(self, frame):
        frame_h, frame_w = frame.shape[:2]
        current_time = time.time()
        
        # 1. Identify active enabled scenarios
        enabled_objs = [s for s in self.scenarios if s.key in self.enabled_scenarios]
        
        yolo_results = {}
        faces_data = []
        
        # Determine base model name
        base_model_name = "custom_yolov8.pt" if os.path.exists(os.path.join(MODELS_DIR, "custom_yolov8.pt")) else "yolov8n.pt"
        
        # Execute face detection and embeddings once per frame if any face recognition scenario is enabled
        face_scenarios_active = any(s.required_model == "yolov8n-face.pt" for s in enabled_objs)
        if face_scenarios_active:
            try:
                mtcnn, resnet = ModelManager.get_face_models()
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                boxes, probs = mtcnn.detect(frame_rgb)
                
                if boxes is not None:
                    for bbox, prob in zip(boxes, probs):
                        if prob is not None and prob >= 0.50:
                            x1, y1, x2, y2 = bbox
                            x1, y1 = max(0, int(x1)), max(0, int(y1))
                            x2, y2 = min(frame_w - 1, int(x2)), min(frame_h - 1, int(y2))
                            
                            if x2 > x1 and y2 > y1:
                                face_crop = frame_rgb[y1:y2, x1:x2]
                                if face_crop.size > 0:
                                    face_resized = cv2.resize(face_crop, (160, 160))
                                    face_normalized = (face_resized.astype(np.float32) - 127.5) / 128.0
                                    face_tensor = torch.tensor(face_normalized).permute(2, 0, 1).to(device)
                                    
                                    with torch.no_grad():
                                        embedding = resnet(face_tensor.unsqueeze(0)).cpu().numpy()[0]
                                        
                                    faces_data.append({
                                        "bbox": (x1, y1, x2, y2),
                                        "embedding": embedding
                                    })
            except Exception as e:
                from logger import logger
                logger.error(f"Error in face detection/embedding: {e}", exc_info=True)

        # Execute predictions on all required YOLO models (run each once per frame)
        unique_yolo_models = set()
        for scenario in enabled_objs:
            if scenario.required_model != "yolov8n-face.pt":
                model_name = scenario.required_model
                if model_name == "yolov8n.pt":
                    model_name = base_model_name
                unique_yolo_models.add(model_name)
                
        # Always keep base YOLO model active for general person counting overlay
        if not unique_yolo_models:
            unique_yolo_models.add(base_model_name)

        for model_name in unique_yolo_models:
            try:
                model_inst = ModelManager.get_model(model_name)
                
                # Resolve interest classes for standard YOLO model
                interest_classes = None
                if model_name == base_model_name:
                    TARGET_CLASS_NAMES = [
                        "person", "car", "motorcycle", "bus", "truck", 
                        "cell phone", "fire", "smoke", "fire hydrant", "oven", "toaster",
                        "gun", "pistol", "revolver", "rifle", "weapon", "knife", "scissors"
                    ]
                    interest_classes = []
                    for cid, name in model_inst.names.items():
                        if name.lower() in TARGET_CLASS_NAMES:
                            interest_classes.append(cid)
                
                res = model_inst.predict(
                    frame,
                    conf=CONF_THRESHOLD,
                    iou=IOU_THRESHOLD,
                    classes=interest_classes,
                    verbose=False,
                    imgsz=INFERENCE_IMAGE_SIZE,
                    device=device,
                )
                yolo_results[model_name] = res
            except Exception as e:
                from logger import logger
                logger.error(f"Error running YOLO model {model_name} prediction: {e}")

        # 2. Get overall person and vehicle counts from the base model
        person_count = 0
        vehicle_count = 0
        SCENARIO_MIN_CONFIDENCE = {
            "person": 0.50,
            "knife": 0.60,
            "scissors": 0.60,
            "cell phone": 0.60,
            "car": 0.60,
            "truck": 0.60,
            "bus": 0.60,
            "motorcycle": 0.60,
            "fire hydrant": 0.55,
        }
        VEHICLE_LABELS = {"car", "truck", "bus", "motorcycle"}
        if base_model_name in yolo_results:
            res = yolo_results[base_model_name]
            if res and len(res) > 0:
                for box in res[0].boxes:
                    class_id = int(box.cls[0]) if hasattr(box.cls, "__getitem__") else int(box.cls)
                    label = res[0].names[class_id]
                    confidence = float(box.conf[0]) if hasattr(box.conf, "__getitem__") else float(box.conf)
                    
                    if label == "person" and confidence >= SCENARIO_MIN_CONFIDENCE.get("person", CONF_THRESHOLD):
                        person_count += 1
                    elif label in VEHICLE_LABELS and confidence >= SCENARIO_MIN_CONFIDENCE.get(label, CONF_THRESHOLD):
                        vehicle_count += 1

        # 3. Create copies for annotated video stream & alert snapshots
        annotated_frame = frame.copy()
        
        # Collect active scenario labels and their thresholds to filter boxes to plot
        enabled_labels = {}
        for scenario in enabled_objs:
            if hasattr(scenario, "labels"):
                for lbl in scenario.labels:
                    enabled_labels[lbl.lower()] = scenario.get_min_confidence(lbl)

        # Plot standard YOLO predictions on frame (only if they correspond to enabled scenarios)
        for model_name, res in yolo_results.items():
            if res and len(res) > 0:
                indices = []
                for i, box in enumerate(res[0].boxes):
                    class_id = int(box.cls[0]) if hasattr(box.cls, "__getitem__") else int(box.cls)
                    label = res[0].names[class_id]
                    confidence = float(box.conf[0]) if hasattr(box.conf, "__getitem__") else float(box.conf)
                    
                    if label.lower() in enabled_labels and confidence >= enabled_labels[label.lower()]:
                        indices.append(i)
                if indices:
                    filtered_res = res[0][indices]
                    annotated_frame = filtered_res.plot(img=annotated_frame)
        snapshot_frame = annotated_frame.copy()

        # 4. Iterate over modular scenarios to process frame detections
        events_to_log = []
        future_scene_state = {}
        stable_objects = []
        current_objects = []

        for scenario in self.scenarios:
            model_name = scenario.required_model
            if model_name == "yolov8n.pt":
                model_name = base_model_name

            # Resolve boxes/names for this scenario's model
            boxes = []
            names = {}
            if model_name in yolo_results:
                res = yolo_results[model_name]
                if res and len(res) > 0:
                    boxes = res[0].boxes
                    names = res[0].names

            # Pass the faces dynamically via attribute to avoid signature mismatches on other scenarios
            from pipelines.scenarios.face_recognition import FaceRecognitionScenario
            if isinstance(scenario, FaceRecognitionScenario):
                scenario.current_faces = faces_data

            event_to_log, updated_state = scenario.process(
                boxes=boxes,
                names=names,
                frame=frame,
                annotated_frame=annotated_frame,
                snapshot_frame=snapshot_frame,
                enabled_scenarios=self.enabled_scenarios,
                scenario_configs=self.scenario_configs,
                scene_state=self.scene_state,
                current_time=current_time
            )
            
            future_scene_state[scenario.key] = updated_state
            
            if updated_state.get("present", False) and updated_state.get("count", 0) > 0:
                stable_objects.append(scenario.key)
            if updated_state.get("count", 0) > 0:
                current_objects.append(scenario.key)
                
            if event_to_log:
                events_to_log.append(event_to_log)

        # 5. Display general person count on frame
        person_count_text = f"PERSONS DETECTED: {person_count}"
        cv2.putText(annotated_frame, person_count_text, (10, frame_h - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)
        cv2.putText(snapshot_frame, person_count_text, (10, frame_h - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)
        if vehicle_count > 0:
            vehicle_count_text = f"VEHICLES DETECTED: {vehicle_count}"
            cv2.putText(snapshot_frame, vehicle_count_text, (10, frame_h - 45), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2, cv2.LINE_AA)

        # 6. Update internal engine states
        if current_objects:
            from logger import logger
            logger.info(f"[CAMERA {self.camera_id}] Detected: {current_objects} | Stable: {stable_objects}")

        self.scene_state = future_scene_state
        self.latest_intelligence.update({
            "person_count": person_count,
            "objects": sorted(current_objects),
            "stable_objects": sorted(stable_objects),
            "last_update": current_time
        })

        # 7. Compress and return frames
        stream_frame = _resize_for_stream(annotated_frame)
        ret, jpeg = cv2.imencode(".jpg", stream_frame, [int(cv2.IMWRITE_JPEG_QUALITY), STREAM_JPEG_QUALITY])
        snapshot_ret, snapshot_jpeg = cv2.imencode(".jpg", snapshot_frame, [int(cv2.IMWRITE_JPEG_QUALITY), SNAPSHOT_JPEG_QUALITY])
        return (
            jpeg.tobytes() if ret else self.placeholder_frame,
            events_to_log,
            snapshot_jpeg.tobytes() if snapshot_ret else self.placeholder_frame,
        )

    def _build_placeholder_frame(self, message: str) -> bytes:
        frame = np.zeros((360, 640, 3), dtype=np.uint8)
        cv2.putText(frame, message, (18, 200), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2, cv2.LINE_AA)
        ret, jpeg = cv2.imencode(".jpg", frame)
        return jpeg.tobytes() if ret else b""

    def release(self):
        self.running = False
        if self.video: self.video.release()
        
        # Unregister from ModelManager to allow unloading models
        ModelManager.unregister_camera(self.camera_id)
