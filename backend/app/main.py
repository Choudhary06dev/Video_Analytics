from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.core.database import init_db, engine
from app.models import Role, ModulePermission, AIScenario
from app.api.v1 import auth, users, roles, cameras, alerts, training


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
            ("Command Hub", "dashboard"),
            ("Neural Stream", "live_monitoring"),
            ("AI Scenarios", "scenarios"),

            ("Activity Vault", "vault"),
            ("System Health", "health"),
            ("AI Training", "training"),
            ("Crisis Alerts", "alerts"),
            ("Admin Control", "admin_hub"),
            ("Dashboard", "admin_dashboard"),
            ("Users", "users"),
            ("Roles", "roles"),
            ("Areas", "areas"),
            ("Cameras", "cameras"),
            ("Audit Protocols", "audit"),
            ("Scenario Control", "scenario_orchestration"),
            ("AI Scenario Registry", "intelligence_registry"),
            ("Settings", "settings"),
        ]


        for name, key in modules:
            stmt = select(ModulePermission).where(ModulePermission.key == key)
            mod = session.exec(stmt).first()
            if not mod:
                mod = ModulePermission(name=name, key=key)
                session.add(mod)
                session.flush() # Get ID
            elif mod.name != name:
                mod.name = name
                session.add(mod)
            
            # Auto-assign to Super Admin (Role ID 1)
            from app.models import RoleModulePermission
            stmt_link = select(RoleModulePermission).where(
                RoleModulePermission.role_id == 1,
                RoleModulePermission.module_permission_id == mod.id
            )
            link = session.exec(stmt_link).first()
            if not link:
                session.add(RoleModulePermission(
                    role_id=1,
                    module_permission_id=mod.id,
                    can_view=True,
                    can_edit=True,
                    can_delete=True
                ))


        # 3. Sync AI Scenarios
        scenarios_to_sync = [
            "Unauthorized entry into restricted areas",
            "Aggressive behaviour detection",
            "Weapon detection (gun/knife)",
            "Multiple persons entry on single access",
            "Blacklisted person alert (facial recognition)",
            "Crowd density / overcrowding detection",
            "Visitor count limit (only 1 attendant per patient)",
            "Entry/Exit tracking of visitors (face recognition)",
            "Staff presence/absence at duty post",
            "Mobile phone usage in restricted areas",
            "Fire / smoke detection",
            "Vehicle detection & tracking",
            "Unauthorized parking / ambulance blockage",
            "Camera offline and recording failure alert",
            "Baby moved outside designated routes",
            "Unauthorized person handling or carrying baby",
            "Baby left unattended",
            "Patient approaching exit without discharge clearance",
            "More than allowed attendants during night",
            "Movement in closed departments/areas",
            "Person climbing or jumping over boundary wall",
        ]
        
        # Mapping for default severities
        severities = {
            "Unauthorized entry into restricted areas": "Critical",
            "Aggressive behaviour detection": "Critical",
            "Weapon detection (gun/knife)": "Critical",
            "Multiple persons entry on single access": "High",
            "Blacklisted person alert (facial recognition)": "Critical",
            "Crowd density / overcrowding detection": "High",
            "Visitor count limit (only 1 attendant per patient)": "Medium",
            "Entry/Exit tracking of visitors (face recognition)": "Low",
            "Staff presence/absence at duty post": "High",
            "Mobile phone usage in restricted areas": "Medium",
            "Fire / smoke detection": "Critical",
            "Vehicle detection & tracking": "Low",
            "Unauthorized parking / ambulance blockage": "High",
            "Camera offline and recording failure alert": "Critical",
            "Baby moved outside designated routes": "Critical",
            "Unauthorized person handling or carrying baby": "Critical",
            "Baby left unattended": "High",
            "Patient approaching exit without discharge clearance": "High",
            "More than allowed attendants during night": "Medium",
            "Movement in closed departments/areas": "Critical",
            "Person climbing or jumping over boundary wall": "Critical",
        }

        # Add or update scenarios
        for name in scenarios_to_sync:
            key = name # AI sends name as key
            stmt = select(AIScenario).where(AIScenario.name == name)
            existing = session.exec(stmt).first()
            if not existing:
                session.add(AIScenario(name=name, key=key, default_severity=severities[name]))
            else:
                existing.key = key
                existing.default_severity = severities[name]
                session.add(existing)

        # Remove extra scenarios
        all_db_scenarios = session.exec(select(AIScenario)).all()
        for scenario in all_db_scenarios:
            if scenario.name not in scenarios_to_sync:
                session.delete(scenario)

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
app.include_router(training.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
