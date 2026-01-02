#!/bin/bash
#
# Wrapper script untuk push tag dan auto-build Docker image
#
# Penggunaan:
#   ./scripts/docker-build-tag.sh <tag-name>       # Buat tag, push, dan build
#   ./scripts/docker-build-tag.sh --push-only      # Push tag yang sudah ada
#   ./scripts/docker-build-tag.sh --build-only     # Hanya build dari tag saat ini
#

set -e

IMAGE_NAME="haka-haki-tool"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_usage() {
    echo "Penggunaan:"
    echo "  $0 <tag-name>        Buat tag, push ke remote, dan build Docker image"
    echo "  $0 --push-only       Push tag yang sudah ada dan build Docker image"
    echo "  $0 --build-only      Hanya build Docker image dari tag saat ini"
    echo ""
    echo "Contoh:"
    echo "  $0 v1.0.0"
    echo "  $0 --push-only"
    exit 1
}

# Parse arguments
if [ $# -eq 0 ]; then
    print_usage
fi

MODE="full"
TAG_NAME=""

case "$1" in
    --help|-h)
        print_usage
        ;;
    --push-only)
        MODE="push-only"
        ;;
    --build-only)
        MODE="build-only"
        ;;
    *)
        TAG_NAME="$1"
        ;;
esac

# Get current tag if not specified
if [ -z "$TAG_NAME" ] && [ "$MODE" != "full" ]; then
    TAG_NAME=$(git describe --tags --exact-match 2>/dev/null || true)
    if [ -z "$TAG_NAME" ]; then
        echo -e "${RED}Error: Tidak ada tag yang ditemukan di HEAD${NC}"
        echo "Buat tag terlebih dahulu dengan: git tag <tag-name>"
        exit 1
    fi
fi

# Validate tag format
if [ -n "$TAG_NAME" ]; then
    if ! [[ "$TAG_NAME" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+.*$ ]]; then
        echo -e "${YELLOW}Warning: Format tag '$TAG_NAME' tidak mengikuti semver (v1.0.0)${NC}"
        read -p "Lanjutkan? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Build Docker image
build_docker_image() {
    local tag="$1"
    echo "================================================"
    echo -e "${GREEN}📦 Tag: $tag${NC}"
    echo -e "${GREEN}🐳 Membangun Docker image...${NC}"
    echo "================================================"

    docker build -t ${IMAGE_NAME}:${tag} -t ${IMAGE_NAME}:latest .

    echo ""
    echo -e "${GREEN}✅ Docker image berhasil dibuat:${NC}"
    echo -e "   ${GREEN}- ${IMAGE_NAME}:${tag}${NC}"
    echo -e "   ${GREEN}- ${IMAGE_NAME}:latest${NC}"
    echo ""
    echo "Untuk menjalankan container:"
    echo "   docker run -p 9000:9000 ${IMAGE_NAME}:${tag}"
    echo "================================================"

    docker images | grep ${IMAGE_NAME} | head -2
}

# Execute based on mode
case "$MODE" in
    full)
        echo -e "${YELLOW}Membuat tag: $TAG_NAME${NC}"
        git tag "$TAG_NAME"
        echo -e "${YELLOW}Pushing tag ke remote...${NC}"
        git push origin "$TAG_NAME"
        build_docker_image "$TAG_NAME"
        ;;
    push-only)
        echo -e "${YELLOW}Pushing tag $TAG_NAME ke remote...${NC}"
        git push origin "$TAG_NAME"
        build_docker_image "$TAG_NAME"
        ;;
    build-only)
        build_docker_image "$TAG_NAME"
        ;;
esac
