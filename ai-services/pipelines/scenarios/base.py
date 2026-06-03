import time

class BaseScenario:
    def __init__(self, key: str, labels: list[str], required_model: str = "yolov8n.pt"):
        """
        Initializes the base scenario.
        :param key: The unique database string key for the scenario (e.g. 'WEAPON_DETECTION_GUN_KNIFE')
        :param labels: List of YOLO/COCO text labels that this scenario detects (e.g. ['knife', 'scissors'])
        :param required_model: The AI model weights file required by this scenario (default: 'yolov8n.pt')
        """
        self.key = key
        self.labels = labels
        self.required_model = required_model

    def get_min_confidence(self, label: str) -> float:
        """Returns the specific threshold for each label."""
        SCENARIO_MIN_CONFIDENCE = {
            "person": 0.50,
            "knife": 0.60,
            "scissors": 0.60,
            "cell phone": 0.60,
            "car": 0.60,
            "truck": 0.60,
            "bus": 0.60,
            "motorcycle": 0.60,
            "backpack": 0.60,
            "handbag": 0.60,
            "suitcase": 0.60,
            "bicycle": 0.60,
            "fire hydrant": 0.55,
            # Custom Model Classes
            "fire": 0.40,
            "smoke": 0.40,
            "gun": 0.55,
            "pistol": 0.55,
            "revolver": 0.55,
            "rifle": 0.55,
            "weapon": 0.55,
        }
        return SCENARIO_MIN_CONFIDENCE.get(label.lower(), 0.25)

    def get_min_stable_frames(self) -> int:
        """Returns scenario-specific consecutive frame counts required to trigger an alert."""
        SCENARIO_MIN_STABLE_FRAMES = {
            "MOBILE_PHONE_USAGE_IN_RESTRICTED_AREAS": 1,  # Log immediately for mobile detection
            "WEAPON_DETECTION_GUN_KNIFE": 1,  # Log immediately for weapons
        }
        return SCENARIO_MIN_STABLE_FRAMES.get(self.key, 2)  # Default: 2 frames

    def get_cooldown_period(self, scenario_configs: dict) -> float:
        """Returns the alert cooldown period in seconds (default: 30.0)."""
        config = scenario_configs.get(self.key, {})
        return float(config.get("cooldown_period", 30.0))

    def process(self, boxes, names, frame, annotated_frame, snapshot_frame, enabled_scenarios, scenario_configs, scene_state, current_time) -> tuple[dict | None, dict]:
        """
        Standard strategy processing for simple object presence detection.
        Subclasses can override this method for specialized scenarios.
        
        Returns:
            A tuple of (event_to_log, updated_scenario_state)
        """
        if self.key not in enabled_scenarios:
            return None, self._get_empty_state(scene_state)

        # 1. Gather all boxes matching our labels that satisfy the confidence threshold
        matching_detections = []
        for box in boxes:
            class_id = int(box.cls[0]) if hasattr(box.cls, "__getitem__") else int(box.cls)
            label = names[class_id]
            if label in self.labels:
                confidence = float(box.conf[0]) if hasattr(box.conf, "__getitem__") else float(box.conf)
                if confidence >= self.get_min_confidence(label):
                    matching_detections.append((label, confidence, box))

        # 2. Extract metrics
        current_count = len(matching_detections)
        max_conf = max([d[1] for d in matching_detections]) if matching_detections else 0.0
        detected_labels = {d[0] for d in matching_detections}

        # Retrieve previous state
        prev = self._get_empty_state(scene_state)
        
        # Stability frame logic
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
        elif present and absent_frames >= 30: # Clear alert state after ~30 frame absence (~1s stream)
            present = False
            max_count_seen = 0

        # Alert cooldown handling
        ALERT_COOLDOWN = self.get_cooldown_period(scenario_configs)
        time_since_log = current_time - prev["last_logged"]

        if should_log and time_since_log >= ALERT_COOLDOWN:
            metadata = {
                "count": current_count,
                "raw_labels": list(detected_labels)
            }
            event_to_log = {
                "scenario_key": self.key,
                "confidence": max_conf,
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

    def _get_empty_state(self, scene_state) -> dict:
        """Returns standard initial/empty scenario tracking state."""
        return scene_state.get(self.key, {
            "count": 0,
            "stable_frames": 0,
            "absent_frames": 0,
            "present": False,
            "last_logged": 0.0,
            "max_count_seen": 0,
        })
