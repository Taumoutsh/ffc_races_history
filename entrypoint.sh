#!/bin/sh
# Ensure data directory exists
mkdir -p /app/data /app/logs

# Copy database if it doesn't exist in data volume and we have a template
if [ ! -f "/app/data/cycling_data.db" ] && [ -f "/app/database/cycling_data.db" ]; then
    echo "Copying database to data directory..."
    cp /app/database/cycling_data.db /app/data/
fi

# Create empty database if none exists (let SQLite create it)
if [ ! -f "/app/data/cycling_data.db" ]; then
    echo "No database found, will be created by the application..."
fi

# Backend only - no frontend files to copy

# Start the application
exec python -m backend.api.server