"""
Participant management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.user import User, UserRole
from app.models.meeting import Meeting, MeetingParticipant, ParticipantStatus
from app.services.meeting_service import (
    get_meeting_by_id, get_meeting_participants, add_participant
)
from app.services.user_service import get_user_by_id, get_users
import uuid

router = APIRouter()


class ParticipantResponse(BaseModel):
    id: str
    user_id: str
    user_email: str
    user_name: str
    language_preference: str
    status: str
    joined_at: Optional[str]
    left_at: Optional[str]

    class Config:
        from_attributes = True


class AddParticipantRequest(BaseModel):
    user_id: str
    language_preference: str = "en"


@router.get("/meeting/{meeting_id}/participants", response_model=List[ParticipantResponse])
async def list_meeting_participants(
    meeting_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List participants for a meeting"""
    meeting = get_meeting_by_id(db, uuid.UUID(meeting_id))
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    # Check permissions - admins can see all, others only their own meetings
    if current_user.role != UserRole.ADMIN and meeting.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this meeting's participants"
        )
    
    participants = get_meeting_participants(db, meeting.id)
    result = []
    for p in participants:
        user = get_user_by_id(db, p.user_id)
        result.append(ParticipantResponse(
            id=str(p.id),
            user_id=str(p.user_id),
            user_email=user.email if user else "Unknown",
            user_name=user.full_name if user else "Unknown",
            language_preference=p.language_preference,
            status=p.status.value,
            joined_at=p.joined_at.isoformat() if p.joined_at else None,
            left_at=p.left_at.isoformat() if p.left_at else None
        ))
    return result


@router.post("/meeting/{meeting_id}/participants", response_model=ParticipantResponse, status_code=status.HTTP_201_CREATED)
async def add_meeting_participant(
    meeting_id: str,
    participant_data: AddParticipantRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Add a participant to a meeting (Admin only)"""
    meeting = get_meeting_by_id(db, uuid.UUID(meeting_id))
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    user = get_user_by_id(db, uuid.UUID(participant_data.user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if participant already exists
    existing = db.query(MeetingParticipant).filter(
        MeetingParticipant.meeting_id == meeting.id,
        MeetingParticipant.user_id == user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a participant in this meeting"
        )
    
    participant = add_participant(
        db=db,
        meeting_id=meeting.id,
        user_id=user.id,
        language_preference=participant_data.language_preference
    )
    
    return ParticipantResponse(
        id=str(participant.id),
        user_id=str(participant.user_id),
        user_email=user.email,
        user_name=user.full_name,
        language_preference=participant.language_preference,
        status=participant.status.value,
        joined_at=participant.joined_at.isoformat() if participant.joined_at else None,
        left_at=participant.left_at.isoformat() if participant.left_at else None
    )


@router.delete("/meeting/{meeting_id}/participants/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_meeting_participant(
    meeting_id: str,
    participant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Remove a participant from a meeting (Admin only)"""
    participant = db.query(MeetingParticipant).filter(
        MeetingParticipant.id == uuid.UUID(participant_id),
        MeetingParticipant.meeting_id == uuid.UUID(meeting_id)
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found"
        )
    
    db.delete(participant)
    db.commit()
    return None






