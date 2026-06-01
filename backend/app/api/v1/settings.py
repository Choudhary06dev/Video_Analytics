from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlmodel import Session, select
from app.core.database import engine, get_session
from app.api.v1.auth import get_current_user
from app.api.v1.users import verify_module_access
from app.models.system_setting import SystemSetting
from typing import Any

router = APIRouter(prefix="/settings", tags=["System Settings"])

def ensure_notification_setting_columns() -> None:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE systemsetting ADD COLUMN IF NOT EXISTS email_alerts_enabled BOOLEAN DEFAULT TRUE"))
        connection.execute(text("ALTER TABLE systemsetting ADD COLUMN IF NOT EXISTS whatsapp_alerts_enabled BOOLEAN DEFAULT TRUE"))

@router.get("/public")
@router.get("/public/")
async def get_public_settings():
    ensure_notification_setting_columns()
    with Session(engine) as session:
        setting = session.exec(select(SystemSetting)).first()
        if not setting:
            setting = SystemSetting()
            session.add(setting)
            session.commit()
            session.refresh(setting)
        return {
            "maintenance_mode": setting.maintenance_mode,
            "public_enrollment": setting.public_enrollment,
            "debug_mode": setting.debug_mode,
            "cluster_sync": setting.cluster_sync
        }

@router.get("")
@router.get("/")
async def get_settings(admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("settings", cur, s, access_level="view"))):
    ensure_notification_setting_columns()
    with Session(engine) as session:
        setting = session.exec(select(SystemSetting)).first()
        if not setting:
            # Create default settings if they don't exist
            setting = SystemSetting()
            session.add(setting)
            session.commit()
            session.refresh(setting)
        return setting


@router.post("")
@router.post("/")
async def update_settings(new_settings: dict, admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("settings", cur, s, access_level="edit"))):
    ensure_notification_setting_columns()
    with Session(engine) as session:
        setting = session.exec(select(SystemSetting)).first()
        if not setting:
            setting = SystemSetting()
            session.add(setting)
        
        # Update fields dynamically
        for key, value in new_settings.items():
            if hasattr(setting, key):
                setattr(setting, key, value)
            # Handle camelCase from frontend to snake_case in backend
            elif key == "maintenanceMode": setting.maintenance_mode = value
            elif key == "debugMode": setting.debug_mode = value
            elif key == "publicEnrollment": setting.public_enrollment = value
            elif key == "clusterSync": setting.cluster_sync = value
            elif key == "confidenceThreshold": setting.confidence_threshold = value
            elif key == "motionSensitivity": setting.motion_sensitivity = value
            elif key == "neuralOptimizer": setting.neural_optimizer = value
            elif key == "edgeProcessing": setting.edge_processing = value
            elif key == "retentionLogs": setting.retention_logs = value
            elif key == "retentionVideo": setting.retention_video = value
            elif key == "retentionMetadata": setting.retention_metadata = value
            elif key == "autoPurge": setting.auto_purge = value
            elif key == "emailAlertsEnabled": setting.email_alerts_enabled = value
            elif key == "whatsappAlertsEnabled": setting.whatsapp_alerts_enabled = value
            elif key == "mfaRequired": setting.mfa_required = value
            elif key == "ipLockdown": setting.ip_lockdown = value
            elif key == "sessionTimeout": setting.session_timeout = value
            elif key == "threatAlerts": setting.threat_alerts = value

        session.add(setting)
        session.commit()
        session.refresh(setting)
        return setting
