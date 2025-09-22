#!/bin/bash

# Cycling History App - Cron Setup Script
# This script configures a crontab entry for weekly data scraping

set -e

# Configuration
PROJECT_DIR="projects"
APP_NAME="race-cycling-app"
SCRIPT_PATH="$HOME/$PROJECT_DIR/${APP_NAME}/cron/weekly-scrape.sh"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🕐 Cycling History App - Cron Setup"
echo "=================================="

# Check if weekly-scrape.sh exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo -e "${RED}Error: weekly-scrape.sh not found at $SCRIPT_PATH${NC}"
    echo "Please make sure the script exists and is executable."
    echo "Expected location: $SCRIPT_PATH"
    exit 1
fi

# Make sure the script is executable
chmod +x "$SCRIPT_PATH"

# Crontab entry: Every Thursday at 3:00 AM
CRON_ENTRY="0 3 * * 2,4 $SCRIPT_PATH >> $HOME/$PROJECT_DIR/${APP_NAME}/cron_logs/cron.log 2>&1"

echo -e "${YELLOW}Setting up crontab entry...${NC}"
echo "Schedule: Every Thursday at 3:00 AM"
echo "Script: $SCRIPT_PATH"
echo "Log file: $HOME/$PROJECT_DIR/${APP_NAME}/cron_logs/cron.log"
echo ""

# Check if crontab entry already exists
if crontab -l 2>/dev/null | grep -q "$SCRIPT_PATH"; then
    echo -e "${YELLOW}Found existing crontab entry for this script.${NC}"
    echo "Current crontab entries:"
    crontab -l 2>/dev/null | grep "$SCRIPT_PATH" || true
    echo ""
    read -p "Do you want to replace it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled. No changes made."
        exit 0
    fi

    # Remove existing entries for this script
    crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH" | crontab -
    echo -e "${GREEN}Removed existing crontab entry.${NC}"
fi

# Add new crontab entry
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo -e "${GREEN}✅ Crontab entry added successfully!${NC}"
echo ""
echo "📋 Current crontab entries:"
crontab -l
echo ""
echo -e "${GREEN}🎯 Summary:${NC}"
echo "• Weekly data scraping will run every Thursday at 3:00 AM"
echo "• All 4 regions will be processed: pays-de-la-loire, bretagne, nouvelle-aquitaine, centre-val-de-loire"
echo "• Database backup will be created before each scraping session"
echo "• Logs will be saved to: $HOME/$PROJECT_DIR/${APP_NAME}/cron_logs/"
echo ""
echo -e "${YELLOW}📌 Useful commands:${NC}"
echo "• View crontab: crontab -l"
echo "• Edit crontab: crontab -e"
echo "• Remove crontab entry: crontab -l | grep -v '$SCRIPT_PATH' | crontab -"
echo "• View logs: tail -f $HOME/$PROJECT_DIR/${APP_NAME}/cron_logs/weekly-scrape.log"
echo "• Test script manually: $SCRIPT_PATH"
echo ""
echo -e "${GREEN}Setup complete! 🎉${NC}"