from pydantic import BaseModel
from typing import Optional


class UserRegister(BaseModel):
    full_name: str
    email: str
    password: str


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


class AdminUserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    password: str | None = None
    role_name: str | None = None
    is_active: bool | None = None


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
