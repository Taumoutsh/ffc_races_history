#!/bin/bash

# Race Cycling History App - Database Setup Script
# Sets up the database and migrates existing YAML data

set -e  # Exit on any error

echo "🚀 Setting up Race Cycling Database..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Create database directory
mkdir -p backend/database

# Setup Python virtual environment and install dependencies
echo "📦 Setting up Python environment..."
if [ ! -d "scraper_env" ]; then
    python3 -m venv scraper_env
fi

source scraper_env/bin/activate
pip install -r requirements.txt

# Create empty database with schema (no migration from YAML)
echo "📁 Creating empty database with schema..."
python -c "
from backend.database.models import CyclingDatabase
db = CyclingDatabase('backend/database/cycling_data.db')
print('✅ Empty database created with schema')
"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📊 Database Statistics:"
python -c "
from backend.database.models import CyclingDatabase
db = CyclingDatabase('backend/database/cycling_data.db')
stats = db.get_database_stats()
print(f'   - Total races: {stats[\"total_races\"]}')
print(f'   - Total cyclists: {stats[\"total_cyclists\"]}')
print(f'   - Total results: {stats[\"total_results\"]}')
"

echo ""
echo "🚀 Next steps:"
echo "   1. Run the scraper to populate database: ./run_scraper.sh"
echo "   2. Start the full application: ./start_full_app.sh"
echo "   Or manually:"
echo "   - Start API server: ./start_api.sh"
echo "   - Start React app: npm run dev"
echo ""