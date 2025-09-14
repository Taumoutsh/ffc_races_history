#!/bin/bash

# Production Deployment Script
set -e

echo "🚴 Race Cycling History App - Production Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
DOMAIN=${DOMAIN:-"localhost"}
PORT=${PORT:-8080}
API_PORT=${API_PORT:-3001}
SSL_ENABLED=${SSL_ENABLED:-false}

print_info "Production deployment configuration:"
echo "  Domain: $DOMAIN"
echo "  Frontend Port: $PORT"
echo "  API Port: $API_PORT"
echo "  SSL Enabled: $SSL_ENABLED"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    print_info "Docker detected. Deploying with Docker..."
    
    # Create production docker-compose override
    cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  race-cycling-app:
    environment:
      - NODE_ENV=production
      - DOMAIN=$DOMAIN
    ports:
      - "$PORT:80"
      - "$API_PORT:3001"
    volumes:
      - ./data:/app/data:rw
      - ./logs:/var/log/nginx:rw
    restart: unless-stopped

EOF

    # Add SSL configuration if enabled
    if [ "$SSL_ENABLED" = "true" ]; then
        print_info "SSL enabled - setting up HTTPS configuration..."
        cat >> docker-compose.prod.yml << EOF
  nginx-proxy:
    profiles: []  # Always run in production
    environment:
      - SSL_ENABLED=true
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
EOF
    fi

    # Build and deploy
    print_info "Building Docker images..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

    print_info "Starting production services..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

    # Wait for services to be ready
    print_info "Waiting for services to start..."
    sleep 10

    # Health check
    if curl -f http://localhost:$API_PORT/api/health >/dev/null 2>&1; then
        print_success "Production deployment successful!"
        echo ""
        echo "🌐 Application URLs:"
        echo "  Frontend: http://$DOMAIN:$PORT"
        echo "  API: http://$DOMAIN:$API_PORT/api"
        echo "  Health Check: http://$DOMAIN:$API_PORT/api/health"
        echo ""
        echo "📊 To view logs:"
        echo "  docker-compose logs -f"
        echo ""
        echo "🛑 To stop:"
        echo "  docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
    else
        print_error "Health check failed. Check logs with: docker-compose logs"
        exit 1
    fi

else
    # Manual production deployment
    print_info "Docker not found. Setting up manual production deployment..."
    
    # Check requirements
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is required for production deployment"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        print_error "Node.js is required to build the frontend"
        exit 1
    fi

    # Create production directory
    PROD_DIR="/opt/race-cycling-app"
    print_info "Creating production directory: $PROD_DIR"
    
    if [ ! -w "$(dirname "$PROD_DIR")" ]; then
        print_warning "Need sudo access to create $PROD_DIR"
        sudo mkdir -p "$PROD_DIR"
        sudo chown $(whoami):$(whoami) "$PROD_DIR"
    else
        mkdir -p "$PROD_DIR"
    fi

    # Build the application
    print_info "Building application..."
    npm ci --only=production
    npm run build

    # Copy files to production directory
    print_info "Copying files to production directory..."
    cp -r dist/* "$PROD_DIR/"
    cp -r backend "$PROD_DIR/"
    cp requirements.txt "$PROD_DIR/"
    cp -r docker "$PROD_DIR/"

    # Setup Python environment
    print_info "Setting up Python environment..."
    cd "$PROD_DIR"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt

    # Create systemd service
    print_info "Creating systemd service..."
    sudo tee /etc/systemd/system/race-cycling-app.service > /dev/null << EOF
[Unit]
Description=Race Cycling History App API Server
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$PROD_DIR
Environment=DB_PATH=$PROD_DIR/data/cycling_data.db
Environment=PORT=$API_PORT
Environment=NODE_ENV=production
ExecStart=$PROD_DIR/venv/bin/python -m backend.api.server
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

    # Create nginx configuration
    if command -v nginx &> /dev/null; then
        print_info "Setting up Nginx configuration..."
        sudo tee /etc/nginx/sites-available/race-cycling-app > /dev/null << EOF
server {
    listen $PORT;
    server_name $DOMAIN;
    root $PROD_DIR;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:$API_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

        sudo ln -sf /etc/nginx/sites-available/race-cycling-app /etc/nginx/sites-enabled/
        sudo nginx -t
        sudo systemctl reload nginx
        print_success "Nginx configured"
    fi

    # Start services
    print_info "Starting services..."
    sudo systemctl daemon-reload
    sudo systemctl enable race-cycling-app
    sudo systemctl start race-cycling-app

    # Health check
    sleep 5
    if curl -f http://localhost:$API_PORT/api/health >/dev/null 2>&1; then
        print_success "Production deployment successful!"
        echo ""
        echo "🌐 Application URLs:"
        echo "  Frontend: http://$DOMAIN:$PORT"
        echo "  API: http://$DOMAIN:$API_PORT/api"
        echo ""
        echo "📊 Service management:"
        echo "  Status: sudo systemctl status race-cycling-app"
        echo "  Logs: sudo journalctl -u race-cycling-app -f"
        echo "  Restart: sudo systemctl restart race-cycling-app"
    else
        print_error "Health check failed. Check service status: sudo systemctl status race-cycling-app"
        exit 1
    fi
fi