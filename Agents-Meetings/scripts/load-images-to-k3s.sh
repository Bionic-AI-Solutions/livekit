#!/bin/bash
set -e

# Script to load Docker images into K3s
# K3s uses containerd, so we need to import images differently

REGISTRY="registry.bionicaisolutions.com"
PROJECT_NAME="meeting-platform"
VERSION="${VERSION:-latest}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if we're on a K3s node
if [ -f /var/lib/rancher/k3s/agent/etc/containerd/config.toml ] || command -v k3s &> /dev/null; then
    print_info "Detected K3s environment"
    USE_K3S=true
else
    print_info "Using standard Docker/containerd"
    USE_K3S=false
fi

# Get the base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BASE_DIR"

IMAGES=(
    "backend"
    "frontend"
    "avatar-agent"
    "translation-agent"
    "room-manager-agent"
)

for image in "${IMAGES[@]}"; do
    image_name=$(echo "$image" | tr '_' '-')
    local_tag="${PROJECT_NAME}-${image_name}:${VERSION}"
    registry_tag="${REGISTRY}/${PROJECT_NAME}-${image_name}:${VERSION}"
    
    print_info "Processing ${image_name}..."
    
    # Check if image exists locally
    if docker images | grep -q "${local_tag}"; then
        print_info "Found local image: ${local_tag}"
        
        # Tag for registry
        docker tag "${local_tag}" "${registry_tag}" 2>/dev/null || true
        
        # For K3s, we can use k3s ctr or import via docker save/load
        if [ "$USE_K3S" = true ]; then
            print_info "Importing ${image_name} into K3s..."
            # Save image and import into containerd
            docker save "${registry_tag}" | sudo k3s ctr images import - || {
                print_warn "Failed to import via k3s ctr, trying alternative method..."
                # Alternative: copy to K3s image directory
                docker save "${registry_tag}" -o "/tmp/${image_name}.tar"
                sudo k3s ctr images import "/tmp/${image_name}.tar" || true
                rm -f "/tmp/${image_name}.tar"
            }
        else
            print_info "Image ${registry_tag} is ready (standard containerd/Docker)"
        fi
    else
        print_warn "Local image ${local_tag} not found. Make sure to build images first."
    fi
done

print_info "Image loading completed!"
print_info "If images weren't found locally, you may need to:"
print_info "  1. Build images: ./scripts/build-and-push.sh"
print_info "  2. Or push to registry and set up image pull secrets"






