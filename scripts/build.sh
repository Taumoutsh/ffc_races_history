#!/bin/bash

# Production Build Script for Race Cycling History App
set -e

echo "🚴 Race Cycling History App - Production Build"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Create build directory
print_status "Creating build directory..."
mkdir -p build
mkdir -p build/frontend
mkdir -p build/backend
mkdir -p build/data

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm ci --only=production

# Build React app
print_status "Building React frontend..."
npm run build
cp -r dist/* build/frontend/
print_success "Frontend build completed"

# Copy backend files
print_status "Copying backend files..."
cp -r backend/* build/backend/
cp requirements.txt build/
print_success "Backend files copied"

# Copy configuration files
print_status "Copying configuration files..."
cp -r docker build/
cp docker-compose.yml build/
cp Dockerfile build/
print_success "Configuration files copied"

# Create deployment scripts
print_status "Creating deployment scripts..."

# Create start script
cat > build/start.sh << 'EOF'
#!/bin/bash

# Quick start script for Race Cycling History App
set -e

echo "🚴 Starting Race Cycling History App..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Start API server in background
echo "🚀 Starting API server..."
export DB_PATH="${DB_PATH:-./data/cycling_data.db}"
export PORT="${PORT:-3001}"
cd backend && python -m api.server &
API_PID=$!

# Function to handle shutdown
shutdown() {
    echo "🛑 Shutting down..."
    kill $API_PID 2>/dev/null || true
    exit 0
}

trap shutdown SIGTERM SIGINT

echo "✅ API server started on port ${PORT:-3001}"
echo "📊 Database: ${DB_PATH:-./data/cycling_data.db}"
echo "🌐 Frontend files are in ./frontend/ directory"
echo ""
echo "To serve the frontend:"
echo "  - Use a web server like nginx, apache, or serve"
echo "  - Or use: python -m http.server 8080 --directory frontend"
echo ""
echo "Press Ctrl+C to stop..."

wait
EOF

chmod +x build/start.sh

# Create Docker build script
cat > build/docker-build.sh << 'EOF'
#!/bin/bash

# Docker build script
set -e

echo "🐳 Building Docker image..."

# Build the image
docker build -t race-cycling-app:latest .

echo "✅ Docker image built successfully!"
echo ""
echo "To run with Docker:"
echo "  docker run -p 8080:80 -p 3001:3001 -v ./data:/app/data race-cycling-app:latest"
echo ""
echo "Or use Docker Compose:"
echo "  docker-compose up"
EOF

chmod +x build/docker-build.sh

# Create deployment README
cat > build/README.md << 'EOF'
# Race Cycling History App - Deployment Package

This package contains everything needed to deploy the Race Cycling History App.

## Quick Start Options

### Option 1: Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build manually
./docker-build.sh
docker run -p 8080:80 -p 3001:3001 -v ./data:/app/data race-cycling-app:latest
```

### Option 2: Manual Deployment
```bash
# Start the application
./start.sh

# Serve frontend (in another terminal)
python -m http.server 8080 --directory frontend
```

### Option 3: Production with Nginx
```bash
# Use the provided nginx configuration
sudo cp docker/nginx.conf /etc/nginx/sites-available/race-cycling-app
sudo ln -s /etc/nginx/sites-available/race-cycling-app /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

## Environment Variables

- `DB_PATH`: Database file path (default: ./data/cycling_data.db)
- `PORT`: API server port (default: 3001)
- `NODE_ENV`: Environment (production/development)

## File Structure

- `frontend/`: Built React application
- `backend/`: Python API server
- `docker/`: Docker configuration files
- `data/`: Database and persistent data
- `start.sh`: Quick start script
- `docker-build.sh`: Docker build script

## URLs

- Frontend: http://localhost:8080 (or configured port)
- API: http://localhost:3001/api
- Health Check: http://localhost:3001/api/health

## Requirements

- Python 3.8+
- Node.js 16+ (for development)
- Docker (optional, for containerized deployment)
EOF

# Create package info
cat > build/package-info.json << EOF
{
  "name": "race-cycling-app",
  "version": "2.5.0",
  "description": "Race Cycling History App - Complete deployment package",
  "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "build_system": "$(uname -s) $(uname -r)",
  "node_version": "$(node --version)",
  "python_version": "$(python3 --version)",
  "components": {
    "frontend": "React + Vite",
    "backend": "Python Flask + SQLite",
    "deployment": "Docker + Nginx"
  },
  "deployment_options": [
    "Docker Compose (recommended)",
    "Manual deployment",
    "Production with reverse proxy"
  ]
}
EOF

# Create archive
print_status "Creating deployment archive..."
cd build
tar -czf "../race-cycling-app-deployment-$(date +%Y%m%d-%H%M%S).tar.gz" .
cd ..

print_success "Build completed successfully!"
print_success "Deployment package created: build/"
print_success "Archive created: race-cycling-app-deployment-*.tar.gz"

echo ""
echo "📦 Deployment Package Contents:"
echo "  ├── frontend/          # Built React app"
echo "  ├── backend/           # Python API server"
echo "  ├── docker/            # Docker configurations"
echo "  ├── data/              # Database directory"
echo "  ├── start.sh           # Quick start script"
echo "  ├── docker-build.sh    # Docker build script"
echo "  ├── docker-compose.yml # Docker Compose config"
echo "  ├── Dockerfile         # Docker image definition"
echo "  └── README.md          # Deployment instructions"
echo ""
echo "🚀 Ready for deployment!"