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

# AI Scenarios Mapping: YOLO label -> Internal Key (matches AIScenario.key in DB)
SCENARIO_MAPPING = {
    "person": "UNAUTHORIZED_ENTRY_INTO_RESTRICTED_AREAS",
    "knife": "WEAPON_DETECTION_GUN_KNIFE",
    "scissors": "WEAPON_DETECTION_GUN_KNIFE",
    "cell phone": "MOBILE_PHONE_USAGE_IN_RESTRICTED_AREAS",
    "car": "VEHICLE_DETECTION_TRACKING",
    "truck": "VEHICLE_DETECTION_TRACKING",
    "bus": "VEHICLE_DETECTION_TRACKING",
    "motorcycle": "VEHICLE_DETECTION_TRACKING",
    "fire hydrant": "FIRE_SMOKE_DETECTION",
    "oven": "FIRE_SMOKE_DETECTION",
    "toaster": "FIRE_SMOKE_DETECTION",
    "parking meter": "UNAUTHORIZED_PARKING_AMBULANCE_BLOCKAGE",
}

# Mission-Critical Class IDs (COCO mapping for YOLOv8)
# 0: person, 2: car, 3: motorcycle, 5: bus, 7: truck, 10: fire hydrant (used for fire), 
# 43: knife, 67: cell phone, 69: oven, 70: toaster, 76: scissors
INTEREST_CLASSES = [0, 2, 3, 5, 7, 10, 43, 67, 69, 70, 76]

CONF_THRESHOLD = 0.25
IOU_THRESHOLD = 0.45
MIN_STABLE_FRAMES_TO_LOG = 2  # Only 2 consecutive frames needed for fast alerting
LOG_COOLDOWN = 10.0 # 5s cooldown between duplicate events
VISITOR_LIMIT = 2  # Max allowed visitors (e.g., 1 patient + 1 attendant)
UNAUTHORIZED_ENTRY_KEY = "UNAUTHORIZED_ENTRY_INTO_RESTRICTED_AREAS"
INFERENCE_IMAGE_SIZE = 640
STREAM_JPEG_QUALITY = 85
SNAPSHOT_JPEG_QUALITY = 98
STREAM_MAX_WIDTH = 1280

