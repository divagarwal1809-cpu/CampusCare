from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class MatchScoreBreakdown(BaseModel):
    skill_score: float
    distance_score: float
    workload_score: float
    availability_score: float
    response_time_score: float
    priority_score: float
    total_score: float

class CandidateResponderOut(BaseModel):
    responder_id: int
    responder_code: str
    responder_name: str
    primary_team: str
    distance_km: float
    eta_minutes: float
    match_score: float
    breakdown: MatchScoreBreakdown
    reasons: List[str]
    is_cross_trained: bool = False

class ReallocationOption(BaseModel):
    option_id: str
    title: str
    action_type: str # "REALLOCATE", "CROSS_TRAINED", "EXTERNAL", "ESCALATE"
    description: str
    reallocate_responder_code: Optional[str] = None
    from_incident_code: Optional[str] = None
    to_incident_code: Optional[str] = None
    impact: str
    benefit: str
    net_priority_gain: float
    recommended: bool = False

class AllocationPlanOut(BaseModel):
    timestamp: str
    active_incidents_count: int
    assigned_incidents: List[Dict[str, Any]]
    unassigned_incidents: List[Dict[str, Any]]
    resource_pressure: Dict[str, Dict[str, Any]] # e.g. {"Medical": {"used": 2, "total": 2, "percent": 100}}
    resource_conflicts: List[str]
    reallocation_proposals: List[ReallocationOption]
    escalation_alerts: List[str]
    system_status: str # "OPERATIONAL", "ELEVATED", "CRITICAL_PRESSURE"
