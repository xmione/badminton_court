#!/bin/bash

echo "=========================================="
echo "      DOCKER STORAGE INSPECTION TOOL     "
echo "=========================================="

echo -e "\n=== 1. SYSTEM OVERVIEW ==="
docker system df

echo -e "\n=== 2. BUILD CACHE ==="
echo "Build cache usage:"
docker builder prune --dry-run 2>&1 | grep "Total" || echo "Build cache is empty"

echo -e "\nBuild cache details:"
docker buildx du 2>/dev/null || echo "BuildKit cache not available"

echo -e "\n=== 3. VOLUMES ==="
echo "Volume list:"
docker volume ls --format "table {{.Name}}\t{{.Driver}}"

echo -e "\nVolume details:"
for volume in $(docker volume ls -q | head -5); do
    echo "Volume: $volume"
    docker volume inspect $volume --format 'Mountpoint: {{.Mountpoint}}'
    echo "---"
done

echo -e "\n=== 4. IMAGES ==="
echo "Largest images:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | sort -k3 -hr | head -10

echo -e "\n=== 5. CONTAINERS ==="
echo "Container status:"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Size}}"

echo -e "\n=== 6. BUILDKIT CACHE LOCATION ==="
case "$(uname -s)" in
    Linux*)  BUILDKIT_DIR="/var/lib/docker/buildkit" ;;
    Darwin*) BUILDKIT_DIR="$HOME/Library/Containers/com.docker.docker/Data/vms/0/data/buildkit" ;;
    CYGWIN*|MINGW*|MSYS*) BUILDKIT_DIR="\\wsl$\\docker-desktop-data\\data\\buildkit" ;;
    *)       BUILDKIT_DIR="unknown" ;;
esac

echo "BuildKit cache directory: $BUILDKIT_DIR"

if [ -d "$BUILDKIT_DIR" ]; then
    echo "BuildKit cache size:"
    if [ "$(uname -s)" = "Linux" ]; then
        sudo du -sh "$BUILDKIT_DIR" 2>/dev/null || echo "Cannot access (try with sudo)"
    else
        du -sh "$BUILDKIT_DIR" 2>/dev/null || echo "Cannot access"
    fi
else
    echo "BuildKit directory not found"
fi

echo -e "\n=== INSPECTION COMPLETE ==="