#!/bin/bash

# Cycling History App - Docker Deployment Script
# This script sets up the application with Docker

set -e

echo "🚀 Cycling History App - Docker Deployment"
echo "============================================="

# Configuration
DOMAIN_NAME=$1
PROJECT_DIR="projects"
APP_NAME="race-cycling-app"
APP_DIR="$HOME/$PROJECT_DIR/${APP_NAME}"
DATA_DIR="$HOME/$PROJECT_DIR/${APP_NAME}/data"
LOG_DIR="$HOME/$PROJECT_DIR/${APP_NAME}/logs"
SSL_DIR="$HOME/$PROJECT_DIR/${APP_NAME}/ssl"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    echo "Install with: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop all running containers before deployment
log_info "Stopping all running Docker containers..."
if [ "$(docker ps -q)" ]; then
    docker stop $(docker ps -q) || log_warn "Some containers could not be stopped"
    log_info "All containers stopped"
else
    log_info "No running containers found"
fi

# Save current database before creating/modifying directories
if [ -d "${APP_DIR}" ]; then
    log_info "Backing up current database before deployment..."
    BACKUP_DIR="$HOME/database-backups"
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

    mkdir -p "${BACKUP_DIR}"

    # Backup existing cycling data database
    if [ -f "${DATA_DIR}/cycling_data.db" ]; then
        cp "${DATA_DIR}/cycling_data.db" "${BACKUP_DIR}/cycling_data_pre_deploy_${TIMESTAMP}.db"
        log_info "Current database backed up to: ${BACKUP_DIR}/cycling_data_pre_deploy_${TIMESTAMP}.db"
    else
        log_warn "No existing cycling database found to backup"
    fi

    # Backup existing auth database
    if [ -f "${DATA_DIR}/auth.db" ]; then
        cp "${DATA_DIR}/auth.db" "${BACKUP_DIR}/auth_pre_deploy_${TIMESTAMP}.db"
        log_info "Current auth database backed up to: ${BACKUP_DIR}/auth_pre_deploy_${TIMESTAMP}.db"
    else
        log_warn "No existing auth database found to backup"
    fi
else
    log_info "No existing application directory found - fresh installation"
fi

# Create application directories
log_info "Creating application directories..."
# Remove existing directories if they have wrong permissions
if [ -d "${APP_DIR}" ] && ! [ -w "${DATA_DIR}" ] 2>/dev/null; then
    log_warn "Removing directories with wrong permissions..."
    sudo rm -rf "${APP_DIR}"
fi

mkdir -p "${APP_DIR}" "${DATA_DIR}" "${LOG_DIR}" "${SSL_DIR}"

# Copy application files
log_info "Copying application files..."
if [ ! -f "docker-compose.yml" ]; then
    log_error "docker-compose.yml not found in current directory"
    exit 1
fi

cp -r * "${APP_DIR}/"
cp .env.production "${APP_DIR}/"
cd "${APP_DIR}"

# Copy database to data directory if it exists
log_info "Setting up cycling data database..."
if [ ! -f "${DATA_DIR}/cycling_data.db" ]; then
    cp "backend/database/cycling_data.db" "${DATA_DIR}/"
    chmod 666 "${DATA_DIR}/cycling_data.db" 2>/dev/null || true
    log_info "Database copied to data directory"
else
    log_info "Database already exists in ${DATA_DIR}."
fi

# Copy auth database to data directory if it exists
log_info "Setting up auth database..."
if [ ! -f "${DATA_DIR}/auth.db" ]; then
    cp "backend/database/auth.db" "${DATA_DIR}/"
    chmod 666 "${DATA_DIR}/auth.db" 2>/dev/null || true
    log_info "Database copied to data directory"
else
    log_info "Database already exists in ${DATA_DIR}."
fi

# Set ownership to match Docker container user (UID:GID 1001:1001) if sudo available
if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
    sudo chown -R 1001:1001 "${DATA_DIR}" "${LOG_DIR}"
    log_info "Ownership set to UID:GID 1001:1001 (Docker appuser)"
else
    log_warn "Cannot set ownership without sudo - setting permissions to 777 for fallback"
    sudo chmod 777 "${DATA_DIR}" "${LOG_DIR}"
fi

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    log_info "Creating environment file..."
    cat > .env << EOF
# Cycling History App Configuration
FLASK_ENV=production
DB_PATH=/app/data/cycling_data.db
AUTH_DB_PATH=/app/data/auth.db
PORT=5000
HOST=0.0.0.0

