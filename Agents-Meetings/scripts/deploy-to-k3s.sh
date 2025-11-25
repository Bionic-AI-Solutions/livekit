#!/bin/bash
set -e

# Configuration
NAMESPACE="meeting-platform"
KUSTOMIZE_DIR="k8s/overlays/production"

# Database Configuration
DB_USERNAME="livekitagent"
DB_PASSWORD="L1v3K1t@g3ntTh1515T0p53cr3t"
DB_HOST="pg-haproxy-primary.pg.svc.cluster.local"
DB_PORT="5432"
DB_NAME="meeting_platform"  # Default database name, adjust if needed

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed or not in PATH"
    exit 1
fi

# Check if kustomize is available (or use kubectl apply -k)
if ! command -v kustomize &> /dev/null && ! kubectl version --client &> /dev/null; then
    print_error "Neither kustomize nor kubectl is available"
    exit 1
fi

# Get the base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BASE_DIR"

# Create namespace if it doesn't exist
print_info "Creating namespace ${NAMESPACE}..."
kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

# Construct DATABASE_URL
DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

print_info "Creating secrets..."

# Backend secret
# Note: You'll need to provide LiveKit and Langfuse credentials
# For now, we'll create the secret with database info and placeholder values
print_info "Creating backend-secret..."
kubectl create secret generic backend-secret \
  --from-literal=DATABASE_URL="${DATABASE_URL}" \
  --from-literal=JWT_SECRET="$(openssl rand -hex 32)" \
  --from-literal=LIVEKIT_API_KEY="${LIVEKIT_API_KEY:-CHANGE_ME}" \
  --from-literal=LIVEKIT_API_SECRET="${LIVEKIT_API_SECRET:-CHANGE_ME}" \
  --from-literal=LANGFUSE_HOST="${LANGFUSE_HOST:-langfuse-web.langfuse.svc.cluster.local}" \
  --from-literal=LANGFUSE_PUBLIC_KEY="${LANGFUSE_PUBLIC_KEY:-CHANGE_ME}" \
  --from-literal=LANGFUSE_SECRET_KEY="${LANGFUSE_SECRET_KEY:-CHANGE_ME}" \
  -n "${NAMESPACE}" \
  --dry-run=client -o yaml | kubectl apply -f -

# Avatar agent secret
print_info "Creating avatar-agent-secret..."
kubectl create secret generic avatar-agent-secret \
  --from-literal=LIVEKIT_API_KEY="${LIVEKIT_API_KEY:-CHANGE_ME}" \
  --from-literal=LIVEKIT_API_SECRET="${LIVEKIT_API_SECRET:-CHANGE_ME}" \
  --from-literal=OPENAI_API_KEY="${OPENAI_API_KEY:-CHANGE_ME}" \
  --from-literal=ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY:-CHANGE_ME}" \
  --from-literal=BITHUMAN_API_SECRET="${BITHUMAN_API_SECRET:-}" \
  --from-literal=BITHUMAN_API_TOKEN="${BITHUMAN_API_TOKEN:-}" \
  --from-literal=ANAM_AVATAR_ID="${ANAM_AVATAR_ID:-}" \
  --from-literal=ANAM_API_URL="${ANAM_API_URL:-}" \
  --from-literal=TAVUS_API_KEY="${TAVUS_API_KEY:-}" \
  --from-literal=LANGFUSE_HOST="${LANGFUSE_HOST:-langfuse-web.langfuse.svc.cluster.local}" \
  --from-literal=LANGFUSE_PUBLIC_KEY="${LANGFUSE_PUBLIC_KEY:-CHANGE_ME}" \
  --from-literal=LANGFUSE_SECRET_KEY="${LANGFUSE_SECRET_KEY:-CHANGE_ME}" \
  -n "${NAMESPACE}" \
  --dry-run=client -o yaml | kubectl apply -f -

# Translation agent secret
print_info "Creating translation-agent-secret..."
kubectl create secret generic translation-agent-secret \
  --from-literal=LIVEKIT_API_KEY="${LIVEKIT_API_KEY:-CHANGE_ME}" \
  --from-literal=LIVEKIT_API_SECRET="${LIVEKIT_API_SECRET:-CHANGE_ME}" \
  --from-literal=OPENAI_API_KEY="${OPENAI_API_KEY:-CHANGE_ME}" \
  --from-literal=DEEPGRAM_API_KEY="${DEEPGRAM_API_KEY:-CHANGE_ME}" \
  --from-literal=ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY:-CHANGE_ME}" \
  --from-literal=GOOGLE_API_KEY="${GOOGLE_API_KEY:-}" \
  --from-literal=LANGFUSE_HOST="${LANGFUSE_HOST:-langfuse-web.langfuse.svc.cluster.local}" \
  --from-literal=LANGFUSE_PUBLIC_KEY="${LANGFUSE_PUBLIC_KEY:-CHANGE_ME}" \
  --from-literal=LANGFUSE_SECRET_KEY="${LANGFUSE_SECRET_KEY:-CHANGE_ME}" \
  -n "${NAMESPACE}" \
  --dry-run=client -o yaml | kubectl apply -f -

# Room manager agent secret
print_info "Creating room-manager-agent-secret..."
kubectl create secret generic room-manager-agent-secret \
  --from-literal=LIVEKIT_API_KEY="${LIVEKIT_API_KEY:-CHANGE_ME}" \
  --from-literal=LIVEKIT_API_SECRET="${LIVEKIT_API_SECRET:-CHANGE_ME}" \
  --from-literal=LANGFUSE_HOST="${LANGFUSE_HOST:-langfuse-web.langfuse.svc.cluster.local}" \
  --from-literal=LANGFUSE_PUBLIC_KEY="${LANGFUSE_PUBLIC_KEY:-CHANGE_ME}" \
  --from-literal=LANGFUSE_SECRET_KEY="${LANGFUSE_SECRET_KEY:-CHANGE_ME}" \
  -n "${NAMESPACE}" \
  --dry-run=client -o yaml | kubectl apply -f -

print_info "Secrets created/updated successfully"

# Deploy using kustomize
print_info "Deploying application using kustomize..."
cd "${KUSTOMIZE_DIR}"

if command -v kustomize &> /dev/null; then
    kustomize build . | kubectl apply -f -
else
    kubectl apply -k .
fi

print_info "Deployment completed!"
print_info ""
print_info "To check deployment status:"
print_info "  kubectl get pods -n ${NAMESPACE}"
print_info "  kubectl get svc -n ${NAMESPACE}"
print_info ""
print_warn "Note: Make sure to update secrets with actual LiveKit and Langfuse credentials"
print_warn "      if you haven't set them as environment variables"






