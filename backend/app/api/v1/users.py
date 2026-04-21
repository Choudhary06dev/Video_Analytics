from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.core.database import get_session
from app.api.v1.auth import get_current_user
from app.models import User, Role
from app.schemas.user_schema import AdminUserCreate, AdminUserUpdate, RoleUpdate
from app.services.user_service import get_user_by_email, record_audit_log
from app.core.security import get_password_hash

router = APIRouter(prefix="/admin/users", tags=["Admin User Management"])

def verify_admin_access(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Admin access level required")
    return current_user

def verify_super_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Forbidden: Super Admin access required")
    return current_user

@router.get("/")
def get_all_users(session: Session = Depends(get_session), admin_data: dict = Depends(verify_admin_access)):
    users = session.exec(select(User)).all()
    result = []
    for u in users:
        role_obj = session.get(Role, u.role_id)
        result.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": role_obj.name if role_obj else "unknown",
            "is_active": u.is_active,
            "created_at": u.created_at
        })
    return result

@router.post("/")
def create_user_by_admin(user_data: AdminUserCreate, session: Session = Depends(get_session), admin_data: dict = Depends(verify_super_admin)):
    existing = get_user_by_email(session, user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    role = session.exec(select(Role).where(Role.name == user_data.role_name)).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role specified")
        
    try:
        new_user = User(
            full_name=user_data.full_name,
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            role_id=role.id
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        record_audit_log(session, admin_data.get("id"), "CREATE", "Personnel Matrix", f"Authorized new node: {new_user.email} (Role: {role.name})")
        session.commit()
        return {"message": "User created successfully", "user_id": new_user.id, "role": role.name}
    except Exception as e:
        print(f"Admin Registration Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

@router.put("/{user_id}")
def update_user_by_admin(user_id: int, user_data: AdminUserUpdate, session: Session = Depends(get_session), admin_data: dict = Depends(verify_admin_access)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_data.full_name:
        user.full_name = user_data.full_name
        
    if user_data.email:
        existing = session.exec(select(User).where(User.email == user_data.email, User.id != user_id)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken by another node")
        user.email = user_data.email
        
    if user_data.password:
        user.hashed_password = get_password_hash(user_data.password)
        
    if user_data.role_name:
        if user.id == admin_data.get("id") and user_data.role_name != "super_admin":
             raise HTTPException(status_code=400, detail="Safety Lock: You cannot revoke your own Super Admin access level.")

        role = session.exec(select(Role).where(Role.name == user_data.role_name)).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role specified")
        user.role_id = role.id

    if user_data.is_active is not None:
        user.is_active = user_data.is_active

    try:
        record_audit_log(session, admin_data.get("id"), "UPDATE", "Personnel Matrix", f"Synchronized identity protocol for node {user.email}")
    except Exception as e:
        print(f"Audit log error: {e}")

    session.add(user)
    session.commit()
    session.refresh(user)
    return {"message": "User updated successfully", "id": user.id}

@router.delete("/{user_id}")
def delete_user(user_id: int, session: Session = Depends(get_session), admin_data: dict = Depends(verify_admin_access)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin_data.get("id"):
        raise HTTPException(status_code=400, detail="Cannot delete your own super admin account")
    
    record_audit_log(session, admin_data.get("id"), "DELETE", "Personnel Matrix", f"Purged identity linkage for node: {user.email}")
    session.delete(user)
    session.commit()
    return {"message": "User deleted successfully"}

@router.patch("/{user_id}/status")
def toggle_user_status(user_id: int, status_data: dict, session: Session = Depends(get_session), admin_data: dict = Depends(verify_admin_access)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin_data.get("id"):
        raise HTTPException(status_code=400, detail="Cannot suspend your own account")

    user.is_active = status_data.get("is_active", True)
    session.add(user)

    try:
        record_audit_log(session, admin_data.get("id"), "STATUS_CHANGE", "Personnel Matrix", f"Node {user.email} session status set to {'ACTIVE' if user.is_active else 'SUSPENDED'}")
    except Exception as e:
        print(f"Audit log error: {e}")

    session.commit()
    return {"message": "User status updated", "is_active": user.is_active}

@router.get("/audit-logs")
def get_audit_logs(limit: int = 50, session: Session = Depends(get_session), admin_data: dict = Depends(verify_admin_access)):
    from app.models import AuditLog
    statement = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)
    logs = session.exec(statement).all()
    
    result = []
    for l in logs:
        u = session.get(User, l.user_id)
        result.append({
            "id": l.id,
            "user_name": u.full_name if u else "Unknown Node",
            "user_email": u.email if u else "N/A",
            "action": l.action,
            "resource": l.resource,
            "details": l.details,
            "timestamp": l.timestamp
        })
    return result
