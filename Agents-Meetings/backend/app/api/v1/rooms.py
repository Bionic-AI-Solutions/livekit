"""
Room management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.meeting import Meeting, MeetingStatus
from app.services.room_service import create_room_for_meeting, get_room_by_meeting_id
from app.services.livekit_service import generate_access_token
import uuid

router = APIRouter()


class RoomTokenRequest(BaseModel):
    meeting_id: str
    language: str = "en"


class RoomTokenResponse(BaseModel):
    token: str
    room_name: str
    ws_url: str


class RoomResponse(BaseModel):
    id: str
    meeting_id: str
    livekit_room_name: str
    livekit_room_sid: Optional[str]
    avatar_agent_active: bool
    translation_agent_active: bool
    num_participants: int = 0

    class Config:
        from_attributes = True


@router.post("/token", response_model=RoomTokenResponse)
async def get_room_token(
    token_request: RoomTokenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate LiveKit access token for joining a room"""
    from app.services.meeting_service import get_meeting_by_id
    from app.core.config import settings
    
    meeting = get_meeting_by_id(db, uuid.UUID(token_request.meeting_id))
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    # Get or create room
    room = get_room_by_meeting_id(db, meeting.id)
    if not room:
        # Create room if meeting is starting
        if meeting.status == MeetingStatus.SCHEDULED:
            meeting.status = MeetingStatus.ACTIVE
            db.commit()
        room = await create_room_for_meeting(db, meeting)
    
    # Generate token
    token = generate_access_token(
        room_name=room.livekit_room_name,
        participant_identity=str(current_user.id),
        participant_name=current_user.full_name,
        language=token_request.language,
        can_publish=True,
        can_subscribe=True
    )
    
    return RoomTokenResponse(
        token=token,
        room_name=room.livekit_room_name,
        ws_url=settings.LIVEKIT_WS_URL
    )


@router.get("/meeting/{meeting_id}", response_model=RoomResponse)
async def get_room_by_meeting(
    meeting_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get room information for a meeting"""
    from app.services.meeting_service import get_meeting_by_id
    from app.services.livekit_service import get_room_info
    
    meeting = get_meeting_by_id(db, uuid.UUID(meeting_id))
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    room = get_room_by_meeting_id(db, meeting.id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found for this meeting"
        )
    
    # Get current participant count from LiveKit
    room_info = await get_room_info(room.livekit_room_name)
    num_participants = room_info.get("num_participants", 0) if room_info else 0
    
    return RoomResponse(
        id=str(room.id),
        meeting_id=str(room.meeting_id),
        livekit_room_name=room.livekit_room_name,
        livekit_room_sid=room.livekit_room_sid,
        avatar_agent_active=room.avatar_agent_active,
        translation_agent_active=room.translation_agent_active,
        num_participants=num_participants
    )

