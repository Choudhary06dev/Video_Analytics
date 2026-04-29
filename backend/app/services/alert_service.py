from datetime import datetime, timedelta
from typing import Optional, List, Dict
from sqlmodel import Session, select
from app.models import DetectionEvent, Camera, Area


def _collect_area_ids(session: Session, area_id: Optional[int]) -> Optional[List[int]]:
    if area_id is None:
        return None

    area = session.get(Area, area_id)
    if not area:
        return []

    area_ids = [area_id]
    queue = [area_id]
    while queue:
        parent_id = queue.pop(0)
        children = session.exec(select(Area).where(Area.parent_id == parent_id)).all()
        for child in children:
            if child.id not in area_ids:
                area_ids.append(child.id)
                queue.append(child.id)

    return area_ids


def _camera_ids_for_area(session: Session, area_id: Optional[int]) -> Optional[List[int]]:
    area_ids = _collect_area_ids(session, area_id)
    if area_ids is None:
        return None
    if not area_ids:
        return []

    cameras = session.exec(select(Camera).where(Camera.area_id.in_(area_ids))).all()
    return [camera.id for camera in cameras if camera.id is not None]


def _apply_event_filters(
    statement,
    session: Session,
    camera_id: Optional[int] = None,
    area_id: Optional[int] = None,
    scenario_key: Optional[str] = None,
    object_class: Optional[str] = None,
    severity: Optional[str] = None,
):
    if camera_id is not None:
        statement = statement.where(DetectionEvent.camera_id == camera_id)
    elif area_id is not None:
        camera_ids = _camera_ids_for_area(session, area_id)
        if not camera_ids:
            return None
        statement = statement.where(DetectionEvent.camera_id.in_(camera_ids))

    if scenario_key:
        statement = statement.where(DetectionEvent.scenario_key == scenario_key)
    if object_class:
        statement = statement.where(DetectionEvent.object_class == object_class)
    if severity:
        statement = statement.where(DetectionEvent.severity == severity)

    return statement

def get_alerts(session: Session, hours: float = 24.0, severity: Optional[str] = None, limit: int = 100):
    cutoff = datetime.now() - timedelta(hours=hours)
    statement = select(DetectionEvent).where(
        DetectionEvent.timestamp >= cutoff,
        DetectionEvent.is_alert == True
    )
    if severity:
        statement = statement.where(DetectionEvent.severity == severity)
    statement = statement.order_by(DetectionEvent.timestamp.desc()).limit(limit)
    return session.exec(statement).all()

def get_logs(
    session: Session,
    hours: float = 24.0,
    camera_id: Optional[int] = None,
    area_id: Optional[int] = None,
    scenario_key: Optional[str] = None,
    object_class: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
):
    cutoff = datetime.now() - timedelta(hours=hours)
    statement = select(DetectionEvent).where(DetectionEvent.timestamp >= cutoff)
    statement = _apply_event_filters(statement, session, camera_id, area_id, scenario_key, object_class, severity)
    if statement is None:
        return []
    statement = statement.order_by(DetectionEvent.timestamp.desc()).offset(skip).limit(limit)
    return session.exec(statement).all()

def get_logs_summary(
    session: Session,
    hours: float = 24.0,
    camera_id: Optional[int] = None,
    area_id: Optional[int] = None,
    scenario_key: Optional[str] = None,
    latest_intelligence: Optional[Dict] = None,
):
    latest_intelligence = latest_intelligence or {}
    cutoff = datetime.now() - timedelta(hours=hours)
    statement = select(DetectionEvent).where(DetectionEvent.timestamp >= cutoff)
    statement = _apply_event_filters(statement, session, camera_id, area_id, scenario_key)
    
    if statement is None:
        events = []
    else:
        events = session.exec(statement).all()
    
    total_persons = 0
    total_weapons = 0
    total_vehicles = 0
    object_counts = {}
    camera_ids = set()
    
    # Activity Vault stats
    hourly_distribution = [0] * 24
    severity_distribution = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    
    for ev in events:
        obj = ev.object_class
        camera_ids.add(ev.camera_id)
        object_counts[obj] = object_counts.get(obj, 0) + 1
        
        # Time and Severity distribution
        hour = ev.timestamp.hour
        hourly_distribution[hour] += 1
        sev = ev.severity
        if sev in severity_distribution:
            severity_distribution[sev] += 1
        
        obj_lower = obj.lower()
        if "person" in obj_lower or "entry" in obj_lower:
            total_persons += ev.metadata_json.get("count", 1) if ev.metadata_json else 1
        if "weapon" in obj_lower or "knife" in obj_lower:
            total_weapons += ev.metadata_json.get("count", 1) if ev.metadata_json else 1
        if "vehicle" in obj_lower or "car" in obj_lower or "truck" in obj_lower:
            total_vehicles += ev.metadata_json.get("count", 1) if ev.metadata_json else 1
            
    live_persons = latest_intelligence.get("person_count", 0)
    live_objects = latest_intelligence.get("objects", [])
    
    live_weapons = 0
    live_vehicles = 0
    for obj in live_objects:
        obj_lower = obj.lower()
        if "weapon" in obj_lower or "knife" in obj_lower:
            live_weapons += 1
        if any(v in obj_lower for v in ["vehicle", "car", "truck", "bus"]):
            live_vehicles += 1

    threat_level = "Normal"
    status_msg = "Security posture stable"
    
    if live_weapons > 0:
        threat_level = "Critical"
        status_msg = f"CRITICAL: WEAPON DETECTED - Threat identified"
    elif live_persons > 10:
        threat_level = "Elevated"
        status_msg = f"CROWD ALERT: {live_persons} persons in sector"
    elif live_vehicles > 5:
        threat_level = "Notice"
        status_msg = f"Increased transit activity: {live_vehicles} units"

    return {
        "hours": hours,
        "camera_id": camera_id,
        "area_id": area_id,
        "scenario_key": scenario_key,
        "count": len(events),
        "total_logs": len(events),
        "camera_ids": sorted(camera_ids),
        "total_persons": total_persons,
        "total_weapons": total_weapons,
        "total_vehicles": total_vehicles,
        "threat_level": threat_level,
        "status_message": status_msg,
        "object_breakdown": object_counts,
        "hourly_distribution": hourly_distribution,
        "severity_distribution": severity_distribution,
        "timestamp": datetime.now().isoformat()
    }
