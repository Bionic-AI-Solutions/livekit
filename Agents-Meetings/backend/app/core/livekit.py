"""
LiveKit client setup and utilities
"""
from livekit import api
from app.core.config import settings

# Lazy initialization of LiveKit API client
_livekit_client: api.LiveKitAPI | None = None


def get_livekit_client() -> api.LiveKitAPI:
    """Get LiveKit API client (lazy initialization)"""
    global _livekit_client
    if _livekit_client is None:
        if not settings.LIVEKIT_API_KEY or not settings.LIVEKIT_API_SECRET:
            raise ValueError("LiveKit API key and secret must be set")
        _livekit_client = api.LiveKitAPI(
            url=settings.LIVEKIT_URL,
            api_key=settings.LIVEKIT_API_KEY,
            api_secret=settings.LIVEKIT_API_SECRET,
        )
    return _livekit_client

