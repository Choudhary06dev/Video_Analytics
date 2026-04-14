from fastapi import FastAPI, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import time
from ultralytics import YOLO
import threading
from fastapi import BackgroundTasks, Depends
from sqlmodel import Session, select
from database import init_db, get_session, engine
from models import DetectionEvent, User, Role
from datetime import datetime
from contextlib import asynccontextmanager
from security import get_password_hash, verify_password, create_access_token, decode_access_token
from pydantic import BaseModel
from fastapi import Header, HTTPException

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
    # Startup: Initialize the database and roles
    init_db()
    init_roles()
    yield
    # Shutdown logic (if any) can go here

app = FastAPI(lifespan=lifespan)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize YOLOv8 Nano model (lightweight for CPU)
model = YOLO("yolov8n.pt")

# Configuration
LOG_INTERVAL = 3.0  # Seconds between database logs for same object types
last_log_time = 0

# Global state to share detection data between video thread and API endpoints
latest_intelligence = {
    "person_count": 0,
    "last_update": time.time(),
    "objects": []
}

class VideoCamera:
    def __init__(self):
        self.video = cv2.VideoCapture(0)
        self.last_log_time = 0
        
    def __del__(self):
        self.video.release()

    def log_detection(self, object_class: str, confidence: float, metadata: dict):
        """Background task to save detection to database"""
        with Session(engine) as session:
            event = DetectionEvent(
                camera_id=1,
                object_class=object_class,
                confidence=float(confidence),
                metadata_json=metadata
            )
            session.add(event)
            session.commit()

    def get_frame(self, background_tasks: BackgroundTasks = None):
        success, frame = self.video.read()
        if not success:
            return None
        
        # --- AI INFERENCE ---
        # Run YOLOv8 on the frame
        # conf=0.5 means only objects with 50%+ confidence are shown
        results = model.predict(frame, conf=0.5, verbose=False)
        
        # Extract metadata
        person_count = 0
        objects_detected = []
        
        if results and len(results) > 0:
            # results[0].plot() draws boxes and labels on the frame automatically
            annotated_frame = results[0].plot()
            
            # Count persons specifically for the dashboard KPI
            for box in results[0].boxes:
                class_id = int(box.cls[0])
                label = results[0].names[class_id]
                objects_detected.append(label)
                if label == 'person':
                    person_count += 1
        else:
            annotated_frame = frame

        # Update global intelligence state
        global latest_intelligence
        latest_intelligence["person_count"] = person_count
        latest_intelligence["objects"] = list(set(objects_detected))
        latest_intelligence["last_update"] = time.time()
        
        # --- DATABASE LOGGING (with Throttling) ---
        current_time = time.time()
        if (current_time - self.last_log_time) > LOG_INTERVAL:
            if person_count > 0 and background_tasks:
                # Log the detection in the background
                background_tasks.add_task(
                    self.log_detection, 
                    "person", 
                    0.8, # Simplified confidence for now
                    {"count": person_count}
                )
                self.last_log_time = current_time

        # Add a custom HUD overlay
        cv2.putText(annotated_frame, f"NEURAL ENGINE ACTIVE | PERSONS: {person_count}", (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Encode as JPEG
        ret, jpeg = cv2.imencode('.jpg', annotated_frame)
        return jpeg.tobytes()

def gen(camera, background_tasks):
    while True:
        frame = camera.get_frame(background_tasks)
        if frame is None:
            time.sleep(1)
            continue
            
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')

@app.get("/")
def read_root():
    return {"status": "AI Analytics Backend Online", "ai_model": "YOLOv8 Nano"}

@app.get("/video_feed")
def video_feed(background_tasks: BackgroundTasks):
    return StreamingResponse(gen(VideoCamera(), background_tasks), 
                             media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/intelligence")
def get_intelligence():
    """Endpoint for frontend to pull real-time detection counts"""
    return latest_intelligence

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": True}

@app.get("/logs")
def get_logs(session: Session = Depends(get_session)):
    """Fetch the latest 50 detection logs for the dashboard"""
    statement = select(DetectionEvent).order_by(DetectionEvent.timestamp.desc()).limit(50)
    results = session.exec(statement).all()
    return results

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

# --- ADMIN ENDPOINTS ---

def verify_super_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or payload.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Forbidden: Super Admin access required")
    return payload

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
