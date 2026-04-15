from sqlmodel import SQLModel, Field, JSON
from datetime import datetime
from typing import Optional, List, Dict
import json

class Role(SQLModel, table=True):
    """
    Model for defining access roles (e.g., super_admin, admin, operator).
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    description: Optional[str] = Field(default=None)


class User(SQLModel, table=True):
    """
    Unified User model handling all accounts based on their Role.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    email: str = Field(index=True, unique=True)
    hashed_password: str
    role_id: int = Field(default=3) # Default 3 assumes 'operator' (1=super_admin, 2=admin, 3=operator)
    created_at: datetime = Field(default_factory=datetime.now)

class DetectionEvent(SQLModel, table=True):
    """
    Model for storing AI detection events.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.now)
    camera_id: int = Field(default=0)
    object_class: str
    confidence: float
    
    # Store additional data like bounding boxes as JSON
    # SaqlModel uses SA's JSON type for this
    metadata_json: Optional[Dict] = Field(default=None, sa_type=JSON)

    class Config:
        arbitrary_types_allowed = True
