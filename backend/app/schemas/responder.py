from pydantic import BaseModel
from typing import List, Optional

class ResponderBase(BaseModel):
    code: str
    name: str
    primary_team: str
    skills: List[str] = []
    latitude: float = 12.9716
    longitude: float = 77.5946
    location_label: str = "Central Station"
    status: str = "AVAILABLE"
    is_available: bool = True
    current_workload: int = 0
    max_workload: int = 2
    shift: str = "Day Shift"
    avg_response_time_min: float = 3.5

class ResponderCreate(ResponderBase):
    pass

class ResponderOut(ResponderBase):
    id: int
    current_assignment_code: Optional[str] = None

    class Config:
        from_attributes = True

class ResponderCapabilityRow(BaseModel):
    id: int
    code: str
    name: str
    primary_team: str
    medical: bool = False
    fire: bool = False
    security: bool = False
    technical: bool = False
    first_aid: bool = False
    crowd_control: bool = False
    status: str
    is_available: bool
    current_workload: int
    max_workload: int
