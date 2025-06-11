#!/bin/bash

# Start both API server and React development server
# Race Cycling History App - Full Application Startup

echo "🚀 Starting Race Cycling History App (Full Stack)"
echo "=================================================="

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $API_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    exit 0
}

# Set trap to handle Ctrl+C
trap cleanup SIGINT SIGTERM

# Check if virtual environment exists
if [ ! -d "scraper_env" ]; then
    echo "❌ Virtual environment not found. Run ./setup_database.sh first"
    exit 1
fi

# Check if database exists
if [ ! -f "database/cycling_data.db" ]; then
    echo "❌ Database not found. Run ./setup_database.sh first"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

echo ""
echo "🌐 Starting API Server..."
# Start API server in background
source scraper_env/bin/activate && python api/server.py &
API_PID=$!

# Wait a moment for API to start
sleep 3

echo "⚛️  Starting React Development Server..."
# Start React dev server in background
npm run dev &
WEB_PID=$!

echo ""
echo "✅ Both servers are starting up!"
echo ""
echo "📊 API Server:     http://localhost:3001"
echo "🌐 Web Interface:  http://localhost:5173"
echo ""
echo "🔍 API Endpoints:  http://localhost:3001/api/"
echo "📱 Network Access: http://[your-ip]:5173 (LAN devices)"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait $API_PID $WEB_PID