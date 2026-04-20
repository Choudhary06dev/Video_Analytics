from sqlmodel import Session, select
from database import engine
from models import User
from security import get_password_hash

with Session(engine) as session:
    user = session.exec(select(User).where(User.email == "admin@admin.com")).first()
    if user:
        user.hashed_password = get_password_hash("admin123")
        session.add(user)
        session.commit()
        print(f"Password reset for user: {user.email}")
    else:
        print("User not found.")
