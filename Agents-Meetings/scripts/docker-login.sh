#!/bin/bash
set -e

# Configuration
REGISTRY="registry.bionicaisolutions.com"
DOCKER_USERNAME="salil"
DOCKER_PASSWORD="w75DtzG78i@YHons)?UmE8"
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

# Get credentials
if [ -z "$DOCKER_USERNAME" ] || [ -z "$DOCKER_PASSWORD" ]; then
    print_error "DOCKER_USERNAME and DOCKER_PASSWORD environment variables must be set"
    print_info "Usage:"
    print_info "  export DOCKER_USERNAME=your-username"
    print_info "  export DOCKER_PASSWORD=your-password"
    print_info "  ./scripts/docker-login.sh"
    exit 1
fi

# Login to registry
print_info "Logging in to registry ${REGISTRY}..."
echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USERNAME" --password-stdin "$REGISTRY" || {
    print_error "Failed to login to registry"
    exit 1
}

print_info "Successfully logged in to registry ${REGISTRY}"






