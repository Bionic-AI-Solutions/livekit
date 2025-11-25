# Cluster Deployment Guide

This guide explains how to deploy the Meeting Platform on a Kubernetes cluster with pre-existing services (LiveKit, Langfuse, Postgres, Redis).

## Prerequisites

- Kubernetes cluster with pre-existing services:
  - LiveKit Server
  - Langfuse
  - PostgreSQL
  - Redis
- Docker registry access: `registry.bionicaisolutions.com`
- `kubectl` configured to access your cluster
- `kustomize` installed (or use `kubectl apply -k`)

## Step 1: Build and Push Docker Images

### Option A: Using the Build Script (Recommended)

1. Set environment variables:
```bash
export DOCKER_USERNAME=your-username
export DOCKER_PASSWORD=your-password
export VERSION=v1.0.0  # Optional, defaults to 'latest'
```

2. Run the build script:
```bash
cd Agents-Meetings
./scripts/build-and-push.sh
```

This will build and push all images:
- `registry.bionicaisolutions.com/meeting-platform-backend:latest`
- `registry.bionicaisolutions.com/meeting-platform-frontend:latest`
- `registry.bionicaisolutions.com/meeting-platform-avatar-agent:latest`
- `registry.bionicaisolutions.com/meeting-platform-translation-agent:latest`
- `registry.bionicaisolutions.com/meeting-platform-room-manager-agent:latest`

### Option B: Manual Docker Login

If you need to login separately:
```bash
export DOCKER_USERNAME=your-username
export DOCKER_PASSWORD=your-password
./scripts/docker-login.sh
```

**Note**: The correct docker login command is:
```bash
docker login --username USERNAME --password-stdin REGISTRY
```
or
```bash
echo "PASSWORD" | docker login --username USERNAME --password-stdin REGISTRY
```

## Step 2: Configure External Services

The application needs to connect to pre-existing services. You need to identify the service names and namespaces.

### Finding Service Names

List services in your cluster:
```bash
# List all services across namespaces
kubectl get svc --all-namespaces

# Or check specific namespaces
kubectl get svc -n default
kubectl get svc -n livekit
kubectl get svc -n langfuse
```

### Service Name Formats

- **Same namespace**: Use service name directly (e.g., `livekit-service`)
- **Different namespace**: Use FQDN format (e.g., `livekit-service.default.svc.cluster.local`)
- **External service**: Use full URL (e.g., `https://livekit.example.com`)

## Step 3: Update Configuration

### Update Production Overlay

Edit `k8s/overlays/production/kustomization.yaml` and update the service URLs:

```yaml
configMapGenerator:
- name: backend-config
  behavior: merge
  literals:
  # Update these with your actual service names
  - LIVEKIT_URL=ws://livekit-service.default.svc.cluster.local:7880
  - DATABASE_HOST=postgres-service.default.svc.cluster.local
  - DATABASE_PORT=5432
  - REDIS_HOST=redis-service.default.svc.cluster.local
  - REDIS_PORT=6379
  - LANGFUSE_HOST=langfuse-service.default.svc.cluster.local
  - LANGFUSE_PORT=3000
```

### Update Secrets

You need to create/update secrets with connection details. The secrets are referenced but not included in the repository for security.

Create secrets using `kubectl`:

```bash
kubectl create namespace meeting-platform

# Backend secrets
kubectl create secret generic backend-secret \
  --from-literal=DATABASE_URL='postgresql://user:password@postgres-service.default.svc.cluster.local:5432/dbname' \
  --from-literal=JWT_SECRET='your-jwt-secret' \
  --from-literal=LIVEKIT_API_KEY='your-livekit-api-key' \
  --from-literal=LIVEKIT_API_SECRET='your-livekit-api-secret' \
  --from-literal=LANGFUSE_HOST='langfuse-service.default.svc.cluster.local' \
  --from-literal=LANGFUSE_PUBLIC_KEY='your-langfuse-public-key' \
  --from-literal=LANGFUSE_SECRET_KEY='your-langfuse-secret-key' \
  -n meeting-platform

# Agent secrets (similar pattern for each agent)
kubectl create secret generic avatar-agent-secret \
  --from-literal=LIVEKIT_API_KEY='your-livekit-api-key' \
  --from-literal=LIVEKIT_API_SECRET='your-livekit-api-secret' \
  --from-literal=OPENAI_API_KEY='your-openai-key' \
  --from-literal=ELEVENLABS_API_KEY='your-elevenlabs-key' \
  --from-literal=LANGFUSE_HOST='langfuse-service.default.svc.cluster.local' \
  --from-literal=LANGFUSE_PUBLIC_KEY='your-langfuse-public-key' \
  --from-literal=LANGFUSE_SECRET_KEY='your-langfuse-secret-key' \
  -n meeting-platform

# Repeat for translation-agent-secret and room-manager-agent-secret
```

