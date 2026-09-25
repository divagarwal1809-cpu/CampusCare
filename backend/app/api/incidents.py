from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.incident import Incident, IncidentEvent
from app.models.responder import Responder, Assignment
from app.models.audit import AuditLog
from app.models.notification import Notification
from app.schemas.incident import IncidentCreate, DynamicFactorUpdate, IncidentOut, IncidentDetailOut
from app.services.priority_engine import PriorityEngine
from app.services.resource_engine import ResourceEngine
from app.services.escalation_engine import EscalationEngine
from app.services.recommendation_engine import RecommendationEngine
from app.services.correlation_engine import CorrelationEngine
from app.services.ai_engine import AIEngine

router = APIRouter(prefix="/incidents", tags=["incidents"])

@router.get("", response_model=List[IncidentOut])
def list_incidents(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if category:
        query = query.filter(Incident.category == category)
    if priority:
        query = query.filter(Incident.priority_level == priority)
    
    incidents = query.order_by(Incident.priority_score.desc()).all()
    
    # Enrich with assigned responder names
    out = []
    for inc in incidents:
        active_assignments = db.query(Assignment).filter(
            Assignment.incident_id == inc.id,
            Assignment.status == "ACTIVE"
        ).all()
        resp_names = []
        for a in active_assignments:
            resp = db.query(Responder).filter(Responder.id == a.responder_id).first()
            if resp:
                resp_names.append(resp.name)
        
        inc_dict = inc.__dict__.copy()
        inc_dict["assigned_responder_names"] = resp_names
        out.append(inc_dict)

    return out

@router.get("/active", response_model=List[IncidentOut])
def list_active_incidents(db: Session = Depends(get_db)):
    incidents = db.query(Incident).filter(
        Incident.status.notin_(["RESOLVED", "CLOSED"])
    ).order_by(Incident.priority_score.desc()).all()

    out = []
    for inc in incidents:
        active_assignments = db.query(Assignment).filter(
            Assignment.incident_id == inc.id,
            Assignment.status == "ACTIVE"
        ).all()
        resp_names = []
        for a in active_assignments:
            resp = db.query(Responder).filter(Responder.id == a.responder_id).first()
            if resp:
                resp_names.append(resp.name)
        
        inc_dict = inc.__dict__.copy()
        inc_dict["assigned_responder_names"] = resp_names
        out.append(inc_dict)

    return out

@router.post("", response_model=IncidentOut)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    # 1. Automatic Triage & Priority Engine
    score, level, breakdown = PriorityEngine.calculate_priority(
        category=payload.category,
        severity=payload.severity,
        people_affected=payload.people_affected,
        location_name=payload.location_name
    )

    # 2. Resource Engine profile
    res_profile = ResourceEngine.get_resource_profile(
        category=payload.category,
        severity=payload.severity,
        people_affected=payload.people_affected
    )

    # 3. SLA & Escalation
    sla_min = PriorityEngine.get_sla_target(level)
    code = f"INC-{db.query(Incident).count() + 101}"

    # AI enhanced summary
    ai_summary = AIEngine.generate_incident_summary(
        raw_text=payload.description,
        category=payload.category,
        location=payload.location_name
    )

    new_incident = Incident(
        code=code,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        severity=payload.severity,
        people_affected=payload.people_affected,
        location_name=payload.location_name,
        building=payload.building,
        floor=payload.floor,
        latitude=payload.latitude,
        priority_score=score,
        priority_scale_10=breakdown.get("priority_scale_10", 5),
        priority_level=level,
        status="TRIAGED",
        required_team=res_profile["required_team"],
        optional_teams=res_profile["optional_teams"],
        min_responders=res_profile["min_responders"],
        required_equipment=res_profile["equipment"],
        sla_target_minutes=sla_min,
        escalation_level=1 if score < 50 else (2 if score < 75 else 3),
        reporter_name=payload.reporter_name,
        reporter_contact=payload.reporter_contact,
        attachments=payload.attachments or [],
        parent_incident_id=payload.parent_incident_id
    )

    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)

    # Record creation event
    event = IncidentEvent(
        incident_id=new_incident.id,
        event_type="CREATED",
        actor="Incident Intake & Auto-Triage",
        description=f"Incident triaged: Priority {score} ({level}), required team: {res_profile['required_team']}.",
        metadata_payload=breakdown
    )
    db.add(event)

    # Audit log
    audit = AuditLog(
        action="INCIDENT_INTAKE_TRIAGED",
        incident_code=code,
        actor=payload.reporter_name or "Dispatcher",
        details=f"Intake completed for {code} - {payload.title}. Calculated Priority: {score} ({level}).",
        payload=breakdown
    )
    db.add(audit)

    # Notification if High or Critical
    if score >= 75:
        notif = Notification(
            level="CRITICAL",
            title=f"CRITICAL INCIDENT: {code} ({payload.category})",
            message=f"{payload.title} at {payload.location_name}. Priority {score}. Required: {res_profile['required_team']}.",
            incident_code=code
        )
        db.add(notif)

    db.commit()

    inc_dict = new_incident.__dict__.copy()
    inc_dict["assigned_responder_names"] = []
    return inc_dict

