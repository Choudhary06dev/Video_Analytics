from sqlmodel import Session, select
from database import engine
from models import User

with Session(engine) as session:
    user = session.exec(select(User).where(User.email == "admin@admin.com")).first()
    if user:
        print(f"User found: {user.email}")
        print(f"Role ID: {user.role_id}")
        print(f"Name: {user.full_name}")
    else:
        print("User not found.")
