from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from datetime import datetime
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    action = Column(String(100), nullable=False) # e.g. "INCIDENT_CREATED", "PRIORITY_RECALCULATED", "ALLOCATION_OPTIMIZED", "REALLOCATION_EXECUTED"
    actor = Column(String(100), default="Campus Operations Center")
    incident_code = Column(String(50), nullable=True)
    details = Column(Text, nullable=False)
    payload = Column(JSON, default=dict)
