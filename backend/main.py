from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import time

import cv2
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

# AI Scenarios Mapping (COCO-80 compatible)
SCENARIO_MAPPING = {
    # Person Detection
    "person": "Staff/Visitor Activity",
    
    # Weapon / Threat Detection
    "knife": "Weapon Detection (Gun/Knife)",
    "scissors": "Weapon Detection (Gun/Knife)",
    
    # Electronics / Restricted Items
    "cell phone": "Mobile Phone Usage - Restricted",
    "laptop": "Electronic Device Detected",
    "remote": "Electronic Device Detected",
    "keyboard": "Electronic Device Detected",
    "mouse": "Electronic Device Detected",
    "tv": "Surveillance Monitor Active",
    
    # Vehicle / Transit
    "car": "Vehicle Observation",
    "truck": "Vehicle Observation",
    "bus": "Vehicle Observation",
    "motorcycle": "Vehicle Observation",
    "bicycle": "Vehicle Observation",
    "airplane": "Aerial Object Detected",
    "boat": "Maritime Vessel Detected",
    "train": "Rail Transit Detected",
    
    # Unattended Objects
    "backpack": "Object Left Unattended",
    "handbag": "Object Left Unattended",
    "suitcase": "Object Left Unattended",
    "umbrella": "Object Left Unattended",
    
    # Safety / Fire
    "fire hydrant": "Fire / Smoke Detection",
    "oven": "Fire / Smoke Detection",
    "toaster": "Fire / Smoke Detection",
    
    # Animal Intrusion
    "dog": "Animal Intrusion Detected",
    "cat": "Animal Intrusion Detected",
    "horse": "Animal Intrusion Detected",
    "bird": "Animal Intrusion Detected",
    "cow": "Animal Intrusion Detected",
    "sheep": "Animal Intrusion Detected",
    "bear": "Animal Intrusion Detected",
    "elephant": "Animal Intrusion Detected",
    
    # Food / Consumables (restricted zones)
    "bottle": "Consumable Item Detected",
    "wine glass": "Consumable Item Detected",
    "cup": "Consumable Item Detected",
    
    # Furniture / Infrastructure
    "chair": "Furniture Displacement",
    "couch": "Furniture Displacement",
    "bed": "Furniture Displacement",
    "dining table": "Furniture Displacement",
    
    # Sports / Recreational
    "sports ball": "Recreational Activity Detected",
    "baseball bat": "Potential Weapon - Blunt Object",
    "tennis racket": "Recreational Activity Detected",
    "skateboard": "Recreational Activity Detected",
    "surfboard": "Recreational Activity Detected",
    "frisbee": "Recreational Activity Detected",
    "skis": "Recreational Activity Detected",
    "snowboard": "Recreational Activity Detected",
    "kite": "Aerial Object Detected",
    
    # Traffic
    "traffic light": "Traffic Signal Detected",
    "stop sign": "Traffic Signal Detected",
    "parking meter": "Parking Zone Detected",
}

SCENARIO_ICONS = {
    "Weapon Detection (Gun/Knife)": "Crosshair",
    "Potential Weapon - Blunt Object": "Crosshair",
    "Staff/Visitor Activity": "Lock",
    "Mobile Phone Usage - Restricted": "Phone",
    "Electronic Device Detected": "Phone",
    "Surveillance Monitor Active": "Phone",
    "Vehicle Observation": "Car",
    "Aerial Object Detected": "Car",
    "Maritime Vessel Detected": "Car",
    "Rail Transit Detected": "Car",
    "Object Left Unattended": "Package",
    "Fire / Smoke Detection": "Flame",
    "Animal Intrusion Detected": "AlertTriangle",
    "Consumable Item Detected": "Package",
    "Furniture Displacement": "Package",
    "Recreational Activity Detected": "AlertTriangle",
    "Traffic Signal Detected": "AlertTriangle",
    "Parking Zone Detected": "Car",
}

# Global state for real-time intelligence
latest_intelligence = {
    "person_count": 0,
    "objects": [],
    "last_update": 0.0
}

