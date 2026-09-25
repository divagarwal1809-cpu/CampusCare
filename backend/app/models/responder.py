from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Responder(Base):
    __tablename__ = "responders"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, index=True) # e.g. "MED-1", "SEC-2", "FIRE-1", "TEAM-D"
    name = Column(String(100), nullable=False) # e.g. "Medical Team 1", "Cross-trained Team D"
    primary_team = Column(String(50), nullable=False) # "Medical", "Fire", "Security", "Technical", "General"
    
    # Skills list e.g. ["medical", "first_aid", "security", "crowd_control"]
    skills = Column(JSON, default=list)
    
    # Live GPS coordinates on campus
    latitude = Column(Float, nullable=False, default=12.9716)
    longitude = Column(Float, nullable=False, default=77.5946)
    location_label = Column(String(100), default="Station Alpha")
    
    # Operational Status
    status = Column(String(30), default="AVAILABLE") # "AVAILABLE", "ASSIGNED", "DISPATCHED", "ON_SCENE", "UNAVAILABLE"
    is_available = Column(Boolean, default=True)
    current_workload = Column(Integer, default=0)
    max_workload = Column(Integer, default=2)
    shift = Column(String(30), default="Night Shift (Alpha)")
    avg_response_time_min = Column(Float, default=3.5)
    
    assignments = relationship("Assignment", back_populates="responder")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    responder_id = Column(Integer, ForeignKey("responders.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(30), default="ACTIVE") # "ACTIVE", "REALLOCATED", "COMPLETED", "CANCELLED"
    match_score = Column(Float, default=90.0)
    decision_reasoning = Column(JSON, default=list) # List of explanation strings
    is_reallocated = Column(Boolean, default=False)
    reallocated_to_incident_id = Column(Integer, nullable=True)

    incident = relationship("Incident", back_populates="assignments")
    responder = relationship("Responder", back_populates="assignments")
