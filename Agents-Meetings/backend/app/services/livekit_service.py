"""
LiveKit service for token generation and room management
"""
from livekit import api
from app.core.livekit import get_livekit_client
from app.core.config import settings
from typing import Optional, Dict
import uuid


def generate_access_token(
    room_name: str,
    participant_identity: str,
    participant_name: str,
    language: Optional[str] = None,
    can_publish: bool = True,
    can_subscribe: bool = True,
    can_publish_data: bool = True
) -> str:
    """Generate LiveKit access token"""
    client = get_livekit_client()
    
    grant = api.VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=can_publish,
        can_subscribe=can_subscribe,
        can_publish_data=can_publish_data,
    )
    
    token = api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET) \
        .with_identity(participant_identity) \
        .with_name(participant_name) \
        .with_grants(grant)
    
    # Add language as attribute
    if language:
        token.with_metadata({"language": language})
    
    return token.to_jwt()


def create_room(room_name: str, max_participants: Optional[int] = None) -> Dict:
    """Create a LiveKit room"""
    client = get_livekit_client()
    
    room_options = api.CreateRoomRequest(name=room_name)
    if max_participants:
        room_options.max_participants = max_participants
    
    room = client.room.create_room(room_options)
    return {
        "name": room.name,
        "sid": room.sid,
        "empty_timeout": room.empty_timeout,
        "max_participants": room.max_participants,
    }


def delete_room(room_name: str):
    """Delete a LiveKit room"""
    client = get_livekit_client()
    client.room.delete_room(api.DeleteRoomRequest(room=room_name))


def list_rooms() -> list:
    """List all LiveKit rooms"""
    client = get_livekit_client()
    rooms = client.room.list_rooms()
    return [{"name": r.name, "sid": r.sid} for r in rooms.rooms]


def dispatch_agent(
    room_name: str,
    agent_type: str,
    agent_config: Optional[Dict] = None
) -> str:
    """Dispatch an agent to a room"""
    client = get_livekit_client()
    
    # Create agent dispatch request
    # Note: This is a simplified version - actual implementation depends on LiveKit agent dispatch API
    job_id = str(uuid.uuid4())
    
    # In a real implementation, you would use the agent dispatch API
    # For now, return a job ID
    return job_id

