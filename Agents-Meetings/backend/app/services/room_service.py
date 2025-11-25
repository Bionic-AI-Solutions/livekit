"""
Room service for room lifecycle management
"""
from sqlalchemy.orm import Session
from app.models.room import Room
from app.models.meeting import Meeting, MeetingStatus, HostType
from app.services.livekit_service import create_room, delete_room, dispatch_agent
from app.services.observability_service import create_meeting_trace
from typing import Optional
import uuid


async def create_room_for_meeting(db: Session, meeting: Meeting) -> Room:
    """Create a LiveKit room for a meeting"""
    # Prepare room metadata for avatar agent configuration
    import json
    room_metadata = {}
    if meeting.meeting_type.value == "classroom" or \
       (meeting.meeting_type.value == "meeting" and meeting.host_type == HostType.AVATAR):
        room_metadata = {
            "avatar_provider": meeting.avatar_provider or "bithuman",
            "avatar_config": meeting.avatar_config or {}
        }
    
    # Create room in LiveKit with metadata
    room_metadata_str = json.dumps(room_metadata) if room_metadata else None
    livekit_room = await create_room(meeting.room_name, meeting.max_participants, room_metadata_str)
    
    # Create room record
    room = Room(
        id=uuid.uuid4(),
        meeting_id=meeting.id,
        livekit_room_name=meeting.room_name,
        livekit_room_sid=livekit_room.get("sid"),
        avatar_agent_active=False,
        translation_agent_active=False
    )
    
    db.add(room)
    db.commit()
    db.refresh(room)
    
    # Create Langfuse trace for room
    trace_id = create_meeting_trace(str(meeting.id), {
        "room_name": meeting.room_name,
        "meeting_id": str(meeting.id)
    })
    room.langfuse_trace_id = trace_id
    db.commit()
    db.refresh(room)
    
    # Dispatch agents based on meeting configuration
    if meeting.translation_enabled:
        await dispatch_translation_agent(db, room)
    
    if meeting.meeting_type.value == "classroom" or \
       (meeting.meeting_type.value == "meeting" and meeting.host_type == HostType.AVATAR):
        await dispatch_avatar_agent(db, room, meeting)
    
    return room


async def dispatch_translation_agent(db: Session, room: Room) -> str:
    """Dispatch translation agent to room"""
    job_id = await dispatch_agent(room.livekit_room_name, "translation")
    room.translation_agent_active = True
    room.agent_job_id = job_id
    db.commit()
    db.refresh(room)
    return job_id


async def dispatch_avatar_agent(db: Session, room: Room, meeting: Meeting) -> str:
    """Dispatch avatar agent to room"""
    agent_config = {
        "provider": meeting.avatar_provider or "bithuman",
        "config": meeting.avatar_config or {}
    }
    job_id = await dispatch_agent(room.livekit_room_name, "avatar", agent_config)
    room.avatar_agent_active = True
    if not room.agent_job_id:
        room.agent_job_id = job_id
    db.commit()
    db.refresh(room)
    return job_id


def get_room_by_meeting_id(db: Session, meeting_id: uuid.UUID) -> Optional[Room]:
    """Get room by meeting ID"""
    return db.query(Room).filter(Room.meeting_id == meeting_id).first()


async def cleanup_room(db: Session, room: Room):
    """Cleanup room when meeting ends"""
    # Delete LiveKit room
    try:
        await delete_room(room.livekit_room_name)
    except Exception:
        pass  # Room may already be deleted
    
    # Update room status
    room.avatar_agent_active = False
    room.translation_agent_active = False
    db.commit()

