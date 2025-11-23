"""
Base avatar provider interface
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from livekit.agents.voice import AgentSession
from livekit import rtc


class AvatarProvider(ABC):
    """Base class for avatar providers"""
    
    @abstractmethod
    async def start(
        self,
        agent_session: AgentSession,
        room: rtc.Room,
        config: Optional[Dict[str, Any]] = None
    ) -> None:
        """Start the avatar session"""
        pass
    
    @abstractmethod
    async def stop(self) -> None:
        """Stop the avatar session"""
        pass

