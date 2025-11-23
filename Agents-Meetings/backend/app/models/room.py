"""
Room model
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.id"), nullable=False, unique=True)
    livekit_room_name = Column(String, unique=True, nullable=False, index=True)
    livekit_room_sid = Column(String, nullable=True)
    agent_job_id = Column(String, nullable=True)
    avatar_agent_active = Column(Boolean, default=False)
    translation_agent_active = Column(Boolean, default=False)
    langfuse_trace_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    meeting = relationship("Meeting", back_populates="room")

