#!/bin/bash
set -e

# Configuration
REGISTRY="registry.bionicaisolutions.com"
PROJECT_NAME="meeting-platform"
VERSION="${VERSION:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

# Login to registry
print_info "Logging in to registry ${REGISTRY}..."
if [ -z "$DOCKER_USERNAME" ] || [ -z "$DOCKER_PASSWORD" ]; then
    print_error "DOCKER_USERNAME and DOCKER_PASSWORD environment variables must be set"
    exit 1
fi

echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USERNAME" --password-stdin "$REGISTRY" || {
    print_error "Failed to login to registry"
    exit 1
}

print_info "Successfully logged in to registry"

# Get the base directory (parent of scripts)
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BASE_DIR"

# Build and push backend
print_info "Building backend image..."
cd backend
docker build -t "${REGISTRY}/meeting/${PROJECT_NAME}-backend:${VERSION}" .
docker tag "${REGISTRY}/meeting/${PROJECT_NAME}-backend:${VERSION}" "${REGISTRY}/meeting/${PROJECT_NAME}-backend:latest"
print_info "Pushing backend image..."
if ! docker push "${REGISTRY}/meeting/${PROJECT_NAME}-backend:${VERSION}"; then
    print_warn "Failed to push ${VERSION} tag, continuing..."
fi
if ! docker push "${REGISTRY}/meeting/${PROJECT_NAME}-backend:latest"; then
    print_warn "Failed to push latest tag, but image was built successfully"
else
    print_info "Backend image pushed successfully"
fi
cd ..

# Build and push frontend
print_info "Building frontend image..."
cd frontend
docker build -t "${REGISTRY}/meeting/${PROJECT_NAME}-frontend:${VERSION}" .
docker tag "${REGISTRY}/meeting/${PROJECT_NAME}-frontend:${VERSION}" "${REGISTRY}/meeting/${PROJECT_NAME}-frontend:latest"
print_info "Pushing frontend image..."
if ! docker push "${REGISTRY}/meeting/${PROJECT_NAME}-frontend:${VERSION}"; then
    print_warn "Failed to push ${VERSION} tag, continuing..."
fi
if ! docker push "${REGISTRY}/meeting/${PROJECT_NAME}-frontend:latest"; then
    print_warn "Failed to push latest tag, but image was built successfully"
else
    print_info "Frontend image pushed successfully"
fi
cd ..

# Build and push agents
AGENTS=("avatar_agent" "translation_agent" "room_manager_agent")

for agent in "${AGENTS[@]}"; do
    agent_name=$(echo "$agent" | tr '_' '-')
    print_info "Building ${agent} image..."
    cd "agents/${agent}"
    docker build -t "${REGISTRY}/meeting/${PROJECT_NAME}-${agent_name}:${VERSION}" .
    docker tag "${REGISTRY}/meeting/${PROJECT_NAME}-${agent_name}:${VERSION}" "${REGISTRY}/meeting/${PROJECT_NAME}-${agent_name}:latest"
    print_info "Pushing ${agent} image..."
    if ! docker push "${REGISTRY}/meeting/${PROJECT_NAME}-${agent_name}:${VERSION}"; then
        print_warn "Failed to push ${VERSION} tag for ${agent}, continuing..."
    fi
    if ! docker push "${REGISTRY}/meeting/${PROJECT_NAME}-${agent_name}:latest"; then
        print_warn "Failed to push latest tag for ${agent}, but image was built successfully"
    else
        print_info "${agent} image pushed successfully"
    fi
    cd "$BASE_DIR"
done

print_info "All images built and pushed successfully!"
print_info "Registry: ${REGISTRY}"
print_info "Project: ${PROJECT_NAME}"
print_info "Version: ${VERSION}"

