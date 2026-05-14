from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import engine
from app.models.system_setting import SystemSetting
from typing import Any

router = APIRouter(prefix="/settings", tags=["System Settings"], redirect_slashes=False)

@router.get("/")
async def get_settings():
    with Session(engine) as session:
        setting = session.exec(select(SystemSetting)).first()
        if not setting:
            # Create default settings if they don't exist
            setting = SystemSetting()
            session.add(setting)
            session.commit()
            session.refresh(setting)
        return setting

@router.post("/")
async def update_settings(new_settings: dict):
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
            elif key == "mfaRequired": setting.mfa_required = value
            elif key == "ipLockdown": setting.ip_lockdown = value
            elif key == "sessionTimeout": setting.session_timeout = value
            elif key == "threatAlerts": setting.threat_alerts = value

        session.add(setting)
        session.commit()
        session.refresh(setting)
        return setting
