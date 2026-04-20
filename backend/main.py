from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import time
import json

import cv2
import numpy as np
from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import Session, select
from ultralytics import YOLO

from config import settings
from database import engine, get_session, init_db
from models import DetectionEvent, Role, User
from security import (
    create_access_token,
    decode_access_token,
    get_authorization_token,
    get_password_hash,
    verify_password,
)


def init_roles():
    with Session(engine) as session:
        roles = ["super_admin", "admin", "operator"]
        for idx, role_name in enumerate(roles, start=1):
            existing = session.get(Role, idx)
            if not existing:
                session.add(Role(id=idx, name=role_name))
        session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    init_roles()
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("yolov8n.pt")

# 21 AI Scenarios Mapping
SCENARIO_MAPPING = {
    "person": "Unauthorized Entry - Restricted Area",
    "knife": "Weapon Detection (Gun/Knife)",
    "cell phone": "Mobile Phone Usage - Restricted",
    "laptop": "Object Left Unattended",
    "car": "Vehicle Observation",
    "truck": "Vehicle Observation",
    "bus": "Vehicle Observation",
    "motorcycle": "Vehicle Observation",
    "backpack": "Object Left Unattended",
    "handbag": "Object Left Unattended",
    "suitcase": "Object Left Unattended",
    "book": "Object Left Unattended",
    "bottle": "Object Left Unattended",
    "cup": "Object Left Unattended",
    "chair": "Object Left Unattended",
    "tv": "Object Left Unattended",
    "fire hydrant": "Fire / Smoke Detection", # Proxy for fire/smoke in COCO
    "bicycle": "Vehicle Observation",
}

SCENARIO_ICONS = {
    "Weapon Detection (Gun/Knife)": "Crosshair",
    "Unauthorized Entry - Restricted Area": "Lock",
    "Mobile Phone Usage - Restricted": "Phone",
    "Vehicle Observation": "Car",
    "Object Left Unattended": "Package",
    "Fire / Smoke Detection": "Flame",
}

CONF_THRESHOLD = 0.55
IOU_THRESHOLD = 0.45
MIN_STABLE_FRAMES_TO_LOG = 4
SCENARIO_MIN_CONFIDENCE = {
    "person": 0.55,
    "knife": 0.60,
    "cell phone": 0.65,
    "car": 0.60,
    "truck": 0.60,
    "bus": 0.60,
    "motorcycle": 0.60,
    "backpack": 0.60,
    "handbag": 0.60,
    "suitcase": 0.60,
    "bicycle": 0.60,
    "fire hydrant": 0.55,
}

# Global state for real-time intelligence
latest_intelligence = {
    "person_count": 0,
    "objects": [],
    "stable_objects": [],
    "last_update": 0.0
}

