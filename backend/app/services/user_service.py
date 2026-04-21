from sqlmodel import Session, select
from app.models import User, Role, AuditLog
from app.core.security import get_password_hash

def record_audit_log(session: Session, user_id: int, action: str, resource: str, details: str):
    """Utility to record administrative actions in the temporal matrix."""
    log = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        details=details
    )
    session.add(log)
    # Note: caller should handle commit unless this is used in a specific transaction

def get_user_by_email(session: Session, email: str):
    return session.exec(select(User).where(User.email == email)).first()

def create_user(session: Session, user_data, role_id: int):
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role_id=role_id
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user
