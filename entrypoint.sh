#!/bin/sh
# Ensure data directory exists and is writable
mkdir -p /app/data /app/logs

# Copy database if it doesn't exist in data volume
if [ ! -f "/app/data/cycling_data.db" ] && [ -f "/app/database/cycling_data.db" ]; then
    echo "Copying database to data directory..."
    cp /app/database/cycling_data.db /app/data/
fi

# Ensure database file is writable
if [ -f "/app/data/cycling_data.db" ]; then
    chmod 664 /app/data/cycling_data.db
fi

# Start the application
exec python -m backend.api.server