from sqlmodel import Session, select
from app.core.database import engine
from app.models import Role

def check_roles():
    with Session(engine) as session:
        roles = session.exec(select(Role)).all()
        for role in roles:
            print(f"ID: {role.id}, Name: {role.name}, Description: {role.description}")

if __name__ == "__main__":
    check_roles()
