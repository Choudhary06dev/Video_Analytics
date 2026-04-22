from pydantic import BaseModel
from typing import Optional


class AreaCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None


class AreaUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None


class CameraCreate(BaseModel):
    name: str
    source_url: str
    area_id: int


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    source_url: Optional[str] = None
    area_id: Optional[int] = None
    is_active: Optional[bool] = None


class ScenarioToggle(BaseModel):
    scenario_id: int
    is_enabled: bool
