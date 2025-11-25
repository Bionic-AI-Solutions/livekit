"""
Avatar agent entrypoint
"""
import logging
import os
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from livekit.agents import Agent, AgentServer, AgentSession, JobContext, cli
from livekit.plugins import openai, silero, deepgram, elevenlabs
from langfuse_setup import setup_langfuse
from providers.bithuman import BitHumanProvider
from providers.anam import AnamProvider
from providers.tavus import TavusProvider
from providers.hedra import HedraProvider
from providers.base import AvatarProvider

load_dotenv()

logger = logging.getLogger("avatar_agent")
logger.setLevel(logging.INFO)

server = AgentServer()


def get_avatar_provider(provider_name: str, config: Optional[Dict[str, Any]] = None) -> AvatarProvider:
    """Get avatar provider by name"""
    provider_name = provider_name.lower()
    
    if provider_name == "bithuman":
        return BitHumanProvider(config)
    elif provider_name == "anam":
        return AnamProvider(config)
    elif provider_name == "tavus":
        return TavusProvider(config)
    elif provider_name == "hedra":
        return HedraProvider(config)
    else:
        raise ValueError(f"Unknown avatar provider: {provider_name}")


@server.rtc_session()
async def entrypoint(ctx: JobContext):
    """Avatar agent entrypoint"""
    # Setup Langfuse
    trace_provider = setup_langfuse(
        metadata={
            "langfuse.session.id": ctx.room.name,
            "agent.type": "avatar",
        }
    )
    
    if trace_provider:
        async def flush_trace():
            trace_provider.force_flush()
        ctx.add_shutdown_callback(flush_trace)
    
    await ctx.connect()
    
    # Get avatar configuration from room metadata or environment
    avatar_provider_name = os.getenv("DEFAULT_AVATAR_PROVIDER", "bithuman")
    avatar_config = {}
    
    # Try to get config from room metadata
    if ctx.room.metadata:
        import json
        try:
            metadata = json.loads(ctx.room.metadata)
            avatar_provider_name = metadata.get("avatar_provider", avatar_provider_name)
            avatar_config = metadata.get("avatar_config", {})
        except:
            pass
    
    # Create agent session
    session = AgentSession(
        vad=silero.VAD.load(),
        stt=deepgram.STT(),
        llm=openai.LLM(model="gpt-4o"),
        tts=elevenlabs.TTS(),
    )
    
    # Get and start avatar provider
    try:
        provider = get_avatar_provider(avatar_provider_name, avatar_config)
        await provider.start(session, ctx.room, avatar_config)
        logger.info(f"Started {avatar_provider_name} avatar")
    except Exception as e:
        logger.error(f"Failed to start avatar provider: {e}")
        raise
    
    # Start agent session
    agent = Agent(
        instructions="You are a helpful meeting host. Speak clearly and engage with participants."
    )
    
    await session.start(
        agent=agent,
        room=ctx.room,
    )


if __name__ == "__main__":
    cli.run_app(server)

