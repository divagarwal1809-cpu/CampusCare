from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.audit import AuditLog

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("/logs")
def get_audit_logs(
    limit: int = 50,
    incident_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if incident_code:
        query = query.filter(AuditLog.incident_code == incident_code)
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

    return [
        {
            "id": l.id,
            "timestamp": l.timestamp.strftime("%H:%M:%S"),
            "full_time": l.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "action": l.action,
            "actor": l.actor,
            "incident_code": l.incident_code,
            "details": l.details,
            "payload": l.payload
        }
        for l in logs
    ]
