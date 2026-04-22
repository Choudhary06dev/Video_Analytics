from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from typing import List
import httpx
from app.core.database import get_session
from app.api.v1.auth import get_current_user
from app.api.v1.users import verify_admin_access, verify_super_admin, verify_admin_hub_access
from app.models import Camera, Area, CameraScenarioAssignment, AIScenario
from app.schemas.camera_schema import CameraCreate, CameraUpdate, AreaCreate, AreaUpdate, ScenarioToggle

router = APIRouter(prefix="", tags=["Camera Management"])

# --- AREAS ---

@router.get("/admin/areas")
def get_areas(session: Session = Depends(get_session), admin_data: dict = Depends(verify_admin_access)):
    areas = session.exec(select(Area)).all()
    return areas

@router.post("/admin/areas")
def create_area(area_data: AreaCreate, session: Session = Depends(get_session), admin_data: dict = Depends(verify_admin_hub_access)):
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
def update_area(area_id: int, area_data: AreaUpdate, session: Session = Depends(get_session), admin_data: dict = Depends(verify_admin_hub_access)):
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
def delete_area(area_id: int, session: Session = Depends(get_session), admin_data: dict = Depends(verify_admin_hub_access)):
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
def get_cameras(session: Session = Depends(get_session), admin_data: dict = Depends(verify_admin_access)):
    cameras = session.exec(select(Camera)).all()
    return cameras

@router.post("/admin/cameras")
def create_camera(camera_data: CameraCreate, session: Session = Depends(get_session), admin_data: dict = Depends(verify_admin_hub_access)):
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
def update_camera(camera_id: int, camera_data: CameraUpdate, session: Session = Depends(get_session), admin_data: dict = Depends(verify_admin_hub_access)):
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
def delete_camera(camera_id: int, session: Session = Depends(get_session), admin_data: dict = Depends(verify_admin_hub_access)):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    session.delete(camera)
    session.commit()
    return {"message": "Camera deleted successfully"}

@router.put("/admin/cameras/{camera_id}/scenarios")
def toggle_camera_scenario(camera_id: int, toggle: ScenarioToggle, session: Session = Depends(get_session), admin_data: dict = Depends(verify_super_admin)):
    camera = session.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    scenario = session.get(AIScenario, toggle.scenario_id)
    if not scenario:
        raise HTTPException(status_code=400, detail="AI Scenario not found")
    stmt = select(CameraScenarioAssignment).where(
        CameraScenarioAssignment.camera_id == camera_id,
        CameraScenarioAssignment.scenario_id == toggle.scenario_id
    )
    assignment = session.exec(stmt).first()
    if assignment:
        assignment.is_enabled = toggle.is_enabled
    else:
        assignment = CameraScenarioAssignment(
            camera_id=camera_id,
            scenario_id=toggle.scenario_id,
            is_enabled=toggle.is_enabled
        )
    session.add(assignment)
    session.commit()
    return {"message": f"Scenario '{scenario.name}' {'enabled' if toggle.is_enabled else 'disabled'}"}

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
    source_url = camera_data.source_url
    ai_service_url = f"http://localhost:8001/stream/{camera_id}?source={source_url}"
    
    async def stream_proxy():
        async with httpx.AsyncClient() as client:
            async with client.stream("GET", ai_service_url) as response:
                async for chunk in response.aiter_bytes():
                    yield chunk

    return StreamingResponse(
        stream_proxy(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )
