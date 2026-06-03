from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Header
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from typing import Optional
import httpx
import json
import asyncio
import logging
from datetime import datetime
from pydantic import BaseModel
from app.core.database import get_session
from app.core.config import settings as config_settings
from app.core.security import decode_access_token
from app.api.v1.auth import get_current_user
from app.api.v1.users import verify_module_access, get_allowed_area_ids
from app.models import DetectionEvent, Camera, Area
from app.services.alert_service import get_alerts, get_logs, get_logs_summary, get_scenario_camera_matrix
from app.services.notification_service import send_alert_email, send_whatsapp_alert

router = APIRouter(prefix="", tags=["Intelligence & Alerts"])
logger = logging.getLogger(__name__)

# Global state to keep track of latest intelligence across the backend
# This will be updated by polling the AI service or via Webhooks
latest_intelligence_cache = {
    "person_count": 0,
    "objects": [],
    "stable_objects": [],
    "last_update": 0.0
}

def empty_intelligence():
    return {
        "person_count": 0,
        "objects": [],
        "stable_objects": [],
        "last_update": 0.0,
    }

class WebhookEvent(BaseModel):
    camera_id: int
    scenario_key: str
    confidence: float
    metadata: dict
    image_base64: Optional[str] = None


def _events_with_location_context(events: list[DetectionEvent], session: Session):
    camera_ids = {event.camera_id for event in events}
    cameras = session.exec(select(Camera).where(Camera.id.in_(camera_ids))).all() if camera_ids else []
    camera_map = {camera.id: camera for camera in cameras}
    area_ids = {camera.area_id for camera in cameras if camera.area_id is not None}
    areas = session.exec(select(Area).where(Area.id.in_(area_ids))).all() if area_ids else []
    area_map = {area.id: area for area in areas}

    result = []
    for event in events:
        item = event.dict()
        camera = camera_map.get(event.camera_id)
        area = area_map.get(camera.area_id) if camera else None
        item["camera_name"] = camera.name if camera else f"CAM-{event.camera_id}"
        item["area_id"] = camera.area_id if camera else None
        item["area_name"] = area.name if area else "Unknown Area"
        result.append(item)
    return result

