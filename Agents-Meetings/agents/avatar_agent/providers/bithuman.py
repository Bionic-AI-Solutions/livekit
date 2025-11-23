"""
BitHuman avatar provider implementation
"""
from typing import Optional, Dict, Any
from livekit.agents.voice import AgentSession
from livekit import rtc
from livekit.plugins import bithuman
from agents.avatar_agent.providers.base import AvatarProvider
import os


class BitHumanProvider(AvatarProvider):
    """BitHuman avatar provider"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.avatar_session: Optional[bithuman.AvatarSession] = None
    
    async def start(
        self,
        agent_session: AgentSession,
        room: rtc.Room,
        config: Optional[Dict[str, Any]] = None
    ) -> None:
        """Start BitHuman avatar session"""
        provider_config = config or self.config
        
        # BitHuman configuration
        api_secret = os.getenv("BITHUMAN_API_SECRET")
        api_token = os.getenv("BITHUMAN_API_TOKEN")
        model_path = os.getenv("BITHUMAN_MODEL_PATH")
        model = provider_config.get("model", "essence")
        avatar_id = provider_config.get("avatar_id")
        avatar_image = provider_config.get("avatar_image")
        
        avatar_options = {}
        if model_path:
            avatar_options["model_path"] = model_path
        if api_secret:
            avatar_options["api_secret"] = api_secret
        if api_token:
            avatar_options["api_token"] = api_token
        if avatar_id:
            avatar_options["avatar_id"] = avatar_id
        if avatar_image:
            avatar_options["avatar_image"] = avatar_image
        if model:
            avatar_options["model"] = model
        
        self.avatar_session = bithuman.AvatarSession(**avatar_options)
        await self.avatar_session.start(agent_session, room)
    
    async def stop(self) -> None:
        """Stop BitHuman avatar session"""
        if self.avatar_session:
            # Cleanup if needed
            pass

