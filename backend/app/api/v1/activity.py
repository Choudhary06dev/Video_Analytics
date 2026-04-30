from fastapi import APIRouter, Depends
from typing import Optional
from sqlmodel import Session, select
from sqlalchemy.orm import joinedload

from app.core.database import get_session
from app.api.v1.auth import get_current_user
from app.services.alert_service import get_logs, get_logs_summary
from app.models import DetectionEvent, Camera, Area

router = APIRouter(prefix="/activity", tags=["Activity Vault"])


from datetime import datetime, timedelta
from app.models import Camera, Area, DetectionEvent

@router.get("")
def get_activity_vault_data(
    hours: float = 24.0,
    camera_id: Optional[int] = None,
    area_id: Optional[int] = None,
    scenario_key: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    session: Session = Depends(get_session),
    auth_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("vault", cur, s, access_level="view"))
):
    """
    Activity Vault endpoint - returns AI detection events with camera/area context.
    """
    # Get logs (existing service)
    events = get_logs(
        session, hours, camera_id, area_id, scenario_key, None, severity, limit, skip, start_date, end_date
    )
    
    # Get summary (existing service)  
    summary = get_logs_summary(session, hours, camera_id, area_id, scenario_key)
    
    # Join with Camera and Area names
    event_list = []
    camera_dict = {c.id: c.name for c in session.exec(select(Camera)).all()}
    area_dict = {a.id: a.name for a in session.exec(select(Area)).all()}
    
    for event in events:
        cam_name = camera_dict.get(event.camera_id, f"CAM-{event.camera_id}")
        area_name = "Unknown Area"
        
        # Get camera area
        camera = session.get(Camera, event.camera_id)
        if camera and camera.area_id:
            area = session.get(Area, camera.area_id)
            if area:
                area_name = area.name
        
        event_list.append({
            "id": event.id,
            "timestamp": event.timestamp.isoformat(),
            "camera_id": event.camera_id,
            "camera_name": cam_name,
            "area_name": area_name,
            "scenario_key": event.scenario_key,
            "object_class": event.object_class, 
            "confidence": float(event.confidence),
            "severity": event.severity,
            "is_alert": event.is_alert,
            "threat_score": _calculate_threat(event),
            "metadata": event.metadata_json or {},
            "time_ago": _format_time_ago(event.timestamp),
            "image_base64": event.image_base64 or None
        })
    
    # Total count query
    if start_date and end_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00').split('.')[0])
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00').split('.')[0])
            if len(end_date) <= 10:
                end_dt = end_dt + timedelta(days=1)
            total_stmt = select(DetectionEvent).where(DetectionEvent.timestamp >= start_dt, DetectionEvent.timestamp <= end_dt)
        except ValueError:
            cutoff = datetime.now() - timedelta(hours=hours)
            total_stmt = select(DetectionEvent).where(DetectionEvent.timestamp >= cutoff)
    else:
        cutoff = datetime.now() - timedelta(hours=hours)
        total_stmt = select(DetectionEvent).where(DetectionEvent.timestamp >= cutoff)
        
    total_count = len(session.exec(total_stmt).all())
    
    return {
        "events": event_list,
        "summary": summary,
        "total": total_count,
        "hours": hours,
        "filters": {
            "camera_id": camera_id,
            "area_id": area_id, 
            "scenario_key": scenario_key,
            "severity": severity
        }
    }


def _calculate_threat(event):
    """Calculate threat score from severity + confidence."""
    severity_map = {"Low": 1, "Medium": 3, "High": 7, "Critical": 10}
    base = severity_map.get(event.severity, 1)
    conf_factor = min(event.confidence * 10, 10)
    return min(base * conf_factor, 100)


def _format_time_ago(timestamp):
    from datetime import datetime
    ago = (datetime.now() - timestamp).total_seconds() / 60
    if ago < 1:
        return "Just now"
    elif ago < 60:
        return f"{int(ago)}m ago"
    elif ago < 1440: 
        return f"{int(ago/60)}h ago"
    else:
        return f"{int(ago/1440)}d ago"


from app.api.v1.users import verify_module_access

@router.get("/summary")
def get_activity_summary(
    hours: float = 24.0,
    camera_id: Optional[int] = None,
    session: Session = Depends(get_session),
    auth_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("vault", cur, s, access_level="view"))
):
    """Summary stats for ActivityVault charts."""
    return get_logs_summary(session, hours, camera_id, None, None)

