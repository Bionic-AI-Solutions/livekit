"""
Meeting service for business logic
"""
from sqlalchemy.orm import Session
from app.models.meeting import Meeting, MeetingType, MeetingStatus, HostType, MeetingParticipant, ParticipantStatus
from app.models.user import UserRole
from app.models.room import Room
from app.services.observability_service import create_meeting_trace
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime


def create_meeting(
    db: Session,
    title: str,
    description: Optional[str],
    meeting_type: MeetingType,
    created_by: uuid.UUID,
    host_id: Optional[uuid.UUID] = None,
    teacher_id: Optional[uuid.UUID] = None,
    scheduled_at: Optional[datetime] = None,
    duration_minutes: Optional[int] = None,
    max_participants: Optional[int] = None,
    host_type: Optional[HostType] = None,
    use_avatar_host: bool = False,
    avatar_provider: Optional[str] = None,
    avatar_config: Optional[Dict[str, Any]] = None,
    translation_enabled: bool = True,
    supported_languages: List[str] = None
) -> Meeting:
    """Create a new meeting"""
    if supported_languages is None:
        supported_languages = ["en"]
    
    # Generate unique room name
    room_name = f"room-{uuid.uuid4().hex[:12]}"
    
    meeting = Meeting(
        id=uuid.uuid4(),
        title=title,
        description=description,
        meeting_type=meeting_type,
        created_by=created_by,
        host_id=host_id,
        teacher_id=teacher_id,
        room_name=room_name,
        scheduled_at=scheduled_at,
        duration_minutes=duration_minutes,
        max_participants=max_participants,
        host_type=host_type,
        use_avatar_host=use_avatar_host if meeting_type == MeetingType.CLASSROOM else (host_type == HostType.AVATAR),
        avatar_provider=avatar_provider,
        avatar_config=avatar_config,
        translation_enabled=translation_enabled,
        supported_languages=supported_languages,
        status=MeetingStatus.SCHEDULED
    )
    
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    
    # Create Langfuse trace
    if meeting:
        trace_id = create_meeting_trace(str(meeting.id), {
            "title": title,
            "type": meeting_type.value,
            "room_name": room_name
        })
        meeting.langfuse_trace_id = trace_id
        db.commit()
        db.refresh(meeting)
    
    return meeting


def get_meeting_by_id(db: Session, meeting_id: uuid.UUID) -> Optional[Meeting]:
    """Get meeting by ID"""
    return db.query(Meeting).filter(Meeting.id == meeting_id).first()


def get_meetings(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    created_by: Optional[uuid.UUID] = None,
    status: Optional[MeetingStatus] = None
) -> List[Meeting]:
    """Get meetings with filtering"""
    query = db.query(Meeting)
    if created_by:
        query = query.filter(Meeting.created_by == created_by)
    if status:
        query = query.filter(Meeting.status == status)
    return query.offset(skip).limit(limit).all()


def update_meeting(
    db: Session,
    meeting_id: uuid.UUID,
    **kwargs
) -> Optional[Meeting]:
    """Update meeting"""
    meeting = get_meeting_by_id(db, meeting_id)
    if not meeting:
        return None
    
    for key, value in kwargs.items():
        if hasattr(meeting, key) and value is not None:
            setattr(meeting, key, value)
    
    db.commit()
    db.refresh(meeting)
    return meeting


def add_participant(
    db: Session,
    meeting_id: uuid.UUID,
    user_id: uuid.UUID,
    language_preference: str = "en"
) -> MeetingParticipant:
    """Add participant to meeting"""
    participant = MeetingParticipant(
        id=uuid.uuid4(),
        meeting_id=meeting_id,
        user_id=user_id,
        language_preference=language_preference,
        status=ParticipantStatus.INVITED
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


def get_meeting_participants(db: Session, meeting_id: uuid.UUID) -> List[MeetingParticipant]:
    """Get all participants for a meeting"""
    return db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting_id).all()

