"""
Translation service for business logic
"""
from sqlalchemy.orm import Session
from app.models.translation import TranslationPreference
from app.models.meeting import Meeting
from typing import Optional, List
import uuid


def create_translation_preference(
    db: Session,
    user_id: uuid.UUID,
    meeting_id: uuid.UUID,
    target_language: str,
    source_language: Optional[str] = None,
    transcription_enabled: bool = True,
    audio_translation_enabled: bool = True
) -> TranslationPreference:
    """Create translation preference for a user in a meeting"""
    preference = TranslationPreference(
        id=uuid.uuid4(),
        user_id=user_id,
        meeting_id=meeting_id,
        source_language=source_language,
        target_language=target_language,
        transcription_enabled=transcription_enabled,
        audio_translation_enabled=audio_translation_enabled
    )
    db.add(preference)
    db.commit()
    db.refresh(preference)
    return preference


def get_translation_preference(
    db: Session,
    user_id: uuid.UUID,
    meeting_id: uuid.UUID
) -> Optional[TranslationPreference]:
    """Get translation preference for a user in a meeting"""
    return db.query(TranslationPreference).filter(
        TranslationPreference.user_id == user_id,
        TranslationPreference.meeting_id == meeting_id
    ).first()


def update_translation_preference(
    db: Session,
    preference_id: uuid.UUID,
    target_language: Optional[str] = None,
    transcription_enabled: Optional[bool] = None,
    audio_translation_enabled: Optional[bool] = None
) -> Optional[TranslationPreference]:
    """Update translation preference"""
    preference = db.query(TranslationPreference).filter(
        TranslationPreference.id == preference_id
    ).first()
    
    if not preference:
        return None
    
    if target_language is not None:
        preference.target_language = target_language
    if transcription_enabled is not None:
        preference.transcription_enabled = transcription_enabled
    if audio_translation_enabled is not None:
        preference.audio_translation_enabled = audio_translation_enabled
    
    db.commit()
    db.refresh(preference)
    return preference


def get_meeting_languages(db: Session, meeting_id: uuid.UUID) -> List[str]:
    """Get all target languages requested for a meeting"""
    preferences = db.query(TranslationPreference).filter(
        TranslationPreference.meeting_id == meeting_id
    ).all()
    return list(set([p.target_language for p in preferences]))

