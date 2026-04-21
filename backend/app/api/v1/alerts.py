from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session
from typing import Optional
import httpx
import json
import asyncio
from app.core.database import get_session
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

@router.get("/intelligence")
async def get_intelligence(camera_id: Optional[int] = None):
    """
    Returns latest intelligence, optionally filtered by camera.
    In a real scenario, this would aggregate data from all AI instances.
    """
    if camera_id:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(f"http://localhost:8001/intelligence/{camera_id}")
                if res.status_code == 200:
                    return res.json()
        except:
            pass
    return latest_intelligence_cache

@router.get("/events")
async def event_stream():
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
def fetch_alerts(hours: float = 24.0, severity: Optional[str] = None, limit: int = 100, session: Session = Depends(get_session)):
    return get_alerts(session, hours, severity, limit)

@router.get("/logs")
def fetch_logs(hours: float = 24.0, camera_id: Optional[int] = None, session: Session = Depends(get_session)):
    return get_logs(session, hours, camera_id)

@router.get("/logs/summary")
def fetch_logs_summary(hours: float = 24.0, camera_id: Optional[int] = None, session: Session = Depends(get_session)):
    return get_logs_summary(session, hours, camera_id, latest_intelligence_cache)
