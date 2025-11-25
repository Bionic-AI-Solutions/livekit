"""
Meeting management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user, require_teacher_or_host
from app.models.user import User, UserRole
from app.models.meeting import Meeting, MeetingType, MeetingStatus, HostType
from app.services.meeting_service import (
    create_meeting, get_meeting_by_id, get_meetings, update_meeting, add_participant
)
from app.services.observability_service import create_meeting_trace
import uuid

router = APIRouter()


class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    meeting_type: MeetingType
    host_id: Optional[str] = None
    teacher_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    max_participants: Optional[int] = None
    host_type: Optional[HostType] = None  # For meetings: human or avatar
    avatar_provider: Optional[str] = None
    avatar_config: Optional[Dict[str, Any]] = None
    translation_enabled: bool = True
    supported_languages: List[str] = ["en"]


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    max_participants: Optional[int] = None
    status: Optional[MeetingStatus] = None
    translation_enabled: Optional[bool] = None
    supported_languages: Optional[List[str]] = None


class MeetingResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    meeting_type: str
    room_name: str
    host_type: Optional[str]
    use_avatar_host: bool
    avatar_provider: Optional[str]
    translation_enabled: bool
    supported_languages: List[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
async def create_meeting_endpoint(
    meeting_data: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_host())
):
    """Create a new meeting (Teacher or Host only)"""
    # Validate role requirements
    if meeting_data.meeting_type == MeetingType.CLASSROOM:
        if current_user.role != UserRole.TEACHER and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only teachers can create classroom meetings"
            )
        # Classrooms always use avatar
        meeting_data.host_type = HostType.AVATAR
        meeting_data.avatar_provider = meeting_data.avatar_provider or "bithuman"
    
    elif meeting_data.meeting_type == MeetingType.MEETING:
        if current_user.role != UserRole.HOST and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only hosts can create meetings"
            )
        # Meetings can have human or avatar host
        if not meeting_data.host_type:
            meeting_data.host_type = HostType.HUMAN
    
    host_id = None
    teacher_id = None
    if meeting_data.host_id:
        host_id = uuid.UUID(meeting_data.host_id)
    if meeting_data.teacher_id:
        teacher_id = uuid.UUID(meeting_data.teacher_id)
    elif meeting_data.meeting_type == MeetingType.CLASSROOM:
        teacher_id = current_user.id
    
    meeting = create_meeting(
        db=db,
        title=meeting_data.title,
        description=meeting_data.description,
        meeting_type=meeting_data.meeting_type,
        created_by=current_user.id,
        host_id=host_id,
        teacher_id=teacher_id,
        scheduled_at=meeting_data.scheduled_at,
        duration_minutes=meeting_data.duration_minutes,
        max_participants=meeting_data.max_participants,
        host_type=meeting_data.host_type,
        avatar_provider=meeting_data.avatar_provider,
        avatar_config=meeting_data.avatar_config,
        translation_enabled=meeting_data.translation_enabled,
        supported_languages=meeting_data.supported_languages
    )
    
    return MeetingResponse(
        id=str(meeting.id),
        title=meeting.title,
        description=meeting.description,
        meeting_type=meeting.meeting_type.value,
        room_name=meeting.room_name,
        host_type=meeting.host_type.value if meeting.host_type else None,
        use_avatar_host=meeting.use_avatar_host,
        avatar_provider=meeting.avatar_provider,
        translation_enabled=meeting.translation_enabled,
        supported_languages=meeting.supported_languages,
        status=meeting.status.value,
        created_at=meeting.created_at
    )


@router.get("/", response_model=List[MeetingResponse])
async def list_meetings(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[MeetingStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List meetings (filtered by user role)"""
    # Admins see all, others see only their own
    created_by = None if current_user.role == UserRole.ADMIN else current_user.id
    
    meetings = get_meetings(
        db=db,
        skip=skip,
        limit=limit,
        created_by=created_by,
        status=status_filter
    )
    
    return [
        MeetingResponse(
            id=str(m.id),
            title=m.title,
            description=m.description,
            meeting_type=m.meeting_type.value,
            room_name=m.room_name,
            host_type=m.host_type.value if m.host_type else None,
            use_avatar_host=m.use_avatar_host,
            avatar_provider=m.avatar_provider,
            translation_enabled=m.translation_enabled,
            supported_languages=m.supported_languages,
            status=m.status.value,
            created_at=m.created_at
        )
        for m in meetings
    ]


@router.get("/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(
    meeting_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get meeting by ID"""
    meeting = get_meeting_by_id(db, uuid.UUID(meeting_id))
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and meeting.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this meeting"
        )
    
    return MeetingResponse(
        id=str(meeting.id),
        title=meeting.title,
        description=meeting.description,
        meeting_type=meeting.meeting_type.value,
        room_name=meeting.room_name,
        host_type=meeting.host_type.value if meeting.host_type else None,
        use_avatar_host=meeting.use_avatar_host,
        avatar_provider=meeting.avatar_provider,
        translation_enabled=meeting.translation_enabled,
        supported_languages=meeting.supported_languages,
        status=meeting.status.value,
        created_at=meeting.created_at
    )


@router.put("/{meeting_id}", response_model=MeetingResponse)
async def update_meeting_endpoint(
    meeting_id: str,
    meeting_data: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update meeting"""
    meeting = get_meeting_by_id(db, uuid.UUID(meeting_id))
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and meeting.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this meeting"
        )
    
    update_data = meeting_data.dict(exclude_unset=True)
    updated_meeting = update_meeting(db, uuid.UUID(meeting_id), **update_data)
    
    return MeetingResponse(
        id=str(updated_meeting.id),
        title=updated_meeting.title,
        description=updated_meeting.description,
        meeting_type=updated_meeting.meeting_type.value,
        room_name=updated_meeting.room_name,
        host_type=updated_meeting.host_type.value if updated_meeting.host_type else None,
        use_avatar_host=updated_meeting.use_avatar_host,
        avatar_provider=updated_meeting.avatar_provider,
        translation_enabled=updated_meeting.translation_enabled,
        supported_languages=updated_meeting.supported_languages,
        status=updated_meeting.status.value,
        created_at=updated_meeting.created_at
    )


@router.post("/{meeting_id}/end", response_model=MeetingResponse)
async def end_meeting_endpoint(
    meeting_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """End an active meeting"""
    from app.services.room_service import get_room_by_meeting_id, cleanup_room
    
    meeting = get_meeting_by_id(db, uuid.UUID(meeting_id))
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    # Check permissions - only admin or meeting creator can end
    if current_user.role != UserRole.ADMIN and meeting.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to end this meeting"
        )
    
    # Only end if meeting is active
    if meeting.status != MeetingStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Meeting is not active (current status: {meeting.status.value})"
        )
    
    # Cleanup room if it exists
    room = get_room_by_meeting_id(db, meeting.id)
    if room:
        await cleanup_room(db, room)
    
    # Update meeting status
    meeting.status = MeetingStatus.ENDED
    db.commit()
    db.refresh(meeting)
    
    return MeetingResponse(
        id=str(meeting.id),
        title=meeting.title,
        description=meeting.description,
        meeting_type=meeting.meeting_type.value,
        room_name=meeting.room_name,
        host_type=meeting.host_type.value if meeting.host_type else None,
        use_avatar_host=meeting.use_avatar_host,
        avatar_provider=meeting.avatar_provider,
        translation_enabled=meeting.translation_enabled,
        supported_languages=meeting.supported_languages,
        status=meeting.status.value,
        created_at=meeting.created_at
    )

