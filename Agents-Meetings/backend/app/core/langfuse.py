"""
Langfuse/OpenTelemetry setup for observability
"""
import os
import base64
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from app.core.config import settings

_tracer_provider: TracerProvider | None = None


def setup_langfuse():
    """Setup Langfuse OpenTelemetry tracing"""
    if not settings.LANGFUSE_ENABLED:
        return None

    if not settings.LANGFUSE_PUBLIC_KEY or not settings.LANGFUSE_SECRET_KEY:
        return None

    langfuse_auth = base64.b64encode(
        f"{settings.LANGFUSE_PUBLIC_KEY}:{settings.LANGFUSE_SECRET_KEY}".encode()
    ).decode()

    os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = f"{settings.LANGFUSE_HOST.rstrip('/')}/api/public/otel"
    os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"Authorization=Basic {langfuse_auth}"

    global _tracer_provider
    _tracer_provider = TracerProvider()
    _tracer_provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
    trace.set_tracer_provider(_tracer_provider)

    return _tracer_provider


def get_tracer(name: str = __name__):
    """Get OpenTelemetry tracer"""
    return trace.get_tracer(name)

