from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.responder import Responder, Assignment
from app.models.incident import Incident
from app.schemas.responder import ResponderOut, ResponderCapabilityRow

router = APIRouter(prefix="/responders", tags=["responders"])

class ResponderStatusUpdate(BaseModel):
    is_available: Optional[bool] = None
    status: Optional[str] = None

@router.get("", response_model=List[ResponderOut])
def list_responders(team: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Responder)
    if team:
        query = query.filter(Responder.primary_team == team)
    responders = query.all()

    out = []
    for r in responders:
        active_assignment = db.query(Assignment).filter(
            Assignment.responder_id == r.id,
            Assignment.status == "ACTIVE"
        ).first()
        inc_code = None
        if active_assignment:
            inc = db.query(Incident).filter(Incident.id == active_assignment.incident_id).first()
            if inc:
                inc_code = inc.code
        
        r_dict = r.__dict__.copy()
        r_dict["current_assignment_code"] = inc_code
        out.append(r_dict)

    return out

@router.get("/available", response_model=List[ResponderOut])
def list_available_responders(db: Session = Depends(get_db)):
    responders = db.query(Responder).filter(Responder.is_available == True).all()
    out = []
    for r in responders:
        r_dict = r.__dict__.copy()
        r_dict["current_assignment_code"] = None
        out.append(r_dict)
    return out

@router.get("/capability-matrix", response_model=List[ResponderCapabilityRow])
def get_capability_matrix(db: Session = Depends(get_db)):
    responders = db.query(Responder).all()
    matrix = []
    for r in responders:
        skills = [s.lower() for s in (r.skills or [])]
        pt = r.primary_team.lower()

        matrix.append({
            "id": r.id,
            "code": r.code,
            "name": r.name,
            "primary_team": r.primary_team,
            "medical": ("medical" in skills or pt == "medical"),
            "fire": ("fire" in skills or "fire_response" in skills or pt == "fire"),
            "security": ("security" in skills or pt == "security"),
            "technical": ("technical" in skills or pt == "technical"),
            "first_aid": ("first_aid" in skills or "medical" in skills or pt == "medical"),
            "crowd_control": ("crowd_control" in skills or "security" in skills or pt == "security"),
            "status": r.status,
            "is_available": r.is_available,
            "current_workload": r.current_workload,
            "max_workload": r.max_workload
        })
    return matrix

@router.patch("/{id}/status")
def update_responder_status(id: int, payload: ResponderStatusUpdate, db: Session = Depends(get_db)):
    responder = db.query(Responder).filter(Responder.id == id).first()
    if not responder:
        raise HTTPException(status_code=404, detail="Responder not found")

    if payload.is_available is not None:
        responder.is_available = payload.is_available
        if not payload.is_available:
            responder.status = "UNAVAILABLE"
        elif responder.status == "UNAVAILABLE":
            responder.status = "AVAILABLE"

    if payload.status is not None:
        responder.status = payload.status

    db.commit()
    return {"success": True, "responder": responder.name, "status": responder.status, "is_available": responder.is_available}