def verify_event_stream_access(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return verify_module_access("live_monitoring", current_user, session, access_level="view")

@router.post("/webhook/events")
async def receive_events(
    events: list[WebhookEvent],
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    x_webhook_secret: Optional[str] = Header(None),
):
    # Verify internal webhook secret
    expected_secret = config_settings.SECRET_KEY
    if not x_webhook_secret or x_webhook_secret != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid webhook secret")

    object_names = []
    stable_objects = []
    person_count = 0

    from sqlmodel import select
    from app.models import AIScenario, User, Role, SystemSetting
    from app.models.user import RoleAreaPermission
    scenarios = session.exec(select(AIScenario)).all()
    scenario_severity_map = {s.key: s.default_severity for s in scenarios}

    # Pre-fetch notify-eligible users (configured via roles in .env)
    notify_roles = config_settings.alert_notify_roles_list
    admin_roles = session.exec(
        select(Role).where(Role.name.in_(notify_roles))
    ).all() if notify_roles else []
    admin_role_ids = [r.id for r in admin_roles]
    notify_users = []
    if admin_role_ids:
        notify_users = session.exec(
            select(User).where(
                User.role_id.in_(admin_role_ids),
                User.is_active == True
            )
        ).all()

    # Pre-fetch all area permissions for quick lookup: {role_id: set(area_ids)}
    all_area_perms = session.exec(
        select(RoleAreaPermission).where(
            RoleAreaPermission.role_id.in_(admin_role_ids),
            RoleAreaPermission.can_view == True
        )
    ).all() if admin_role_ids else []
    role_area_map = {}
    for perm in all_area_perms:
        role_area_map.setdefault(perm.role_id, set()).add(perm.area_id)

    # Custom alert receiver from .env (always receives all alerts regardless of area)
    custom_receiver = config_settings.ALERT_RECEIVER_EMAIL

    system_setting = session.exec(select(SystemSetting)).first()
    email_alerts_enabled = system_setting.email_alerts_enabled if system_setting else True
    whatsapp_alerts_enabled = system_setting.whatsapp_alerts_enabled if system_setting else True

    # Pre-fetch camera and area info for email context
    all_cameras = session.exec(select(Camera)).all()
    camera_map = {c.id: c for c in all_cameras}
    all_areas = session.exec(select(Area)).all()
    area_map = {a.id: a for a in all_areas}

    for ev in events:
        severity = scenario_severity_map.get(ev.scenario_key, "Medium")
        # Har detection ko as an alert mark karenge taake wo crisis center me show ho
        is_alert = True
        
        db_event = DetectionEvent(
            camera_id=ev.camera_id,
            scenario_key=ev.scenario_key,
            object_class=ev.scenario_key,
            confidence=ev.confidence,
            severity=severity,
            is_alert=is_alert,
            metadata_json=ev.metadata,
            image_base64=ev.image_base64
        )
        session.add(db_event)

        object_names.append(ev.scenario_key)
        if is_alert:
            stable_objects.append(ev.scenario_key)
        if "person" in ev.scenario_key.lower() or "entry" in ev.scenario_key.lower():
            person_count += int(ev.metadata.get("count", 1))

        # Schedule email notification for configured severity alerts
        notify_severities = config_settings.alert_notify_severities_list
        if is_alert and severity in notify_severities and notify_users:
            cam = camera_map.get(ev.camera_id)
            area = area_map.get(cam.area_id) if cam else None
            alert_area_id = cam.area_id if cam else None

            # Filter users: only those whose role has can_view permission for this area
            filtered_emails = []
            whatsapp_numbers = []
            for u in notify_users:
                if alert_area_id is not None:
                    user_allowed_areas = role_area_map.get(u.role_id, set())
                    if alert_area_id in user_allowed_areas:
                        if u.email:
                            filtered_emails.append(u.email)
                        if u.whatsapp_alerts_enabled and u.whatsapp_number:
                            whatsapp_numbers.append(u.whatsapp_number)

            # Always add custom receiver from .env (global override)
            if custom_receiver and custom_receiver not in filtered_emails:
                filtered_emails.append(custom_receiver)

            if not email_alerts_enabled:
                filtered_emails = []
            if not whatsapp_alerts_enabled:
                whatsapp_numbers = []

            logger.info(
                "Alert notification recipients: scenario=%s severity=%s camera_id=%s area_id=%s "
                "email_enabled=%s whatsapp_enabled=%s emails=%s whatsapp_numbers=%s",
                ev.scenario_key,
                severity,
                ev.camera_id,
                alert_area_id,
                email_alerts_enabled,
                whatsapp_alerts_enabled,
                len(filtered_emails),
                len(whatsapp_numbers),
            )

            if filtered_emails or whatsapp_numbers:
                email_details = {
                    "scenario_key": ev.scenario_key,
                    "camera_id": ev.camera_id,
                    "camera_name": cam.name if cam else f"CAM-{ev.camera_id}",
                    "area_name": area.name if area else "Unknown Area",
                    "severity": severity,
                    "confidence": ev.confidence,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "metadata": ev.metadata,
                    "image_base64": ev.image_base64,
                }
                if filtered_emails:
                    background_tasks.add_task(send_alert_email, email_details, filtered_emails)
                if whatsapp_numbers:
                    background_tasks.add_task(send_whatsapp_alert, email_details, whatsapp_numbers)

    session.commit()

    latest_intelligence_cache.update({
        "person_count": person_count,
        "objects": sorted(set(object_names)),
        "stable_objects": sorted(set(stable_objects)),
        "last_update": asyncio.get_running_loop().time()
    })
    return {"status": "success"}

@router.get("/intelligence/{camera_id}")
@router.get("/intelligence")
@router.get("/intelligence/")
async def get_intelligence(
    camera_id: Optional[int] = None,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
    auth_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("dashboard", cur, s, access_level="view")),
):
    """
    Returns latest intelligence, filtered by authorized areas.
    """
    allowed_area_ids = get_allowed_area_ids(current_user["id"], session)
    
    # Get all camera objects for these allowed areas
    allowed_cameras = session.exec(
        select(Camera).where(Camera.area_id.in_(allowed_area_ids), Camera.is_active == True)
    ).all()
    allowed_camera_ids = {c.id for c in allowed_cameras}

    if camera_id is not None:
        if camera_id not in allowed_camera_ids:
            return empty_intelligence() # Security block

        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                res = await client.get(f"http://localhost:8001/intelligence/{camera_id}")
                if res.status_code == 200:
                    return res.json()
        except Exception:
            pass
        return empty_intelligence()

    # Aggregate intelligence for all allowed cameras
    aggregate = {
        "person_count": 0,
        "objects": [],
        "stable_objects": [],
        "last_update": latest_intelligence_cache.get("last_update", 0.0),
        "camera_counts": {}
    }

    if not allowed_cameras:
        return aggregate

    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            responses = await asyncio.gather(
                *[client.get(f"http://localhost:8001/intelligence/{cam.id}") for cam in allowed_cameras],
                return_exceptions=True,
            )
    except Exception:
        responses = []

    for i, res in enumerate(responses):
        if isinstance(res, Exception) or res.status_code != 200:
            continue
        data = res.json()
        cam_id = allowed_cameras[i].id
        c_person_count = data.get("person_count", 0) or 0
        aggregate["camera_counts"][cam_id] = c_person_count
        aggregate["person_count"] += c_person_count
        aggregate["objects"].extend(data.get("objects", []) or [])
        aggregate["stable_objects"].extend(data.get("stable_objects", []) or [])
        aggregate["last_update"] = max(aggregate["last_update"], data.get("last_update", 0.0) or 0.0)

    if aggregate["objects"] or aggregate["stable_objects"] or aggregate["person_count"]:
        aggregate["objects"] = sorted(set(aggregate["objects"]))
        aggregate["stable_objects"] = sorted(set(aggregate["stable_objects"]))
        # Note: We don't update global latest_intelligence_cache here because it's user-specific now
        return aggregate

    return aggregate

