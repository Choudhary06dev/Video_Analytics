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
    allowed_area_ids: Optional[List[int]] = None,
):
    # 1. Global Area Permission Filter (Security)
    if allowed_area_ids is not None:
        # Get all camera IDs in these allowed areas
        allowed_cams = session.exec(
            select(Camera.id).where(Camera.area_id.in_(allowed_area_ids))
        ).all()
        
        if not allowed_cams:
            return None # No cameras accessible = No logs
            
        statement = statement.where(DetectionEvent.camera_id.in_(allowed_cams))

    # 2. Specific Filters (User Request)
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

def get_alerts(
    session: Session, 
    hours: float = 24.0, 
    severity: Optional[str] = None, 
    limit: int = 100,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    allowed_area_ids: Optional[List[int]] = None,
):
    if start_date or end_date:
        try:
            start_dt = None
            end_dt = None
            if start_date:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00').split('.')[0])
            if end_date:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00').split('.')[0])
                if len(end_date) <= 10:
                    end_dt = end_dt + timedelta(days=1)
            
            statement = select(DetectionEvent)
            if start_dt:
                statement = statement.where(DetectionEvent.timestamp >= start_dt)
            if end_dt:
                statement = statement.where(DetectionEvent.timestamp <= end_dt)
        except ValueError:
            cutoff = datetime.now() - timedelta(hours=hours)
            statement = select(DetectionEvent).where(DetectionEvent.timestamp >= cutoff)
    else:
        cutoff = datetime.now() - timedelta(hours=hours)
        statement = select(DetectionEvent).where(DetectionEvent.timestamp >= cutoff)

    statement = statement.where(DetectionEvent.is_alert == True)
    
    # Apply security and severity filters
    statement = _apply_event_filters(statement, session, severity=severity, allowed_area_ids=allowed_area_ids)
    
    if statement is None:
        return []
        
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
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    allowed_area_ids: Optional[List[int]] = None,
):
    if start_date or end_date:
        try:
            start_dt = None
            end_dt = None
            if start_date:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00').split('.')[0])
            if end_date:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00').split('.')[0])
                if len(end_date) <= 10:
                    end_dt = end_dt + timedelta(days=1)
            
            statement = select(DetectionEvent)
            if start_dt:
                statement = statement.where(DetectionEvent.timestamp >= start_dt)
            if end_dt:
                statement = statement.where(DetectionEvent.timestamp <= end_dt)
        except ValueError:
            cutoff = datetime.now() - timedelta(hours=hours)
            statement = select(DetectionEvent).where(DetectionEvent.timestamp >= cutoff)
    else:
        cutoff = datetime.now() - timedelta(hours=hours)
        statement = select(DetectionEvent).where(DetectionEvent.timestamp >= cutoff)
        
    statement = _apply_event_filters(statement, session, camera_id, area_id, scenario_key, object_class, severity, allowed_area_ids)
    if statement is None:
        return []
    statement = statement.order_by(DetectionEvent.timestamp.desc()).offset(skip).limit(limit)
    return session.exec(statement).all()

def _get_summary_stats(
    session: Session,
    start_dt: datetime,
    end_dt: datetime,
    camera_id: Optional[int] = None,
    area_id: Optional[int] = None,
    scenario_key: Optional[str] = None,
    allowed_area_ids: Optional[List[int]] = None,
) -> Dict:
    statement = select(DetectionEvent).where(DetectionEvent.timestamp >= start_dt).where(DetectionEvent.timestamp <= end_dt)
    statement = _apply_event_filters(statement, session, camera_id, area_id, scenario_key, allowed_area_ids=allowed_area_ids)
    
    if statement is None:
        events = []
    else:
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
            
    return {
        "count": len(events),
        "total_persons": total_persons,
        "total_weapons": total_weapons,
        "total_vehicles": total_vehicles,
        "object_breakdown": object_counts,
        "avg_confidence": float(sum(ev.confidence for ev in events) / len(events) if events else 0)
    }

