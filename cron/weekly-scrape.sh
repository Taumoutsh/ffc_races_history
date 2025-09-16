#!/bin/bash

# Cycling History App - Weekly Data Scraping
# This script runs the scraper for all 4 regions automatically using scrape-region.sh
# Designed to run via crontab every Thursday at 3am

set -e

# Configuration
PROJECT_DIR="projects"
APP_NAME="race-cycling-app"
APP_DIR="$HOME/$PROJECT_DIR/${APP_NAME}"
LOG_FILE="$HOME/$PROJECT_DIR/${APP_NAME}/cron_logs/weekly-scrape.log"
SCRAPE_SCRIPT="$HOME/$PROJECT_DIR/${APP_NAME}/scrape-region.sh"

# Available regions
REGIONS=("pays-de-la-loire" "bretagne" "nouvelle-aquitaine" "centre-val-de-loire")

# Colors for output (in case script is run manually)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to run scraper for a specific region using existing scrape-region.sh
scrape_region() {
    local region="$1"
    log_info "Starting scraper for region: $region (using scrape-region.sh)"

    if "$SCRAPE_SCRIPT" "$region" >> "$LOG_FILE" 2>&1; then
        log_info "✅ Successfully completed scraping for region: $region"
        return 0
    else
        log_error "❌ Failed to scrape region: $region"
        return 1
    fi
}

# Main execution
main() {
    local start_time=$(date)
    local total_regions=${#REGIONS[@]}
    local successful_regions=0
    local failed_regions=0

    log_info "=========================================="
    log_info "Starting weekly data scraping session"
    log_info "Date: $start_time"
    log_info "Regions to process: ${REGIONS[*]}"
    log_info "=========================================="

    # Check if scrape-region.sh script exists
    if [ ! -f "$SCRAPE_SCRIPT" ]; then
        log_error "scrape-region.sh script not found: $SCRAPE_SCRIPT"
        log_error "Please ensure the script exists and is executable"
        exit 1
    fi

    # Make sure the script is executable
    chmod +x "$SCRAPE_SCRIPT"

    # Process each region sequentially
    for region in "${REGIONS[@]}"; do
        log_info "Processing region $((successful_regions + failed_regions + 1))/$total_regions: $region"

        if scrape_region "$region"; then
            ((successful_regions++))
        else
            ((failed_regions++))
        fi

        # Add delay between regions to avoid overwhelming the server
        if [ $((successful_regions + failed_regions)) -lt $total_regions ]; then
            log_info "Waiting 30 seconds before next region..."
            sleep 30
        fi
    done

    # Final summary
    local end_time=$(date)
    log_info "=========================================="
    log_info "Weekly scraping session completed"
    log_info "Start time: $start_time"
    log_info "End time: $end_time"
    log_info "Total regions: $total_regions"
    log_info "Successful: $successful_regions"
    log_info "Failed: $failed_regions"
    log_info "=========================================="

    # Exit with error code if any region failed
    if [ $failed_regions -gt 0 ]; then
        log_error "Some regions failed to scrape. Check logs above."
        exit 1
    else
        log_info "🎉 All regions scraped successfully!"
        exit 0
    fi
}

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Run main function
main "$@" 2>&1 | tee -a "$LOG_FILE"