class VideoCamera:
    def __init__(self):
        source = settings.CAMERA_SOURCE
        if isinstance(source, str) and source.isdigit():
            source = int(source)
        self.source = source
        self.video = cv2.VideoCapture(self.source)
        self.last_log_time = 0.0
        self.scene_state = {}
        self.placeholder_frame = self._build_placeholder_frame("NO SIGNAL")

    def _build_placeholder_frame(self, message: str) -> bytes:
        frame = np.zeros((360, 640, 3), dtype=np.uint8)
        cv2.putText(frame, message, (18, 200), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.putText(frame, "Reconnecting camera...", (18, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 1, cv2.LINE_AA)
        ret, jpeg = cv2.imencode(".jpg", frame)
        return jpeg.tobytes() if ret else b""

    def _ensure_camera(self) -> bool:
        if self.video is None:
            self.video = cv2.VideoCapture(self.source)
        elif not self.video.isOpened():
            self.video.open(self.source)
        return self.video is not None and self.video.isOpened()

    def release(self):
        if self.video is not None and self.video.isOpened():
            self.video.release()

    def log_detection(self, object_class: str, confidence: float, metadata: dict):
        with Session(engine) as session:
            event = DetectionEvent(
                camera_id=1,
                object_class=object_class,
                confidence=float(confidence),
                metadata_json=metadata,
            )
            session.add(event)
            session.commit()
            session.refresh(event)

    def get_frame(self):
        if not self._ensure_camera():
            return self.placeholder_frame

        success, frame = self.video.read()
        if not success or frame is None:
            self._ensure_camera()
            return self.placeholder_frame

        results = model.predict(frame, conf=CONF_THRESHOLD, iou=IOU_THRESHOLD, verbose=False)
        person_count = 0
        detected_scenarios = {}
        raw_detections = []

        annotated_frame = frame
        if results and len(results) > 0:
            annotated_frame = results[0].plot()
            for box in results[0].boxes:
                class_id = int(box.cls[0]) if hasattr(box.cls, "__getitem__") else int(box.cls)
                label = results[0].names[class_id]
                confidence = (
                    float(box.conf[0]) if hasattr(box.conf, "__getitem__") else float(box.conf)
                )

                min_conf = max(CONF_THRESHOLD, SCENARIO_MIN_CONFIDENCE.get(label, CONF_THRESHOLD))
                if confidence < min_conf:
                    continue

                raw_detections.append({"label": label, "confidence": confidence})

                if label == "person":
                    person_count += 1

                scenario_name = SCENARIO_MAPPING.get(label)
                if scenario_name:
                    if scenario_name not in detected_scenarios:
                        detected_scenarios[scenario_name] = {"max_conf": confidence, "count": 1, "labels": {label}}
                    else:
                        detected_scenarios[scenario_name]["max_conf"] = max(detected_scenarios[scenario_name]["max_conf"], confidence)
                        detected_scenarios[scenario_name]["count"] += 1
                        detected_scenarios[scenario_name]["labels"].add(label)

        current_objects = sorted(list(detected_scenarios.keys()))
        current_time = time.time()
        future_scene_state = {}
        stable_objects = []

        for scenario_name in set(list(self.scene_state.keys()) + current_objects):
            current_count = detected_scenarios.get(scenario_name, {"count": 0})["count"]
            prev = self.scene_state.get(scenario_name, {"count": 0, "stable_frames": 0, "absent_frames": 0, "present": False, "last_logged": 0})

            if current_count == prev["count"]:
                stable_frames = prev["stable_frames"] + 1
            else:
                stable_frames = 1

            if current_count == 0:
                absent_frames = prev["absent_frames"] + 1 if prev["count"] == 0 else 1
            else:
                absent_frames = 0

            present = prev["present"]
            should_log = False

            if current_count > 0:
                if stable_frames >= MIN_STABLE_FRAMES_TO_LOG:
                    if not present:
                        should_log = True
                        present = True
                    elif scenario_name != "Unauthorized Entry - Restricted Area" and current_count > prev["count"]:
                        should_log = True
            else:
                if present and absent_frames >= MIN_STABLE_FRAMES_TO_LOG * 2:
                    should_log = True
                    present = False

            if present and current_count > 0:
                stable_objects.append(scenario_name)

            if should_log:
                if current_count > 0:
                    data = detected_scenarios[scenario_name]
                    if scenario_name == "Unauthorized Entry - Restricted Area":
                        detail = f"{person_count} Persons detected"
                    elif scenario_name == "Weapon Detection (Gun/Knife)":
                        detail = f"{', '.join(data['labels']).capitalize()} detected"
                    elif current_count > 1:
                        detail = f"{current_count} {scenario_name} objects detected"
                    else:
                        detail = f"{list(data['labels'])[0].capitalize()} detected"

                    self.log_detection(
                        scenario_name,
                        data["max_conf"],
                        {
                            "detail": detail,
                            "count": current_count,
                            "raw_labels": list(data["labels"]),
                            "timestamp": datetime.now().isoformat(),
                            "is_alert": scenario_name in ["Weapon Detection (Gun/Knife)", "Fire / Smoke Detection"],
                        },
                    )
                else:
                    detail = (
                        "Person(s) left frame" if scenario_name == "Unauthorized Entry - Restricted Area"
                        else "Object cleared from scene"
                    )
                    self.log_detection(
                        scenario_name,
                        0.0,
                        {
                            "detail": detail,
                            "count": 0,
                            "raw_labels": [],
                            "timestamp": datetime.now().isoformat(),
                            "is_alert": False,
                        },
                    )
                prev["last_logged"] = current_time

            future_scene_state[scenario_name] = {
                "count": current_count,
                "stable_frames": stable_frames,
                "absent_frames": absent_frames,
                "present": present,
                "last_logged": prev["last_logged"],
            }

        self.scene_state = future_scene_state

        has_change = (
            person_count != latest_intelligence["person_count"] or
            current_objects != latest_intelligence["objects"] or
            sorted(stable_objects) != latest_intelligence.get("stable_objects", [])
        )

        latest_intelligence["person_count"] = person_count
        latest_intelligence["objects"] = current_objects
        latest_intelligence["stable_objects"] = sorted(stable_objects)
        if has_change:
            latest_intelligence["last_update"] = current_time

        cv2.putText(
            annotated_frame,
            f"NEURAL ENGINE ACTIVE | SCENARIOS: {len(detected_scenarios)}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2,
        )

        ret, jpeg = cv2.imencode(".jpg", annotated_frame)
        return jpeg.tobytes() if ret else self.placeholder_frame


camera = VideoCamera()


def gen(camera):
    while True:
        frame = camera.get_frame()
        if frame is None:
            time.sleep(1)
            continue

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + frame
            + b"\r\n\r\n"
        )


def get_current_user(token: str = Depends(get_authorization_token)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


def verify_super_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Forbidden: Super Admin access required")
    return current_user


@app.on_event("shutdown")
def shutdown_event():
    camera.release()


@app.get("/")
def read_root():
    return {"status": "AI Analytics Backend Online", "ai_model": "YOLOv8 Nano"}


@app.get("/video_feed")
def video_feed():
    return StreamingResponse(
        gen(camera),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@app.get("/intelligence")
def get_intelligence():
    return latest_intelligence


@app.get("/events")
def event_stream():
    def event_generator():
        last_update = 0.0
        while True:
            if latest_intelligence["last_update"] != last_update:
                last_update = latest_intelligence["last_update"]
                yield f"data: {json.dumps(latest_intelligence)}\n\n"
            time.sleep(0.25)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "camera_open": camera.video.isOpened() if camera is not None else False,
    }


@app.get("/logs")
def get_logs(hours: int = 24, camera_id: Optional[int] = None, session: Session = Depends(get_session)):
    cutoff = datetime.now() - timedelta(hours=hours)
    statement = select(DetectionEvent).where(DetectionEvent.timestamp >= cutoff)
    
    if camera_id is not None:
        statement = statement.where(DetectionEvent.camera_id == camera_id)
        
    statement = statement.order_by(DetectionEvent.timestamp.desc()).limit(100)
    results = session.exec(statement).all()
    return results


@app.get("/logs/summary")
def get_logs_summary(hours: int = 24, camera_id: Optional[int] = None, session: Session = Depends(get_session)):
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
        
        # Categorize for Dashboard Stats
        obj_lower = obj.lower()
        if "person" in obj_lower or "entry" in obj_lower:
            total_persons += ev.metadata_json.get("count", 1) if ev.metadata_json else 1
        if "weapon" in obj_lower or "knife" in obj_lower:
            total_weapons += ev.metadata_json.get("count", 1) if ev.metadata_json else 1
        if "vehicle" in obj_lower or "car" in obj_lower or "truck" in obj_lower:
            total_vehicles += ev.metadata_json.get("count", 1) if ev.metadata_json else 1
            
    # Calculate Live Stats vs Historical Totals
    # Use real-time intelligence for the primary dashboard metrics
    live_persons = latest_intelligence.get("person_count", 0)
    live_objects = latest_intelligence.get("objects", [])
    
    live_weapons = 0
    live_vehicles = 0
    for obj in live_objects:
        obj_lower = obj.lower()
        if "weapon" in obj_lower or "knife" in obj_lower:
            live_weapons += 1 # In this simple logic, we flag presence
        if any(v in obj_lower for v in ["vehicle", "car", "truck", "bus"]):
            live_vehicles += 1

    # Assess Threat Level based on LIVE counts, not historical sums
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
        "count": len(events), # Total signals in time window
        "total_persons": live_persons, # NOW SHOWING REAL-TIME
        "total_weapons": live_weapons, # NOW SHOWING REAL-TIME
        "total_vehicles": live_vehicles, # NOW SHOWING REAL-TIME
        "threat_level": threat_level,
        "status_message": status_msg,
        "object_breakdown": object_counts,
        "timestamp": datetime.now().isoformat()
    }


# --- AUTHENTICATION ENDPOINTS ---

class UserRegister(BaseModel):
    full_name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

@app.post("/auth/register")
def register_user(user_data: UserRegister, session: Session = Depends(get_session)):
    # Check if user exists
    existing = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        new_user = User(
            full_name=user_data.full_name,
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            role_id=3 # Default to operator
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return {"message": "User created successfully", "user_id": new_user.id}
    except Exception as e:
        from fastapi import HTTPException
        print(f"Registration Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

@app.post("/auth/login", response_model=Token)
def login_user(login_data: UserLogin, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == login_data.email)).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Fetch the role name
    role = session.get(Role, user.role_id)
    role_name = role.name if role else "operator"
    
    access_token = create_access_token(data={"sub": user.email, "id": user.id, "role": role_name})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "name": user.full_name, "role": role_name}
    }


