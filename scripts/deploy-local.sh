#!/bin/bash

# Local Development Deployment Script
set -e

echo "🚴 Race Cycling History App - Local Development Setup"
echo "===================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check dependencies
print_info "Checking dependencies..."

if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing via package manager recommended."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    print_warning "Python 3 not found. Installing Python 3.8+ recommended."
    exit 1
fi

# Setup Python virtual environment
print_info "Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt
print_success "Python environment ready"

# Install Node.js dependencies
print_info "Installing Node.js dependencies..."
npm install
print_success "Node.js dependencies installed"

# Setup database
print_info "Setting up database..."
if [ ! -f "backend/database/cycling_data.db" ]; then
    python backend/database/models.py
    print_success "Database initialized"
else
    print_success "Database already exists"
fi

# Create development start script
cat > start-dev.sh << 'EOF'
#!/bin/bash

# Development startup script
set -e

echo "🚴 Starting Race Cycling History App (Development Mode)"

# Activate Python environment
source venv/bin/activate

# Start API server in background
echo "🚀 Starting API server on port 3001..."
cd backend && python -m api.server &
API_PID=$!

# Wait for API to be ready
sleep 3

# Start React development server
echo "🌐 Starting React development server on port 5173..."
cd .. && npm run dev &
REACT_PID=$!

# Function to handle shutdown
shutdown() {
    echo ""
    echo "🛑 Shutting down development servers..."
    kill $API_PID 2>/dev/null || true
    kill $REACT_PID 2>/dev/null || true
    exit 0
}

trap shutdown SIGTERM SIGINT

echo ""
echo "✅ Development servers started!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔗 API: http://localhost:3001/api"
echo "📊 Health Check: http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop all servers..."

wait
EOF

chmod +x start-dev.sh

print_success "Development environment setup complete!"
print_success "Created start-dev.sh script for easy development startup"

echo ""
echo "🚀 To start development:"
echo "  ./start-dev.sh"
echo ""
echo "📖 Or start services manually:"
echo "  Backend:  cd backend && python -m api.server"
echo "  Frontend: npm run dev"