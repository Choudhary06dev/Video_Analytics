from datetime import datetime, timedelta
from typing import Optional, List, Dict
from sqlmodel import Session, select
from app.models import DetectionEvent, AIScenario, Camera

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

def get_logs(session: Session, hours: float = 24.0, camera_id: Optional[int] = None):
    cutoff = datetime.now() - timedelta(hours=hours)
    statement = select(DetectionEvent).where(DetectionEvent.timestamp >= cutoff)
    if camera_id is not None:
        statement = statement.where(DetectionEvent.camera_id == camera_id)
    statement = statement.order_by(DetectionEvent.timestamp.desc()).limit(100)
    return session.exec(statement).all()

def get_logs_summary(session: Session, hours: float = 24.0, camera_id: Optional[int] = None, latest_intelligence: Dict = {}):
    cutoff = datetime.now() - timedelta(hours=hours)
    statement = select(DetectionEvent).where(DetectionEvent.timestamp >= cutoff)
    if camera_id is not None:
        statement = statement.where(DetectionEvent.camera_id == camera_id)
    
    events = session.exec(statement).all()
    
    total_persons = 0
    total_weapons = 0
    total_vehicles = 0
    object_counts = {}
    
    for ev in events:
        obj = ev.object_class
        object_counts[obj] = object_counts.get(obj, 0) + 1
        
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
        "count": len(events),
        "total_persons": total_persons,
        "total_weapons": total_weapons,
        "total_vehicles": total_vehicles,
        "threat_level": threat_level,
        "status_message": status_msg,
        "object_breakdown": object_counts,
        "timestamp": datetime.now().isoformat()
    }
