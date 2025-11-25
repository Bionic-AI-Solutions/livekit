"""
Avatar agent entrypoint
"""
import logging
import os
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from livekit.agents import Agent, AgentServer, AgentSession, JobContext, JobRequest, cli
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


async def request_fnc(req: JobRequest):
    await req.accept(
        name="avatar",
        identity="avatar-host",
    )


@server.rtc_session(agent_name="avatar", on_request=request_fnc)
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
    
    # Get avatar configuration from dispatch metadata, room metadata, or environment
    avatar_provider_name = os.getenv("DEFAULT_AVATAR_PROVIDER", "bithuman")
    avatar_config = {}
    
    import json
    
    # First, try to get config from dispatch metadata (JobRequest)
    # This is the primary source as it's passed directly when dispatching the agent
    if hasattr(ctx, 'job') and ctx.job and ctx.job.metadata:
        try:
            dispatch_metadata = json.loads(ctx.job.metadata)
            if isinstance(dispatch_metadata, dict):
                provider = dispatch_metadata.get("provider")
                config = dispatch_metadata.get("config", {})
                if provider:
                    avatar_provider_name = provider
                if config:
                    avatar_config = config
                logger.info(f"Loaded avatar config from dispatch metadata: provider={avatar_provider_name}, config={avatar_config}")
        except Exception as e:
            logger.warning(f"Failed to parse dispatch metadata: {e}")
    
    # Fallback to room metadata if dispatch metadata not available
    if not avatar_config and ctx.room.metadata:
        try:
            metadata = json.loads(ctx.room.metadata)
            if isinstance(metadata, dict):
                if "avatar_provider" in metadata:
                    avatar_provider_name = metadata.get("avatar_provider", avatar_provider_name)
                if "avatar_config" in metadata:
                    avatar_config = metadata.get("avatar_config", {})
                logger.info(f"Loaded avatar config from room metadata: provider={avatar_provider_name}, config={avatar_config}")
        except Exception as e:
            logger.warning(f"Failed to parse room metadata: {e}")
    
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

