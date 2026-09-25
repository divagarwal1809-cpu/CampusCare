from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, index=True) # e.g. "INC-101"
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False) # "Medical", "Fire", "Security", "Technical", "Hazmat"
    severity = Column(Integer, default=3) # 1 to 5 scale
    people_affected = Column(Integer, default=1)
    
    # Campus Location
    location_name = Column(String(100), nullable=False) # e.g. "Block C Science Lab", "Hostel Zone B"
    building = Column(String(80), nullable=True)
    floor = Column(String(30), nullable=True)
    latitude = Column(Float, nullable=False, default=12.9716) # Centered on campus
    longitude = Column(Float, nullable=False, default=77.5946)
    
    # Operational Priority & Triage
    priority_score = Column(Float, default=50.0) # 0 to 100
    priority_scale_10 = Column(Integer, default=5) # 1 to 10 priority scale
    priority_level = Column(String(20), default="MEDIUM") # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    status = Column(String(30), default="TRIAGED") # "REPORTED", "TRIAGED", "ASSIGNED", "DISPATCHED", "ON_SCENE", "RESOLVED", "CLOSED"
    
    # Dynamic Factors
    smoke_spreading = Column(Boolean, default=False)
    trapped_persons = Column(Boolean, default=False)
    hazard_leak = Column(Boolean, default=False)
    delayed_minutes = Column(Integer, default=0)
    
    # Resource Requirements (JSON)
    required_team = Column(String(50), default="General")
    optional_teams = Column(JSON, default=list) # e.g. ["Security", "Medical"]
    min_responders = Column(Integer, default=1)
    required_equipment = Column(JSON, default=list)
    
    # Escalation & SLA
    escalation_level = Column(Integer, default=1) # 1: Normal, 2: Supervisor, 3: Campus EOC, 4: External Services
    sla_target_minutes = Column(Integer, default=15)
    created_at = Column(DateTime, default=datetime.utcnow)
    first_response_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Hierarchy & Cascading
    parent_incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    reporter_name = Column(String(100), default="Campus Security Patrol")
    reporter_contact = Column(String(100), default="ext-4401")
    attachments = Column(JSON, default=list)

    # Relationships
    children = relationship("Incident", backref="parent", remote_side=[id])
    assignments = relationship("Assignment", back_populates="incident", cascade="all, delete-orphan")
    events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan")

class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    event_type = Column(String(50), nullable=False) # "CREATED", "PRIORITY_UPDATE", "ASSIGNED", "REALLOCATED", "ESCALATED", "RESOLVED"
    actor = Column(String(100), default="CampusCare Engine")
    description = Column(Text, nullable=False)
    metadata_payload = Column(JSON, default=dict)

    incident = relationship("Incident", back_populates="events")
