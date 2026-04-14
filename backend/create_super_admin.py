from sqlmodel import SQLModel, Session, select
from database import engine, init_db
from models import Role, User
from security import get_password_hash
import sys
import getpass
from colorama import init, Fore

init(autoreset=True)

def reset_db_and_seed_admin():
    print(Fore.CYAN + "=== NEXER ENTERPRISE - SECURE NODE SETUP ===")
    print(Fore.YELLOW + "WARNING: This will drop existing database tables to apply the new RBAC schema.")
    confirm = input("Continue? (y/n): ")
    if confirm.lower() != 'y':
        print(Fore.RED + "Aborted.")
        sys.exit(0)

    # Note: SQLModel.metadata.drop_all(engine) drops all tables known to the metadata.
    # It might leave unknown tables, but that's fine for now.
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
        email = input("Email Node (e.g. admin@nexer.core): ")
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
