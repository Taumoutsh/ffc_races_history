#!/bin/bash

# Race Cycling History App - Region Scraper with Backup
# This script creates a database backup and runs the optimized scraper for a specific region

set -e

# Configuration (matching deploy-vps.sh)
PROJECT_DIR="projects"
APP_NAME="race-cycling-app"
APP_DIR="$HOME/$PROJECT_DIR/${APP_NAME}"
DATA_DIR="$HOME/$PROJECT_DIR/${APP_NAME}/data"

# Backup configuration
BACKUP_DIR="$HOME/database-backups"

# Available regions
AVAILABLE_REGIONS=("pays-de-la-loire" "bretagne" "nouvelle-aquitaine" "centre-val-de-loire")

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

# Usage function
show_usage() {
    echo "🕷️  Race Cycling History App - Region Scraper"
    echo "============================================="
    echo ""
    echo "Usage: $0 <region>"
    echo ""
    echo "Available regions:"
    for region in "${AVAILABLE_REGIONS[@]}"; do
        echo "  - $region"
    done
    echo ""
    echo "Examples:"
    echo "  $0 pays-de-la-loire"
    echo "  $0 bretagne"
    echo "  $0 nouvelle-aquitaine"
    echo ""
}

# Validate region parameter
validate_region() {
    local region="$1"
    for valid_region in "${AVAILABLE_REGIONS[@]}"; do
        if [[ "$region" == "$valid_region" ]]; then
            return 0
        fi
    done
    return 1
}

# Create database backup
create_backup() {
    log_info "🗄️  Creating database backup..."

    local timestamp=$(date +"%Y%m%d_%H%M%S")

    # Create backup directory if it doesn't exist
    mkdir -p "${BACKUP_DIR}"

    # Backup cycling data database
    if [ -f "${DATA_DIR}/cycling_data.db" ]; then
        cp "${DATA_DIR}/cycling_data.db" "${BACKUP_DIR}/cycling_data_backup_${timestamp}.db"
        log_info "Cycling database backed up to: ${BACKUP_DIR}/cycling_data_backup_${timestamp}.db"
    else
        log_warn "No cycling database found to backup at: ${DATA_DIR}/cycling_data.db"
    fi

    # Backup auth database if it exists
    if [ -f "${DATA_DIR}/auth.db" ]; then
        cp "${DATA_DIR}/auth.db" "${BACKUP_DIR}/auth_backup_${timestamp}.db"
        log_info "Auth database backed up to: ${BACKUP_DIR}/auth_backup_${timestamp}.db"
    else
        log_warn "No auth database found to backup"
    fi

    echo ""
}

# Run scraper for specific region
run_scraper() {
    local region="$1"

    log_info "🕷️  Running scraper for region: $region"
    log_info "This may take several minutes to complete..."
    echo ""

    # Change to app directory for docker compose
    cd "${APP_DIR}"

    # Run the optimized scraper
    if docker compose run --rm race-cycling-app python -m backend.scrapers.cycling_scraper_db_optimized --region "$region"; then
        log_info "✅ Scraping completed successfully for region: $region"
    else
        log_error "❌ Scraping failed for region: $region"
        return 1
    fi
}

# Main function
main() {
    echo "🕷️  Race Cycling History App - Region Scraper"
    echo "============================================="
    echo ""

    # Check if region parameter is provided
    if [ $# -eq 0 ]; then
        log_error "No region specified"
        echo ""
        show_usage
        exit 1
    fi

    local region="$1"

    # Validate region
    if ! validate_region "$region"; then
        log_error "Invalid region: $region"
        echo ""
        show_usage
        exit 1
    fi

    # Check if app directory exists
    if [ ! -d "${APP_DIR}" ]; then
        log_error "Application directory not found: ${APP_DIR}"
        log_error "Please run deploy-vps.sh first to set up the application"
        exit 1
    fi

    # Check if Docker Compose is available
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi

    # Check if application is running
    if ! curl -f http://localhost/health >/dev/null 2>&1; then
        log_warn "Application health check failed - it may not be running"
        log_warn "You may need to start it with: cd ${APP_DIR} && docker compose up -d"
    fi

    # Create backup before scraping
    create_backup

    # Run scraper for the specified region
    if run_scraper "$region"; then
        echo ""
        log_info "🎉 Scraping process completed successfully!"
        echo ""
        echo "📍 Region scraped: $region"
        echo "🗄️  Backup location: ${BACKUP_DIR}/"
        echo "📊 Database location: ${DATA_DIR}/cycling_data.db"
        echo ""
        echo "🔧 To scrape other regions:"
        for other_region in "${AVAILABLE_REGIONS[@]}"; do
            if [[ "$other_region" != "$region" ]]; then
                echo "   $0 $other_region"
            fi
        done
    else
        echo ""
        log_error "❌ Scraping process failed"
        echo ""
        echo "🗄️  Database backup is still available at: ${BACKUP_DIR}/"
        echo "🔍 Check logs with: cd ${APP_DIR} && docker compose logs race-cycling-app"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"