import cv2
import numpy as np
import time
from datetime import datetime
from ultralytics import YOLO
import os

# AI Scenarios Mapping
SCENARIO_MAPPING = {
    "person": "Staff/Visitor Activity",
    "knife": "Weapon Detection (Gun/Knife)",
    "scissors": "Weapon Detection (Gun/Knife)",
    "cell phone": "Mobile Phone Usage - Restricted",
    "laptop": "Electronic Device Detected",
    "remote": "Electronic Device Detected",
    "keyboard": "Electronic Device Detected",
    "mouse": "Electronic Device Detected",
    "tv": "Surveillance Monitor Active",
    "car": "Vehicle Observation",
    "truck": "Vehicle Observation",
    "bus": "Vehicle Observation",
    "motorcycle": "Vehicle Observation",
    "bicycle": "Vehicle Observation",
    "airplane": "Aerial Object Detected",
    "boat": "Maritime Vessel Detected",
    "train": "Rail Transit Detected",
    "backpack": "Object Left Unattended",
    "handbag": "Object Left Unattended",
    "suitcase": "Object Left Unattended",
    "umbrella": "Object Left Unattended",
    "fire hydrant": "Fire / Smoke Detection",
    "oven": "Fire / Smoke Detection",
    "toaster": "Fire / Smoke Detection",
    "dog": "Animal Intrusion Detected",
    "cat": "Animal Intrusion Detected",
    "horse": "Animal Intrusion Detected",
    "bird": "Animal Intrusion Detected",
    "cow": "Animal Intrusion Detected",
    "sheep": "Animal Intrusion Detected",
    "bear": "Animal Intrusion Detected",
    "elephant": "Animal Intrusion Detected",
    "bottle": "Consumable Item Detected",
    "wine glass": "Consumable Item Detected",
    "cup": "Consumable Item Detected",
    "chair": "Furniture Displacement",
    "couch": "Furniture Displacement",
    "bed": "Furniture Displacement",
    "dining table": "Furniture Displacement",
    "sports ball": "Recreational Activity Detected",
    "baseball bat": "Potential Weapon - Blunt Object",
    "tennis racket": "Recreational Activity Detected",
    "skateboard": "Recreational Activity Detected",
    "surfboard": "Recreational Activity Detected",
    "frisbee": "Recreational Activity Detected",
    "skis": "Recreational Activity Detected",
    "snowboard": "Recreational Activity Detected",
    "kite": "Aerial Object Detected",
    "traffic light": "Traffic Signal Detected",
    "stop sign": "Traffic Signal Detected",
    "parking meter": "Parking Zone Detected",
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
        self.scene_state = {}
        self.placeholder_frame = self._build_placeholder_frame(f"CAMERA {camera_id} - NO SIGNAL")
        self.latest_intelligence = {
            "person_count": 0,
            "objects": [],
            "stable_objects": [],
            "last_update": 0.0
        }

    def _build_placeholder_frame(self, message: str) -> bytes:
        frame = np.zeros((360, 640, 3), dtype=np.uint8)
        cv2.putText(frame, message, (18, 200), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.putText(frame, "Reconnecting camera...", (18, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 1, cv2.LINE_AA)
        ret, jpeg = cv2.imencode(".jpg", frame)
        return jpeg.tobytes() if ret else b""

    def _ensure_camera(self) -> bool:
        if self.video is None:
            self.video = cv2.VideoCapture(self.source)
        elif not self.video.isOpened():
            self.video.open(self.source)
        return self.video is not None and self.video.isOpened()

    def release(self):
        if self.video is not None and self.video.isOpened():
            self.video.release()

    def process_frame(self):
        if not self._ensure_camera():
            return self.placeholder_frame, None

        success, frame = self.video.read()
        if not success or frame is None:
            self._ensure_camera()
            return self.placeholder_frame, None

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
                if scenario_name:
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
