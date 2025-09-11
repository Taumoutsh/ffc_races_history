#!/bin/bash

# Race Cycling Scraper Launcher
# Launches the Python web scraper to collect new race data

echo "🕷️  Race Cycling Data Scraper"
echo "=============================="

# Function to show usage
show_usage() {
    echo "Usage: $0 [db|yaml] [region]"
    echo ""
    echo "Options:"
    echo "  db    - Run database scraper (recommended, saves to SQLite)"
    echo "  yaml  - Run legacy YAML scraper (saves to public/data.yaml)"
    echo ""
    echo "Available regions:"
    echo "  pays-de-la-loire   - Pays de la Loire (default)"
    echo "  bretagne           - Bretagne"
    echo "  nouvelle-acquitaine - Nouvelle-Acquitaine"
    echo ""
    echo "Examples:"
    echo "  $0                              # Database scraper, Pays de la Loire"
    echo "  $0 db pays-de-la-loire          # Database scraper, Pays de la Loire"
    echo "  $0 db bretagne                  # Database scraper, Bretagne"
    echo "  $0 db nouvelle-acquitaine       # Database scraper, Nouvelle-Acquitaine"
    echo "  $0 yaml                         # Legacy YAML scraper"
    echo ""
    echo "If no options are provided, database scraper with Pays de la Loire will be used."
    exit 1
}

# Function to create database backup
create_backup() {
    if [ -f "backend/database/cycling_data.db" ]; then
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        BACKUP_FILE="backend/database/cycling_data_backup_${TIMESTAMP}.db"
        echo "💾 Creating database backup: $BACKUP_FILE"
        cp "backend/database/cycling_data.db" "$BACKUP_FILE"
        if [ $? -eq 0 ]; then
            echo "✅ Database backup created successfully"
        else
            echo "❌ Failed to create database backup"
        fi
    fi
}

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Scraper interrupted by user"
    
    # Create backup if database exists
    if [ "$SCRAPER_TYPE" == "db" ]; then
        create_backup
    fi
    
    # Deactivate virtual environment if active
    if [[ "$VIRTUAL_ENV" != "" ]]; then
        echo "🔧 Deactivating virtual environment..."
        deactivate 2>/dev/null
    fi
    exit 0
}

# Set trap to handle Ctrl+C
trap cleanup SIGINT SIGTERM

# Check command line arguments
SCRAPER_TYPE=${1:-db}
REGION=${2:-pays-de-la-loire}

# Validate scraper type
if [[ "$SCRAPER_TYPE" != "db" && "$SCRAPER_TYPE" != "yaml" ]]; then
    echo "❌ Invalid scraper type: $SCRAPER_TYPE"
    show_usage
fi

# Validate region
VALID_REGIONS=("pays-de-la-loire" "bretagne" "nouvelle-acquitaine")
if [[ ! " ${VALID_REGIONS[@]} " =~ " ${REGION} " ]]; then
    echo "❌ Invalid region: $REGION"
    echo "Available regions: ${VALID_REGIONS[*]}"
    show_usage
fi

# Check if virtual environment exists
if [ ! -d "scraper_env" ]; then
    echo "❌ Virtual environment not found."
    echo "💡 Run ./setup_database.sh to set up the environment first"
    exit 1
fi

echo "🔧 Activating Python virtual environment..."
source scraper_env/bin/activate

# Verify virtual environment is active
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "❌ Failed to activate virtual environment"
    echo "💡 Check if scraper_env directory exists and is properly configured"
    exit 1
fi

echo "✅ Virtual environment activated: $(basename $VIRTUAL_ENV)"

# Set Python path to include backend directory for imports
export PYTHONPATH="${PWD}/backend:${PYTHONPATH}"
echo "🔧 Python path configured for backend imports"

# Check Python dependencies
echo "📦 Checking dependencies..."
python -c "import requests, bs4, yaml" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Missing required Python packages."
    echo "💡 Run ./setup_database.sh to install dependencies"
    deactivate 2>/dev/null
    exit 1
fi

if [ "$SCRAPER_TYPE" == "db" ]; then
    echo "🗄️  Running OPTIMIZED DATABASE scraper..."
    echo "📍 Target: SQLite database (backend/database/cycling_data.db)"
    
    # Check if database exists
    if [ ! -f "backend/database/cycling_data.db" ]; then
        echo "❌ Database not found. Run ./setup_database.sh first"
        exit 1
    fi
    
    # Display region-specific information
    case "$REGION" in
        "pays-de-la-loire")
            REGION_NAME="Pays de la Loire"
            ;;
        "bretagne")
            REGION_NAME="Bretagne"
            ;;
        "nouvelle-acquitaine")
            REGION_NAME="Nouvelle-Acquitaine"
            ;;
    esac
    
    echo "🌐 Scraping from: velo.ffc.fr"
    echo "🏴 Target region: $REGION_NAME ($REGION)"
    echo "⏳ This may take several minutes for new races..."
    echo "📊 Enhanced logging and progress tracking enabled"
    echo ""
    echo "Press Ctrl+C to stop scraping"
    echo ""
    
    python backend/scrapers/cycling_scraper_db_optimized.py --region "$REGION"
    
else
    echo "📄 Running YAML scraper (legacy)..."
    echo "📍 Target: public/data.yaml"
    echo "🌐 Scraping from: velo.ffc.fr"
    echo "🏴 Target region: $REGION_NAME ($REGION) - Note: Legacy scraper only supports Pays de la Loire"
    echo "⏳ This may take several minutes for new races..."
    echo ""
    echo "Press Ctrl+C to stop scraping"
    echo ""
    
    python backend/scrapers/cycling_scraper.py
fi

# Check exit status
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Scraping completed successfully!"
    
    if [ "$SCRAPER_TYPE" == "db" ]; then
        echo "📊 Data saved to: backend/database/cycling_data.db"
        echo "🔄 Restart API server to see new data: ./start_api.sh"
        
        # Create backup after successful completion
        create_backup
    else
        echo "📊 Data saved to: public/data.yaml"
        echo "🔄 Refresh your browser to see new data"
    fi
    
    echo ""
    echo "💡 You can now run ./start_full_app.sh to start the application"
else
    echo ""
    echo "❌ Scraping failed or was interrupted"
    echo "💡 Check the error messages above for details"
fi

# Deactivate virtual environment
if [[ "$VIRTUAL_ENV" != "" ]]; then
    echo "🔧 Deactivating virtual environment..."
    deactivate 2>/dev/null
fi