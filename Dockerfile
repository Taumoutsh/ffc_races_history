# Simple Docker build for Race Cycling History App
# Windows-compatible configuration
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY vite.config.js ./
COPY eslint.config.js ./

# Build the React app
RUN npm run build

# Production stage
FROM python:3.11-alpine AS production

WORKDIR /app

# Install system dependencies and curl for health checks
RUN apk add --no-cache \
    gcc \
    musl-dev \
    sqlite \
    nginx \
    curl \
    bash

# Copy Python requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Create directory for database source and copy if exists
RUN mkdir -p /app/database_source

# Copy existing database files if they exist
COPY backend/database/ ./database_source/

# Copy built frontend
COPY --from=frontend-builder /app/dist ./frontend/dist

# Copy configuration files
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Create application directories
RUN mkdir -p /app/data /app/logs /var/log/nginx /var/lib/nginx/tmp

# Create a simple startup script inline
RUN echo '#!/bin/bash' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "🚴 Starting Race Cycling History App..."' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Set environment variables' >> /app/start.sh && \
    echo 'export DB_PATH=/app/data/cycling_data.db' >> /app/start.sh && \
    echo 'export PYTHONPATH=/app:$PYTHONPATH' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Initialize database if needed' >> /app/start.sh && \
    echo 'if [ ! -f "$DB_PATH" ]; then' >> /app/start.sh && \
    echo '    echo "📊 Looking for existing database..."' >> /app/start.sh && \
    echo '    # Check if there are any database files in the source directory' >> /app/start.sh && \
    echo '    if [ -f "/app/database_source/cycling_data.db" ]; then' >> /app/start.sh && \
    echo '        echo "📁 Found existing database, copying cycling_data.db to data directory..."' >> /app/start.sh && \
    echo '        cp /app/database_source/cycling_data.db "$DB_PATH"' >> /app/start.sh && \
    echo '    elif [ -f "/app/database_source/cycling_data_backup_"*.db ]; then' >> /app/start.sh && \
    echo '        echo "📁 Found backup database, copying to data directory..."' >> /app/start.sh && \
    echo '        cp /app/database_source/cycling_data_backup_*.db "$DB_PATH"' >> /app/start.sh && \
    echo '    elif [ "$(ls -A /app/database_source/*.db 2>/dev/null)" ]; then' >> /app/start.sh && \
    echo '        echo "📁 Found database files, copying first one to data directory..."' >> /app/start.sh && \
    echo '        cp $(ls /app/database_source/*.db | head -1) "$DB_PATH"' >> /app/start.sh && \
    echo '        if [ -f "$DB_PATH" ]; then' >> /app/start.sh && \
    echo '            echo "✅ Database copied successfully!"' >> /app/start.sh && \
    echo '        else' >> /app/start.sh && \
    echo '            echo "⚠️  Database copy failed, will create new database"' >> /app/start.sh && \
    echo '        fi' >> /app/start.sh && \
    echo '    fi' >> /app/start.sh && \
    echo '    # If no database exists after copy attempt, create a new one' >> /app/start.sh && \
    echo '    if [ ! -f "$DB_PATH" ]; then' >> /app/start.sh && \
    echo '        echo "📊 Creating new database..."' >> /app/start.sh && \
    echo '        python -c "' >> /app/start.sh && \
    echo 'import sys' >> /app/start.sh && \
    echo 'sys.path.append(\"/app\")" >> /app/start.sh' && \
    echo 'from backend.database.models_optimized import CyclingDatabase' >> /app/start.sh && \
    echo 'db = CyclingDatabase(\"$DB_PATH\")' >> /app/start.sh && \
    echo 'print(\"Database initialized successfully!\")" || echo "Database initialization failed, continuing..."' >> /app/start.sh && \
    echo '    fi' >> /app/start.sh && \
    echo 'else' >> /app/start.sh && \
    echo '    echo "✅ Database already exists at $DB_PATH"' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start API server in background' >> /app/start.sh && \
    echo 'echo "🚀 Starting API server on port 3001..."' >> /app/start.sh && \
    echo 'cd /app && python -m backend.api.server &' >> /app/start.sh && \
    echo 'API_PID=$!' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Wait for API to be ready' >> /app/start.sh && \
    echo 'echo "⏳ Waiting for API server..."' >> /app/start.sh && \
    echo 'for i in $(seq 1 60); do' >> /app/start.sh && \
    echo '    if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then' >> /app/start.sh && \
    echo '        echo "✅ API server is ready!"' >> /app/start.sh && \
    echo '        break' >> /app/start.sh && \
    echo '    fi' >> /app/start.sh && \
    echo '    if [ $i -eq 60 ]; then' >> /app/start.sh && \
    echo '        echo "❌ API server failed to start after 60 seconds"' >> /app/start.sh && \
    echo '        echo "Checking API server logs..."' >> /app/start.sh && \
    echo '        ps aux | grep python' >> /app/start.sh && \
    echo '        exit 1' >> /app/start.sh && \
    echo '    fi' >> /app/start.sh && \
    echo '    sleep 1' >> /app/start.sh && \
    echo 'done' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start Nginx' >> /app/start.sh && \
    echo 'echo "🌐 Starting Nginx..."' >> /app/start.sh && \
    echo 'nginx -g "daemon off;" &' >> /app/start.sh && \
    echo 'NGINX_PID=$!' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Function to handle shutdown' >> /app/start.sh && \
    echo 'shutdown() {' >> /app/start.sh && \
    echo '    echo "🛑 Shutting down services..."' >> /app/start.sh && \
    echo '    kill $API_PID 2>/dev/null || true' >> /app/start.sh && \
    echo '    kill $NGINX_PID 2>/dev/null || true' >> /app/start.sh && \
    echo '    exit 0' >> /app/start.sh && \
    echo '}' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Trap signals' >> /app/start.sh && \
    echo 'trap shutdown SIGTERM SIGINT' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Keep container running' >> /app/start.sh && \
    echo 'echo "📱 Application ready! API: http://localhost:3001/api | Frontend: http://localhost:80"' >> /app/start.sh && \
    echo 'wait' >> /app/start.sh && \
    chmod +x /app/start.sh

# Create environment file
RUN echo 'NODE_ENV=production' > /app/.env && \
    echo 'VITE_API_URL=http://localhost:3001/api' >> /app/.env && \
    echo 'DB_PATH=/app/data/cycling_data.db' >> /app/.env && \
    echo 'API_PORT=3001' >> /app/.env && \
    echo 'DEBUG=false' >> /app/.env && \
    echo 'PORT=3001' >> /app/.env

# Expose ports
EXPOSE 80 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Start command
CMD ["/app/start.sh"]