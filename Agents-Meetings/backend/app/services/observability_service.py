"""
Observability service for Langfuse tracking
"""
from opentelemetry import trace
from app.core.langfuse import get_tracer
from typing import Optional, Dict, Any
import uuid


def create_meeting_trace(meeting_id: str, metadata: Optional[Dict[str, Any]] = None) -> str:
    """Create a trace for a meeting"""
    tracer = get_tracer("meeting_service")
    with tracer.start_as_current_span("meeting_lifecycle") as span:
        span.set_attribute("meeting.id", meeting_id)
        if metadata:
            for key, value in metadata.items():
                span.set_attribute(f"meeting.{key}", str(value))
        trace_id = format(span.get_span_context().trace_id, "032x")
        return trace_id


def create_participant_span(participant_id: str, meeting_id: str, metadata: Optional[Dict[str, Any]] = None) -> str:
    """Create a span for a participant"""
    tracer = get_tracer("participant_service")
    with tracer.start_as_current_span("participant_session") as span:
        span.set_attribute("participant.id", participant_id)
        span.set_attribute("meeting.id", meeting_id)
        if metadata:
            for key, value in metadata.items():
                span.set_attribute(f"participant.{key}", str(value))
        span_id = format(span.get_span_context().span_id, "016x")
        return span_id


def track_translation_operation(
    source_language: str,
    target_language: str,
    text_length: int,
    metadata: Optional[Dict[str, Any]] = None
):
    """Track a translation operation"""
    tracer = get_tracer("translation_service")
    with tracer.start_as_current_span("translation") as span:
        span.set_attribute("translation.source_language", source_language)
        span.set_attribute("translation.target_language", target_language)
        span.set_attribute("translation.text_length", text_length)
        if metadata:
            for key, value in metadata.items():
                span.set_attribute(f"translation.{key}", str(value))


def track_agent_operation(agent_type: str, operation: str, metadata: Optional[Dict[str, Any]] = None):
    """Track an agent operation"""
    tracer = get_tracer("agent_service")
    with tracer.start_as_current_span(f"agent.{operation}") as span:
        span.set_attribute("agent.type", agent_type)
        span.set_attribute("agent.operation", operation)
        if metadata:
            for key, value in metadata.items():
                span.set_attribute(f"agent.{key}", str(value))


def record_error(span_name: str, error: Exception, metadata: Optional[Dict[str, Any]] = None):
    """Record an error in tracing"""
    tracer = get_tracer("error_tracking")
    with tracer.start_as_current_span(span_name) as span:
        span.record_exception(error)
        span.set_status(trace.Status(trace.StatusCode.ERROR, str(error)))
        if metadata:
            for key, value in metadata.items():
                span.set_attribute(f"error.{key}", str(value))