def get_logs_summary(
    session: Session,
    hours: float = 24.0,
    camera_id: Optional[int] = None,
    area_id: Optional[int] = None,
    scenario_key: Optional[str] = None,
    latest_intelligence: Optional[Dict] = None,
    allowed_area_ids: Optional[List[int]] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    latest_intelligence = latest_intelligence or {}
    now = datetime.now()
    
    # Calculate current period range
    if start_date or end_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00').split('.')[0]) if start_date else now - timedelta(hours=hours)
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00').split('.')[0]) if end_date else now
            if end_date and len(end_date) <= 10:
                end_dt += timedelta(days=1)
        except ValueError:
            start_dt, end_dt = now - timedelta(hours=hours), now
    else:
        start_dt, end_dt = now - timedelta(hours=hours), now
        
    # Get Current Period Stats
    current_stats = _get_summary_stats(session, start_dt, end_dt, camera_id, area_id, scenario_key, allowed_area_ids)
    
    # Calculate Previous Period Range (same duration before start_dt)
    duration = end_dt - start_dt
    prev_start_dt = start_dt - duration
    prev_end_dt = start_dt
    
    # Get Previous Period Stats
    previous_stats = _get_summary_stats(session, prev_start_dt, prev_end_dt, camera_id, area_id, scenario_key, allowed_area_ids)
    
    # Additional data for the response (Heatmaps, Threat levels based on current period)
    statement = select(DetectionEvent).where(DetectionEvent.timestamp >= start_dt).where(DetectionEvent.timestamp <= end_dt)
    statement = _apply_event_filters(statement, session, camera_id, area_id, scenario_key, allowed_area_ids=allowed_area_ids)
    events = session.exec(statement).all() if statement is not None else []
    
    hourly_distribution = [0] * 24
    weekly_distribution = [[0] * 24 for _ in range(7)]
    severity_distribution = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    
    for ev in events:
        hour = ev.timestamp.hour
        hourly_distribution[hour] += 1
        weekly_distribution[ev.timestamp.weekday()][hour] += 1
        if ev.severity in severity_distribution:
            severity_distribution[ev.severity] += 1
            
    live_persons = latest_intelligence.get("person_count", 0)
    live_weapons = sum(1 for obj in latest_intelligence.get("objects", []) if any(x in obj.lower() for x in ["weapon", "knife"]))
    
    if live_weapons > 0:
        threat_level, status_msg = "Critical", "Critical: weapon detected - Threat identified"
    elif live_persons > 10:
        threat_level, status_msg = "Elevated", f"Crowd alert: {live_persons} persons in sector"
    else:
        threat_level, status_msg = "Normal", "Security posture stable"

    return {
        "hours": hours,
        "current": current_stats,
        "previous": previous_stats,
        "threat_level": threat_level,
        "status_message": status_msg,
        "hourly_distribution": hourly_distribution,
        "weekly_distribution": weekly_distribution,
        "severity_distribution": severity_distribution,
        "count": current_stats["count"], # For backward compatibility
        "total_persons": current_stats["total_persons"],
        "timestamp": now.isoformat()
    }

def get_scenario_camera_matrix(
    session: Session,
    hours: float = 24.0,
    area_id: Optional[int] = None,
    allowed_area_ids: Optional[List[int]] = None,
):
    """
    Returns a cross-tabulation of scenarios (rows) vs cameras (columns) with alert counts.
    """
    cutoff = datetime.now() - timedelta(hours=hours)
    statement = select(DetectionEvent).where(DetectionEvent.timestamp >= cutoff)

    statement = _apply_event_filters(statement, session, area_id=area_id, allowed_area_ids=allowed_area_ids)
    if statement is None:
        return {"scenarios": [], "cameras": [], "matrix": {}, "total_alerts": 0}

    events = session.exec(statement).all()

    # Build matrix: { scenario_key: { camera_id: count } }
    matrix = {}
    camera_ids = set()
    for ev in events:
        sk = ev.scenario_key or ev.object_class or "unknown"
        cid = ev.camera_id
        camera_ids.add(cid)
        if sk not in matrix:
            matrix[sk] = {}
        matrix[sk][cid] = matrix[sk].get(cid, 0) + 1

    # Get camera names
    camera_list = []
    if camera_ids:
        cams = session.exec(select(Camera).where(Camera.id.in_(camera_ids))).all()
        camera_list = [{"id": c.id, "name": c.name} for c in sorted(cams, key=lambda x: x.id)]
    
    # Sort scenarios by total alerts descending
    scenario_totals = {sk: sum(cams.values()) for sk, cams in matrix.items()}
    sorted_scenarios = sorted(matrix.keys(), key=lambda sk: scenario_totals.get(sk, 0), reverse=True)

    return {
        "scenarios": sorted_scenarios,
        "cameras": camera_list,
        "matrix": matrix,
        "total_alerts": len(events)
    }
