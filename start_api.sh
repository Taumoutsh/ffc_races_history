#!/bin/bash

# Start API Server with proper Python environment

echo "🚀 Starting Race Cycling API Server..."

# Check if virtual environment exists
if [ ! -d "scraper_env" ]; then
    echo "❌ Virtual environment not found. Run ./setup_database.sh first"
    exit 1
fi

# Activate virtual environment
source scraper_env/bin/activate

# Check if database exists
if [ ! -f "backend/database/cycling_data.db" ]; then
    echo "❌ Database not found. Run ./setup_database.sh first"
    exit 1
fi

# Start API server
echo "🌐 Starting API server on http://localhost:3001"
echo "🔍 API endpoints available at http://localhost:3001/api/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python backend/api/server.py