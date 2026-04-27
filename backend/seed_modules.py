from sqlmodel import Session, select
from app.core.database import engine
from app.models import ModulePermission

def seed_new_modules():
    modules = [
        {"name": "Scenario Orchestration", "key": "scenario_orchestration", "description": "Assign AI models to cameras"},
        {"name": "Intelligence Registry", "key": "intelligence_registry", "description": "Manage AI scenario definitions"},
    ]
    
    with Session(engine) as session:
        for m in modules:
            existing = session.exec(select(ModulePermission).where(ModulePermission.key == m["key"])).first()
            if not existing:
                new_mod = ModulePermission(**m)
                session.add(new_mod)
                print(f"Added module: {m['name']}")
            else:
                print(f"Module exists: {m['name']}")
        session.commit()

if __name__ == "__main__":
    seed_new_modules()
