from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from datetime import datetime
from app.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    level = Column(String(20), default="INFO") # "INFO", "WARNING", "CRITICAL", "ESCALATION"
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    incident_code = Column(String(50), nullable=True)
    is_read = Column(Boolean, default=False)
