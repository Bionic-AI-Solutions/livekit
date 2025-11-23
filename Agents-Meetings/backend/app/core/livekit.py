"""
LiveKit client setup and utilities
"""
from livekit import api
from app.core.config import settings

# Initialize LiveKit API client
livekit_client = api.LiveKitAPI(
    url=settings.LIVEKIT_URL,
    api_key=settings.LIVEKIT_API_KEY,
    api_secret=settings.LIVEKIT_API_SECRET,
)


def get_livekit_client() -> api.LiveKitAPI:
    """Get LiveKit API client"""
    return livekit_client

