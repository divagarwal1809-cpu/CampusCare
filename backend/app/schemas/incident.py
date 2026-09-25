from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class IncidentBase(BaseModel):
    title: str
    description: str
    category: str # "Medical", "Fire", "Security", "Technical", "Hazmat"
    severity: int = Field(ge=1, le=5, default=3)
    people_affected: int = Field(ge=0, default=1)
    location_name: str
    building: Optional[str] = None
    floor: Optional[str] = None
    latitude: float = 12.9716
    longitude: float = 77.5946
    reporter_name: Optional[str] = "Campus Security Patrol"
    reporter_contact: Optional[str] = "ext-4401"
    attachments: Optional[List[str]] = []
    parent_incident_id: Optional[int] = None

class IncidentCreate(IncidentBase):
    pass

class DynamicFactorUpdate(BaseModel):
    people_affected: Optional[int] = None
    smoke_spreading: Optional[bool] = None
    trapped_persons: Optional[bool] = None
    hazard_leak: Optional[bool] = None
    delayed_minutes: Optional[int] = None
    severity: Optional[int] = None

class IncidentEventOut(BaseModel):
    id: int
    timestamp: datetime
    event_type: str
    actor: str
    description: str
    metadata_payload: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class IncidentOut(IncidentBase):
    id: int
    code: str
    priority_score: float
    priority_scale_10: int = 5
    priority_level: str
    status: str
    smoke_spreading: bool
    trapped_persons: bool
    hazard_leak: bool
    delayed_minutes: int
    required_team: str
    optional_teams: List[str]
    min_responders: int
    required_equipment: List[str]
    escalation_level: int
    sla_target_minutes: int
    created_at: datetime
    first_response_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    assigned_responder_names: Optional[List[str]] = []

    class Config:
        from_attributes = True

class IncidentDetailOut(IncidentOut):
    events: List[IncidentEventOut] = []
    correlated_incident_codes: List[str] = []
    child_incident_codes: List[str] = []
