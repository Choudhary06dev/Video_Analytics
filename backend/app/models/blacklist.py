from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class BlacklistPerson(SQLModel, table=True):
    """
    Model for storing blacklisted individuals for facial recognition.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    reason: str
    severity: str = Field(default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW
    image_preview: Optional[str] = Field(default=None) # Base64 or URL
    notes: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
