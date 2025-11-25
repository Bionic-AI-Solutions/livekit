"""
Translation agent entrypoint
"""
import logging
from dotenv import load_dotenv
from livekit.agents import AgentServer, AutoSubscribe, JobContext, JobRequest, cli
from langfuse_setup import setup_langfuse
from multi_user_translator import RoomTranslator

load_dotenv()

logger = logging.getLogger("translation_agent")
logger.setLevel(logging.INFO)

server = AgentServer()


async def request_fnc(req: JobRequest):
    await req.accept(
        name="translator",
        identity="translator",
    )


@server.rtc_session(agent_name="translator", on_request=request_fnc)
async def entrypoint(ctx: JobContext):
    """Main entrypoint for the translation agent service."""
    # Setup Langfuse
    trace_provider = setup_langfuse(
        metadata={
            "langfuse.session.id": ctx.room.name,
            "agent.type": "translation",
        }
    )
    
    if trace_provider:
        async def flush_trace():
            trace_provider.force_flush()
        ctx.add_shutdown_callback(flush_trace)
    
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Set the current agent's state
    await ctx.room.local_participant.set_attributes(
        {
            "lk.agent.state": "listening",
        }
    )
    logger.info("translation agent state set to listening")

    room_translator = RoomTranslator(
        ctx.room,
        # additional_languages can be configured here if needed
    )
    room_translator.start()


if __name__ == "__main__":
    cli.run_app(server)

