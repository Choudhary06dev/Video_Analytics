from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, delete
from typing import List
import httpx
from app.core.database import get_session
from app.core.config import settings
from app.api.v1.auth import get_current_user
from app.api.v1.users import verify_module_access, get_allowed_area_ids
from app.models import Camera, Area, AIScenario

from app.schemas.camera_schema import CameraCreate, CameraUpdate, AreaCreate, AreaUpdate, ScenarioToggle, ScenarioBulkUpdate, ScenarioCreate, ScenarioUpdate

router = APIRouter(prefix="", tags=["Camera Management"])


def _camera_with_scenario_count(camera: Camera, session: Session):
    cam_dict = camera.dict()
    cam_dict["scenario_count"] = len(camera.enabled_scenario_ids or [])
    return cam_dict


@router.get("/live/areas")
def get_live_areas(session: Session = Depends(get_session), live_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("live_monitoring", cur, s, access_level="view"))):
    allowed_area_ids = get_allowed_area_ids(live_data.get("id"), session)
    if not allowed_area_ids:
        return []
    return session.exec(select(Area).where(Area.id.in_(allowed_area_ids)).order_by(Area.id)).all()


@router.get("/live/cameras")
def get_live_cameras(session: Session = Depends(get_session), live_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("live_monitoring", cur, s, access_level="view"))):
    allowed_area_ids = get_allowed_area_ids(live_data.get("id"), session)
    if not allowed_area_ids:
        return []
    cameras = session.exec(select(Camera).where(Camera.area_id.in_(allowed_area_ids)).order_by(Camera.id)).all()
    return [_camera_with_scenario_count(cam, session) for cam in cameras]


@router.get("/live/scenarios")
def get_live_scenarios(session: Session = Depends(get_session), live_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("live_monitoring", cur, s, access_level="view"))):
    return session.exec(select(AIScenario)).all()

# --- AREAS ---

@router.get("/admin/areas")
def get_areas(skip: int = 0, limit: int = 20, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("areas", cur, s, access_level="view"))):
    allowed_area_ids = get_allowed_area_ids(admin_data.get("id"), session)
    if not allowed_area_ids:
        return {"total": 0, "areas": []}
    total_count = len(session.exec(select(Area).where(Area.id.in_(allowed_area_ids))).all())
    areas = session.exec(select(Area).where(Area.id.in_(allowed_area_ids)).order_by(Area.id).offset(skip).limit(limit)).all()
    return {"total": total_count, "areas": areas}

@router.post("/admin/areas")
def create_area(area_data: AreaCreate, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("areas", cur, s, access_level="edit"))):
    if area_data.parent_id:
        parent = session.get(Area, area_data.parent_id)
        if not parent:
            raise HTTPException(status_code=400, detail="Parent area not found")
            
    new_area = Area(
        name=area_data.name,
        description=area_data.description,
        parent_id=area_data.parent_id
    )
    session.add(new_area)
    session.commit()
    session.refresh(new_area)
    return new_area

@router.put("/admin/areas/{area_id}")
def update_area(area_id: int, area_data: AreaUpdate, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("areas", cur, s, access_level="edit"))):
    area = session.get(Area, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    if area_data.name:
        area.name = area_data.name
    if area_data.description:
        area.description = area_data.description
    # Check if parent_id was provided (even if it's None/null)
    if "parent_id" in area_data.dict(exclude_unset=True) or area_data.parent_id is not None:
        if area_data.parent_id == area_id:
            raise HTTPException(status_code=400, detail="An area cannot be its own parent")
        # Treat 0 or None as resetting to root (None)
        area.parent_id = area_data.parent_id if (area_data.parent_id is not None and area_data.parent_id != 0) else None
    session.add(area)
    session.commit()
    session.refresh(area)
    return area

@router.delete("/admin/areas/{area_id}")
def delete_area(area_id: int, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("areas", cur, s, access_level="delete"))):
    area = session.get(Area, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    children = session.exec(select(Area).where(Area.parent_id == area_id)).all()
    if children:
        raise HTTPException(status_code=400, detail="Cannot delete an area that has sub-areas.")
    if area.cameras:
        raise HTTPException(status_code=400, detail="Cannot delete an area that has cameras assigned.")
    session.delete(area)
    session.commit()
    return {"message": "Area deleted successfully"}

# --- CAMERAS ---

@router.get("/admin/cameras")
def get_cameras(skip: int = 0, limit: int = 20, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("cameras", cur, s, access_level="view"))):
    allowed_area_ids = get_allowed_area_ids(admin_data.get("id"), session)
    if not allowed_area_ids:
        return {"total": 0, "cameras": []}
    total_count = len(session.exec(select(Camera).where(Camera.area_id.in_(allowed_area_ids))).all())
    cameras = session.exec(select(Camera).where(Camera.area_id.in_(allowed_area_ids)).order_by(Camera.id).offset(skip).limit(limit)).all()
    return {"total": total_count, "cameras": [_camera_with_scenario_count(cam, session) for cam in cameras]}