def get_current_user(token: str = Depends(get_authorization_token)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


@app.get("/auth/me")
def read_current_user(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}


# --- ADMIN ENDPOINTS ---

def verify_super_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Forbidden: Super Admin access required")
    return current_user

@app.get("/admin/users")
def get_all_users(session: Session = Depends(get_session), admin_data: dict = Depends(verify_super_admin)):
    users = session.exec(select(User)).all()
    result = []
    for u in users:
        role_obj = session.get(Role, u.role_id)
        result.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": role_obj.name if role_obj else "unknown",
            "created_at": u.created_at
        })
    return result

class RoleUpdate(BaseModel):
    role_name: str

@app.put("/admin/users/{user_id}/role")
def update_user_role(user_id: int, role_data: RoleUpdate, session: Session = Depends(get_session), admin_data: dict = Depends(verify_super_admin)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == admin_data.get("id"):
        raise HTTPException(status_code=400, detail="Cannot change your own role")
        
    role = session.exec(select(Role).where(Role.name == role_data.role_name)).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role specified")
        
    user.role_id = role.id
    session.add(user)
    session.commit()
    return {"message": "Role updated successfully", "new_role": role.name}

class AdminUserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role_name: str

@app.post("/admin/users")
def create_user_by_admin(user_data: AdminUserCreate, session: Session = Depends(get_session), admin_data: dict = Depends(verify_super_admin)):
    existing = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    role = session.exec(select(Role).where(Role.name == user_data.role_name)).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role specified")
        
    try:
        new_user = User(
            full_name=user_data.full_name,
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            role_id=role.id
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return {"message": "User created successfully", "user_id": new_user.id, "role": role.name}
    except Exception as e:
        print(f"Admin Registration Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

class AdminUserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    password: str | None = None
    role_name: str | None = None

@app.put("/admin/users/{user_id}")
def update_user_by_admin(user_id: int, user_data: AdminUserUpdate, session: Session = Depends(get_session), admin_data: dict = Depends(verify_super_admin)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Security: If user is changing their own role, block it if it's not super_admin or something?
    # Actually, let's just allow editing name/email for anyone.
    
    if user_data.full_name:
        user.full_name = user_data.full_name
        
    if user_data.email:
        # Check if email is taken by others
        existing = session.exec(select(User).where(User.email == user_data.email, User.id != user_id)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken by another node")
        user.email = user_data.email
        
    if user_data.password:
        user.hashed_password = get_password_hash(user_data.password)
        
    if user_data.role_name:
        # Prevent self-demotion from Super Admin to avoid system lockouts
        if user.id == admin_data.get("id") and user_data.role_name != "super_admin":
             raise HTTPException(status_code=400, detail="Safety Lock: You cannot revoke your own Super Admin access level.")
             
        role = session.exec(select(Role).where(Role.name == user_data.role_name)).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role specified")
        user.role_id = role.id
        
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"message": "User updated successfully", "id": user.id}

@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int, session: Session = Depends(get_session), admin_data: dict = Depends(verify_super_admin)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin_data.get("id"):
        raise HTTPException(status_code=400, detail="Cannot delete your own super admin account")
    
    session.delete(user)
    session.commit()
    return {"message": "User deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    # Use a single worker for AI models to avoid memory issues on CPU
    uvicorn.run(app, host="0.0.0.0", port=8000)
