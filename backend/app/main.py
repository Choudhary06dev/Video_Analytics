from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.core.database import init_db, engine
from app.models import Role, ModulePermission, AIScenario
from app.api.v1 import auth, users, roles, cameras, alerts


def init_system_data():
    """
    Seeds initial roles, modules, and AI scenarios.
    """
    with Session(engine) as session:
        # 1. Seed Roles
        roles_data = {
            1: ("super_admin", "Full system access and configuration"),
            2: ("admin", "Hospital-wide management and surveillance"),
            3: ("operator", "Real-time monitoring and alert response")
        }
        for idx, (name, desc) in roles_data.items():
            db_role = session.get(Role, idx)
            if not db_role:
                session.add(Role(id=idx, name=name, description=desc))
        
        # 2. Seed Modules
        modules = [
            ("Dashboard", "dashboard"),
            ("Live Monitoring", "live_monitoring"),
            ("AI Scenarios", "scenarios"),
            ("Activity Vault", "vault"),
            ("Alerts", "alerts"),
            ("System Health", "health"),
            ("Admin Hub", "admin_hub"),
            ("Staff Roster", "roster"),
            ("Settings", "settings"),
        ]
        for name, key in modules:
            stmt = select(ModulePermission).where(ModulePermission.key == key)
            mod = session.exec(stmt).first()
            if not mod:
                session.add(ModulePermission(name=name, key=key))

        # 3. Seed AI Scenarios
        scenarios = [
            ("Unauthorized restricted area entry", "restricted_entry", "Critical"),
            ("Aggressive behavior", "aggression", "Critical"),
            ("Weapon detection (gun/knife)", "weapon_threat", "Critical"),
            ("Tailgating / Multiple entry", "tailgating", "High"),
            ("Blacklisted person alert", "blacklist_face", "Critical"),
            ("Overcrowding detection", "crowd_density", "High"),
            ("Visitor count limit exceeded", "visitor_limit", "Medium"),
            ("Visitor tracking", "visitor_tracking", "Low"),
            ("Staff absence at post", "staff_absence", "High"),
            ("Mobile phone usage - restricted", "mobile_restricted", "Medium"),
            ("Fire / smoke detection", "fire_smoke", "Critical"),
            ("Vehicle tracking", "vehicle_tracking", "Low"),
            ("Unauthorized parking / blockage", "parking_violation", "Medium"),
            ("Camera/Recording failure", "system_failure", "High"),
            ("Baby outside route", "baby_movement", "Critical"),
            ("Unauthorized baby handling", "baby_handling", "Critical"),
            ("Baby unattended", "baby_unattended", "Critical"),
            ("Unauthorized patient exit", "patient_exit", "High"),
            ("Night attendant limit exceeded", "night_limit", "Medium"),
            ("Closed department movement", "closed_dept_movement", "High"),
            ("Boundary intrusion", "boundary_climb", "High"),
        ]
        for name, key, severity in scenarios:
            stmt = select(AIScenario).where(AIScenario.key == key)
            if not session.exec(stmt).first():
                session.add(AIScenario(name=name, key=key, default_severity=severity))

        session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    init_db()
    # Seed initial roles, modules, and AI scenarios
    init_system_data()
    yield
    # Cleanup logic if needed


app = FastAPI(
    title="Hospital AI Surveillance API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Endpoint
@app.get("/")
def read_root():
    return {
        "status": "Hospital AI Surveillance Online",
        "version": "1.0.0",
        "engine": "FastAPI Modular Architecture"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(roles.router)
app.include_router(cameras.router)
app.include_router(alerts.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
