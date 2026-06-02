from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlmodel import Session, select
from app.core.database import get_session, engine
from app.core.config import settings as config_settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    get_authorization_token,
    get_password_hash,
    verify_password,
)
from app.models import User, Role, ModulePermission, RoleModulePermission
from app.models.system_setting import SystemSetting
from app.schemas.user_schema import UserRegister, UserLogin, Token
from app.services.user_service import get_user_by_email

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
@router.post("/register/")
def register_user(user_data: UserRegister, session: Session = Depends(get_session)):
    # Enforce public enrollment setting from database
    with Session(engine) as settings_session:
        setting = settings_session.exec(select(SystemSetting)).first()
        if setting and not setting.public_enrollment:
            raise HTTPException(status_code=403, detail="Public registration is currently disabled")

    existing = get_user_by_email(session, user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        new_user = User(
            full_name=user_data.full_name,
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            role_id=3 # Default to operator
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return {"message": "User created successfully", "user_id": new_user.id}
    except Exception as e:
        from app.core.logger import logger
        logger.error(f"Registration Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Registration failed. Please try again later.")

@router.post("/login", response_model=Token)
@router.post("/login/", response_model=Token)
def login_user(login_data: UserLogin, response: Response, session: Session = Depends(get_session)):
    user = get_user_by_email(session, login_data.email)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    role = session.get(Role, user.role_id)
    role_name = role.name if role else "operator"
    
    access_token = create_access_token(data={"sub": user.email, "id": user.id, "role": role_name, "role_id": user.role_id})
    
    # Set HttpOnly, Secure cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=config_settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "name": user.full_name, "role": role_name, "role_id": user.role_id, "whatsapp_number": user.whatsapp_number or "", "whatsapp_alerts_enabled": user.whatsapp_alerts_enabled or False}
    }

@router.post("/logout")
@router.post("/logout/")
def logout_user(response: Response):
    response.delete_cookie("access_token", httponly=True, secure=False, samesite="lax")
    return {"message": "Logged out successfully"}

def get_current_user(token: str = Depends(get_authorization_token)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return payload

@router.get("/me")
@router.get("/me/")
def read_current_user(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}

@router.get("/permissions")
@router.get("/permissions/")
def read_current_permissions(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    user_id = current_user.get("id")
    db_user = session.get(User, user_id) if user_id else None
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    stmt = select(RoleModulePermission).where(RoleModulePermission.role_id == db_user.role_id)
    role_permissions = session.exec(stmt).all()

    permissions_map = {}
    for perm in role_permissions:
        mod = session.get(ModulePermission, perm.module_permission_id)
        if not mod:
            continue
        permissions_map[mod.key] = {
            "can_view": perm.can_view,
            "can_edit": perm.can_edit,
            "can_delete": perm.can_delete
        }

    return {"role_id": db_user.role_id, "permissions": permissions_map}