## Step 4: Deploy to Cluster

### Using Kustomize

```bash
cd Agents-Meetings/k8s/overlays/production
kubectl apply -k .
```

### Or using kustomize directly

```bash
cd Agents-Meetings/k8s/overlays/production
kustomize build . | kubectl apply -f -
```

### Verify Deployment

```bash
# Check deployments
kubectl get deployments -n meeting-platform

# Check pods
kubectl get pods -n meeting-platform

# Check services
kubectl get svc -n meeting-platform

# View logs
kubectl logs -f deployment/backend -n meeting-platform
kubectl logs -f deployment/frontend -n meeting-platform
```

## Step 5: Access the Application

### Get Service Endpoints

```bash
# Backend API
kubectl get svc backend -n meeting-platform

# Frontend
kubectl get svc frontend -n meeting-platform

# Ingress (if configured)
kubectl get ingress -n meeting-platform
```

### Port Forwarding (for testing)

```bash
# Backend
kubectl port-forward svc/backend 8000:8000 -n meeting-platform

# Frontend
kubectl port-forward svc/frontend 3000:3000 -n meeting-platform
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Troubleshooting

### Images Not Pulling

If pods show `ImagePullBackOff`:

1. Verify image exists in registry:
```bash
docker pull registry.bionicaisolutions.com/meeting-platform-backend:latest
```

2. Check image pull secrets:
```bash
kubectl get secrets -n meeting-platform
```

3. Create image pull secret if needed:
```bash
kubectl create secret docker-registry regcred \
  --docker-server=registry.bionicaisolutions.com \
  --docker-username=your-username \
  --docker-password=your-password \
  -n meeting-platform
```

Then update deployments to use the secret:
```yaml
spec:
  template:
    spec:
      imagePullSecrets:
      - name: regcred
```

### Connection Issues to External Services

1. Verify service names are correct:
```bash
kubectl get svc --all-namespaces | grep -E "livekit|postgres|redis|langfuse"
```

2. Test connectivity from a pod:
```bash
kubectl run -it --rm debug --image=busybox --restart=Never -n meeting-platform -- sh
# Inside the pod:
nslookup livekit-service.default.svc.cluster.local
telnet postgres-service.default.svc.cluster.local 5432
```

3. Check DNS resolution:
```bash
kubectl exec -it deployment/backend -n meeting-platform -- nslookup livekit-service
```

### Database Connection Issues

1. Verify DATABASE_URL in secret:
```bash
kubectl get secret backend-secret -n meeting-platform -o jsonpath='{.data.DATABASE_URL}' | base64 -d
```

2. Ensure database is accessible from the cluster network

3. Check backend logs:
```bash
kubectl logs -f deployment/backend -n meeting-platform
```

## Updating Images

When you rebuild and push new images:

1. Build and push:
```bash
export VERSION=v1.0.1
./scripts/build-and-push.sh
```

2. Update kustomization.yaml to use new version:
```yaml
images:
  - name: meeting-platform-backend
    newTag: v1.0.1
```

3. Apply changes:
```bash
kubectl apply -k k8s/overlays/production
```

4. Restart deployments if needed:
```bash
kubectl rollout restart deployment/backend -n meeting-platform
kubectl rollout restart deployment/frontend -n meeting-platform
```

## Architecture Notes

### Excluded Services

The following services are **NOT** deployed as part of this application (they are pre-existing):
- PostgreSQL
- Redis
- LiveKit Server
- Langfuse

These services are referenced via external service names in ConfigMaps and Secrets.

### Application Components

The following components **ARE** deployed:
- Backend (FastAPI)
- Frontend (Next.js)
- Avatar Agent
- Translation Agent
- Room Manager Agent

All images are pulled from `registry.bionicaisolutions.com`.






