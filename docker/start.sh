#!/bin/sh

# Start script for Race Cycling History App
set -e

echo "🚴 Starting Race Cycling History App..."

# Create data directory if it doesn't exist
mkdir -p /app/data

# Set database path
export DB_PATH=${DB_PATH:-/app/data/cycling_data.db}

# Initialize database if it doesn't exist
if [ ! -f "$DB_PATH" ]; then
    echo "📊 Initializing database..."
    cd /app && python -c "
from backend.database.models import CyclingDatabase
db = CyclingDatabase('$DB_PATH')
print('Database initialized successfully!')
"
fi

# Start the API server in background
echo "🚀 Starting API server..."
cd /app && python -m backend.api.server &
API_PID=$!

# Wait for API to be ready
echo "⏳ Waiting for API server to start..."
for i in $(seq 1 30); do
    if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        echo "✅ API server is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ API server failed to start"
        exit 1
    fi
    sleep 1
done

# Start Nginx
echo "🌐 Starting Nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Function to handle shutdown
shutdown() {
    echo "🛑 Shutting down services..."
    kill $API_PID 2>/dev/null || true
    kill $NGINX_PID 2>/dev/null || true
    exit 0
}

# Trap signals
trap shutdown SIGTERM SIGINT

# Wait for services
wait