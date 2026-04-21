import sys
import os
# Add the project root to sys.path to allow absolute imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import SQLModel, Session
from app.core.database import engine, init_db
from app.models.user import Role, User
from app.core.security import get_password_hash
import getpass
from colorama import init, Fore

init(autoreset=True)

def reset_db_and_seed_admin():
    print(Fore.CYAN + "=== HOSPITAL AI SURVEILLANCE - SECURE NODE SETUP ===")
    print(Fore.YELLOW + "WARNING: This will drop existing database tables to apply the new RBAC schema.")
    confirm = input("Continue? (y/n): ")
    if confirm.lower() != 'y':
        print(Fore.RED + "Aborted.")
        sys.exit(0)

    print(Fore.CYAN + "Dropping old tables...")
    SQLModel.metadata.drop_all(engine)
    
    print(Fore.CYAN + "Creating new tables...")
    init_db()

    print(Fore.CYAN + "Seeding Core Roles...")
    with Session(engine) as session:
        roles = ["super_admin", "admin", "operator"]
        for idx, role_name in enumerate(roles, start=1):
            session.add(Role(id=idx, name=role_name))
        session.commit()

        print(Fore.GREEN + "\nRoles seeded successfully.")
        
        print(Fore.YELLOW + "\n--- SUPER ADMIN INITIALIZATION ---")
        full_name = input("Full Name: ")
        email = input("Email Node (e.g. admin@hospital.core): ")
        password = getpass.getpass("Access Key (Hashed on entry): ")
        
        admin_user = User(
            full_name=full_name,
            email=email,
            hashed_password=get_password_hash(password),
            role_id=1 # 1 = super_admin
        )
        
        session.add(admin_user)
        session.commit()
        print(Fore.GREEN + f"SUCCESS: Super Admin '{full_name}' [Node: {email}] activated globally.")
        
if __name__ == "__main__":
    reset_db_and_seed_admin()
