#!/bin/bash

# Simple deployment script for Race Cycling History App
set -e

echo "🚴 Race Cycling History App - Simple Deployment"
echo "=============================================="
echo

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

# Get local IP address for network access
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
if [ -z "$LOCAL_IP" ]; then
    echo "⚠️  Could not detect local IP address, using localhost"
    LOCAL_IP="localhost"
else
    echo "✅ Detected local IP address: $LOCAL_IP"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose not found."
    exit 1
fi

echo "✅ Docker and Docker Compose found"

# Stop existing containers
echo "🛑 Stopping existing containers..."
$COMPOSE_CMD down

# Build application
echo "🔨 Building application..."
$COMPOSE_CMD build --no-cache

# Start application
echo "🚀 Starting application..."
export VITE_API_URL="http://$LOCAL_IP:3001/api"
$COMPOSE_CMD up -d

# Wait for startup
echo "⏳ Waiting for application to be ready..."
sleep 20

# Check health
echo "🔍 Checking application health..."
if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "✅ API server is healthy"
else
    echo "⚠️  API server might not be ready yet"
fi

if curl -f http://localhost:8080 >/dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "⚠️  Frontend might not be ready yet"
fi

echo
echo "🎉 Deployment Complete!"
echo
echo "📱 Access your application:"
echo "  Frontend (local):  http://localhost:8080"
echo "  Frontend (network): http://$LOCAL_IP:8080"
echo "  API (local):       http://localhost:3001/api"
echo "  API (network):     http://$LOCAL_IP:3001/api"
echo "  Health Check:      http://localhost:3001/api/health"
echo
echo "📊 Management commands:"
echo "  View logs:    $COMPOSE_CMD logs -f"
echo "  View status:  $COMPOSE_CMD ps"
echo "  Restart:      $COMPOSE_CMD restart"
echo "  Stop:         $COMPOSE_CMD down"
echo
echo "✨ Your Race Cycling History App is now running!"