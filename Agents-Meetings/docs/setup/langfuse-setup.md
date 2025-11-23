# Langfuse Setup Guide

Langfuse provides observability and tracing for all LLM operations, meeting analytics, and agent activities.

## Cloud Setup (Recommended)

1. Sign up at [Langfuse Cloud](https://cloud.langfuse.com)
2. Create a new project
3. Navigate to Settings > API Keys
4. Create a new API key pair:
   - Public Key
   - Secret Key
5. Update all secret files with Langfuse credentials:
   - `k8s/base/backend/secret.yaml`
   - `k8s/base/agents/avatar-agent/secret.yaml`
   - `k8s/base/agents/translation-agent/secret.yaml`
   - `k8s/base/agents/room-manager-agent/secret.yaml`

```yaml
LANGFUSE_HOST: "https://cloud.langfuse.com"
LANGFUSE_PUBLIC_KEY: "pk-..."
LANGFUSE_SECRET_KEY: "sk-..."
```

## Self-Hosted Setup

If you prefer to self-host Langfuse:

1. Deploy Langfuse using the provided Kubernetes manifests in `k8s/base/langfuse/`
2. Update `k8s/base/langfuse/secret.yaml` with:
   - Database URL (separate database recommended)
   - NextAuth secret
   - Encryption salt
3. Access Langfuse UI at the service URL
4. Create API keys in the UI
5. Update all secret files with self-hosted URL and keys

## Configuration

### Backend Integration

The backend automatically sets up OpenTelemetry tracing when `LANGFUSE_ENABLED=true` in the ConfigMap.

### Agent Integration

All agents include Langfuse setup in their entrypoints. Tracing is automatically enabled when:
- `LANGFUSE_HOST` is set
- `LANGFUSE_PUBLIC_KEY` is set
- `LANGFUSE_SECRET_KEY` is set

## What Gets Tracked

### Meeting Operations
- Meeting creation, start, end
- Participant join/leave events
- Room lifecycle

### Translation Operations
- STT transcriptions per language
- LLM translation calls
- TTS synthesis operations
- Translation latency and quality

### Avatar Operations
- Avatar session lifecycle
- LLM interactions
- TTS operations
- Avatar rendering

### Agent Operations
- Agent startup and shutdown
- Error events
- Performance metrics

## Viewing Traces

1. Access Langfuse UI (cloud or self-hosted)
2. Navigate to Traces section
3. Filter by:
   - Meeting ID
   - Participant ID
   - Agent type
   - Time range

## Troubleshooting

### Traces Not Appearing

1. Verify API keys are correct
2. Check agent logs for Langfuse connection errors
3. Verify `LANGFUSE_ENABLED=true` in ConfigMaps
4. Check network connectivity to Langfuse host

### High Trace Volume

If you have many meetings, consider:
- Sampling traces (configure in agent code)
- Using separate Langfuse projects per environment
- Adjusting retention policies in Langfuse

## Best Practices

1. Use separate Langfuse projects for dev/staging/prod
2. Set up alerts for error rates
3. Monitor token usage and costs
4. Review traces regularly for optimization opportunities

