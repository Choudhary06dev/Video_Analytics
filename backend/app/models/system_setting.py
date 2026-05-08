from sqlmodel import SQLModel, Field
from typing import Optional

class SystemSetting(SQLModel, table=True):
    id: Optional[int] = Field(default=1, primary_key=True)
    maintenance_mode: bool = Field(default=False)
    debug_mode: bool = Field(default=True)
    public_enrollment: bool = Field(default=False)
    cluster_sync: bool = Field(default=True)
    region: str = Field(default="South Asia (PK-1)")
    confidence_threshold: int = Field(default=75)
    motion_sensitivity: int = Field(default=80)
    neural_optimizer: bool = Field(default=True)
    edge_processing: bool = Field(default=True)
    retention_logs: int = Field(default=90)
    retention_video: int = Field(default=30)
    retention_metadata: int = Field(default=180)
    auto_purge: bool = Field(default=True)
    mfa_required: bool = Field(default=True)
    ip_lockdown: bool = Field(default=False)
    session_timeout: int = Field(default=60)
    threat_alerts: bool = Field(default=True)
