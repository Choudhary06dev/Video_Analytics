import cv2
import time
import numpy as np
from pipelines.scenarios.base import BaseScenario
from pipelines.blacklist_manager import BlacklistManager
from logger import logger

class FaceRecognitionScenario(BaseScenario):
    def __init__(self, key: str):
        # This scenario requires the yolov8n-face.pt (or MTCNN) model, so we register it
        super().__init__(
            key=key,
            labels=["person"],
            required_model="yolov8n-face.pt" # Demarcates that this scenario needs face recognition
        )
        # In-memory cache for visitor tracking
        # Mapping: visitor_id (str) -> {"embedding": np.ndarray, "last_seen": float}
        self.visitor_cache = {}
        self.next_visitor_id = 1
        self.visitor_timeout = 300.0 # 5 minutes threshold to consider a visitor exited

    def process(self, boxes, names, frame, annotated_frame, snapshot_frame, enabled_scenarios, scenario_configs, scene_state, current_time) -> tuple[dict | None, dict]:
        if self.key not in enabled_scenarios:
            return None, self._get_empty_state(scene_state)

        faces = getattr(self, "current_faces", [])
        if not faces:
            return None, self._get_empty_state(scene_state)

        config = scenario_configs.get(self.key, {})
        similarity_threshold = float(config.get("similarity_threshold", 0.60))

        event_to_log = None
        detected_person = None
        max_conf = 0.0

        frame_h, frame_w = frame.shape[:2]

        if self.key == "BLACKLISTED_PERSON_ALERT_FACIAL_RECOGNITION":
            blacklist = BlacklistManager().get_embeddings()
            
            for face_idx, face in enumerate(faces):
                bbox = face["bbox"] # (x1, y1, x2, y2)
                live_emb = face["embedding"]
                
                best_match = None
                best_sim = 0.0
                
                for entry in blacklist:
                    sim = BlacklistManager.calculate_similarity(live_emb, entry["embedding"])
                    if sim > best_sim:
                        best_sim = sim
                        best_match = entry

                # Print matching debug info to console
                best_name = best_match["name"] if best_match else "None"
                logger.info(f"[Face Rec] Face {face_idx+1} matching: best match = '{best_name}', similarity = {best_sim:.4f} (Required Threshold: {similarity_threshold:.2f})")

                x1, y1, x2, y2 = [int(val) for val in bbox]

                if best_match and best_sim >= similarity_threshold:
                    # Found a blacklisted individual!
                    max_conf = best_sim
                    detected_person = best_match
                    
                    # Draw a red box and text around face (Thicker & Brighter)
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                    cv2.rectangle(snapshot_frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                    
                    label_text = f"BLACKLISTED: {best_match['name']} ({best_sim:.2f})"
                    cv2.putText(annotated_frame, label_text, (x1, max(20, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                    cv2.putText(snapshot_frame, label_text, (x1, max(20, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                    break # Trigger alert for the first detected blacklisted person in this frame
                else:
                    # Draw bright yellow scanning feedback box (Thicker & Brighter)
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 255), 2)
                    cv2.putText(annotated_frame, "Scanning...", (x1, max(20, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

            prev = self._get_empty_state(scene_state)
            present = detected_person is not None
            stable_frames = prev["stable_frames"] + 1 if present else 0
            
            # Cooldown check
            ALERT_COOLDOWN = self.get_cooldown_period(scenario_configs)
            time_since_log = current_time - prev["last_logged"]
            
            if present and stable_frames >= 2 and time_since_log >= ALERT_COOLDOWN:
                metadata = {
                    "person_name": detected_person["name"],
                    "reason": detected_person["reason"],
                    "severity": detected_person["severity"],
                    "similarity": round(max_conf, 2)
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
                "count": 1 if present else 0,
                "stable_frames": stable_frames,
                "absent_frames": 0 if present else prev["absent_frames"] + 1,
                "present": present,
                "last_logged": last_logged,
                "max_count_seen": 1 if present else 0
            }
            return event_to_log, updated_state

        elif self.key == "ENTRY_EXIT_TRACKING_OF_VISITORS_FACE_RECOGNITION":
            # Clean up old visitors in local cache to handle exit events
            self._cleanup_visitor_cache(current_time)

            tracked_visitors = []
            
            for face in faces:
                bbox = face["bbox"]
                live_emb = face["embedding"]
                
                best_match_id = None
                best_sim = 0.0
                
                for vis_id, vis_info in self.visitor_cache.items():
                    sim = BlacklistManager.calculate_similarity(live_emb, vis_info["embedding"])
                    if sim > best_sim:
                        best_sim = sim
                        best_match_id = vis_id

                if best_match_id and best_sim >= similarity_threshold:
                    # Update last seen time for tracked visitor
                    self.visitor_cache[best_match_id]["last_seen"] = current_time
                    visitor_id_str = f"Visitor #{best_match_id}"
                else:
                    # Assign a new visitor ID
                    new_id = self.next_visitor_id
                    self.next_visitor_id += 1
                    self.visitor_cache[new_id] = {
                        "embedding": live_emb,
                        "last_seen": current_time,
                        "first_seen": current_time,
                        "logged_entry": False
                    }
                    visitor_id_str = f"Visitor #{new_id}"
                    best_match_id = new_id

                # Draw green box for visitors
                x1, y1, x2, y2 = [int(val) for val in bbox]
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.rectangle(snapshot_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(annotated_frame, visitor_id_str, (x1, max(15, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                cv2.putText(snapshot_frame, visitor_id_str, (x1, max(15, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                tracked_visitors.append(best_match_id)

            # Check if any new visitor requires logging (Entry event)
            new_visitor_to_log = None
            for vis_id, vis_info in self.visitor_cache.items():
                if vis_id in tracked_visitors and not vis_info["logged_entry"]:
                    if current_time - vis_info["first_seen"] >= 0.5: # Stable for 0.5s before logging
                        vis_info["logged_entry"] = True
                        new_visitor_to_log = vis_id
                        break

            prev = self._get_empty_state(scene_state)
            if new_visitor_to_log is not None:
                metadata = {
                    "visitor_id": f"Visitor #{new_visitor_to_log}",
                    "action": "ENTRY",
                    "time": time.strftime("%H:%M:%S", time.localtime(current_time))
                }
                event_to_log = {
                    "scenario_key": self.key,
                    "confidence": 1.0,
                    "metadata": metadata
                }

            updated_state = {
                "count": len(tracked_visitors),
                "stable_frames": prev["stable_frames"] + 1 if len(tracked_visitors) > 0 else 0,
                "absent_frames": 0 if len(tracked_visitors) > 0 else prev["absent_frames"] + 1,
                "present": len(tracked_visitors) > 0,
                "last_logged": current_time if new_visitor_to_log else prev["last_logged"],
                "max_count_seen": max(prev.get("max_count_seen", 0), len(tracked_visitors))
            }
            return event_to_log, updated_state

        return None, self._get_empty_state(scene_state)

    def _cleanup_visitor_cache(self, current_time):
        """
        Identifies and removes visitors that haven't been seen for `visitor_timeout` seconds.
        Logs an EXIT event when a visitor is cleaned up.
        """
        exited_ids = []
        for vis_id, vis_info in list(self.visitor_cache.items()):
            if current_time - vis_info["last_seen"] > self.visitor_timeout:
                exited_ids.append(vis_id)
                
        for vis_id in exited_ids:
            logger.info(f"Visitor #{vis_id} has exited (timeout reached).")
            del self.visitor_cache[vis_id]
