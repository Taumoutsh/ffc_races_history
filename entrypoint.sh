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

# Copy frontend files to shared volume for nginx (only if volume is empty)
if [ -d "/app/frontend/dist-built" ] && [ ! "$(ls -A /app/frontend/dist 2>/dev/null)" ]; then
    echo "Copying frontend files to shared volume for nginx..."
    cp -r /app/frontend/dist-built/* /app/frontend/dist/
    echo "Frontend files copied successfully"
elif [ "$(ls -A /app/frontend/dist 2>/dev/null)" ]; then
    echo "Frontend files already exist in shared volume"
else
    echo "Warning: No frontend files found to copy"
fi

# Start the application
exec python -m backend.api.server