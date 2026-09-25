from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.incident import Incident, IncidentEvent
from app.models.responder import Responder, Assignment
from app.models.audit import AuditLog
from app.models.notification import Notification
from app.schemas.decision import AllocationPlanOut, CandidateResponderOut
from app.services.allocation_engine import AllocationEngine
from app.services.assignment_engine import AssignmentEngine
from app.services.ai_engine import AIEngine

router = APIRouter(prefix="/decisions", tags=["decisions"])

class EvaluateCandidateIn(BaseModel):
    incident_id: int
    responder_id: int

class AssignResponderIn(BaseModel):
    incident_id: int
    responder_id: int

class ExecuteOptionIn(BaseModel):
    option_id: str
    action_type: str # "REALLOCATE", "CROSS_TRAINED", "EXTERNAL", "ESCALATE"
    reallocate_responder_code: str = None
    from_incident_code: str = None
    to_incident_code: str = None

@router.get("/allocation-plan", response_model=AllocationPlanOut)
def get_allocation_plan(db: Session = Depends(get_db)):
    incidents = db.query(Incident).filter(Incident.status.notin_(["RESOLVED", "CLOSED"])).all()
    responders = db.query(Responder).all()
    assignments = db.query(Assignment).filter(Assignment.status == "ACTIVE").all()

    plan = AllocationEngine.optimize_multi_incident_allocation(
        incidents=incidents,
        responders=responders,
        active_assignments=assignments
    )
    return plan

