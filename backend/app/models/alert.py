from sqlmodel import SQLModel, Field, JSON
from datetime import datetime
from typing import Optional, Dict


class AIScenario(SQLModel, table=True):
    """
    The 21 AI scenarios supported by the system.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    key: str = Field(unique=True)  # internal key for logic
    description: Optional[str] = Field(default=None)
    default_severity: str = Field(default="Medium")  # Critical, High, Medium, Low


class DetectionEvent(SQLModel, table=True):
    """
    Model for storing AI detection events.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.now)
    camera_id: int = Field(foreign_key="camera.id")
    scenario_key: str  # Links back to AIScenario.key
    object_class: str
    confidence: float
    severity: str = Field(default="Low")
    is_alert: bool = Field(default=False)

    # Store additional data like bounding boxes as JSON
    metadata_json: Optional[Dict] = Field(default=None, sa_type=JSON)

    class Config:
        arbitrary_types_allowed = True


class AuditLog(SQLModel, table=True):
    """
    Registry for tracking all critical administrative actions.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    action: str  # e.g. "CREATE_USER", "UPDATE_PERMISSIONS", "TOGGLE_CAMERA"
    resource: str  # e.g. "Identity Matrix", "Access Authority", "Surveillance"
    details: str
    timestamp: datetime = Field(default_factory=datetime.now)
