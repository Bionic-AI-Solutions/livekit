"""
Translation preferences model
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class TranslationPreference(Base):
    __tablename__ = "translation_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.id"), nullable=False)
    source_language = Column(String, nullable=True)
    target_language = Column(String, nullable=False, default="en")
    transcription_enabled = Column(Boolean, default=True)
    audio_translation_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

