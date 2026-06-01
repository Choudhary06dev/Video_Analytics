from pydantic import BaseModel, field_validator
from typing import Optional
import re


def _validate_password_strength(password: str) -> str:
    """Enforce strong password policy."""
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if len(password) > 128:
        raise ValueError("Password must not exceed 128 characters")
    if not re.search(r'[A-Z]', password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r'[0-9]', password):
        raise ValueError("Password must contain at least one digit")
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
        raise ValueError("Password must contain at least one special character")
    return password


def _validate_email_format(email: str) -> str:
    """Basic email format validation."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValueError("Invalid email format")
    return email.lower().strip()


class UserRegister(BaseModel):
    full_name: str
    email: str
    password: str

    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        return _validate_password_strength(v)

    @field_validator('email')
    @classmethod
    def email_format(cls, v):
        return _validate_email_format(v)

    @field_validator('full_name')
    @classmethod
    def name_not_empty(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        if len(v) > 100:
            raise ValueError("Full name must not exceed 100 characters")
        return v


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


class AdminUserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role_name: str
    whatsapp_number: str | None = None
    whatsapp_alerts_enabled: bool | None = None

    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        return _validate_password_strength(v)

    @field_validator('email')
    @classmethod
    def email_format(cls, v):
        return _validate_email_format(v)


class AdminUserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    password: str | None = None
    role_name: str | None = None
    is_active: bool | None = None
    whatsapp_number: str | None = None
    whatsapp_alerts_enabled: bool | None = None


class RoleUpdate(BaseModel):
    role_name: str


class RoleCreateRequest(BaseModel):
    name: str
    description: str | None = None


class RoleUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None


class PermissionUpdate(BaseModel):
    module_key: str
    can_view: bool
    can_edit: bool
    can_delete: bool


class AreaPermissionUpdate(BaseModel):
    area_id: int
    can_view: bool
