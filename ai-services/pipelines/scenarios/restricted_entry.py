import cv2
import time
from pipelines.scenarios.base import BaseScenario
from pipelines.scenarios.helpers import (
    _normalize_restricted_zones,
    _bbox_inside_any_zone,
    _draw_restricted_zones
)

class UnauthorizedEntryScenario(BaseScenario):
    def __init__(self):
        super().__init__(
            key="UNAUTHORIZED_ENTRY_INTO_RESTRICTED_AREAS",
            labels=["person"]
        )

    def process(self, boxes, names, frame, annotated_frame, snapshot_frame, enabled_scenarios, scenario_configs, scene_state, current_time) -> tuple[dict | None, dict]:
        if self.key not in enabled_scenarios:
            return None, self._get_empty_state(scene_state)

        config = scenario_configs.get(self.key, {})
        restricted_zones = _normalize_restricted_zones(config)
        
        if not restricted_zones:
            return None, self._get_empty_state(scene_state)

        frame_h, frame_w = frame.shape[:2]
        restricted_entries = []
        max_conf = 0.0
        detected_labels = set()

        # 1. Detect breaches
        for box in boxes:
            class_id = int(box.cls[0]) if hasattr(box.cls, "__getitem__") else int(box.cls)
            label = names[class_id]
            if label in self.labels:
                confidence = float(box.conf[0]) if hasattr(box.conf, "__getitem__") else float(box.conf)
                if confidence >= self.get_min_confidence(label):
                    xyxy = box.xyxy[0].tolist()
                    matching_zone, matched_point = _bbox_inside_any_zone(xyxy, frame_w, frame_h, restricted_zones)
                    if matching_zone is not None:
                        restricted_entries.append({"zone_index": matching_zone, "matched_point": matched_point})
                        max_conf = max(max_conf, confidence)
                        detected_labels.add(label)
                        # Draw high-visibility marker on the matched breach points
                        cv2.circle(
                            annotated_frame,
                            (int(matched_point["x"] * frame_w), int(matched_point["y"] * frame_h)),
                            7,
                            (0, 255, 255),
                            -1
                        )

        current_count = len(restricted_entries)
        prev = self._get_empty_state(scene_state)

        # 2. Update states
        stable_frames = prev["stable_frames"] + 1 if current_count == prev["count"] else 1
        absent_frames = prev["absent_frames"] + 1 if current_count == 0 else 0
        present = prev.get("present", False)
        max_count_seen = max(prev.get("max_count_seen", 0), current_count)
        should_log = False
        event_to_log = None

        entry_start_time = prev.get("entry_start_time", None)
        dwell_alert_triggered = prev.get("dwell_alert_triggered", False)

        dwell_limit = float(config.get("dwell_time", 0))

        if current_count > 0:
            if entry_start_time is None:
                entry_start_time = current_time
                dwell_alert_triggered = False
            
            elapsed = current_time - entry_start_time
            if elapsed >= dwell_limit:
                if not present:
                    should_log = True
                    present = True
                    dwell_alert_triggered = True
                elif max_count_seen > prev.get("max_count_seen", 0):
                    should_log = True
                    dwell_alert_triggered = True
        else:
            if absent_frames >= 30:
                present = False
                entry_start_time = None
                dwell_alert_triggered = False
                max_count_seen = 0

        # Cooldown management
        ALERT_COOLDOWN = self.get_cooldown_period(scenario_configs)
        time_since_log = current_time - prev["last_logged"]

        if should_log and time_since_log >= ALERT_COOLDOWN:
            metadata = {
                "count": current_count,
                "raw_labels": list(detected_labels),
                "restricted_entries": restricted_entries,
                "dwell_duration": round(current_time - (entry_start_time or current_time), 2),
                "dwell_limit": dwell_limit
            }
            event_to_log = {
                "scenario_key": self.key,
                "confidence": max_conf,
                "metadata": metadata
            }
            last_logged = current_time
        else:
            last_logged = prev["last_logged"]

        # 3. Visual warning overlays & boundary drawing
        # In-place modify frame buffers for the live stream and recording snapshots
        _draw_restricted_zones(annotated_frame, restricted_zones, frame_w, frame_h)
        _draw_restricted_zones(snapshot_frame, restricted_zones, frame_w, frame_h)

        if current_count > 0:
            elapsed = current_time - entry_start_time if entry_start_time is not None else 0.0
            banner_text = (
                f"RESTRICTED AREA BREACH | DWELL: {elapsed:.1f}s / {dwell_limit:.1f}s"
                if dwell_limit > 0 else
                f"RESTRICTED AREA BREACH | DWELL: {elapsed:.1f}s"
            )
            
            overlay = annotated_frame.copy()
            bg_color = (0, 0, 180) if elapsed >= dwell_limit else (0, 120, 255)
            cv2.rectangle(overlay, (10, 10), (520, 45), bg_color, -1)
            cv2.addWeighted(overlay, 0.6, annotated_frame, 0.4, 0, annotated_frame)
            cv2.addWeighted(overlay, 0.6, snapshot_frame, 0.4, 0, snapshot_frame)
            
            cv2.putText(annotated_frame, banner_text, (20, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.putText(snapshot_frame, banner_text, (20, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)

        updated_state = {
            "count": current_count,
            "stable_frames": stable_frames,
            "absent_frames": absent_frames,
            "present": present,
            "last_logged": last_logged,
            "max_count_seen": max_count_seen,
            "entry_start_time": entry_start_time,
            "dwell_alert_triggered": dwell_alert_triggered
        }

        return event_to_log, updated_state

    def _get_empty_state(self, scene_state) -> dict:
        state = super()._get_empty_state(scene_state)
        if "entry_start_time" not in state:
            state["entry_start_time"] = None
        if "dwell_alert_triggered" not in state:
            state["dwell_alert_triggered"] = False
        return state