class VideoCamera:
    def __init__(self):
        source = settings.CAMERA_SOURCE
        if isinstance(source, str) and source.isdigit():
            source = int(source)
        self.video = cv2.VideoCapture(source)
        self.last_log_time = 0.0
        # Tracks last logged count for each scenario name to prevent redundant entries
        self.last_logged_state = {} 

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
        if not self.video.isOpened():
            return None

        success, frame = self.video.read()
        if not success or frame is None:
            return None

        results = model.predict(frame, conf=0.5, verbose=False)
        person_count = 0
        detected_scenarios = {} # scenario_name -> {max_conf, count, raw_labels}
        raw_detections = []

        if results and len(results) > 0:
            annotated_frame = results[0].plot()
            for box in results[0].boxes:
                class_id = int(box.cls[0]) if hasattr(box.cls, "__getitem__") else int(box.cls)
                label = results[0].names[class_id]
                confidence = (
                    float(box.conf[0]) if hasattr(box.conf, "__getitem__") else float(box.conf)
                )
                
                raw_detections.append({"label": label, "confidence": confidence})
                
                # Special counting for persons
                if label == "person":
                    person_count += 1
                
                # Map to Scenarios
                scenario_name = SCENARIO_MAPPING.get(label)
                if scenario_name:
                    if scenario_name not in detected_scenarios:
                        detected_scenarios[scenario_name] = {"max_conf": confidence, "count": 1, "labels": {label}}
                    else:
                        detected_scenarios[scenario_name]["max_conf"] = max(detected_scenarios[scenario_name]["max_conf"], confidence)
                        detected_scenarios[scenario_name]["count"] += 1
                        detected_scenarios[scenario_name]["labels"].add(label)
        else:
            annotated_frame = frame

        latest_intelligence["person_count"] = person_count
        latest_intelligence["objects"] = sorted(list(detected_scenarios.keys()))
        latest_intelligence["last_update"] = time.time()

        # Logic for Event-Based Logging (Only log on change)
        if detected_scenarios:
            for scenario_name, data in detected_scenarios.items():
                current_count = data["count"]
                last_count = self.last_logged_state.get(scenario_name, 0)

                # TRIGGER LOG ON CHANGE
                if current_count != last_count:
                    # Calculate the detail string based on the scenario
                    if scenario_name == "Unauthorized Entry - Restricted Area":
                        detail = f"{person_count} Persons detected"
                    elif scenario_name == "Weapon Detection (Gun/Knife)":
                        detail = f"{', '.join(data['labels']).capitalize()} detected"
                    elif current_count > 1:
                        detail = f"{current_count} {scenario_name} objects detected"
                    else:
                        detail = f"{list(data['labels'])[0].capitalize()} detected"

                    # Instant Logging (No longer using background tasks to avoid stream queuing delay)
                    self.log_detection(
                        scenario_name,
                        data["max_conf"],
                        {
                            "detail": detail,
                            "count": current_count,
                            "raw_labels": list(data["labels"]),
                            "timestamp": datetime.now().isoformat(),
                            "is_alert": scenario_name in ["Weapon Detection (Gun/Knife)", "Fire / Smoke Detection"]
                        },
                    )
                    # Update local state so we don't log this count again
                    self.last_logged_state[scenario_name] = current_count
            
            # Cleanup: if a scenario was previously present but is now gone, reset its count to 0
            for prev_scenario in list(self.last_logged_state.keys()):
                if prev_scenario not in detected_scenarios:
                    self.last_logged_state[prev_scenario] = 0

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
        return jpeg.tobytes() if ret else None


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


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "camera_open": camera.video.isOpened() if camera is not None else False,
    }


@app.get("/logs")
def get_logs(hours: float = 24.0, camera_id: Optional[int] = None, session: Session = Depends(get_session)):
    cutoff = datetime.now() - timedelta(hours=hours)
    statement = select(DetectionEvent).where(DetectionEvent.timestamp >= cutoff)
    
    if camera_id is not None:
        statement = statement.where(DetectionEvent.camera_id == camera_id)
        
    statement = statement.order_by(DetectionEvent.timestamp.desc()).limit(100)
    results = session.exec(statement).all()
    return results


@app.get("/logs/summary")
def get_logs_summary(hours: float = 24.0, camera_id: Optional[int] = None, session: Session = Depends(get_session)):
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
        "total_persons": total_persons, # Filtered historical sum
        "total_weapons": total_weapons, # Filtered historical sum
        "total_vehicles": total_vehicles, # Filtered historical sum
        "threat_level": threat_level, # Assess based on LIVE data
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
