#!/bin/bash

# 🚴 Race Cycling History App - Installation Script
# =================================================
# Downloads and deploys the app in one command

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

print_banner() {
    echo -e "${BOLD}${BLUE}"
    echo "🚴 Race Cycling History App - Installer"
    echo "========================================"
    echo -e "${NC}"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Configuration
REPO_URL=${REPO_URL:-"https://github.com/Taumoutsh/ffc_races_history"}
INSTALL_DIR=${INSTALL_DIR:-"./race-cycling-app"}
DOMAIN=${DOMAIN:-"localhost"}
PORT=${PORT:-8080}

print_banner

print_info "Installation Configuration:"
echo "  📦 Repository: $REPO_URL"
echo "  📁 Install Directory: $INSTALL_DIR"
echo "  🌐 Domain: $DOMAIN"
echo "  🔗 Port: $PORT"
echo ""

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v curl &> /dev/null; then
    print_error "curl is required but not installed"
    exit 1
fi

if ! command -v git &> /dev/null; then
    print_warning "git not found, will attempt to download as archive"
    USE_GIT=false
else
    USE_GIT=true
    print_success "git is available"
fi

if ! command -v docker &> /dev/null; then
    print_error "Docker is required but not installed"
    print_info "Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is required but not installed"
    exit 1
fi

print_success "All prerequisites met"

# Download/clone the repository
print_info "Downloading application..."

if [ -d "$INSTALL_DIR" ]; then
    print_warning "Directory $INSTALL_DIR already exists"
    read -p "Remove and reinstall? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$INSTALL_DIR"
    else
        print_error "Installation cancelled"
        exit 1
    fi
fi

if [ "$USE_GIT" = true ]; then
    git clone "$REPO_URL" "$INSTALL_DIR"
    print_success "Repository cloned successfully"
else
    # Download as archive (fallback)
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    # Try to download main branch as zip
    ARCHIVE_URL="${REPO_URL}/archive/refs/heads/main.zip"
    print_info "Downloading from $ARCHIVE_URL"
    
    if curl -L "$ARCHIVE_URL" -o repo.zip; then
        if command -v unzip &> /dev/null; then
            unzip -q repo.zip
            mv */​* .
            rm -rf repo.zip */
            print_success "Archive downloaded and extracted"
        else
            print_error "unzip is required to extract the archive"
            exit 1
        fi
    else
        print_error "Failed to download repository archive"
        print_info "Please install git or download manually from $REPO_URL"
        exit 1
    fi
    
    cd ..
fi

# Change to install directory
cd "$INSTALL_DIR"

# Make deployment script executable
chmod +x deploy.sh

# Run deployment
print_info "Starting deployment..."

DOMAIN="$DOMAIN" PORT="$PORT" ./deploy.sh

# Final message
echo ""
echo -e "${GREEN}${BOLD}🎉 Installation Complete!${NC}"
echo ""
echo -e "${BOLD}Your Race Cycling History App is now running at:${NC}"
echo "  🌐 http://$DOMAIN:$PORT"
echo ""
echo -e "${BOLD}To manage your installation:${NC}"
echo "  📁 App directory: $(pwd)"
echo "  📊 View logs: docker-compose logs -f"
echo "  🔄 Restart: docker-compose restart"
echo "  🛑 Stop: docker-compose down"
echo ""
echo -e "${BLUE}Enjoy your cycling data! 🚴‍♂️${NC}"