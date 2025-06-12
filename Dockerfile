# Multi-stage Docker build for Race Cycling History App
# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY vite.config.js ./
COPY eslint.config.js ./

# Build the React app
RUN npm run build

# Stage 2: Python backend setup
FROM python:3.11-alpine AS backend-builder

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache gcc musl-dev sqlite

# Copy Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Stage 3: Production image
FROM python:3.11-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache sqlite nginx

# Copy Python dependencies
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy backend application
COPY --from=backend-builder /app/backend ./backend

# Copy built frontend
COPY --from=frontend-builder /app/dist ./frontend/dist

# Copy configuration files
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/start.sh ./start.sh
COPY docker/.env.production ./.env

# Create necessary directories
RUN mkdir -p /var/log/nginx /var/lib/nginx/tmp /app/data

# Set permissions
RUN chmod +x ./start.sh

# Expose ports
EXPOSE 80 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start command
CMD ["./start.sh"]