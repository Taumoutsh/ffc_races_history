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
mkdir -p database

# Setup Python virtual environment and install dependencies
echo "📦 Setting up Python environment..."
if [ ! -d "scraper_env" ]; then
    python3 -m venv scraper_env
fi

source scraper_env/bin/activate
pip install -r requirements.txt

# Check if existing YAML data exists
if [ -f "public/data.yaml" ]; then
    echo "📁 Found existing YAML data, migrating to database..."
    python database/migrate_yaml_to_db.py public/data.yaml database/cycling_data.db
else
    echo "ℹ️ No existing YAML data found. Database will be created empty."
    # Create empty database with schema
    python -c "
from database.database import CyclingDatabase
db = CyclingDatabase('database/cycling_data.db')
print('✅ Empty database created with schema')
"
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📊 Database Statistics:"
python -c "
from database.database import CyclingDatabase
db = CyclingDatabase('database/cycling_data.db')
stats = db.get_database_stats()
print(f'   - Total races: {stats[\"total_races\"]}')
print(f'   - Total cyclists: {stats[\"total_cyclists\"]}')
print(f'   - Total results: {stats[\"total_results\"]}')
"

echo ""
echo "🚀 Next steps:"
echo "   1. Activate virtual environment: source scraper_env/bin/activate"
echo "   2. Start the API server: python api/server.py"
echo "   3. Start the React app (in new terminal): npm run dev"
echo "   4. Run the new scraper: python cycling_scraper_db.py"
echo ""