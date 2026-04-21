from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict


class DetectionEventBase(BaseModel):
    timestamp: datetime
    camera_id: int
    scenario_key: str
    object_class: str
    confidence: float
    severity: str
    is_alert: bool
    metadata_json: Optional[Dict] = None


class AlertSummary(BaseModel):
    hours: float
    camera_id: Optional[int]
    count: int
    total_persons: int
    total_weapons: int
    total_vehicles: int
    threat_level: str
    status_message: str
    object_breakdown: Dict[str, int]
    timestamp: datetime
