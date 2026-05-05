from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.core.database import get_session
from app.api.v1.auth import get_current_user
from app.api.v1.users import verify_module_access
from app.models import Role, ModulePermission, RoleModulePermission, Area, RoleAreaPermission
from app.schemas.user_schema import RoleCreateRequest, RoleUpdateRequest, PermissionUpdate, AreaPermissionUpdate
from app.services.user_service import record_audit_log

router = APIRouter(prefix="/admin/roles", tags=["Admin Role Management"])

@router.get("/")
def get_roles(session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("roles", cur, s, access_level="view"))):
    roles = session.exec(select(Role).order_by(Role.id)).all()
    result = []
    for r in roles:
        stmt = select(RoleModulePermission).where(RoleModulePermission.role_id == r.id)
        perms = session.exec(stmt).all()
        
        perm_list = []
        for p in perms:
            mod = session.get(ModulePermission, p.module_permission_id)
            perm_list.append({
                "module_id": p.module_permission_id,
                "module_key": mod.key if mod else "unknown",
                "module_name": mod.name if mod else "unknown",
                "can_view": p.can_view,
                "can_edit": p.can_edit,
                "can_delete": p.can_delete
            })
            
        result.append({
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "permissions": perm_list
        })
    return result

@router.get("/modules")
def get_modules(session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("roles", cur, s, access_level="view"))):
    modules = session.exec(select(ModulePermission)).all()
    return modules

@router.post("/")
def create_role(role_data: RoleCreateRequest, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("roles", cur, s, access_level="edit"))):
    normalized_name = role_data.name.strip().lower().replace(" ", "_")
    if not normalized_name:
        raise HTTPException(status_code=400, detail="Role name is required")

    existing = session.exec(select(Role).where(Role.name == normalized_name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role already exists")

    new_role = Role(
        name=normalized_name,
        description=role_data.description.strip() if role_data.description else None
    )
    session.add(new_role)
    session.commit()
    session.refresh(new_role)

    record_audit_log(
        session,
        admin_data.get("id"),
        "CREATE",
        "Access Authority",
        f"Created role profile: {new_role.name}"
    )
    session.commit()
    return {"message": "Role created successfully", "role": new_role}

@router.put("/{role_id}")
def update_role(role_id: int, role_data: RoleUpdateRequest, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("roles", cur, s, access_level="edit"))):
    role = session.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role_data.name is not None:
        normalized_name = role_data.name.strip().lower().replace(" ", "_")
        if not normalized_name:
            raise HTTPException(status_code=400, detail="Role name cannot be empty")

        existing = session.exec(select(Role).where(Role.name == normalized_name, Role.id != role_id)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Role name already exists")
        role.name = normalized_name

    if role_data.description is not None:
        role.description = role_data.description.strip() or None

    session.add(role)
    session.commit()
    session.refresh(role)

    record_audit_log(
        session,
        admin_data.get("id"),
        "UPDATE",
        "Access Authority",
        f"Updated role profile: {role.name}"
    )
    session.commit()
    return {"message": "Role updated successfully", "role": role}

@router.put("/{role_id}/permissions")
def update_role_permissions(role_id: int, perms: List[PermissionUpdate], session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("roles", cur, s, access_level="edit"))):
    role = session.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    for p in perms:
        stmt = select(ModulePermission).where(ModulePermission.key == p.module_key)
        mod = session.exec(stmt).first()
        if not mod: continue
        
        perm_stmt = select(RoleModulePermission).where(
            RoleModulePermission.role_id == role_id,
            RoleModulePermission.module_permission_id == mod.id
        )
        existing_perm = session.exec(perm_stmt).first()
        
        if existing_perm:
            existing_perm.can_view = p.can_view
            existing_perm.can_edit = p.can_edit
            existing_perm.can_delete = p.can_delete
            session.add(existing_perm)
        else:
            new_perm = RoleModulePermission(
                role_id=role_id,
                module_permission_id=mod.id,
                can_view=p.can_view,
                can_edit=p.can_edit,
                can_delete=p.can_delete
            )
            session.add(new_perm)
            
    session.commit()
    return {"message": "Permissions updated successfully"}


@router.get("/{role_id}/areas")
def get_role_area_permissions(role_id: int, session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("roles", cur, s, access_level="view"))):
    """
    Returns all areas with their view permission status for the specific role.
    """
    role = session.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    all_areas = session.exec(select(Area).order_by(Area.id)).all()
    role_perms = session.exec(select(RoleAreaPermission).where(RoleAreaPermission.role_id == role_id)).all()
    
    perm_map = {p.area_id: p.can_view for p in role_perms}
    
    result = []
    for area in all_areas:
        result.append({
            "area_id": area.id,
            "area_name": area.name,
            "parent_id": area.parent_id,
            "can_view": perm_map.get(area.id, False)
        })
    
    return result


@router.put("/{role_id}/areas")
def update_role_area_permissions(role_id: int, perms: List[AreaPermissionUpdate], session: Session = Depends(get_session), admin_data: dict = Depends(lambda cur=Depends(get_current_user), s=Depends(get_session): verify_module_access("roles", cur, s, access_level="edit"))):
    """
    Updates area-level permissions for a role.
    """
    role = session.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    for p in perms:
        area = session.get(Area, p.area_id)
        if not area: continue
        
        stmt = select(RoleAreaPermission).where(
            RoleAreaPermission.role_id == role_id,
            RoleAreaPermission.area_id == p.area_id
        )
        existing_perm = session.exec(stmt).first()
        
        if existing_perm:
            existing_perm.can_view = p.can_view
            session.add(existing_perm)
        else:
            new_perm = RoleAreaPermission(
                role_id=role_id,
                area_id=p.area_id,
                can_view=p.can_view
            )
            session.add(new_perm)
            
    session.commit()
    record_audit_log(session, admin_data.get("id"), "UPDATE", "Access Authority", f"Updated area permissions for role: {role.name}")
    session.commit()
    return {"message": "Area permissions updated successfully"}
