from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List


class Area(SQLModel, table=True):
    """
    Hierarchical areas in the hospital (e.g., ICU, Building A, Floor 1).
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = Field(default=None)
    parent_id: Optional[int] = Field(default=None, foreign_key="area.id")

    # Relationships
    cameras: List["Camera"] = Relationship(back_populates="area")


class Camera(SQLModel, table=True):
    """
    Hospital camera units.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    source_url: str  # RTSP or Stream URL
    area_id: int = Field(foreign_key="area.id")
    status: str = Field(default="offline")  # online, offline, maintenance
    is_active: bool = Field(default=True)

    # Relationship
    area: Area = Relationship(back_populates="cameras")
    scenario_assignments: List["CameraScenarioAssignment"] = Relationship(back_populates="camera")


class CameraScenarioAssignment(SQLModel, table=True):
    """
    Toggling specific AI scenarios per camera.
    """
    camera_id: int = Field(foreign_key="camera.id", primary_key=True)
    scenario_id: int = Field(foreign_key="aiscenario.id", primary_key=True)
    is_enabled: bool = Field(default=False)

    camera: Camera = Relationship(back_populates="scenario_assignments")
