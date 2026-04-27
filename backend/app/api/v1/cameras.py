from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from typing import List
import httpx
from app.core.database import get_session
from app.api.v1.auth import get_current_user
from app.api.v1.users import verify_module_access
from app.models import Camera, Area, CameraScenarioAssignment, AIScenario

from app.schemas.camera_schema import CameraCreate, CameraUpdate, AreaCreate, AreaUpdate, ScenarioToggle, ScenarioBulkUpdate, ScenarioCreate, ScenarioUpdate

router = APIRouter(prefix="", tags=["Camera Management"])


def _camera_with_scenario_count(camera: Camera, session: Session):
    stmt = select(CameraScenarioAssignment).where(
        CameraScenarioAssignment.camera_id == camera.id,
        CameraScenarioAssignment.is_enabled == True
    )
    cam_dict = camera.dict()
    cam_dict["scenario_count"] = len(session.exec(stmt).all())
    return cam_dict


@router.get("/live/areas")
def get_live_areas(session: Session = Depends(get_session), live_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("live_monitoring", cur, s, access_level="view"))):
    return session.exec(select(Area)).all()


@router.get("/live/cameras")
def get_live_cameras(session: Session = Depends(get_session), live_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("live_monitoring", cur, s, access_level="view"))):
    cameras = session.exec(select(Camera)).all()
    return [_camera_with_scenario_count(cam, session) for cam in cameras]


@router.get("/live/scenarios")
def get_live_scenarios(session: Session = Depends(get_session), live_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("live_monitoring", cur, s, access_level="view"))):
    return session.exec(select(AIScenario)).all()

# --- AREAS ---

@router.get("/admin/areas")
def get_areas(session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("areas", cur, s, access_level="view"))):
    areas = session.exec(select(Area)).all()
    return areas

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
    if area_data.parent_id is not None:
        if area_data.parent_id == area_id:
            raise HTTPException(status_code=400, detail="An area cannot be its own parent")
        area.parent_id = area_data.parent_id if area_data.parent_id != 0 else None
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
def get_cameras(session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("cameras", cur, s, access_level="view"))):
    cameras = session.exec(select(Camera)).all()
    return [_camera_with_scenario_count(cam, session) for cam in cameras]


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
    Returns all 21 scenarios with their is_enabled status for a specific camera.
    """
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    # Get all system scenarios
    all_scenarios = session.exec(select(AIScenario)).all()
    
    # Get current assignments
    stmt = select(CameraScenarioAssignment).where(CameraScenarioAssignment.camera_id == camera_id)
    assignments = {a.scenario_id: a.is_enabled for a in session.exec(stmt).all()}
    
    result = []
    for s in all_scenarios:
        result.append({
            "id": s.id,
            "name": s.name,
            "key": s.key,
            "severity": s.default_severity,
            "is_enabled": assignments.get(s.id, False)
        })
    
    return result


@router.get("/internal/cameras/{camera_id}/scenarios/enabled")
def get_enabled_camera_scenarios(camera_id: int, session: Session = Depends(get_session)):
    """
    Internal service endpoint used by the AI process at startup.
    It returns only enabled scenario names and does not expose admin metadata.
    """
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    stmt = select(CameraScenarioAssignment).where(
        CameraScenarioAssignment.camera_id == camera_id,
        CameraScenarioAssignment.is_enabled == True
    )
    assignments = session.exec(stmt).all()
    enabled_names = []
    for assignment in assignments:
        scenario = session.get(AIScenario, assignment.scenario_id)
        if scenario:
            enabled_names.append(scenario.name)

    return {"camera_id": camera_id, "enabled_scenarios": enabled_names}

@router.put("/admin/cameras/{camera_id}/scenarios")
async def sync_camera_scenarios(camera_id: int, data: ScenarioBulkUpdate, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("scenario_orchestration", cur, s, access_level="edit"))):

    """
    Bulk syncs enabled scenarios for a camera and notifies the AI service.
    """
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    # 1. Remove existing assignments for this camera
    stmt = select(CameraScenarioAssignment).where(CameraScenarioAssignment.camera_id == camera_id)
    existing = session.exec(stmt).all()
    for e in existing:
        session.delete(e)
    
    # 2. Add new enabled assignments
    enabled_names = []
    for sid in data.enabled_scenario_ids:
        scenario = session.get(AIScenario, sid)
        if scenario:
            assignment = CameraScenarioAssignment(
                camera_id=camera_id,
                scenario_id=sid,
                is_enabled=True
            )
            session.add(assignment)
            enabled_names.append(scenario.name)
    
    session.commit()

    # 3. Notify AI Service (Handshake)
    try:
        async with httpx.AsyncClient() as client:
            # Tell AI service to reload config for this camera
            await client.post(f"http://localhost:8001/control/reload/{camera_id}", json={
                "enabled_scenarios": enabled_names
            })
    except Exception as e:
        # Don't fail the whole request if AI service is down, but log it
        print(f"Failed to notify AI service: {e}")

    return {"status": "success", "message": f"Synced {len(enabled_names)} scenarios for camera {camera_id}"}
    

# --- AI SCENARIOS (CRUD) ---

@router.get("/admin/scenarios")
def get_all_scenarios(session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("intelligence_registry", cur, s, access_level="view"))):
    """
    Returns the list of all AI scenarios in the system.
    """
    return session.exec(select(AIScenario)).all()


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
    
    # Assuming AI service runs on localhost:8001
    import urllib.parse
    source_url_encoded = urllib.parse.quote(camera_data.source_url, safe="")
    ai_service_url = f"http://localhost:8001/stream/{camera_id}?source={source_url_encoded}"
    ai_health_url = f"http://localhost:8001/intelligence/{camera_id}"

    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            await client.get(ai_health_url)
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="AI video service is offline")
    
    async def stream_proxy():
        try:
            timeout = httpx.Timeout(None, connect=2.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream("GET", ai_service_url) as response:
                    response.raise_for_status()
                    async for chunk in response.aiter_bytes():
                        yield chunk
        except httpx.HTTPError as exc:
            print(f"AI stream unavailable for camera {camera_id}: {exc}")

    return StreamingResponse(
        stream_proxy(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )
