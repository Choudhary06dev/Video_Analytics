import cv2
import numpy as np
import time
import threading
import requests
from datetime import datetime
from ultralytics import YOLO
import os
from config import BACKEND_URL

# Optimize OpenCV/FFmpeg for low-latency RTSP reads.
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = (
    "rtsp_transport;tcp|rtsp_flags;prefer_tcp|fflags;nobuffer|flags;low_delay|"
    "max_delay;0|stimeout;10000000"
)

# Mission-Critical Class IDs (COCO mapping for YOLOv8)
# 0: person, 2: car, 3: motorcycle, 5: bus, 7: truck, 10: fire hydrant (used for fire), 
# 43: knife, 67: cell phone, 69: oven, 70: toaster, 76: scissors
INTEREST_CLASSES = [0, 2, 3, 5, 7, 10, 43, 67, 69, 70, 76]

CONF_THRESHOLD = 0.25
IOU_THRESHOLD = 0.45
INFERENCE_IMAGE_SIZE = 640
STREAM_JPEG_QUALITY = 85
SNAPSHOT_JPEG_QUALITY = 98
STREAM_MAX_WIDTH = 1280

# Global AI Engine Model
model = YOLO(os.path.join(os.path.dirname(__file__), "..", "models", "yolov8n.pt"))


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

        self.scenarios = [
            UnauthorizedEntryScenario(),
            WeaponDetectionScenario(),
            MobilePhoneUsageScenario(),
            VehicleTrackingScenario(),
            FireSmokeDetectionScenario(),
            UnauthorizedParkingScenario(),
            VisitorLimitScenario()
        ]

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
        # 1. Run YOLO prediction
        results = model.predict(
            frame,
            conf=CONF_THRESHOLD,
            iou=IOU_THRESHOLD,
            classes=INTEREST_CLASSES,
            verbose=False,
            imgsz=INFERENCE_IMAGE_SIZE,
        )
        frame_h, frame_w = frame.shape[:2]
        
        # 2. Get overall person count for screen overlay display
        person_count = 0
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
        if results and len(results) > 0:
            for box in results[0].boxes:
                class_id = int(box.cls[0]) if hasattr(box.cls, "__getitem__") else int(box.cls)
                label = results[0].names[class_id]
                confidence = float(box.conf[0]) if hasattr(box.conf, "__getitem__") else float(box.conf)
                
                # Check confidence for person
                if label == "person" and confidence >= SCENARIO_MIN_CONFIDENCE.get("person", CONF_THRESHOLD):
                    person_count += 1

        # 3. Create copies for annotated video stream & alert snapshots
        annotated_frame = frame.copy()
        if results and len(results) > 0:
            annotated_frame = results[0].plot()
        snapshot_frame = annotated_frame.copy()

        # 4. Iterate over modular scenarios to process frame detections
        events_to_log = []
        future_scene_state = {}
        stable_objects = []
        current_objects = []

        boxes = results[0].boxes if (results and len(results) > 0) else []
        names = results[0].names if (results and len(results) > 0) else {}
        current_time = time.time()

        for scenario in self.scenarios:
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
        ret, jpeg = cv2.imencode(".jpg", stream_frame, [int(cv2.IMWRITE_JPEG_QUALITY), STREAM_QUALITY := STREAM_JPEG_QUALITY])
        snapshot_ret, snapshot_jpeg = cv2.imencode(".jpg", snapshot_frame, [int(cv2.IMWRITE_JPEG_QUALITY), SNAPSHOT_QUALITY := SNAPSHOT_JPEG_QUALITY])
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