@router.post("/admin/cameras")
def create_camera(camera_data: CameraCreate, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("cameras", cur, s, access_level="edit"))):
    area = session.get(Area, camera_data.area_id)
    if not area:
        raise HTTPException(status_code=400, detail="Assigned Area not found")
    new_camera = Camera(
        name=camera_data.name,
        source_url=camera_data.source_url,
        area_id=camera_data.area_id
    )
    session.add(new_camera)
    session.commit()
    session.refresh(new_camera)
    return new_camera

@router.put("/admin/cameras/{camera_id}")
def update_camera(camera_id: int, camera_data: CameraUpdate, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("cameras", cur, s, access_level="edit"))):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    if camera_data.name is not None:
        camera.name = camera_data.name
    if camera_data.source_url is not None:
        camera.source_url = camera_data.source_url
    if camera_data.area_id is not None:
        area = session.get(Area, camera_data.area_id)
        if not area:
            raise HTTPException(status_code=400, detail="Assigned Area not found")
        camera.area_id = camera_data.area_id
    if camera_data.is_active is not None:
        camera.is_active = camera_data.is_active
    session.add(camera)
    session.commit()
    session.refresh(camera)
    return camera

@router.delete("/admin/cameras/{camera_id}")
def delete_camera(camera_id: int, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("cameras", cur, s, access_level="delete"))):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    # Perform soft-delete to preserve AI intelligence logs
    camera.is_active = False
    session.add(camera)
    session.commit()
    return {"message": "Camera deactivated successfully"}

@router.get("/admin/cameras/{camera_id}/scenarios")
def get_camera_scenarios(camera_id: int, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("scenario_orchestration", cur, s, access_level="view"))):
    """
    Returns all scenarios with their is_enabled status from the JSON field.
    """
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    # Get all system scenarios
    all_scenarios = session.exec(select(AIScenario)).all()
    
    # Get enabled IDs and configs from the camera JSON fields
    enabled_ids = set(camera.enabled_scenario_ids or [])
    configs = camera.scenario_configs or {}
    
    result = []
    for s in all_scenarios:
        result.append({
            "id": s.id,
            "name": s.name,
            "key": s.key,
            "severity": s.default_severity,
            "is_enabled": s.id in enabled_ids,
            "config": configs.get(s.name, {})
        })
    
    return result


@router.get("/internal/cameras/{camera_id}/scenarios/enabled")
def get_enabled_camera_scenarios(camera_id: int, session: Session = Depends(get_session)):
    """
    Internal service endpoint used by the AI process at startup.
    Reads from the JSON field.
    """
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    enabled_names = []
    enabled_ids = camera.enabled_scenario_ids or []
    for sid in enabled_ids:
        scenario = session.get(AIScenario, sid)
        if scenario:
            enabled_names.append(scenario.name)

    return {
        "camera_id": camera_id, 
        "enabled_scenarios": enabled_names,
        "scenario_configs": camera.scenario_configs or {}
    }

