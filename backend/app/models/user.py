from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List


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
    key: str = Field(unique=True)  # e.g. "dashboard", "live_monitoring", "alerts"


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
    whatsapp_number: Optional[str] = Field(default=None)
    whatsapp_alerts_enabled: bool = Field(default=False)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.now)

    # Relationships
    role: Role = Relationship(back_populates="users")
