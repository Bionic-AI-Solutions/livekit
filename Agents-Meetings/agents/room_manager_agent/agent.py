"""
Room manager agent for room lifecycle management
"""
import logging
from dotenv import load_dotenv
from livekit.agents import AgentServer, JobContext, JobRequest, cli
from agents.room_manager_agent.langfuse_setup import setup_langfuse
from opentelemetry import trace

load_dotenv()

logger = logging.getLogger("room_manager_agent")
logger.setLevel(logging.INFO)

server = AgentServer()


async def request_fnc(req: JobRequest):
    await req.accept(
        name="room_manager",
        identity="room_manager",
    )


@server.rtc_session(agent_name="room_manager", on_request=request_fnc)
async def entrypoint(ctx: JobContext):
    """Room manager agent entrypoint"""
    # Setup Langfuse
    trace_provider = setup_langfuse(
        metadata={
            "langfuse.session.id": ctx.room.name,
            "agent.type": "room_manager",
        }
    )
    
    if trace_provider:
        async def flush_trace():
            trace_provider.force_flush()
        ctx.add_shutdown_callback(flush_trace)
    
    await ctx.connect()
    
    tracer = trace.get_tracer("room_manager_agent")
    
    with tracer.start_as_current_span("room_management") as span:
        span.set_attribute("room.name", ctx.room.name)
        span.set_attribute("room.sid", ctx.room.sid)
        
        logger.info(f"Room manager connected to room: {ctx.room.name}")
        
        # Monitor room events
        @ctx.room.on("participant_connected")
        def on_participant_connected(participant):
            with tracer.start_as_current_span("participant_connected") as p_span:
                p_span.set_attribute("participant.identity", participant.identity)
                p_span.set_attribute("room.name", ctx.room.name)
                logger.info(f"Participant connected: {participant.identity}")
        
        @ctx.room.on("participant_disconnected")
        def on_participant_disconnected(participant):
            with tracer.start_as_current_span("participant_disconnected") as p_span:
                p_span.set_attribute("participant.identity", participant.identity)
                p_span.set_attribute("room.name", ctx.room.name)
                logger.info(f"Participant disconnected: {participant.identity}")
        
        # Keep agent alive
        import asyncio
        await asyncio.sleep(float('inf'))


if __name__ == "__main__":
    cli.run_app(server)

