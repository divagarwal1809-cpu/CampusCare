from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SimulationInput(BaseModel):
    medical_teams_count: int = 2
    fire_teams_count: int = 1
    security_teams_count: int = 2
    general_teams_count: int = 2
    incident_spike_count: int = 0
    allow_cross_training: bool = True
    delay_multiplier: float = 1.0

class SimulationComparisonOut(BaseModel):
    scenario_name: str
    current_plan: Dict[str, Any]
    simulated_plan: Dict[str, Any]
    metrics: Dict[str, Any]
    key_findings: List[str]
