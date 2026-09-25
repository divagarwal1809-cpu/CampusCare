from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.incident import Incident
from app.models.responder import Responder, Assignment
from app.schemas.simulation import SimulationInput, SimulationComparisonOut
from app.services.simulation_engine import SimulationEngine

router = APIRouter(prefix="/simulation", tags=["simulation"])

@router.post("/run", response_model=SimulationComparisonOut)
def run_simulation(payload: SimulationInput, db: Session = Depends(get_db)):
    live_incidents = db.query(Incident).filter(Incident.status.notin_(["RESOLVED", "CLOSED"])).all()
    live_responders = db.query(Responder).all()
    live_assignments = db.query(Assignment).filter(Assignment.status == "ACTIVE").all()

    result = SimulationEngine.run_simulation(
        sim_input=payload,
        live_incidents=live_incidents,
        live_responders=live_responders,
        live_assignments=live_assignments
    )
    return result