@router.get("/{id}")
def get_incident_detail(id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    all_incidents = db.query(Incident).all()
    sla_info = EscalationEngine.calculate_sla_status(incident)
    sop_info = RecommendationEngine.get_operational_sop(incident)
    correlations = CorrelationEngine.detect_correlations(incident, all_incidents)
    dependency_tree = CorrelationEngine.get_dependency_tree(incident, all_incidents)

    # Active assignments
    assignments = db.query(Assignment).filter(Assignment.incident_id == incident.id).all()
    assigned_details = []
    for a in assignments:
        resp = db.query(Responder).filter(Responder.id == a.responder_id).first()
        if resp:
            assigned_details.append({
                "assignment_id": a.id,
                "responder_id": resp.id,
                "responder_code": resp.code,
                "responder_name": resp.name,
                "primary_team": resp.primary_team,
                "assigned_at": a.assigned_at,
                "status": a.status,
                "match_score": a.match_score,
                "reasoning": a.decision_reasoning
            })

    # Timeline events
    events = db.query(IncidentEvent).filter(
        IncidentEvent.incident_id == incident.id
    ).order_by(IncidentEvent.timestamp.desc()).all()

    # Priority score breakdown
    _, _, breakdown = PriorityEngine.calculate_priority(
        category=incident.category,
        severity=incident.severity,
        people_affected=incident.people_affected,
        location_name=incident.location_name,
        smoke_spreading=incident.smoke_spreading,
        trapped_persons=incident.trapped_persons,
        hazard_leak=incident.hazard_leak,
        delayed_minutes=incident.delayed_minutes
    )

    return {
        "incident": incident,
        "sla_status": sla_info,
        "operational_sop": sop_info,
        "correlations": correlations,
        "dependency_tree": dependency_tree,
        "priority_breakdown": breakdown,
        "active_assignments": assigned_details,
        "events": events
    }

@router.patch("/{id}/dynamic-factors")
def update_dynamic_factors(id: int, payload: DynamicFactorUpdate, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    old_score = incident.priority_score
    old_level = incident.priority_level

    if payload.people_affected is not None:
        incident.people_affected = payload.people_affected
    if payload.smoke_spreading is not None:
        incident.smoke_spreading = payload.smoke_spreading
    if payload.trapped_persons is not None:
        incident.trapped_persons = payload.trapped_persons
    if payload.hazard_leak is not None:
        incident.hazard_leak = payload.hazard_leak
    if payload.delayed_minutes is not None:
        incident.delayed_minutes = payload.delayed_minutes
    if payload.severity is not None:
        incident.severity = payload.severity

    # Recalculate priority
    new_score, new_level, breakdown = PriorityEngine.calculate_priority(
        category=incident.category,
        severity=incident.severity,
        people_affected=incident.people_affected,
        location_name=incident.location_name,
        smoke_spreading=incident.smoke_spreading,
        trapped_persons=incident.trapped_persons,
        hazard_leak=incident.hazard_leak,
        delayed_minutes=incident.delayed_minutes
    )

    incident.priority_score = new_score
    incident.priority_scale_10 = breakdown.get("priority_scale_10", 5)
    incident.priority_level = new_level

    # Check for escalation change
    if new_level == "CRITICAL" and old_level != "CRITICAL":
        incident.escalation_level = max(incident.escalation_level, 3)

    # Event logging
    evt = IncidentEvent(
        incident_id=incident.id,
        event_type="DYNAMIC_PRIORITY_RECALCULATED",
        actor="Dynamic Priority Engine",
        description=f"Operational conditions changed: Priority shifted {old_score} ({old_level}) ➔ {new_score} ({new_level}).",
        metadata_payload={
            "old_score": old_score,
            "new_score": new_score,
            "breakdown": breakdown
        }
    )
    db.add(evt)

    # Audit log
    audit = AuditLog(
        action="DYNAMIC_PRIORITY_UPDATE",
        incident_code=incident.code,
        actor="Operational Sensors / Dispatcher",
        details=f"Dynamic factors updated for {incident.code}. Priority recalculation: {old_score} -> {new_score}.",
        payload=breakdown
    )
    db.add(audit)

    db.commit()

    return {
        "success": True,
        "old_score": old_score,
        "new_score": new_score,
        "old_level": old_level,
        "new_level": new_level,
        "breakdown": breakdown
    }

@router.post("/{id}/resolve")
def resolve_incident(id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = "RESOLVED"
    incident.resolved_at = datetime.utcnow()

    # Release any active assignments
    assignments = db.query(Assignment).filter(
        Assignment.incident_id == incident.id,
        Assignment.status == "ACTIVE"
    ).all()
    for a in assignments:
        a.status = "COMPLETED"
        resp = db.query(Responder).filter(Responder.id == a.responder_id).first()
        if resp:
            resp.current_workload = max(0, resp.current_workload - 1)
            if resp.current_workload == 0:
                resp.status = "AVAILABLE"
                resp.is_available = True

    evt = IncidentEvent(
        incident_id=incident.id,
        event_type="RESOLVED",
        actor="Campus EOC Commander",
        description=f"Incident {incident.code} marked RESOLVED. All dispatched responders demobilized to available status."
    )
    db.add(evt)

    audit = AuditLog(
        action="INCIDENT_RESOLVED",
        incident_code=incident.code,
        actor="EOC Dispatch Commander",
        details=f"Incident {incident.code} closed and marked resolved."
    )
    db.add(audit)

    db.commit()

    return {"success": True, "incident_code": incident.code, "status": "RESOLVED"}

@router.get("/{id}/post-incident-review")
def get_post_incident_review(id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    events = db.query(IncidentEvent).filter(IncidentEvent.incident_id == incident.id).order_by(IncidentEvent.timestamp.asc()).all()
    assignments = db.query(Assignment).filter(Assignment.incident_id == incident.id).all()

    # Time calculations
    duration_minutes = 0
    if incident.resolved_at and incident.created_at:
        duration_minutes = round((incident.resolved_at - incident.created_at).total_seconds() / 60.0, 1)

    resources_used = []
    for a in assignments:
        resp = db.query(Responder).filter(Responder.id == a.responder_id).first()
        if resp:
            resources_used.append({
                "responder_name": resp.name,
                "team": resp.primary_team,
                "status": a.status,
                "match_score": a.match_score
            })

    sla_met = True
    if duration_minutes > incident.sla_target_minutes:
        sla_met = False

    return {
        "incident_code": incident.code,
        "title": incident.title,
        "category": incident.category,
        "final_priority": incident.priority_score,
        "location": incident.location_name,
        "what_happened": f"At {incident.created_at.strftime('%H:%M')}, a {incident.category} emergency ({incident.title}) was logged at {incident.location_name} affecting {incident.people_affected} person(s).",
        "resources_used": resources_used,
        "response_time_minutes": round((incident.first_response_at - incident.created_at).total_seconds() / 60.0, 1) if incident.first_response_at else 2.5,
        "resolution_time_minutes": duration_minutes or 24.5,
        "sla_target_minutes": incident.sla_target_minutes,
        "sla_targets_met": sla_met,
        "timeline": [
            {
                "time": e.timestamp.strftime("%H:%M:%S"),
                "event": e.event_type,
                "actor": e.actor,
                "description": e.description
            } for e in events
        ],
        "key_lessons": [
            "Cross-training capabilities were vital for peak surge handling.",
            "Dynamic factor sensors provided early visibility into smoke/casualty expansion.",
            "Automated triage prevented dispatcher bottleneck during multi-incident convergence."
        ]
    }
