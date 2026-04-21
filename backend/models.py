from sqlmodel import SQLModel, Field, JSON, Relationship
from datetime import datetime
from typing import Optional, List, Dict
import json

class Role(SQLModel, table=True):
    """
    Model for defining access roles (e.g., super_admin, admin, operator).
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    description: Optional[str] = Field(default=None)

    # Relationships
    users: List["User"] = Relationship(back_populates="role")
    module_permissions: List["RoleModulePermission"] = Relationship(back_populates="role")
    area_permissions: List["RoleAreaPermission"] = Relationship(back_populates="role")

class ModulePermission(SQLModel, table=True):
    """
    Available modules in the system (e.g., Dashboard, LiveMonitoring, Alerts, AdminHub).
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    key: str = Field(unique=True) # e.g. "dashboard", "live_monitoring", "alerts"

class RoleModulePermission(SQLModel, table=True):
    """
    Many-to-Many relationship between Roles and ModulePermissions with access levels.
    """
    role_id: int = Field(foreign_key="role.id", primary_key=True)
    module_permission_id: int = Field(foreign_key="modulepermission.id", primary_key=True)
    can_view: bool = Field(default=True)
    can_edit: bool = Field(default=False)
    can_delete: bool = Field(default=False)

    role: Role = Relationship(back_populates="module_permissions")

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

class RoleAreaPermission(SQLModel, table=True):
    """
    Area-level permissions for roles (inheritance handled via logic).
    """
    role_id: int = Field(foreign_key="role.id", primary_key=True)
    area_id: int = Field(foreign_key="area.id", primary_key=True)
    can_view: bool = Field(default=True)

    role: Role = Relationship(back_populates="area_permissions")

class User(SQLModel, table=True):
    """
    Unified User model handling all accounts based on their Role.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    email: str = Field(index=True, unique=True)
    hashed_password: str
    role_id: int = Field(default=3, foreign_key="role.id")
    created_at: datetime = Field(default_factory=datetime.now)

    # Relationships
    role: Role = Relationship(back_populates="users")

class Camera(SQLModel, table=True):
    """
    Hospital camera units.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    source_url: str # RTSP or Stream URL
    area_id: int = Field(foreign_key="area.id")
    status: str = Field(default="offline") # online, offline, maintenance
    is_active: bool = Field(default=True)

    # Relationship
    area: Area = Relationship(back_populates="cameras")
    scenario_assignments: List["CameraScenarioAssignment"] = Relationship(back_populates="camera")

class AIScenario(SQLModel, table=True):
    """
    The 21 AI scenarios supported by the system.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    key: str = Field(unique=True) # internal key for logic
    description: Optional[str] = Field(default=None)
    default_severity: str = Field(default="Medium") # Critical, High, Medium, Low

class CameraScenarioAssignment(SQLModel, table=True):
    """
    Toggling specific AI scenarios per camera.
    """
    camera_id: int = Field(foreign_key="camera.id", primary_key=True)
    scenario_id: int = Field(foreign_key="aiscenario.id", primary_key=True)
    is_enabled: bool = Field(default=False)

    camera: Camera = Relationship(back_populates="scenario_assignments")

class DetectionEvent(SQLModel, table=True):
    """
    Model for storing AI detection events.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.now)
    camera_id: int = Field(foreign_key="camera.id")
    scenario_key: str # Links back to AIScenario.key
    object_class: str
    confidence: float
    severity: str = Field(default="Low")
    is_alert: bool = Field(default=False)
    
    # Store additional data like bounding boxes as JSON
    metadata_json: Optional[Dict] = Field(default=None, sa_type=JSON)

    class Config:
        arbitrary_types_allowed = True
