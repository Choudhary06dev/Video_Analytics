import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.core.database import engine
from app.models.user import User
from app.core.security import get_password_hash

def reset_password(email, new_password):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if user:
            user.hashed_password = get_password_hash(new_password)
            session.add(user)
            session.commit()
            print(f"Password reset for user: {user.email}")
        else:
            print(f"User {email} not found.")

if __name__ == "__main__":
    email = input("Email: ")
    pwd = input("New Password: ")
    reset_password(email, pwd)
