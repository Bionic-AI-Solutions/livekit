"""
Hedra avatar provider implementation
"""
from typing import Optional, Dict, Any
from PIL import Image
from livekit.agents.voice import AgentSession
from livekit import rtc
from livekit.plugins import hedra
from agents.avatar_agent.providers.base import AvatarProvider
import os


class HedraProvider(AvatarProvider):
    """Hedra avatar provider"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.avatar_session: Optional[hedra.AvatarSession] = None
    
    async def start(
        self,
        agent_session: AgentSession,
        room: rtc.Room,
        config: Optional[Dict[str, Any]] = None
    ) -> None:
        """Start Hedra avatar session"""
        provider_config = config or self.config
        
        avatar_image_path = provider_config.get("avatar_image")
        avatar_participant_identity = provider_config.get("avatar_participant_identity", "avatar")
        
        avatar_image = None
        if avatar_image_path:
            if os.path.exists(avatar_image_path):
                avatar_image = Image.open(avatar_image_path)
            elif avatar_image_path.startswith("http"):
                # Download image if URL
                import requests
                response = requests.get(avatar_image_path)
                from io import BytesIO
                avatar_image = Image.open(BytesIO(response.content))
        
        if not avatar_image:
            raise ValueError("Hedra avatar_image is required")
        
        self.avatar_session = hedra.AvatarSession(
            avatar_participant_identity=avatar_participant_identity,
            avatar_image=avatar_image
        )
        await self.avatar_session.start(agent_session, room)
    
    async def stop(self) -> None:
        """Stop Hedra avatar session"""
        if self.avatar_session:
            # Cleanup if needed
            pass

