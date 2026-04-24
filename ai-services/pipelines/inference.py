import cv2
import numpy as np
import time
import threading
from datetime import datetime
from ultralytics import YOLO
import os

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
MIN_STABLE_FRAMES_TO_LOG = 4

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
        self.video = cv2.VideoCapture(self.source)
        self.video.set(cv2.CAP_PROP_BUFFERSIZE, 1) # Prevent frame buffering delay
        self.scene_state = {}
        self.placeholder_frame = self._build_placeholder_frame(f"CAMERA {camera_id} - NO SIGNAL")
        self.latest_intelligence = {
            "person_count": 0,
            "objects": [],
            "stable_objects": [],
            "last_update": 0.0
        }
        
        self.enabled_scenarios = set()
        self._load_initial_config()
        
        self.latest_frame = None
        self.running = True
        
        # Exponential backoff for reconnection (prevents 403 IP bans from IMOU/Dahua cameras)
        self._reconnect_delay = 10    # Start with 10 seconds
        self._max_reconnect_delay = 120  # Cap at 2 minutes
        self._consecutive_failures = 0
        
        self.thread = threading.Thread(target=self._capture_thread, daemon=True)
        self.thread.start()

    def _load_initial_config(self):
        """
        Fetches the enabled scenarios from the backend API.
        """
        try:
            # We use a synchronous request here because it's in __init__ (in a thread-friendly way)
            import requests
            response = requests.get(f"http://localhost:8000/admin/cameras/{self.camera_id}/scenarios", timeout=2)
            if response.status_code == 200:
                scenarios = response.json()
                self.enabled_scenarios = {s["name"] for s in scenarios if s.get("is_enabled")}
                print(f"Engine {self.camera_id} loaded {len(self.enabled_scenarios)} scenarios.")
        except Exception as e:
            print(f"Engine {self.camera_id} failed to load config: {e}")

    def update_config(self, enabled_names: list):
        """
        Updates the enabled scenarios in real-time.
        """
        self.enabled_scenarios = set(enabled_names)
        print(f"Engine {self.camera_id} config updated: {len(self.enabled_scenarios)} scenarios enabled.")


    def _capture_thread(self):
        while self.running:
            if not self._ensure_camera():
                # Exponential backoff: wait longer after each consecutive failure
                wait_time = min(self._reconnect_delay * (2 ** min(self._consecutive_failures, 4)), self._max_reconnect_delay)
                self._consecutive_failures += 1
                print(f"[Camera {self.camera_id}] Connection failed. Waiting {wait_time}s before retry (attempt #{self._consecutive_failures})")
                time.sleep(wait_time)
                continue
            
            success, frame = self.video.read()
            if success:
                self.latest_frame = frame
                # Reset backoff on successful read
                self._consecutive_failures = 0
            else:
                self._consecutive_failures += 1
                wait_time = min(self._reconnect_delay * (2 ** min(self._consecutive_failures, 4)), self._max_reconnect_delay)
                print(f"[Camera {self.camera_id}] Frame read failed. Releasing and waiting {wait_time}s (attempt #{self._consecutive_failures})")
                self.video.release()
                time.sleep(wait_time)

    def _build_placeholder_frame(self, message: str) -> bytes:
        frame = np.zeros((360, 640, 3), dtype=np.uint8)
        cv2.putText(frame, message, (18, 200), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.putText(frame, "Reconnecting camera...", (18, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 1, cv2.LINE_AA)
        ret, jpeg = cv2.imencode(".jpg", frame)
        return jpeg.tobytes() if ret else b""

    def _ensure_camera(self) -> bool:
        masked_source = self.source
        if isinstance(self.source, str) and "@" in self.source:
            parts = self.source.split("@")
            masked_source = "rtsp://***:***@" + parts[1]

        if self.video is None:
            print(f"[Engine {self.camera_id}] Initializing VideoCapture for {masked_source}")
            self.video = cv2.VideoCapture(self.source, cv2.CAP_FFMPEG)
            self.video.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        elif not self.video.isOpened():
            print(f"[Engine {self.camera_id}] Attempting to open {masked_source}")
            self.video.open(self.source, cv2.CAP_FFMPEG)
            self.video.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        
        status = self.video is not None and self.video.isOpened()
        if not status:
            # If it failed to open, force a re-creation next time to clear internal cache
            self.video = None
        return status

    def release(self):
        self.running = False
        if self.video is not None and self.video.isOpened():
            self.video.release()

    def process_frame(self):
        if self.latest_frame is None:
            return self.placeholder_frame, None

        frame = self.latest_frame.copy()

        results = model.predict(frame, conf=CONF_THRESHOLD, iou=IOU_THRESHOLD, verbose=False)
        person_count = 0
        detected_scenarios = {}
        raw_detections = []
        events_to_log = []

        annotated_frame = frame
        if results and len(results) > 0:
            annotated_frame = results[0].plot()
            for box in results[0].boxes:
                class_id = int(box.cls[0]) if hasattr(box.cls, "__getitem__") else int(box.cls)
                label = results[0].names[class_id]
                confidence = float(box.conf[0]) if hasattr(box.conf, "__getitem__") else float(box.conf)

                min_conf = max(CONF_THRESHOLD, SCENARIO_MIN_CONFIDENCE.get(label, CONF_THRESHOLD))
                if confidence < min_conf:
                    continue

                raw_detections.append({"label": label, "confidence": confidence})
                if label == "person":
                    person_count += 1

                scenario_name = SCENARIO_MAPPING.get(label)
                if scenario_name and scenario_name in self.enabled_scenarios:
                    if scenario_name not in detected_scenarios:
                        detected_scenarios[scenario_name] = {"max_conf": confidence, "count": 1, "labels": {label}}
                    else:
                        detected_scenarios[scenario_name]["max_conf"] = max(detected_scenarios[scenario_name]["max_conf"], confidence)
                        detected_scenarios[scenario_name]["count"] += 1
                        detected_scenarios[scenario_name]["labels"].add(label)


        current_objects = sorted(list(detected_scenarios.keys()))
        current_time = time.time()
        future_scene_state = {}
        stable_objects = []

        for scenario_name in set(list(self.scene_state.keys()) + current_objects):
            current_count = detected_scenarios.get(scenario_name, {"count": 0})["count"]
            prev = self.scene_state.get(scenario_name, {"count": 0, "stable_frames": 0, "absent_frames": 0, "present": False, "last_logged": 0})

            if current_count == prev["count"]:
                stable_frames = prev["stable_frames"] + 1
            else:
                stable_frames = 1

            if current_count == 0:
                absent_frames = prev["absent_frames"] + 1 if prev["count"] == 0 else 1
            else:
                absent_frames = 0

            present = prev["present"]
            should_log = False

            if current_count > 0:
                if stable_frames >= MIN_STABLE_FRAMES_TO_LOG:
                    if not present:
                        should_log = True
                        present = True
                    elif scenario_name != "Unauthorized Entry - Restricted Area" and current_count > prev["count"]:
                        should_log = True
            else:
                if present and absent_frames >= MIN_STABLE_FRAMES_TO_LOG * 2:
                    should_log = True
                    present = False

            if present and current_count > 0:
                stable_objects.append(scenario_name)

            if should_log:
                events_to_log.append({
                    "scenario_key": scenario_name,
                    "confidence": detected_scenarios[scenario_name]["max_conf"] if current_count > 0 else 0.0,
                    "metadata": {
                        "count": current_count,
                        "raw_labels": list(detected_scenarios[scenario_name]["labels"]) if current_count > 0 else []
                    }
                })
                prev["last_logged"] = current_time

            future_scene_state[scenario_name] = {
                "count": current_count,
                "stable_frames": stable_frames,
                "absent_frames": absent_frames,
                "present": present,
                "last_logged": prev["last_logged"],
            }

        self.scene_state = future_scene_state
        self.latest_intelligence.update({
            "person_count": person_count,
            "objects": current_objects,
            "stable_objects": sorted(stable_objects),
            "last_update": current_time
        })

        ret, jpeg = cv2.imencode(".jpg", annotated_frame)
        return (jpeg.tobytes() if ret else self.placeholder_frame), events_to_log
