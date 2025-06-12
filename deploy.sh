#!/bin/bash

# 🚴 Race Cycling History App - One-Click Deployment Script
# =========================================================
# This script deploys the app anywhere with Docker support

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Utility functions
print_banner() {
    echo -e "${BOLD}${BLUE}"
    echo "🚴 Race Cycling History App - Deployment"
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

print_step() {
    echo -e "\n${BOLD}${BLUE}==>${NC} ${BOLD}$1${NC}"
}

# Configuration with defaults
DOMAIN=${DOMAIN:-"localhost"}
PORT=${PORT:-8080}
API_PORT=${API_PORT:-3001}
DEPLOYMENT_MODE=${DEPLOYMENT_MODE:-"simple"}
SSL_ENABLED=${SSL_ENABLED:-false}

print_banner

print_info "Deployment Configuration:"
echo "  🌐 Domain: $DOMAIN"
echo "  🔗 Frontend Port: $PORT"
echo "  ⚡ API Port: $API_PORT"
echo "  🚀 Mode: $DEPLOYMENT_MODE"
echo "  🔒 SSL: $SSL_ENABLED"
echo ""

# Pre-deployment checks
print_step "Running Pre-deployment Checks"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    print_info "Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

print_success "Docker and Docker Compose are available"

# Check if ports are available
if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
    print_warning "Port $PORT is already in use"
fi

if netstat -tuln 2>/dev/null | grep -q ":$API_PORT "; then
    print_warning "Port $API_PORT is already in use"
fi

# Create necessary directories
print_step "Setting up Directory Structure"

mkdir -p data logs backups ssl
print_success "Created directories: data, logs, backups, ssl"

# Initialize database if it doesn't exist
if [ ! -f "data/cycling_data.db" ]; then
    print_info "No existing database found. Setting up initial database..."
    if [ -f "database/cycling_data.db" ]; then
        cp database/cycling_data.db data/
        print_success "Copied existing database to data directory"
    else
        print_info "Will create new database on first run"
    fi
fi

# Choose deployment method based on mode
case $DEPLOYMENT_MODE in
    "simple")
        COMPOSE_FILE="docker-compose.yml"
        COMPOSE_CMD="docker-compose"
        ;;
    "production")
        COMPOSE_FILE="docker-compose.production.yml"
        COMPOSE_CMD="docker-compose -f docker-compose.production.yml"
        ;;
    "full-stack")
        COMPOSE_FILE="docker-compose.production.yml"
        COMPOSE_CMD="docker-compose -f docker-compose.production.yml --profile full-stack"
        ;;
    *)
        print_error "Invalid deployment mode: $DEPLOYMENT_MODE"
        print_info "Valid modes: simple, production, full-stack"
        exit 1
        ;;
esac

# Build and deploy
print_step "Building Application"

print_info "Building Docker images..."
$COMPOSE_CMD build --no-cache

print_success "Docker images built successfully"

print_step "Starting Services"

# Update environment variables
export DOMAIN PORT API_PORT SSL_ENABLED

print_info "Starting containers..."
$COMPOSE_CMD up -d

print_info "Waiting for services to be ready..."
sleep 15

# Health checks
print_step "Running Health Checks"

# Check API health
API_URL="http://localhost:$API_PORT/api/health"
for i in {1..30}; do
    if curl -f "$API_URL" >/dev/null 2>&1; then
        print_success "API health check passed"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "API health check failed after 30 attempts"
        print_info "Check logs with: $COMPOSE_CMD logs"
        exit 1
    fi
    sleep 2
done

# Check frontend
FRONTEND_URL="http://localhost:$PORT"
if curl -f "$FRONTEND_URL" >/dev/null 2>&1; then
    print_success "Frontend health check passed"
else
    print_warning "Frontend might not be ready yet (this is sometimes normal)"
fi

# Final success message
print_step "Deployment Complete! 🎉"

echo ""
echo -e "${GREEN}${BOLD}🌐 Your Race Cycling History App is now running!${NC}"
echo ""
echo -e "${BOLD}Access URLs:${NC}"
echo "  📱 Frontend: http://$DOMAIN:$PORT"
echo "  ⚡ API: http://$DOMAIN:$API_PORT/api"
echo "  🏥 Health Check: http://$DOMAIN:$API_PORT/api/health"
echo ""
echo -e "${BOLD}Management Commands:${NC}"
echo "  📊 View logs: $COMPOSE_CMD logs -f"
echo "  📈 View status: $COMPOSE_CMD ps"
echo "  🔄 Restart: $COMPOSE_CMD restart"
echo "  🛑 Stop: $COMPOSE_CMD down"
echo "  🗑️  Remove: $COMPOSE_CMD down -v"
echo ""

# Show additional info based on deployment mode
if [ "$DEPLOYMENT_MODE" = "production" ] || [ "$DEPLOYMENT_MODE" = "full-stack" ]; then
    echo -e "${BOLD}Production Features:${NC}"
    echo "  🔒 SSL Support (if configured)"
    echo "  💾 Automatic backups to ./backups/"
    echo "  📊 Resource limits and monitoring"
    echo "  🔄 Auto-restart on failure"
    echo ""
fi

# Show next steps
echo -e "${BOLD}Next Steps:${NC}"
echo "1. 🌐 Open http://$DOMAIN:$PORT in your browser"
echo "2. 🔍 Test the search functionality"
echo "3. 📊 Check that charts are working"
echo "4. 🔄 Run the scraper to get fresh data (if needed)"
echo ""

# Environment-specific instructions
if [ "$DOMAIN" != "localhost" ]; then
    echo -e "${YELLOW}${BOLD}For public deployment:${NC}"
    echo "  - Make sure firewall allows ports $PORT and $API_PORT"
    echo "  - Consider setting up SSL certificates"
    echo "  - Update DNS records if using custom domain"
    echo ""
fi

print_success "Deployment completed successfully!"
echo ""
echo -e "${BLUE}For support: Check DEPLOYMENT.md or create an issue${NC}"