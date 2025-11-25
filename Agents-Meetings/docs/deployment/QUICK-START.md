# Quick Start - Cluster Deployment

## Prerequisites Check

```bash
# Verify kubectl access
kubectl cluster-info

# Find existing services
./scripts/find-services.sh
```

## Step 1: Login to Docker Registry

```bash
export DOCKER_USERNAME=salil
export DOCKER_PASSWORD='w75DtzG78i@YHons)?UmE8'
./scripts/docker-login.sh
```

**Note**: The correct docker login syntax is:
```bash
docker login --username USERNAME --password-stdin REGISTRY
```

## Step 2: Build and Push Images

```bash
export VERSION=v1.0.0  # Optional
./scripts/build-and-push.sh
```

## Step 3: Identify Service Names

```bash
./scripts/find-services.sh
```

Note the service names and namespaces for:
- LiveKit
- PostgreSQL  
- Redis
- Langfuse

## Step 4: Update Configuration

Edit `k8s/overlays/production/kustomization.yaml` and update service URLs based on your findings.

Example if services are in `default` namespace:
```yaml
- LIVEKIT_URL=ws://livekit-service.default.svc.cluster.local:7880
- DATABASE_HOST=postgres-service.default.svc.cluster.local
```

## Step 5: Create Secrets

```bash
kubectl create namespace meeting-platform

# Backend secret
kubectl create secret generic backend-secret \
  --from-literal=DATABASE_URL='postgresql://user:pass@postgres-service.default.svc.cluster.local:5432/dbname' \
  --from-literal=JWT_SECRET='your-secret' \
  --from-literal=LIVEKIT_API_KEY='your-key' \
  --from-literal=LIVEKIT_API_SECRET='your-secret' \
  --from-literal=LANGFUSE_HOST='langfuse-service.default.svc.cluster.local' \
  --from-literal=LANGFUSE_PUBLIC_KEY='your-key' \
  --from-literal=LANGFUSE_SECRET_KEY='your-secret' \
  -n meeting-platform

# Repeat for agent secrets (avatar-agent-secret, translation-agent-secret, room-manager-agent-secret)
```

## Step 6: Deploy

```bash
cd k8s/overlays/production
kubectl apply -k .
```

## Step 7: Verify

```bash
kubectl get pods -n meeting-platform
kubectl logs -f deployment/backend -n meeting-platform
```

## Troubleshooting

### Image Pull Errors

If you see `ImagePullBackOff`, create image pull secret:

```bash
kubectl create secret docker-registry regcred \
  --docker-server=registry.bionicaisolutions.com \
  --docker-username=salil \
  --docker-password='w75DtzG78i@YHons)?UmE8' \
  -n meeting-platform
```

Then add to deployments (update `k8s/base/*/deployment.yaml`):
```yaml
spec:
  template:
    spec:
      imagePullSecrets:
      - name: regcred
```

### Connection Issues

Test connectivity:
```bash
kubectl run -it --rm debug --image=busybox --restart=Never -n meeting-platform -- sh
# Inside pod:
nslookup livekit-service.default.svc.cluster.local
```

## Full Documentation

See [cluster-deployment.md](./cluster-deployment.md) for detailed documentation.






