"""
Meeting and participant models
"""
import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class MeetingType(str, Enum):
    CLASSROOM = "classroom"
    MEETING = "meeting"


class MeetingStatus(str, Enum):
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    ENDED = "ended"
    CANCELLED = "cancelled"


class HostType(str, Enum):
    HUMAN = "human"
    AVATAR = "avatar"


class ParticipantStatus(str, Enum):
    INVITED = "invited"
    JOINED = "joined"
    LEFT = "left"


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    meeting_type = Column(SQLEnum(MeetingType), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    host_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    room_name = Column(String, unique=True, nullable=False, index=True)
    scheduled_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    max_participants = Column(Integer, nullable=True)
    host_type = Column(SQLEnum(HostType), nullable=True)  # For meetings: human or avatar
    use_avatar_host = Column(Boolean, default=False)  # For classrooms: always true
    avatar_provider = Column(String, nullable=True)
    avatar_config = Column(JSONB, nullable=True)
    translation_enabled = Column(Boolean, default=True)
    supported_languages = Column(JSONB, default=["en"])
    status = Column(SQLEnum(MeetingStatus), default=MeetingStatus.SCHEDULED)
    langfuse_trace_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    participants = relationship("MeetingParticipant", back_populates="meeting", cascade="all, delete-orphan")
    room = relationship("Room", back_populates="meeting", uselist=False, cascade="all, delete-orphan")


class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    language_preference = Column(String, default="en")
    joined_at = Column(DateTime, nullable=True)
    left_at = Column(DateTime, nullable=True)
    status = Column(SQLEnum(ParticipantStatus), default=ParticipantStatus.INVITED)
    langfuse_span_id = Column(String, nullable=True)

    # Relationships
    meeting = relationship("Meeting", back_populates="participants")