SCENARIO_MIN_CONFIDENCE = {
    "person": 0.50,
    "knife": 0.60,
    "scissors": 0.60,
    "cell phone": 0.50,  # Lowered from 0.65 for faster mobile detection
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

# Scenario-specific minimum stable frames for logging (for faster detection of critical items)
SCENARIO_MIN_STABLE_FRAMES = {
    "MOBILE_PHONE_USAGE_IN_RESTRICTED_AREAS": 1,  # Log immediately for mobile detection
    "WEAPON_DETECTION_GUN_KNIFE": 1,  # Log immediately for weapons
}

# Global AI Engine Model
model = YOLO(os.path.join(os.path.dirname(__file__), "..", "models", "yolov8n.pt"))


def _point_in_polygon(point, polygon):
    """Ray-casting point-in-polygon test for normalized frame coordinates."""
    if not polygon or len(polygon) < 3:
        return False

    x, y = point
    inside = False
    j = len(polygon) - 1
    for i in range(len(polygon)):
        xi, yi = polygon[i]["x"], polygon[i]["y"]
        xj, yj = polygon[j]["x"], polygon[j]["y"]
        intersects = (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-9) + xi
        if intersects:
            inside = not inside
        j = i
    return inside


def _normalize_restricted_zones(config):
    if "restricted_zone" in config:
        zone = config.get("restricted_zone")
        return [zone] if isinstance(zone, list) and len(zone) >= 3 else []

    zone = config.get("restricted_zone")
    zones = config.get("restricted_zones")
    if zones:
        return [z for z in zones if isinstance(z, list) and len(z) >= 3]
    if isinstance(zone, list) and len(zone) >= 3:
        return [zone]
    return []


def _bbox_inside_any_zone(xyxy, frame_w, frame_h, zones):
    x1, y1, x2, y2 = xyxy
    candidate_points = [
        (((x1 + x2) / 2) / frame_w, y2 / frame_h),                    # feet/lower center
        (((x1 + x2) / 2) / frame_w, ((y1 + y2) / 2) / frame_h),        # bbox center
        (((x1 + x2) / 2) / frame_w, (y1 + ((y2 - y1) * 0.75)) / frame_h),
        (x1 / frame_w, y2 / frame_h),
        (x2 / frame_w, y2 / frame_h),
    ]

    for zone_index, zone in enumerate(zones):
        for x, y in candidate_points:
            point = (max(0.0, min(1.0, x)), max(0.0, min(1.0, y)))
            if _point_in_polygon(point, zone):
                return zone_index, {"x": round(point[0], 4), "y": round(point[1], 4)}
    return None, None


def _resize_for_stream(frame):
    height, width = frame.shape[:2]
    if width <= STREAM_MAX_WIDTH:
        return frame
    scale = STREAM_MAX_WIDTH / width
    return cv2.resize(frame, (STREAM_MAX_WIDTH, int(height * scale)), interpolation=cv2.INTER_AREA)


def _draw_restricted_zones(frame, zones, frame_w, frame_h):
    if not zones:
        return frame

    output = frame.copy()
    for zone in zones:
        pts = np.array([[
            int(point["x"] * frame_w),
            int(point["y"] * frame_h)
        ] for point in zone], np.int32)
        cv2.polylines(output, [pts], isClosed=True, color=(0, 0, 255), thickness=2)
        overlay = output.copy()
        cv2.fillPoly(overlay, [pts], color=(0, 0, 255))
        output = cv2.addWeighted(overlay, 0.12, output, 0.88, 0)
    return output

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
        print(f"[CAMERA {camera_id}] ENGINE START | Source: {source} | Enabled Scenarios: {self.enabled_scenarios}")
        
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
        print(f"[CAMERA {self.camera_id}] CONFIG RELOADED | Enabled: {self.enabled_scenarios}")

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
        return self.processed_frame_bytes, self.processed_events, self.snapshot_frame_bytes

    def _perform_inference(self, frame):
        results = model.predict(
            frame,
            conf=CONF_THRESHOLD,
            iou=IOU_THRESHOLD,
            classes=INTEREST_CLASSES,
            verbose=False,
            imgsz=INFERENCE_IMAGE_SIZE,
        )
        frame_h, frame_w = frame.shape[:2]
        person_count = 0
        detected_scenarios = {}
        events_to_log = []
        restricted_zones = _normalize_restricted_zones(self.scenario_configs.get(UNAUTHORIZED_ENTRY_KEY, {}))
        restricted_entries = []

        # We now plot directly on the high-resolution original frame
        annotated_frame = frame.copy()
        if results and len(results) > 0:
            annotated_frame = results[0].plot()
            for box in results[0].boxes:
                class_id = int(box.cls[0]) if hasattr(box.cls, "__getitem__") else int(box.cls)
                label = results[0].names[class_id]
                confidence = float(box.conf[0]) if hasattr(box.conf, "__getitem__") else float(box.conf)
                
                if label == "person": person_count += 1
                
                # Check if this label meets its specific scenario confidence threshold
                min_required_conf = SCENARIO_MIN_CONFIDENCE.get(label, CONF_THRESHOLD)
                
                if confidence >= min_required_conf:
                    scenario_name = SCENARIO_MAPPING.get(label)
                    if scenario_name and scenario_name in self.enabled_scenarios:
                        if scenario_name == UNAUTHORIZED_ENTRY_KEY and restricted_zones:
                            xyxy = box.xyxy[0].tolist()
                            matching_zone, matched_point = _bbox_inside_any_zone(xyxy, frame_w, frame_h, restricted_zones)
                            if matching_zone is None:
                                continue
                            restricted_entries.append({"zone_index": matching_zone, "matched_point": matched_point})
                            cv2.circle(
                                annotated_frame,
                                (int(matched_point["x"] * frame_w), int(matched_point["y"] * frame_h)),
                                7,
                                (0, 255, 255),
                                -1
                            )

                        if scenario_name not in detected_scenarios:
                            detected_scenarios[scenario_name] = {"max_conf": confidence, "count": 1, "labels": {label}}
                        else:
                            detected_scenarios[scenario_name]["max_conf"] = max(detected_scenarios[scenario_name]["max_conf"], confidence)
                            detected_scenarios[scenario_name]["count"] += 1
                            detected_scenarios[scenario_name]["labels"].add(label)

        snapshot_frame = annotated_frame.copy()
        annotated_frame = _draw_restricted_zones(annotated_frame, restricted_zones, frame_w, frame_h)
        snapshot_frame = _draw_restricted_zones(snapshot_frame, restricted_zones, frame_w, frame_h)

        if restricted_entries and UNAUTHORIZED_ENTRY_KEY in detected_scenarios:
            detected_scenarios[UNAUTHORIZED_ENTRY_KEY]["restricted_entries"] = restricted_entries

        # Draw Dwell Time warning banner if someone is in the restricted zone
        if len(restricted_entries) > 0 and UNAUTHORIZED_ENTRY_KEY in self.enabled_scenarios:
            unauth_state = self.scene_state.get(UNAUTHORIZED_ENTRY_KEY, {})
            entry_start_time = unauth_state.get("entry_start_time")
            current_time = time.time()
            elapsed = current_time - entry_start_time if entry_start_time is not None else 0.0
            
            dwell_config = self.scenario_configs.get(UNAUTHORIZED_ENTRY_KEY, {})
            dwell_limit = float(dwell_config.get("dwell_time", 0))
            
            banner_text = f"RESTRICTED AREA BREACH | DWELL: {elapsed:.1f}s / {dwell_limit:.1f}s" if dwell_limit > 0 else f"RESTRICTED AREA BREACH | DWELL: {elapsed:.1f}s"
            
            overlay = annotated_frame.copy()
            bg_color = (0, 0, 180) if elapsed >= dwell_limit else (0, 120, 255)
            cv2.rectangle(overlay, (10, 10), (520, 45), bg_color, -1)
            cv2.addWeighted(overlay, 0.6, annotated_frame, 0.4, 0, annotated_frame)
            cv2.addWeighted(overlay, 0.6, snapshot_frame, 0.4, 0, snapshot_frame)
            
            cv2.putText(annotated_frame, banner_text, (20, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.putText(snapshot_frame, banner_text, (20, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)

        # Check for visitor limit
        visitor_scenario_key = "VISITOR_COUNT_LIMIT_EXCEEDED"
        
        # Get dynamic limit from configs, default to global VISITOR_LIMIT
        dynamic_limit = int(self.scenario_configs.get(visitor_scenario_key, {}).get("limit", VISITOR_LIMIT))
        
        if person_count > dynamic_limit and visitor_scenario_key in self.enabled_scenarios:
            detected_scenarios[visitor_scenario_key] = {
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
            prev = self.scene_state.get(scenario_name, {"count": 0, "stable_frames": 0, "absent_frames": 0, "present": False, "last_logged": 0, "max_count_seen": 0})

            # Check for stability
            stable_frames = prev["stable_frames"] + 1 if current_count == prev["count"] else 1
            absent_frames = prev["absent_frames"] + 1 if current_count == 0 else 0
            present = prev.get("present", False)  # Safety: handle missing "present" key
            max_count_seen = max(prev.get("max_count_seen", 0), current_count)  # Track highest count
            should_log = False

            # Logging Logic:
            # 1. Log if it's a NEW detection (0 -> >0) and stable
            # 2. Log if the count INCREASES (e.g. 1 person -> 2 persons) and stable
            # 3. BUT only if cooldown has passed or count changed
            time_since_log = current_time - prev["last_logged"]

            # Initialize or retrieve dwell-related states
            entry_start_time = prev.get("entry_start_time", None)
            dwell_alert_triggered = prev.get("dwell_alert_triggered", False)

            if scenario_name == UNAUTHORIZED_ENTRY_KEY:
                dwell_config = self.scenario_configs.get(UNAUTHORIZED_ENTRY_KEY, {})
                dwell_limit = float(dwell_config.get("dwell_time", 0))

                if current_count > 0:
                    if entry_start_time is None:
                        entry_start_time = current_time
                        dwell_alert_triggered = False
                    
                    elapsed = current_time - entry_start_time
                    if elapsed >= dwell_limit:
                        # Log on NEW breach or when max_count increases (more people in zone)
                        if not present:
                            should_log = True
                            present = True
                            dwell_alert_triggered = True
                        elif max_count_seen > prev.get("max_count_seen", 0):
                            # More people detected in restricted zone
                            should_log = True
                            dwell_alert_triggered = True
                else:
                    if absent_frames >= 30:
                        present = False
                        entry_start_time = None
                        dwell_alert_triggered = False
                        max_count_seen = 0
            else:
                if current_count > 0:
                    # Log if: NEW detection (not present) OR when max_count increases (new object detected)
                    required_stable_frames = SCENARIO_MIN_STABLE_FRAMES.get(scenario_name, MIN_STABLE_FRAMES_TO_LOG)
                    if stable_frames >= required_stable_frames:
                        if not present:
                            # First appearance
                            should_log = True
                            present = True
                        elif max_count_seen > prev.get("max_count_seen", 0):
                            # New object detected (e.g., 1 phone → 2 phones)
                            should_log = True
                elif present and absent_frames >= 30: # Wait ~1sec (30 frames) before clearing
                    present = False
                    max_count_seen = 0  # Reset when object disappears

            if present and current_count > 0: stable_objects.append(scenario_name)

            if should_log:
                metadata = {
                    "count": current_count,
                    "raw_labels": list(data.get("labels", []))
                }
                if scenario_name == UNAUTHORIZED_ENTRY_KEY:
                    metadata["restricted_entries"] = data.get("restricted_entries", [])
                    dwell_config = self.scenario_configs.get(UNAUTHORIZED_ENTRY_KEY, {})
                    dwell_limit = float(dwell_config.get("dwell_time", 0))
                    metadata["dwell_duration"] = round(current_time - (entry_start_time or current_time), 2)
                    metadata["dwell_limit"] = dwell_limit
                events_to_log.append({
                    "scenario_key": scenario_name,
                    "confidence": data.get("max_conf", 0.0),
                    "metadata": metadata
                })
                prev["last_logged"] = current_time

            future_scene_state[scenario_name] = {
                "count": current_count,
                "stable_frames": stable_frames,
                "absent_frames": absent_frames,
                "present": present,
                "last_logged": prev["last_logged"],
                "max_count_seen": max_count_seen,
            }
            if scenario_name == UNAUTHORIZED_ENTRY_KEY:
                future_scene_state[scenario_name]["entry_start_time"] = entry_start_time
                future_scene_state[scenario_name]["dwell_alert_triggered"] = dwell_alert_triggered

        if current_objects:
            print(f"[CAMERA {self.camera_id}] Detected: {current_objects} | Stable: {stable_objects}")

        self.scene_state = future_scene_state
        self.latest_intelligence.update({
            "person_count": person_count, "objects": current_objects,
            "stable_objects": sorted(stable_objects), "last_update": current_time
        })

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
