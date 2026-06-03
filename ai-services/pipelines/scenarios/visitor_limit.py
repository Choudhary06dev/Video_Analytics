from pipelines.scenarios.base import BaseScenario

class VisitorLimitScenario(BaseScenario):
    def __init__(self):
        super().__init__(
            key="VISITOR_COUNT_LIMIT_EXCEEDED",
            labels=["person"]
        )

    def process(self, boxes, names, frame, annotated_frame, snapshot_frame, enabled_scenarios, scenario_configs, scene_state, current_time) -> tuple[dict | None, dict]:
        if self.key not in enabled_scenarios:
            return None, self._get_empty_state(scene_state)

        config = scenario_configs.get(self.key, {})
        visitor_limit = int(config.get("limit", 0))
        if visitor_limit <= 0:
            return None, self._get_empty_state(scene_state)

        # Count total persons detected
        person_count = 0
        max_conf = 0.0
        for box in boxes:
            class_id = int(box.cls[0]) if hasattr(box.cls, "__getitem__") else int(box.cls)
            label = names[class_id]
            if label == "person":
                confidence = float(box.conf[0]) if hasattr(box.conf, "__getitem__") else float(box.conf)
                if confidence >= self.get_min_confidence("person"):
                    person_count += 1
                    max_conf = max(max_conf, confidence)

        # Determine limit exceedance status
        current_count = person_count if person_count > visitor_limit else 0
        
        prev = self._get_empty_state(scene_state)
        stable_frames = prev["stable_frames"] + 1 if current_count == prev["count"] else 1
        absent_frames = prev["absent_frames"] + 1 if current_count == 0 else 0
        present = prev.get("present", False)
        max_count_seen = max(prev.get("max_count_seen", 0), current_count)
        should_log = False
        event_to_log = None

        if current_count > 0:
            required_stable_frames = self.get_min_stable_frames()
            if stable_frames >= required_stable_frames:
                if not present:
                    should_log = True
                    present = True
                elif max_count_seen > prev.get("max_count_seen", 0):
                    should_log = True
        elif present and absent_frames >= 30:
            present = False
            max_count_seen = 0

        ALERT_COOLDOWN = self.get_cooldown_period(scenario_configs)
        time_since_log = current_time - prev["last_logged"]

        if should_log and time_since_log >= ALERT_COOLDOWN:
            metadata = {
                "count": person_count,
                "limit": visitor_limit,
                "raw_labels": ["person"]
            }
            event_to_log = {
                "scenario_key": self.key,
                "confidence": max_conf if max_conf > 0 else 0.99,
                "metadata": metadata
            }
            last_logged = current_time
        else:
            last_logged = prev["last_logged"]

        updated_state = {
            "count": current_count,
            "stable_frames": stable_frames,
            "absent_frames": absent_frames,
            "present": present,
            "last_logged": last_logged,
            "max_count_seen": max_count_seen,
        }

        return event_to_log, updated_state
