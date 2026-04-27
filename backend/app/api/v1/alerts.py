from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from typing import Optional
import httpx
import json
import asyncio
from pydantic import BaseModel
from app.core.database import get_session
from app.core.security import decode_access_token
from app.api.v1.auth import get_current_user
from app.api.v1.users import verify_module_access
from app.models import DetectionEvent, Camera
from app.services.alert_service import get_alerts, get_logs, get_logs_summary

router = APIRouter(prefix="", tags=["Intelligence & Alerts"])

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

def verify_event_stream_access(
    token: str = Query(None),
    session: Session = Depends(get_session),
):
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token missing")

    current_user = decode_access_token(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return verify_module_access("live_monitoring", current_user, session, access_level="view")

@router.post("/webhook/events")
async def receive_events(events: list[WebhookEvent], session: Session = Depends(get_session)):
    object_names = []
    stable_objects = []
    person_count = 0

    for ev in events:
        severity = "Medium"
        is_alert = False
        if ev.confidence > 0.7:
            severity = "High"
            is_alert = True
        
        db_event = DetectionEvent(
            camera_id=ev.camera_id,
            scenario_key=ev.scenario_key,
            object_class=ev.scenario_key,
            confidence=ev.confidence,
            severity=severity,
            is_alert=is_alert,
            metadata_json=ev.metadata
        )
        session.add(db_event)

        object_names.append(ev.scenario_key)
        if is_alert:
            stable_objects.append(ev.scenario_key)
        if "person" in ev.scenario_key.lower() or "entry" in ev.scenario_key.lower():
            person_count += int(ev.metadata.get("count", 1))

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
async def get_intelligence(
    camera_id: Optional[int] = None,
    session: Session = Depends(get_session),
    auth_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("dashboard", cur, s, access_level="view")),
):
    """
    Returns latest intelligence, optionally filtered by camera.
    In a real scenario, this would aggregate data from all AI instances.
    """
    if camera_id is not None:
        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                res = await client.get(f"http://localhost:8001/intelligence/{camera_id}")
                if res.status_code == 200:
                    return res.json()
        except Exception:
            pass
        return empty_intelligence()

    if camera_id is None:
        cameras = session.exec(select(Camera).where(Camera.is_active == True)).all()
        aggregate = {
            "person_count": 0,
            "objects": [],
            "stable_objects": [],
            "last_update": latest_intelligence_cache.get("last_update", 0.0),
        }

        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                responses = await asyncio.gather(
                    *[client.get(f"http://localhost:8001/intelligence/{cam.id}") for cam in cameras],
                    return_exceptions=True,
                )
        except Exception:
            responses = []

        for res in responses:
            if isinstance(res, Exception) or res.status_code != 200:
                continue
            data = res.json()
            aggregate["person_count"] += data.get("person_count", 0) or 0
            aggregate["objects"].extend(data.get("objects", []) or [])
            aggregate["stable_objects"].extend(data.get("stable_objects", []) or [])
            aggregate["last_update"] = max(aggregate["last_update"], data.get("last_update", 0.0) or 0.0)

        if aggregate["objects"] or aggregate["stable_objects"] or aggregate["person_count"]:
            aggregate["objects"] = sorted(set(aggregate["objects"]))
            aggregate["stable_objects"] = sorted(set(aggregate["stable_objects"]))
            latest_intelligence_cache.update(aggregate)
            return aggregate

    return latest_intelligence_cache

@router.get("/events")
async def event_stream(auth_data: dict = Depends(verify_event_stream_access)):
    """
    Server-Sent Events for real-time dashboard updates.
    Ideally, this would subscribe to a Redis pub/sub.
    """
    async def event_generator():
        last_update = 0.0
        while True:
            if latest_intelligence_cache["last_update"] != last_update:
                last_update = latest_intelligence_cache["last_update"]
                yield f"data: {json.dumps(latest_intelligence_cache)}\n\n"
            await asyncio.sleep(0.5)
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/alerts")
def fetch_alerts(
    hours: float = 24.0,
    severity: Optional[str] = None,
    limit: int = 100,
    session: Session = Depends(get_session),
    auth_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("alerts", cur, s, access_level="view")),
):
    return get_alerts(session, hours, severity, limit)

@router.get("/logs")
def fetch_logs(
    hours: float = 24.0,
    camera_id: Optional[int] = None,
    object_class: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    session: Session = Depends(get_session),
    auth_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("alerts", cur, s, access_level="view")),
):
    limit = max(1, min(limit, 500))
    skip = max(0, skip)
    return get_logs(session, hours, camera_id, object_class, severity, limit, skip)

@router.get("/logs/summary")
def fetch_logs_summary(
    hours: float = 24.0,
    camera_id: Optional[int] = None,
    session: Session = Depends(get_session),
    auth_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("alerts", cur, s, access_level="view")),
):
    return get_logs_summary(session, hours, camera_id, latest_intelligence_cache)
