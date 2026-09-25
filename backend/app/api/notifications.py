from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("")
def list_notifications(unread_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(Notification)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    notifications = query.order_by(Notification.timestamp.desc()).limit(30).all()
    
    return [
        {
            "id": n.id,
            "timestamp": n.timestamp.strftime("%H:%M:%S"),
            "level": n.level,
            "title": n.title,
            "message": n.message,
            "incident_code": n.incident_code,
            "is_read": n.is_read
        }
        for n in notifications
    ]

@router.post("/{id}/read")
def mark_read(id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"success": True}
