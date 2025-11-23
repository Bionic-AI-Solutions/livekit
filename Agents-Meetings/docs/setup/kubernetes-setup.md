# Kubernetes Setup Guide

This guide walks you through deploying the Multilingual Meeting Platform to Kubernetes.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured to access your cluster
- kustomize (v3.2.0+)
- Docker registry access for pushing images

## Configuration Files

All configuration files are located in `k8s/base/` and environment-specific overlays in `k8s/overlays/`.

### Key Files to Update

1. **Secrets** - Update all secret files in `k8s/base/*/secret.yaml`:
   - `k8s/base/postgres/secret.yaml` - Database credentials
   - `k8s/base/backend/secret.yaml` - Backend API keys and secrets
   - `k8s/base/agents/avatar-agent/secret.yaml` - Avatar provider API keys
   - `k8s/base/agents/translation-agent/secret.yaml` - Translation service API keys
   - `k8s/base/livekit/secret.yaml` - LiveKit keys
   - `k8s/base/langfuse/secret.yaml` - Langfuse credentials (if self-hosting)

2. **ConfigMaps** - Update configuration in `k8s/base/*/configmap.yaml`:
   - `k8s/base/backend/configmap.yaml` - Backend configuration
   - `k8s/base/frontend/configmap.yaml` - Frontend URLs
   - `k8s/base/agents/*/configmap.yaml` - Agent configurations

## Deployment Steps

### 1. Update Secrets

Edit all secret files and replace placeholder values:

```bash
# Example: Update PostgreSQL secret
vim k8s/base/postgres/secret.yaml
# Change POSTGRES_PASSWORD to a secure password
```

### 2. Build and Push Docker Images

```bash
# Build backend
docker build -t your-registry/meeting-platform-backend:latest ./backend
docker push your-registry/meeting-platform-backend:latest

# Build frontend
docker build -t your-registry/meeting-platform-frontend:latest ./frontend
docker push your-registry/meeting-platform-frontend:latest

# Build agents
docker build -t your-registry/meeting-platform-avatar-agent:latest ./agents/avatar_agent
docker push your-registry/meeting-platform-avatar-agent:latest

docker build -t your-registry/meeting-platform-translation-agent:latest ./agents/translation_agent
docker push your-registry/meeting-platform-translation-agent:latest

docker build -t your-registry/meeting-platform-room-manager-agent:latest ./agents/room_manager_agent
docker push your-registry/meeting-platform-room-manager-agent:latest
```

### 3. Update Image Names in Deployments

Update image names in deployment files to match your registry:

```bash
# Update backend deployment
sed -i 's|meeting-platform-backend:latest|your-registry/meeting-platform-backend:latest|g' k8s/base/backend/deployment.yaml
```

### 4. Deploy to Kubernetes

#### Development Environment

```bash
kubectl apply -k k8s/overlays/development
```

#### Staging Environment

```bash
kubectl apply -k k8s/overlays/staging
```

#### Production Environment

```bash
kubectl apply -k k8s/overlays/production
```

### 5. Verify Deployment

```bash
# Check all pods
kubectl get pods -n meeting-platform

# Check services
kubectl get svc -n meeting-platform

# Check logs
kubectl logs -n meeting-platform deployment/backend
```

## Database Migration

After deploying, run database migrations:

```bash
# Get backend pod name
BACKEND_POD=$(kubectl get pods -n meeting-platform -l app=backend -o jsonpath='{.items[0].metadata.name}')

# Run migrations
kubectl exec -n meeting-platform $BACKEND_POD -- alembic upgrade head
```

## Troubleshooting

### Pods Not Starting

1. Check pod logs: `kubectl logs -n meeting-platform <pod-name>`
2. Check pod events: `kubectl describe pod -n meeting-platform <pod-name>`
3. Verify secrets are correctly set: `kubectl get secret -n meeting-platform`

### Database Connection Issues

1. Verify PostgreSQL is running: `kubectl get pods -n meeting-platform -l app=postgres`
2. Check database URL in backend secret matches PostgreSQL service
3. Test connection from backend pod

### LiveKit Connection Issues

1. Verify LiveKit service is accessible: `kubectl get svc -n meeting-platform livekit`
2. Check LiveKit API keys in secrets
3. Verify WebSocket URL in frontend config

## Next Steps

- See [Secrets Configuration Guide](./secrets-configuration.md) for detailed secret setup
- See [API Keys Setup](./api-keys-setup.md) for external service API keys
- See [Langfuse Setup](./langfuse-setup.md) for observability configuration

