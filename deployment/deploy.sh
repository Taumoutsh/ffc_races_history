#!/bin/bash

# Race Cycling History App - Production Deployment Script
# Run this script on your VPS to deploy the application

set -e  # Exit on any error

echo "🚀 Starting Race Cycling History App deployment..."

# Configuration
APP_DIR="/var/www/race-cycling-app"
SERVICE_NAME="race-cycling-api"
NGINX_SITE="race-cycling-app"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script as root or with sudo"
    exit 1
fi

echo "📁 Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

echo "🐍 Setting up Python backend..."
# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install --upgrade pip
pip install flask flask-cors bcrypt requests beautifulsoup4

echo "📦 Building React frontend..."
npm install
npm run build

echo "🔐 Creating admin user..."
# Create admin user if auth database is empty
if [ ! -f "backend/database/auth.db" ] || [ ! -s "backend/database/auth.db" ]; then
    echo "Creating default admin user..."
    python3 backend/create_admin.py admin admin123
    echo "✅ Default admin user created: admin / admin123"
    echo "⚠️  IMPORTANT: Change this password after first login!"
fi

echo "🛠️ Setting up systemd service..."
# Copy service file
cp deployment/race-cycling-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable $SERVICE_NAME

echo "🌐 Configuring Nginx..."
# Copy Nginx configuration
cp deployment/nginx-site.conf /etc/nginx/sites-available/$NGINX_SITE
ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default  # Remove default site

# Test Nginx configuration
nginx -t

echo "🔧 Setting permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR
chmod -R 644 $APP_DIR/backend/database/

echo "🚀 Starting services..."
systemctl restart $SERVICE_NAME
systemctl restart nginx

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Service Status:"
systemctl status $SERVICE_NAME --no-pager -l
echo ""
echo "🌐 Your application should now be available at:"
echo "   http://$(curl -s ifconfig.me)"
echo "   or http://your-domain.com (if you have a domain)"
echo ""
echo "🔑 Default login credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo "   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!"
echo ""
echo "📊 Useful commands:"
echo "   Check API status: systemctl status $SERVICE_NAME"
echo "   View API logs:    journalctl -u $SERVICE_NAME -f"
echo "   Restart API:      systemctl restart $SERVICE_NAME"
echo "   Check Nginx:      systemctl status nginx"
echo "   View Nginx logs:  tail -f /var/log/nginx/error.log"