# Secrets Configuration Guide

This guide details all secrets that need to be configured in Kubernetes.

## Secret Files Location

All secrets are located in `k8s/base/*/secret.yaml`. Each service has its own secret file.

## PostgreSQL Secret

**File:** `k8s/base/postgres/secret.yaml`

```yaml
POSTGRES_USER: "postgres"
POSTGRES_PASSWORD: "CHANGE_ME_SECURE_PASSWORD"  # Use a strong password
POSTGRES_DB: "meeting_platform"
```

## Backend Secret

**File:** `k8s/base/backend/secret.yaml`

```yaml
JWT_SECRET: "CHANGE_ME_GENERATE_A_SECURE_JWT_SECRET_MIN_32_CHARS"  # Generate with: openssl rand -hex 32
DATABASE_URL: "postgresql://postgres:PASSWORD@postgres:5432/meeting_platform"
LIVEKIT_API_KEY: "YOUR_LIVEKIT_API_KEY"
LIVEKIT_API_SECRET: "YOUR_LIVEKIT_API_SECRET"
LANGFUSE_HOST: "https://cloud.langfuse.com"  # Or self-hosted URL
LANGFUSE_PUBLIC_KEY: "YOUR_LANGFUSE_PUBLIC_KEY"
LANGFUSE_SECRET_KEY: "YOUR_LANGFUSE_SECRET_KEY"
```

## Avatar Agent Secret

**File:** `k8s/base/agents/avatar-agent/secret.yaml`

```yaml
LIVEKIT_API_KEY: "YOUR_LIVEKIT_API_KEY"
LIVEKIT_API_SECRET: "YOUR_LIVEKIT_API_SECRET"
# BitHuman (preferred)
BITHUMAN_API_SECRET: "YOUR_BITHUMAN_API_SECRET"
BITHUMAN_API_TOKEN: "YOUR_BITHUMAN_API_TOKEN"
# Anam (optional)
ANAM_AVATAR_ID: "YOUR_ANAM_AVATAR_ID"
ANAM_API_URL: "YOUR_ANAM_API_URL"
# Tavus (optional)
TAVUS_API_KEY: "YOUR_TAVUS_API_KEY"
# OpenAI
OPENAI_API_KEY: "YOUR_OPENAI_API_KEY"
# ElevenLabs
ELEVENLABS_API_KEY: "YOUR_ELEVENLABS_API_KEY"
# Langfuse
LANGFUSE_HOST: "https://cloud.langfuse.com"
LANGFUSE_PUBLIC_KEY: "YOUR_LANGFUSE_PUBLIC_KEY"
LANGFUSE_SECRET_KEY: "YOUR_LANGFUSE_SECRET_KEY"
```

## Translation Agent Secret

**File:** `k8s/base/agents/translation-agent/secret.yaml`

```yaml
LIVEKIT_API_KEY: "YOUR_LIVEKIT_API_KEY"
LIVEKIT_API_SECRET: "YOUR_LIVEKIT_API_SECRET"
OPENAI_API_KEY: "YOUR_OPENAI_API_KEY"
DEEPGRAM_API_KEY: "YOUR_DEEPGRAM_API_KEY"
ELEVENLABS_API_KEY: "YOUR_ELEVENLABS_API_KEY"
GOOGLE_API_KEY: "YOUR_GOOGLE_API_KEY"  # Optional
LANGFUSE_HOST: "https://cloud.langfuse.com"
LANGFUSE_PUBLIC_KEY: "YOUR_LANGFUSE_PUBLIC_KEY"
LANGFUSE_SECRET_KEY: "YOUR_LANGFUSE_SECRET_KEY"
```

## LiveKit Secret

**File:** `k8s/base/livekit/secret.yaml`

```yaml
LIVEKIT_KEYS: |
  YOUR_LIVEKIT_API_KEY:YOUR_LIVEKIT_API_SECRET
```

## Langfuse Secret (Self-Hosted)

**File:** `k8s/base/langfuse/secret.yaml`

```yaml
DATABASE_URL: "postgresql://postgres:PASSWORD@postgres:5432/langfuse"
NEXTAUTH_SECRET: "GENERATE_A_SECURE_RANDOM_STRING"  # openssl rand -hex 32
SALT: "GENERATE_A_SECURE_RANDOM_STRING"  # openssl rand -hex 32
```

## Generating Secure Secrets

### JWT Secret

```bash
openssl rand -hex 32
```

### NextAuth Secret / Salt

```bash
openssl rand -hex 32
```

### Database Password

```bash
openssl rand -base64 24
```

## Security Best Practices

1. **Never commit secrets to git** - All secret files should be in `.gitignore`
2. **Use Kubernetes secrets** - Never hardcode secrets in code
3. **Rotate secrets regularly** - Update secrets periodically
4. **Use different secrets per environment** - Development, staging, and production should have different secrets
5. **Limit secret access** - Use RBAC to restrict who can view secrets

## Verifying Secrets

After updating secrets, verify they're correctly set:

```bash
# List all secrets
kubectl get secrets -n meeting-platform

# View a specific secret (base64 encoded)
kubectl get secret backend-secret -n meeting-platform -o yaml

# Decode a secret value
kubectl get secret backend-secret -n meeting-platform -o jsonpath='{.data.JWT_SECRET}' | base64 -d
```

