"""
Translation agent entrypoint
"""
import logging
import asyncio
import time
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import AgentServer, AutoSubscribe, JobContext, JobRequest, cli
from livekit.agents.types import TOPIC_CHAT
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
    
    # Store accumulated chat messages per stream
    chat_message_buffers: dict[str, str] = {}
    
    async def translate_and_send_chat_message(original_message: str, sender: rtc.RemoteParticipant):
        """Translate a chat message and send to participants"""
        if not original_message or original_message.strip() == '':
            return
        
        sender_language = sender.attributes.get("language", "en")
        logger.info(f"Processing chat message from {sender.identity} ({sender_language}): {original_message}")
        
        # Get all participant languages (excluding sender's language)
        target_languages = set()
        for p in ctx.room.remote_participants.values():
            lang = p.attributes.get("language")
            if lang and lang != sender_language:
                target_languages.add(lang)
        
        # Also include local participant (the agent itself) - but we don't need to translate for it
        # Actually, we want to translate for all participants except the sender
        
        if not target_languages:
            logger.info("No target languages to translate to")
            return
        
        logger.info(f"Translating to languages: {target_languages}")
        
        # Translate to each target language and send
        from livekit.plugins import google
        llm = google.LLM()
        
        for target_lang in target_languages:
            try:
                from livekit.agents import llm as agents_llm
                context = agents_llm.ChatContext()
                context.add_message(
                    role="system",
                    content=f"You are a translator. Translate the following text to {target_lang}. Only return the translation, nothing else.",
                )
                context.add_message(role="user", content=original_message)
                
                llm_stream = llm.chat(chat_ctx=context)
                translated = ""
                async for chunk in llm_stream:
                    if chunk.delta and chunk.delta.content:
                        translated += chunk.delta.content
                await llm_stream.aclose()
                
                if not translated or translated.strip() == '':
                    logger.warning(f"Empty translation for {target_lang}")
                    continue
                
                logger.info(f"Translated to {target_lang}: {translated}")
                
                # Send translated message using TextStream to each participant with this language
                # Use publish_data with topic "lk-chat-translated-{language}" for the frontend to pick up
                translated_chat = {
                    "message": translated,
                    "original": original_message,
                    "from": sender.identity,
                    "fromName": sender.name or sender.identity,
                    "translated": True,
                    "sourceLanguage": sender_language,
                    "targetLanguage": target_lang,
                    "timestamp": int(time.time() * 1000)
                }
                
                # Send to all participants with this language preference
                for p in ctx.room.remote_participants.values():
                    if p.attributes.get("language") == target_lang:
                        import json
                        await ctx.room.local_participant.publish_data(
                            json.dumps(translated_chat).encode('utf-8'),
                            kind=rtc.DataPacket_Kind.RELIABLE,
                            topic=f"lk-chat-translated-{target_lang}",
                            destination_identities=[p.identity]
                        )
                        logger.info(f"Sent translated chat message to {p.identity} (language: {target_lang})")
                
                logger.info(f"Sent translated chat message to participants with language {target_lang}")
            except Exception as e:
                logger.error(f"Error translating chat message to {target_lang}: {e}", exc_info=True)
    
    # Handle chat messages via TextStream (LiveKit's built-in chat mechanism)
    def on_chat_text_received(reader: rtc.TextStreamReader, participant_identity: str):
        """Handle chat messages received via TextStream"""
        async def _process_chat_stream():
            try:
                stream_id = reader.info.stream_id
                participant = ctx.room.remote_participants.get(participant_identity)
                if not participant:
                    logger.warning(f"Participant {participant_identity} not found")
                    return
                
                # Accumulate text chunks
                if stream_id not in chat_message_buffers:
                    chat_message_buffers[stream_id] = ""
                
                # Read all text from the stream
                complete_message = await reader.read_all()
                logger.info(f"Received complete chat message from {participant_identity}: {complete_message}")
                
                if complete_message and complete_message.strip():
                    await translate_and_send_chat_message(complete_message.strip(), participant)
            except Exception as e:
                logger.error(f"Error processing chat text stream: {e}", exc_info=True)
        
        asyncio.create_task(_process_chat_stream())
    
    # Register TextStream handler for chat messages
    try:
        ctx.room.register_text_stream_handler(topic=TOPIC_CHAT, handler=on_chat_text_received)
        logger.info("Registered TextStream handler for chat messages (topic: lk.chat)")
    except ValueError as e:
        logger.warning(f"Could not register text stream handler: {e}")
    
    # Also handle data_received events as fallback (in case chat uses data packets)
    @ctx.room.on("data_received")
    async def on_data_received(
        payload: bytes,
        participant: rtc.RemoteParticipant,
        kind: rtc.DataPacket_Kind,
        topic: str | None,
    ):
        """Intercept chat messages via data packets (fallback)"""
        # Only process RELIABLE data packets
        if kind != rtc.DataPacket_Kind.RELIABLE:
            return
        
        # Skip if this is already a translated message
        if topic and ("translated" in topic.lower() or "lk-chat-translated" in topic):
            return
        
        # Log all data received for debugging
        logger.info(f"Data received - topic: {topic}, participant: {participant.identity}, kind: {kind}")
        
        # Process chat messages (topic "lk.chat" or None/empty for default chat)
        if topic and topic != "lk.chat" and topic != "":
            # Not a chat message, ignore
            return
        
        try:
            import json
            
            # Try to parse as chat message
            data_str = payload.decode('utf-8')
            logger.info(f"Decoded data: {data_str[:100]}...")  # Log first 100 chars
            
            try:
                chat_data = json.loads(data_str)
                logger.info(f"Parsed chat data: {chat_data}")
                
                # LiveKit chat message format: {"message": "...", "timestamp": ...}
                original_message = None
                if isinstance(chat_data, dict):
                    if 'message' in chat_data:
                        original_message = chat_data['message']
                    elif 'text' in chat_data:
                        original_message = chat_data['text']
                elif isinstance(chat_data, str):
                    original_message = chat_data
                
                if original_message and original_message.strip():
                    await translate_and_send_chat_message(original_message, participant)
            except json.JSONDecodeError:
                # Try as plain string
                if data_str.strip():
                    logger.info(f"Treating as plain string message: {data_str}")
                    await translate_and_send_chat_message(data_str, participant)
        except UnicodeDecodeError:
            # Not UTF-8, ignore
            pass
        except Exception as e:
            logger.error(f"Error processing data_received chat message: {e}", exc_info=True)


if __name__ == "__main__":
    cli.run_app(server)

