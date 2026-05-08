# Import all models here so SQLModel metadata picks them up
from app.models.user import User, Role, ModulePermission, RoleModulePermission, RoleAreaPermission
from app.models.camera import Camera, Area
from app.models.alert import DetectionEvent, AIScenario, AuditLog
from app.models.blacklist import BlacklistPerson
from app.models.system_setting import SystemSetting

__all__ = [
    "User", "Role", "ModulePermission", "RoleModulePermission", "RoleAreaPermission",
    "Camera", "Area",
    "DetectionEvent", "AIScenario", "AuditLog",
    "BlacklistPerson", "SystemSetting"
]
