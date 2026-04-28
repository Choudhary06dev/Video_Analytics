from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.core.database import get_session
from app.api.v1.auth import get_current_user
from app.models import User, Role, ModulePermission, RoleModulePermission
from app.schemas.user_schema import AdminUserCreate, AdminUserUpdate, RoleUpdate
from app.services.user_service import get_user_by_email, record_audit_log
from app.core.security import get_password_hash

router = APIRouter(prefix="/admin/users", tags=["Admin User Management"])

def verify_module_access(module_key: str, current_user: dict = Depends(get_current_user), session: Session = Depends(get_session), access_level: str = "edit"):
    """Generic module-based permission verifier - NO HARDCODED BYPASSES"""
    user_id = current_user.get("id")

    db_user = session.get(User, user_id) if user_id else None
    if not db_user:
        raise HTTPException(status_code=403, detail="Forbidden: User not found")
    
    # Get the specific module
    module = session.exec(select(ModulePermission).where(ModulePermission.key == module_key)).first()
    if not module:
        # If module doesn't exist, we default to deny for security
        raise HTTPException(status_code=403, detail=f"Forbidden: {module_key} module not configured")
    
    # Check role permission for this module
    role_perm = session.exec(
        select(RoleModulePermission).where(
            RoleModulePermission.role_id == db_user.role_id,
            RoleModulePermission.module_permission_id == module.id
        )
    ).first()
    
    if not role_perm:
        raise HTTPException(status_code=403, detail=f"Forbidden: No permissions assigned for {module.name}")

    if access_level == "view" and not role_perm.can_view:
        raise HTTPException(status_code=403, detail=f"Forbidden: View permission required for {module.name}")
    elif access_level == "edit" and not role_perm.can_edit:
        raise HTTPException(status_code=403, detail=f"Forbidden: Edit permission required for {module.name}")
    elif access_level == "delete" and not role_perm.can_delete:
        raise HTTPException(status_code=403, detail=f"Forbidden: Delete permission required for {module.name}")
    
    return current_user

def verify_admin_access(current_user: dict = Depends(get_current_user), session: Session = Depends(get_session)):
    """Dynamic admin check: Requires VIEW access to admin_hub"""
    return verify_module_access("admin_hub", current_user, session, access_level="view")

def verify_super_admin(current_user: dict = Depends(get_current_user), session: Session = Depends(get_session)):
    """Dynamic super admin check: Requires EDIT access to admin_hub"""
    return verify_module_access("admin_hub", current_user, session, access_level="edit")

def verify_admin_hub_access(current_user: dict = Depends(get_current_user), session: Session = Depends(get_session)):
    """Verify user has access to admin_hub module with edit permissions"""
    return verify_module_access("admin_hub", current_user, session, access_level="edit")


@router.get("/")
def get_all_users(skip: int = 0, limit: int = 20, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("users", cur, s, access_level="view"))):
    total_count = len(session.exec(select(User)).all())
    
    users = session.exec(select(User).offset(skip).limit(limit)).all()
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
    return {"total": total_count, "users": result}

@router.post("/")
def create_user_by_admin(user_data: AdminUserCreate, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("users", cur, s, access_level="edit"))):
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

@router.get("/audit-logs")
def get_audit_logs(skip: int = 0, limit: int = 50, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("audit", cur, s, access_level="view"))):
    from app.models import AuditLog
    
    total_count = len(session.exec(select(AuditLog)).all())
    
    statement = select(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit)
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
    return {"total": total_count, "logs": result}

@router.put("/{user_id}")
def update_user_by_admin(user_id: int, user_data: AdminUserUpdate, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("users", cur, s, access_level="edit"))):
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
def delete_user(user_id: int, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("users", cur, s, access_level="delete"))):
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
def toggle_user_status(user_id: int, status_data: dict, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("users", cur, s, access_level="edit"))):
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
