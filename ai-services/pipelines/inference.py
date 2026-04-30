import cv2
import numpy as np
import time
import threading
import requests
from datetime import datetime
from ultralytics import YOLO
import os
from config import BACKEND_URL

# Optimize OpenCV/FFmpeg for RTSP stability (IMOU/Dahua specialized)
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|rtsp_flags;prefer_tcp|stimeout;10000000" # 10s timeout, TCP

# AI Scenarios Mapping
SCENARIO_MAPPING = {
    "person": "Unauthorized entry into restricted areas",
    "knife": "Weapon detection (gun/knife)",
    "scissors": "Weapon detection (gun/knife)",
    "cell phone": "Mobile phone usage in restricted areas",
    "car": "Vehicle detection & tracking",
    "truck": "Vehicle detection & tracking",
    "bus": "Vehicle detection & tracking",
    "motorcycle": "Vehicle detection & tracking",
    "fire hydrant": "Fire / smoke detection",
    "oven": "Fire / smoke detection",
    "toaster": "Fire / smoke detection",
    "parking meter": "Unauthorized parking / ambulance blockage",
}

CONF_THRESHOLD = 0.55
IOU_THRESHOLD = 0.45
MIN_STABLE_FRAMES_TO_LOG = 1
VISITOR_LIMIT = 2  # Max allowed visitors (e.g., 1 patient + 1 attendant)

SCENARIO_MIN_CONFIDENCE = {
    "person": 0.55,
    "knife": 0.60,
    "cell phone": 0.65,
    "car": 0.60,
    "truck": 0.60,
    "bus": 0.60,
    "motorcycle": 0.60,
    "backpack": 0.60,
    "handbag": 0.60,
    "suitcase": 0.60,
    "bicycle": 0.60,
    "fire hydrant": 0.55,
}

# Global AI Engine Model
model = YOLO(os.path.join(os.path.dirname(__file__), "..", "models", "yolov8n.pt"))

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
        
        self.latest_raw_frame = None
        self.processed_frame_bytes = self.placeholder_frame
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
                frame_bytes, events = self._perform_inference(frame)
                self.processed_frame_bytes = frame_bytes
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
            self.video = cv2.VideoCapture(self.source, cv2.CAP_FFMPEG)
            self.video.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            self.video.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 15000)
            self.video.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 15000)
        return self.video is not None and self.video.isOpened()

    def process_frame(self):
        return self.processed_frame_bytes, self.processed_events

    def _perform_inference(self, frame):
        # Optimized for speed: Resize to 640p (Standard YOLO size)
        frame = cv2.resize(frame, (640, 360))

        # Direct predict with stream=True for speed if needed, but keeping it simple for now
        results = model.predict(frame, conf=CONF_THRESHOLD, iou=IOU_THRESHOLD, verbose=False, imgsz=640)
        person_count = 0
        detected_scenarios = {}
        events_to_log = []

        annotated_frame = frame
        if results and len(results) > 0:
            annotated_frame = results[0].plot()
            for box in results[0].boxes:
                class_id = int(box.cls[0]) if hasattr(box.cls, "__getitem__") else int(box.cls)
                label = results[0].names[class_id]
                confidence = float(box.conf[0]) if hasattr(box.conf, "__getitem__") else float(box.conf)
                
                if label == "person": person_count += 1
                
                scenario_name = SCENARIO_MAPPING.get(label)
                if scenario_name and scenario_name in self.enabled_scenarios:
                    if scenario_name not in detected_scenarios:
                        detected_scenarios[scenario_name] = {"max_conf": confidence, "count": 1, "labels": {label}}
                    else:
                        detected_scenarios[scenario_name]["max_conf"] = max(detected_scenarios[scenario_name]["max_conf"], confidence)
                        detected_scenarios[scenario_name]["count"] += 1
                        detected_scenarios[scenario_name]["labels"].add(label)

        # Check for visitor limit
        visitor_scenario_name = "Visitor count limit (only 1 attendant per patient)"
        
        # Get dynamic limit from configs, default to global VISITOR_LIMIT
        dynamic_limit = int(self.scenario_configs.get(visitor_scenario_name, {}).get("limit", VISITOR_LIMIT))
        
        if person_count > dynamic_limit and visitor_scenario_name in self.enabled_scenarios:
            detected_scenarios[visitor_scenario_name] = {
                "max_conf": 0.9, # High confidence assumed for limit breach
                "count": person_count, 
                "labels": {"person"}
            }

        current_objects = sorted(list(detected_scenarios.keys()))
        current_time = time.time()
        future_scene_state = {}
        stable_objects = []

        for scenario_name in set(list(self.scene_state.keys()) + current_objects):
            data = detected_scenarios.get(scenario_name, {"count": 0})
            current_count = data["count"]
            prev = self.scene_state.get(scenario_name, {"count": 0, "stable_frames": 0, "absent_frames": 0, "present": False, "last_logged": 0})

            stable_frames = prev["stable_frames"] + 1 if current_count == prev["count"] else 1
            absent_frames = prev["absent_frames"] + 1 if current_count == 0 else 0
            present = prev["present"]
            should_log = False

            if current_count > 0:
                if stable_frames >= MIN_STABLE_FRAMES_TO_LOG and not present:
                    should_log = True
                    present = True
            elif present and absent_frames >= MIN_STABLE_FRAMES_TO_LOG * 2:
                present = False

            if present and current_count > 0: stable_objects.append(scenario_name)

            if should_log:
                events_to_log.append({
                    "scenario_key": scenario_name,
                    "confidence": data.get("max_conf", 0.0),
                    "metadata": {"count": current_count, "raw_labels": list(data.get("labels", []))}
                })
                prev["last_logged"] = current_time

            future_scene_state[scenario_name] = {
                "count": current_count, "stable_frames": stable_frames, "absent_frames": absent_frames,
                "present": present, "last_logged": prev["last_logged"],
            }

        self.scene_state = future_scene_state
        self.latest_intelligence.update({
            "person_count": person_count, "objects": current_objects,
            "stable_objects": sorted(stable_objects), "last_update": current_time
        })

        ret, jpeg = cv2.imencode(".jpg", annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
        return (jpeg.tobytes() if ret else self.placeholder_frame), events_to_log

    def _build_placeholder_frame(self, message: str) -> bytes:
        frame = np.zeros((360, 640, 3), dtype=np.uint8)
        cv2.putText(frame, message, (18, 200), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2, cv2.LINE_AA)
        ret, jpeg = cv2.imencode(".jpg", frame)
        return jpeg.tobytes() if ret else b""

    def release(self):
        self.running = False
        if self.video: self.video.release()
