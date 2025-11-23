"""
Anam avatar provider implementation
"""
from typing import Optional, Dict, Any
from livekit.agents.voice import AgentSession
from livekit import rtc
from livekit.plugins import anam
from agents.avatar_agent.providers.base import AvatarProvider
import os


class AnamProvider(AvatarProvider):
    """Anam avatar provider"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.avatar_session: Optional[anam.AvatarSession] = None
    
    async def start(
        self,
        agent_session: AgentSession,
        room: rtc.Room,
        config: Optional[Dict[str, Any]] = None
    ) -> None:
        """Start Anam avatar session"""
        provider_config = config or self.config
        
        avatar_id = provider_config.get("avatar_id") or os.getenv("ANAM_AVATAR_ID")
        api_url = provider_config.get("api_url") or os.getenv("ANAM_API_URL")
        persona_name = provider_config.get("persona_name", "Agent")
        
        if not avatar_id:
            raise ValueError("ANAM_AVATAR_ID is required")
        
        self.avatar_session = anam.AvatarSession(
            personaConfig={"name": persona_name, "avatarId": avatar_id},
            apiUrl=api_url,
        )
        await self.avatar_session.start(agent_session, room)
    
    async def stop(self) -> None:
        """Stop Anam avatar session"""
        if self.avatar_session:
            # Cleanup if needed
            pass