@router.post("/evaluate-candidate", response_model=CandidateResponderOut)
def evaluate_candidate(payload: EvaluateCandidateIn, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == payload.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    responder = db.query(Responder).filter(Responder.id == payload.responder_id).first()
    if not responder:
        raise HTTPException(status_code=404, detail="Responder not found")

    evaluation = AssignmentEngine.evaluate_candidate(responder, incident)
    return evaluation

@router.post("/assign")
def assign_responder(payload: AssignResponderIn, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == payload.incident_id).first()
    responder = db.query(Responder).filter(Responder.id == payload.responder_id).first()

    if not incident or not responder:
        raise HTTPException(status_code=404, detail="Incident or Responder not found")

    # Evaluate match score and reasons
    eval_res = AssignmentEngine.evaluate_candidate(responder, incident)

    # Create assignment
    assignment = Assignment(
        incident_id=incident.id,
        responder_id=responder.id,
        assigned_at=datetime.utcnow(),
        status="ACTIVE",
        match_score=eval_res["match_score"],
        decision_reasoning=eval_res["reasons"]
    )
    db.add(assignment)

    # Update responder status
    responder.current_workload += 1
    responder.status = "ASSIGNED"
    if responder.current_workload >= responder.max_workload:
        responder.is_available = False

    # Update incident status
    incident.status = "ASSIGNED"
    if not incident.first_response_at:
        incident.first_response_at = datetime.utcnow()

    # Event & Audit
    evt = IncidentEvent(
        incident_id=incident.id,
        event_type="ASSIGNED",
        actor="EOC Dispatch Optimizer",
        description=f"Assigned {responder.name} ({responder.code}) with match score {eval_res['match_score']}%.",
        metadata_payload=eval_res
    )
    db.add(evt)

    audit = AuditLog(
        action="RESPONDER_ASSIGNED",
        incident_code=incident.code,
        actor="Dispatch Console",
        details=f"Assigned {responder.name} to {incident.code}. Reason: {'; '.join(eval_res['reasons'][:2])}."
    )
    db.add(audit)

    db.commit()

    return {
        "success": True,
        "incident_code": incident.code,
        "responder_name": responder.name,
        "match_score": eval_res["match_score"],
        "reasons": eval_res["reasons"]
    }

@router.post("/execute-option")
def execute_reallocation_option(payload: ExecuteOptionIn, db: Session = Depends(get_db)):
    """
    Executes one of the 4 decision options from the multi-incident optimization engine:
    1. REALLOCATE (preempt responder from lower priority incident and reroute)
    2. CROSS_TRAINED (dispatch multi-disciplinary responder like Team D)
    3. EXTERNAL (trigger mutual aid / 911 dispatch)
    4. ESCALATE (escalate to Operations Administrator)
    """
    to_incident = db.query(Incident).filter(Incident.code == payload.to_incident_code).first()
    if not to_incident:
        raise HTTPException(status_code=404, detail="Target incident not found")

    if payload.action_type == "REALLOCATE":
        from_incident = db.query(Incident).filter(Incident.code == payload.from_incident_code).first()
        responder = db.query(Responder).filter(Responder.code == payload.reallocate_responder_code).first()
        if not from_incident or not responder:
            raise HTTPException(status_code=404, detail="Source incident or responder not found")

        # Update old assignment
        old_assignment = db.query(Assignment).filter(
            Assignment.incident_id == from_incident.id,
            Assignment.responder_id == responder.id,
            Assignment.status == "ACTIVE"
        ).first()
        if old_assignment:
            old_assignment.status = "REALLOCATED"
            old_assignment.is_reallocated = True
            old_assignment.reallocated_to_incident_id = to_incident.id

        # Update from_incident status to TRIAGED/PENDING_REPLACEMENT
        from_incident.status = "TRIAGED"

        # Create new assignment for to_incident
        eval_res = AssignmentEngine.evaluate_candidate(responder, to_incident)
        new_assignment = Assignment(
            incident_id=to_incident.id,
            responder_id=responder.id,
            status="ACTIVE",
            match_score=eval_res["match_score"],
            decision_reasoning=[
                f"✓ Reallocated from {from_incident.code} (Priority {from_incident.priority_score})",
                f"✓ High-priority life safety response (+{round(to_incident.priority_score - from_incident.priority_score, 1)} net gain)"
            ] + eval_res["reasons"]
        )
        db.add(new_assignment)
        to_incident.status = "DISPATCHED"
        if not to_incident.first_response_at:
            to_incident.first_response_at = datetime.utcnow()

        # Log events on both incidents
        evt_from = IncidentEvent(
            incident_id=from_incident.id,
            event_type="RESPONDER_REALLOCATED",
            actor="EOC Dynamic Reallocation",
            description=f"{responder.name} preempted and reallocated to higher priority incident {to_incident.code}."
        )
        db.add(evt_from)

        evt_to = IncidentEvent(
            incident_id=to_incident.id,
            event_type="REALLOCATION_RECEIVED",
            actor="EOC Dynamic Reallocation",
            description=f"Received emergency reallocation of {responder.name} from {from_incident.code}."
        )
        db.add(evt_to)

        # Audit
        audit = AuditLog(
            action="REALLOCATION_EXECUTED",
            incident_code=to_incident.code,
            actor="EOC Incident Commander",
            details=f"Preempted {responder.name} from {from_incident.code} (Pri {from_incident.priority_score}) and rerouted to {to_incident.code} (Pri {to_incident.priority_score})."
        )
        db.add(audit)

        notif = Notification(
            level="WARNING",
            title=f"Resource Reallocation: {responder.code} Rerouted",
            message=f"{responder.name} was moved from {from_incident.code} to {to_incident.code} based on priority.",
            incident_code=to_incident.code
        )
        db.add(notif)

        db.commit()
        return {
            "success": True,
            "message": f"Successfully reallocated {responder.name} from {from_incident.code} to {to_incident.code}."
        }

    elif payload.action_type == "CROSS_TRAINED":
        responder = db.query(Responder).filter(Responder.code == payload.reallocate_responder_code).first()
        if not responder:
            raise HTTPException(status_code=404, detail="Cross-trained responder not found")

        eval_res = AssignmentEngine.evaluate_candidate(responder, to_incident)
        assignment = Assignment(
            incident_id=to_incident.id,
            responder_id=responder.id,
            status="ACTIVE",
            match_score=eval_res["match_score"],
            decision_reasoning=[
                f"✓ Cross-trained deployment ({responder.name} utilizes secondary capability)",
                f"✓ Preserves other active incident operations"
            ] + eval_res["reasons"]
        )
        db.add(assignment)
        responder.current_workload += 1
        responder.status = "ASSIGNED"
        to_incident.status = "DISPATCHED"

        evt = IncidentEvent(
            incident_id=to_incident.id,
            event_type="CROSS_TRAINED_DISPATCH",
            actor="EOC Resource Optimizer",
            description=f"Dispatched cross-trained responder {responder.name} ({responder.primary_team}) to fulfill {to_incident.required_team} requirement."
        )
        db.add(evt)

        audit = AuditLog(
            action="CROSS_TRAINED_DISPATCH",
            incident_code=to_incident.code,
            actor="EOC Dispatcher",
            details=f"Dispatched cross-trained {responder.name} for {to_incident.code}."
        )
        db.add(audit)
        db.commit()

        return {"success": True, "message": f"Dispatched cross-trained unit {responder.name} to {to_incident.code}."}

    elif payload.action_type == "EXTERNAL":
        to_incident.escalation_level = 4
        evt = IncidentEvent(
            incident_id=to_incident.id,
            event_type="EXTERNAL_MUTUAL_AID_REQUESTED",
            actor="EOC Incident Commander",
            description=f"External emergency dispatch requested: City {to_incident.required_team} Services 911 mutual aid activated."
        )
        db.add(evt)
        audit = AuditLog(
            action="EXTERNAL_AID_REQUESTED",
            incident_code=to_incident.code,
            actor="EOC Commander",
            details=f"Level 4 External Emergency Services dispatched for {to_incident.code}."
        )
        db.add(audit)
        db.commit()
        return {"success": True, "message": f"City 911 / Mutual Aid emergency services dispatched for {to_incident.code}."}

    elif payload.action_type == "ESCALATE":
        to_incident.escalation_level = max(to_incident.escalation_level, 3)
        evt = IncidentEvent(
            incident_id=to_incident.id,
            event_type="ADMIN_ESCALATION",
            actor="EOC Dispatcher",
            description="Escalated directly to Campus Operations Director / Emergency Operations Chief."
        )
        db.add(evt)
        audit = AuditLog(
            action="COMMAND_ESCALATION",
            incident_code=to_incident.code,
            actor="EOC Dispatcher",
            details=f"Escalated incident {to_incident.code} to campus leadership."
        )
        db.add(audit)
        db.commit()
        return {"success": True, "message": f"Incident {to_incident.code} escalated to Campus Operations Chief."}

    return {"success": False, "message": "Unknown action type"}

@router.get("/situation-briefing")
def get_situation_briefing(db: Session = Depends(get_db)):
    active_incidents = db.query(Incident).filter(Incident.status.notin_(["RESOLVED", "CLOSED"])).all()
    responders = db.query(Responder).all()
    assignments = db.query(Assignment).filter(Assignment.status == "ACTIVE").all()

    plan = AllocationEngine.optimize_multi_incident_allocation(
        incidents=active_incidents,
        responders=responders,
        active_assignments=assignments
    )

    briefing = AIEngine.generate_situation_briefing(
        active_incidents=active_incidents,
        responders=responders,
        pressure=plan["resource_pressure"]
    )
    return briefing
