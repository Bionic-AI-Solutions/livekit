"""
Tavus avatar provider implementation
"""
from typing import Optional, Dict, Any
from livekit.agents.voice import AgentSession
from livekit import rtc
from livekit.plugins import tavus
from providers.base import AvatarProvider
import os


class TavusProvider(AvatarProvider):
    """Tavus avatar provider"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.avatar_session: Optional[tavus.AvatarSession] = None
    
    async def start(
        self,
        agent_session: AgentSession,
        room: rtc.Room,
        config: Optional[Dict[str, Any]] = None
    ) -> None:
        """Start Tavus avatar session"""
        provider_config = config or self.config
        
        persona_id = provider_config.get("persona_id")
        replica_id = provider_config.get("replica_id")
        
        if not persona_id or not replica_id:
            raise ValueError("Tavus persona_id and replica_id are required")
        
        self.avatar_session = tavus.AvatarSession(
            persona_id=persona_id,
            replica_id=replica_id,
        )
        await self.avatar_session.start(agent_session, room)
    
    async def stop(self) -> None:
        """Stop Tavus avatar session"""
        if self.avatar_session:
            # Cleanup if needed
            pass