@router.get("/events")
async def event_stream(
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
    auth_data: dict = Depends(verify_event_stream_access)
):
    """
    Server-Sent Events for real-time dashboard updates, filtered by user access.
    """
    allowed_area_ids = get_allowed_area_ids(current_user["id"], session)
    allowed_cams = session.exec(
        select(Camera.id).where(Camera.area_id.in_(allowed_area_ids))
    ).all()
    allowed_cam_ids = set(allowed_cams)

    async def event_generator():
        last_update = 0.0
        while True:
            if latest_intelligence_cache["last_update"] != last_update:
                last_update = latest_intelligence_cache["last_update"]
                
                # In a real system, we'd pull per-camera stats. 
                # For now, if the global cache updated, we tell the client to re-sync 
                # or we'd need to store per-camera history.
                # To keep it simple and secure, we send a "sync" signal or a filtered snapshot.
                # However, since the webhook doesn't store per-camera latest in the cache currently,
                # we just send a signal to the frontend to re-fetch /intelligence (which is filtered).
                
                sync_payload = {"type": "sync", "last_update": last_update}
                yield f"data: {json.dumps(sync_payload)}\n\n"
                
            await asyncio.sleep(1.0)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/alerts")
@router.get("/alerts/")
def fetch_alerts(
    hours: float = 24.0,
    severity: Optional[str] = None,
    limit: int = 100,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
    auth_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("alerts", cur, s, access_level="view")),
):
    # Filter by allowed areas
    allowed_area_ids = get_allowed_area_ids(current_user["id"], session)
    alerts = get_alerts(session, hours, severity, limit, start_date, end_date, allowed_area_ids=allowed_area_ids)
    return _events_with_location_context(alerts, session)

@router.get("/logs")
@router.get("/logs/")
def fetch_logs(
    hours: float = 24.0,
    camera_id: Optional[int] = None,
    area_id: Optional[int] = None,
    scenario_key: Optional[str] = None,
    object_class: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
    auth_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("alerts", cur, s, access_level="view")),
):
    limit = max(1, min(limit, 500))
    skip = max(0, skip)
    
    # Filter by allowed areas
    allowed_area_ids = get_allowed_area_ids(current_user["id"], session)
    logs = get_logs(session, hours, camera_id, area_id, scenario_key, object_class, severity, limit, skip, allowed_area_ids=allowed_area_ids)
    return _events_with_location_context(logs, session)

@router.get("/logs/summary")
@router.get("/logs/summary/")
def fetch_logs_summary(
    hours: float = 24.0,
    camera_id: Optional[int] = None,
    area_id: Optional[int] = None,
    scenario_key: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
    auth_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("alerts", cur, s, access_level="view")),
):
    # Filter by allowed areas
    allowed_area_ids = get_allowed_area_ids(current_user["id"], session)
    
    return get_logs_summary(session, hours, camera_id, area_id, scenario_key, latest_intelligence_cache, allowed_area_ids=allowed_area_ids)
    
@router.put("/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    session: Session = Depends(get_session),
    auth_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("alerts", cur, s, access_level="edit")),
):
    """
    Marks an alert as resolved in the database.
    """
    event = session.get(DetectionEvent, alert_id)
    if not event:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    event.is_resolved = True
    session.add(event)
    session.commit()
    return {"status": "success", "message": f"Alert {alert_id} resolved"}

@router.get("/logs/matrix")
@router.get("/logs/matrix/")
def fetch_scenario_camera_matrix(
    hours: float = 24.0,
    area_id: Optional[int] = None,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
    auth_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("alerts", cur, s, access_level="view")),
):
    allowed_area_ids = get_allowed_area_ids(current_user["id"], session)
    return get_scenario_camera_matrix(session, hours, area_id, allowed_area_ids=allowed_area_ids)
