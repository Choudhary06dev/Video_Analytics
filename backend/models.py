from sqlmodel import SQLModel, Field, JSON
from datetime import datetime
from typing import Optional, List, Dict
import json

class FrontEndUser(SQLModel, table=True):
    """
    Model for regular frontend users.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    email: str = Field(index=True, unique=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.now)

class AdminUser(SQLModel, table=True):
    """
    Model for platform administrators.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    is_super_admin: bool = Field(default=False)

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