# Security (change these in production)
JWT_SECRET_KEY=$(openssl rand -hex 32)
FLASK_SECRET_KEY=$(openssl rand -hex 32)

# Optional: Database backup settings
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30
EOF
fi

# Create nginx configuration
log_info "Creating nginx configuration..."
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name _;

        # Security headers
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        add_header X-XSS-Protection "1; mode=block";
        add_header Referrer-Policy "strict-origin-when-cross-origin";

        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://race-cycling-app:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Content-Type $content_type;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # Static assets (JS, CSS, images, etc.)
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            root /usr/share/nginx/html;
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }

        # Frontend application (SPA)
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://race-cycling-app:5000/api/health;
            access_log off;
        }
    }

    HTTPS server (uncomment and configure SSL certificates)
    server {
        listen 443 ssl http2;
        server_name ${DOMAIN_NAME};
    
        ssl_certificate /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
    
        # Same location blocks as HTTP server above
    }
}
EOF

# Create optional scraper Dockerfile
log_info "Creating scraper Dockerfile..."
cat > Dockerfile.scraper << 'EOF'
FROM python:3.11-alpine

# Install system dependencies
RUN apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

USER appuser

# Run optimized scraper
CMD ["python", "-m", "backend.scrapers.cycling_scraper_db_optimized"]
EOF

# Initialize database if it doesn't exist
if [ ! -f "${DATA_DIR}/cycling_data.db" ]; then
    log_info "Database not found. You may need to initialize it manually or run the scraper."
    log_warn "Make sure to copy your existing database to ${DATA_DIR}/cycling_data.db"
fi

# Set up log rotation (optional - requires sudo)
log_info "Setting up log rotation..."
if sudo -n true 2>/dev/null; then
    sudo bash -c "cat > /etc/logrotate.d/${APP_NAME} << EOF
${LOG_DIR}/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 $USER $USER
    postrotate
        docker compose -f ${APP_DIR}/docker-compose.yml restart nginx >/dev/null 2>&1 || true
    endscript
}
EOF"
else
    log_warn "Skipping log rotation setup - requires sudo access"
fi

# Build and start services
log_info "Building Docker images..."
docker compose build

log_info "Starting services..."
docker compose up -d

# Wait for services to be ready
log_info "Waiting for services to start..."
sleep 10

# Health check
log_info "Performing health check..."
if curl -f http://localhost/health >/dev/null 2>&1; then
    log_info "✅ Application is running successfully!"
    echo ""
    echo "🌐 Access your application at:"
    echo "   - Local: http://localhost"
    if command -v ip &> /dev/null; then
        IP=$(ip route get 8.8.8.8 | awk '{print $7}' | head -n1)
        echo "   - Network: http://${IP}"
    fi
    echo ""
    echo "📁 Application files: ${APP_DIR}"
    echo "📊 Database location: ${DATA_DIR}/cycling_data.db"
    echo "📝 Logs location: ${LOG_DIR}"
    if [ -d "$HOME/database-backups" ] && [ "$(ls -A $HOME/database-backups 2>/dev/null)" ]; then
        echo "🗄️  Database backups: $HOME/database-backups/"
    fi
    echo ""
    echo "🔧 Useful commands:"
    echo "   - View logs: docker compose -f ${APP_DIR}/docker-compose.yml logs -f"
    echo "   - Restart: docker compose -f ${APP_DIR}/docker-compose.yml restart"
    echo "   - Stop: docker compose -f ${APP_DIR}/docker-compose.yml down"
    echo "   - Update: cd ${APP_DIR} && git pull && docker compose build && docker compose up -d"
    echo "🕷️  To run the scraper again manually:"
    echo "   - docker compose run --rm race-cycling-app python -m backend.scrapers.cycling_scraper_db_optimized --region pays-de-la-loire"
    echo "   - docker compose run --rm race-cycling-app python -m backend.scrapers.cycling_scraper_db_optimized --region bretagne"
    echo "   - docker compose run --rm race-cycling-app python -m backend.scrapers.cycling_scraper_db_optimized --region nouvelle-aquitaine"
    echo "   - docker compose run --rm race-cycling-app python -m backend.scrapers.cycling_scraper_db_optimized --region centre-val-de-loire"

else
    log_error "❌ Health check failed. Check the logs:"
    docker compose logs
    exit 1
fi

log_info "🎉 Deployment completed successfully!"