# API Keys Setup Guide

This guide explains how to obtain and configure API keys for external services.

## LiveKit

1. Sign up at [LiveKit Cloud](https://cloud.livekit.io) or deploy self-hosted
2. Create a new project
3. Generate API keys in the project settings
4. Update `k8s/base/backend/secret.yaml` and agent secrets with:
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`

## Langfuse

### Cloud Option

1. Sign up at [Langfuse Cloud](https://cloud.langfuse.com)
2. Create a new project
3. Get API keys from project settings
4. Update secrets with:
   - `LANGFUSE_HOST`: `https://cloud.langfuse.com`
   - `LANGFUSE_PUBLIC_KEY`
   - `LANGFUSE_SECRET_KEY`

### Self-Hosted Option

1. Deploy Langfuse using the provided Kubernetes manifests
2. Access Langfuse UI and create API keys
3. Update secrets with self-hosted URL

## BitHuman (Avatar Provider)

1. Sign up at [BitHuman](https://bithuman.ai)
2. Get API credentials from dashboard
3. Update `k8s/base/agents/avatar-agent/secret.yaml`:
   - `BITHUMAN_API_SECRET`
   - `BITHUMAN_API_TOKEN`

## OpenAI

1. Sign up at [OpenAI](https://platform.openai.com)
2. Create API key in account settings
3. Update secrets:
   - `OPENAI_API_KEY` in avatar-agent and translation-agent secrets

## Deepgram (Speech-to-Text)

1. Sign up at [Deepgram](https://deepgram.com)
2. Create API key in dashboard
3. Update `k8s/base/agents/translation-agent/secret.yaml`:
   - `DEEPGRAM_API_KEY`

## ElevenLabs (Text-to-Speech)

1. Sign up at [ElevenLabs](https://elevenlabs.io)
2. Get API key from profile settings
3. Update secrets:
   - `ELEVENLABS_API_KEY` in avatar-agent and translation-agent secrets

## Google Cloud (Translation - Optional)

1. Create project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Translation API
3. Create service account and download JSON key
4. Extract API key or use service account
5. Update `k8s/base/agents/translation-agent/secret.yaml`:
   - `GOOGLE_API_KEY`

## Anam (Avatar Provider - Optional)

1. Sign up at [Anam](https://anam.ai)
2. Create avatar and get credentials
3. Update `k8s/base/agents/avatar-agent/secret.yaml`:
   - `ANAM_AVATAR_ID`
   - `ANAM_API_URL`

## Tavus (Avatar Provider - Optional)

1. Sign up at [Tavus](https://tavus.io)
2. Get API key from dashboard
3. Update `k8s/base/agents/avatar-agent/secret.yaml`:
   - `TAVUS_API_KEY`

## Testing API Keys

After configuring API keys, test connectivity:

```bash
# Test backend connectivity
kubectl exec -n meeting-platform deployment/backend -- curl http://localhost:8000/health

# Check agent logs for API key errors
kubectl logs -n meeting-platform deployment/avatar-agent
kubectl logs -n meeting-platform deployment/translation-agent
```

## Cost Considerations

- **OpenAI**: Pay-per-use, monitor usage in dashboard
- **Deepgram**: Pay-per-minute of audio processed
- **ElevenLabs**: Pay-per-character for TTS
- **BitHuman**: Check pricing on their website
- **LiveKit**: Free tier available, then pay-per-participant-minute

## Rate Limits

Be aware of rate limits for each service:
- OpenAI: Check your tier limits
- Deepgram: Varies by plan
- ElevenLabs: Character limits per month
- Google: Quota per project

Monitor usage and adjust accordingly.

