"""
LiveKit service for token generation and room management
"""
from livekit import api
from app.core.livekit import get_livekit_client
from app.core.config import settings
from typing import Optional, Dict
import uuid
import json


def generate_access_token(
    room_name: str,
    participant_identity: str,
    participant_name: str,
    language: Optional[str] = None,
    can_publish: bool = True,
    can_subscribe: bool = True,
    can_publish_data: bool = True,
    can_update_own_metadata: bool = True
) -> str:
    """Generate LiveKit access token"""
    client = get_livekit_client()
    
    grant = api.VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=can_publish,
        can_subscribe=can_subscribe,
        can_publish_data=can_publish_data,
        can_update_own_metadata=can_update_own_metadata,
    )
    
    token = api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET) \
        .with_identity(participant_identity) \
        .with_name(participant_name) \
        .with_grants(grant)
    
    # Add language as metadata (must be JSON string, not dict)
    if language:
        token.with_metadata(json.dumps({"language": language}))
    
    return token.to_jwt()


async def create_room(room_name: str, max_participants: Optional[int] = None, metadata: Optional[str] = None) -> Dict:
    """Create a LiveKit room"""
    client = get_livekit_client()
    
    room_options = api.CreateRoomRequest(name=room_name)
    if max_participants:
        room_options.max_participants = max_participants
    if metadata:
        room_options.metadata = metadata
    
    room = await client.room.create_room(room_options)
    return {
        "name": room.name,
        "sid": room.sid,
        "empty_timeout": room.empty_timeout,
        "max_participants": room.max_participants,
    }


async def delete_room(room_name: str):
    """Delete a LiveKit room"""
    client = get_livekit_client()
    await client.room.delete_room(api.DeleteRoomRequest(room=room_name))


async def list_rooms() -> list:
    """List all LiveKit rooms"""
    client = get_livekit_client()
    rooms = await client.room.list_rooms()
    return [{"name": r.name, "sid": r.sid} for r in rooms.rooms]


async def get_room_info(room_name: str) -> Optional[Dict]:
    """Get room information including participant count"""
    client = get_livekit_client()
    try:
        room = await client.room.list_rooms(names=[room_name])
        if room.rooms and len(room.rooms) > 0:
            r = room.rooms[0]
            # Room object should have num_participants field
            num_participants = getattr(r, 'num_participants', 0)
            return {
                "name": r.name,
                "sid": r.sid,
                "num_participants": num_participants,
                "empty_timeout": r.empty_timeout,
                "max_participants": r.max_participants,
            }
        return None
    except Exception as e:
        print(f"Error getting room info: {e}")
        return None


async def dispatch_agent(
    room_name: str,
    agent_type: str,
    agent_config: Optional[Dict] = None
) -> str:
    """Dispatch an agent to a room using LiveKit agent dispatch API"""
    client = get_livekit_client()
    
    # Map agent types to agent names (must match agent_name in agent decorator)
    agent_name_map = {
        "avatar": "avatar",
        "translation": "translator",
        "room_manager": "room_manager"
    }
    
    agent_name = agent_name_map.get(agent_type, agent_type)
    
    # Prepare metadata for the agent (as JSON string)
    metadata = ""
    if agent_config:
        import json
        metadata = json.dumps(agent_config)
    
    try:
        # Create agent dispatch using LiveKit API
        # This will trigger the agent to join the room automatically
        dispatch = await client.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(
                agent_name=agent_name,
                room=room_name,
                metadata=metadata
            )
        )
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Successfully dispatched {agent_type} agent ({agent_name}) to room {room_name}, dispatch_id: {dispatch.id}")
        
        return dispatch.id
    except Exception as e:
        # Log error but don't fail - agent might still connect via other means
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to dispatch {agent_type} agent ({agent_name}) to room {room_name}: {e}", exc_info=True)
        # Return a placeholder job ID for tracking
        return str(uuid.uuid4())