@router.put("/admin/cameras/{camera_id}/scenarios")
async def sync_camera_scenarios(camera_id: int, data: ScenarioBulkUpdate, background_tasks: BackgroundTasks, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("scenario_orchestration", cur, s, access_level="edit"))):
    """
    Updates enabled scenarios in a single JSON column and notifies AI service.
    """
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    # 1. Update JSON fields
    camera.enabled_scenario_ids = data.enabled_scenario_ids
    camera.scenario_configs = data.scenario_configs
    
    # Get names for AI service notification
    enabled_names = []
    for sid in data.enabled_scenario_ids:
        scenario = session.get(AIScenario, sid)
        if scenario:
            enabled_names.append(scenario.name)
    
    session.add(camera)
    session.commit()

    # 2. Notify AI Service in Background
    background_tasks.add_task(notify_ai_service_reload, camera_id, enabled_names, data.scenario_configs)

    return {"status": "success", "message": f"Synced {len(enabled_names)} scenarios for camera {camera_id}"}


async def notify_ai_service_reload(camera_id: int, enabled_names: list, scenario_configs: dict):
    """Helper to notify AI service in background"""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{settings.AI_SERVICE_URL}/control/reload/{camera_id}", json={
                "enabled_scenarios": enabled_names,
                "scenario_configs": scenario_configs
            }, timeout=5.0)
    except Exception as e:
        print(f"Failed to notify AI service in background: {e}")
    

# --- AI SCENARIOS (CRUD) ---

@router.get("/admin/scenarios")
def get_all_scenarios(session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("intelligence_registry", cur, s, access_level="view"))):
    """
    Returns the list of all AI scenarios in the system.
    """
    return session.exec(select(AIScenario).order_by(AIScenario.id)).all()


@router.post("/admin/scenarios")
def create_scenario(data: ScenarioCreate, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("intelligence_registry", cur, s, access_level="edit"))):

    """
    Adds a new AI scenario to the system registry.
    """
    # Check if key already exists
    existing = session.exec(select(AIScenario).where(AIScenario.key == data.key)).first()
    if existing:
        raise HTTPException(status_code=400, detail="A scenario with this key already exists")
        
    new_scenario = AIScenario(
        name=data.name,
        key=data.key,
        description=data.description,
        default_severity=data.default_severity
    )
    session.add(new_scenario)
    session.commit()
    session.refresh(new_scenario)
    return new_scenario


@router.put("/admin/scenarios/{scenario_id}")
def update_scenario(scenario_id: int, data: ScenarioUpdate, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("intelligence_registry", cur, s, access_level="edit"))):

    """
    Updates an existing AI scenario.
    """
    scenario = session.get(AIScenario, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    if data.name: scenario.name = data.name
    if data.key: scenario.key = data.key
    if data.description: scenario.description = data.description
    if data.default_severity: scenario.default_severity = data.default_severity
    
    session.add(scenario)
    session.commit()
    session.refresh(scenario)
    return scenario


@router.delete("/admin/scenarios/{scenario_id}")
def delete_scenario(scenario_id: int, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("intelligence_registry", cur, s, access_level="delete"))):

    """
    Removes a scenario from the system.
    """
    scenario = session.get(AIScenario, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    # Check if any camera is using it?
    # For now we allow deletion but it might break existing assignments.
    session.delete(scenario)
    session.commit()
    return {"message": "Scenario deleted successfully"}


# --- STREAMS ---

@router.get("/video_feed/{camera_id}")
async def video_feed(camera_id: int, session: Session = Depends(get_session)):
    """
    Proxies MJPEG stream from the AI Microservice.
    """
    camera_data = session.get(Camera, camera_id)
    if not camera_data:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    import urllib.parse
    source_url_encoded = urllib.parse.quote(camera_data.source_url, safe="")
    ai_service_url = f"http://localhost:8001/stream/{camera_id}?source={source_url_encoded}"
    
    async def stream_proxy():
        import asyncio
        max_retries = 3
        for attempt in range(max_retries):
            try:
                timeout = httpx.Timeout(None, connect=10.0)
                async with httpx.AsyncClient(timeout=timeout) as client:
                    async with client.stream("GET", ai_service_url) as response:
                        response.raise_for_status()
                        async for chunk in response.aiter_bytes():
                            yield chunk
                return
            except Exception as exc:
                print(f"AI stream attempt {attempt+1}/{max_retries} failed for camera {camera_id}: {exc}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)

    return StreamingResponse(
        stream_proxy(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )
