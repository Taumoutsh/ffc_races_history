# FFC Races History Viewer

(This whole app has been developed thanks to Claude by Anthropic AI)

A modern React web application for visualizing cycling race data and performance analytics. Built with React + Vite and powered by a SQLite database backend, featuring interactive charts, cyclist profiles, and comprehensive race leaderboards.

## 🆕 Latest Updates (v2.7.0)
- ⚔️ **NEW: Performance Comparison Feature** - Compare cyclists directly with dual-line interactive charts
- 🎯 **Smart Comparison Visibility** - Only appears when comparison is meaningful (different cyclists with common races)
- 📊 **Interactive Dual Charts** - Blue line for current cyclist, green line for default cyclist
- 🔍 **Intelligent Race Matching** - Matches races by ID or name+date for accurate comparisons
- 🌍 **Multilingual Comparison** - Complete translation support for comparison feature
- 💫 **Glassmorphism UI** - Modern modal design consistent with app aesthetics

### Previous Updates (v2.4.0)
- 🏁 **Races panel implementation** - Dedicated modal panel for browsing all races
- ✅ **Enhanced races table** - Clickable headers for sorting by date, name, or participants
- ✅ **Improved UI consistency** - Races panel matches CyclistProfile modal styling
- ✅ **Unified race access** - Clicking races shows same leaderboard modal throughout app
- ✅ **Complete translations** - All text properly localized with sentence case formatting

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![Vite](https://img.shields.io/badge/Vite-6.3.5-purple.svg)
![Python](https://img.shields.io/badge/Python-3.8+-green.svg)
![SQLite](https://img.shields.io/badge/SQLite-3-blue.svg)

## ✨ Features

### 📊 Performance Analytics
- **Interactive Performance Charts**: Line graphs showing race positions over time with smart pagination
- **Chart Pagination**: Displays 10 races maximum with smooth navigation buttons
- **Hover Navigation**: Left (←) and right (→) buttons appear on hover for 5-race increments
- **Automatic Positioning**: Shows most recent races by default, navigate to view older races
- **Pagination Indicator**: Shows current range (e.g., "Showing races 15-24 of 47")
- **Clickable Data Points**: Click any point to view full race leaderboards
- **Dynamic Tooltips**: Hover for detailed race information

### 🏆 Race Management
- **🏁 Races Panel**: Dedicated modal panel accessible via "View all races" button
- **Complete Race Browser**: View, search, and sort all races in the database
- **Sortable Race Table**: Click headers to sort by date, name, or participant count
- **Race Search**: Real-time search through race names with French accent support
- **Load More Functionality**: Paginated race loading (20 races at a time)
- **Complete Race Leaderboards**: View all participants with rankings
- **Interactive Modals**: Beautiful, responsive modal windows with glassmorphism design
- **Participant Details**: Full cyclist information including ID, region, and team
- **Unified Navigation**: Consistent race leaderboard access from any component

### 👤 Cyclist Profiles
- **Individual Performance History**: Complete race history for any cyclist
- **⚔️ Performance Comparison**: Compare any cyclist with the default cyclist in shared races
- **Smart Comparison Button**: Only appears when meaningful comparisons exist
- **Dual-Line Charts**: Interactive comparison charts with color-coded performance lines
- **Sortable Data**: Sort by date, location, or position
- **Interactive Tables**: Click races to view leaderboards
- **Performance Overview**: Total races and statistics

### 🔍 Enhanced Search & Discovery
- **Real-time Search**: Find cyclists as you type with intelligent search
- **French Accent Support**: Search with or without accents (é, è, ç, à, ü, etc.)
- **Smart Matching**: Search by first name, last name, or cyclist ID
- **Case-Insensitive**: Handles mixed case names (UPPERCASE, CamelCase)
- **Bidirectional Search**: "jerome" finds "Jérôme", "francois" finds "François"
- **Instant Results**: Live search results with race counts
- **Unicode Normalization**: Advanced character matching for international names

### 🔬 Research from Entry List
- **Import Entry Lists**: Paste tab/space-separated racer lists
- **Smart Matching**: Find racers by UCI ID or name matching
- **Results Analysis**: View best position, ID, name, region, and team
- **Database Cross-reference**: Check which entry list racers exist in your database

### 🌐 Multi-language Support
- **Bilingual Interface**: Complete English and French translations
- **Dynamic Language Switching**: Toggle between languages instantly
- **Localized Content**: All UI elements, labels, and messages translated

### ⚙️ Dynamic Configuration & Personalization
- **Dynamic Default Cyclist Selection**: Interactive button to change default cyclist
- **Real-time Chart Updates**: Performance chart updates immediately when default changes
- **Smart Button States**: Visual feedback with gold/green gradients and disabled states
- **Persistent Selection**: Default cyclist saved across browser sessions
- **Default Cyclist Highlighting**: Visual distinction across all tables with green highlighting
- **Customizable UI**: Header titles and labels
- **Auto-formatting**: Club names cleaned (removes leading numbers)
- **Chart Title Updates**: Performance chart reflects selected cyclist name

### 🗄️ Database System
- **SQLite Backend**: Lightweight, serverless database for better performance
- **REST API**: Full API endpoints for data access
- **Real-time Search**: Database-powered search functionality
- **Data Migration**: Easy migration from YAML to database
- **Web Hostable**: Suitable for deployment on web servers

### 🌐 Network Deployment
- **Local Network Access**: Share app across devices on same Wi-Fi network
- **Cross-device Compatible**: Works on phones, tablets, and computers
- **Automatic Configuration**: Simple IP-based setup with environment variables
- **Real-time Sync**: All devices share the same data and updates
- **Mobile Responsive**: Optimized interface for touch devices

## 🚀 Quick Start

Choose your preferred setup method:

### 🐳 Docker Deployment (Recommended for Production)
**One-command deployment anywhere with Docker:**
```bash
git clone https://github.com/Taumoutsh/ffc_races_history.git
cd ffc_races_history
./deploy.sh
```
Access at: `http://localhost:8080`

### 📋 Development Setup
**For local development and customization:**

#### Prerequisites
- Node.js 16+ 
- Python 3.8+
- npm or yarn

#### One-Click Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd race-cycling-app
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Setup database and migrate data**
   ```bash
   ./setup_database.sh
   ```
   This will:
   - Create Python virtual environment
   - Install Python dependencies
   - Create SQLite database
   - Migrate existing YAML data (if available)
   - Show database statistics

4. **Start the API server**
   ```bash
   ./start_api.sh
   ```
   - Starts REST API on `http://localhost:3001`
   - Serves data from SQLite database

5. **Start the React app** (in new terminal)
   ```bash
   npm run dev
   ```
   - Starts development server on `http://localhost:5173`

6. **Configure default cyclist** (optional)
   - Edit `src/config/appConfig.js`
   - Update `defaultCyclist.firstName` and `defaultCyclist.lastName`

### 🌐 Network Setup (Optional - Access from other devices)

7. **Find your computer's IP address**
   ```bash
   ipconfig getifaddr en0
   ```

8. **Update environment configuration**
   ```bash
   # Edit .env.local and replace with your IP
   VITE_API_URL=http://YOUR_IP_ADDRESS:3001/api
   ```

9. **Restart both servers**
   - Access from any device on your network: `http://YOUR_IP_ADDRESS:5173`

---

## 🚀 Deployment & Packaging

The app comes with comprehensive deployment tools for easy installation anywhere.

### 🐳 Docker Deployment

#### Simple Deployment
```bash
# One-command deployment
./deploy.sh

# Custom domain
DOMAIN=yourdomain.com ./deploy.sh

# Production mode with optimization
DEPLOYMENT_MODE=production ./deploy.sh
```

#### Production Deployment
```bash
# Full production setup with SSL, backups, monitoring
DEPLOYMENT_MODE=full-stack DOMAIN=yourdomain.com SSL_ENABLED=true ./deploy.sh
```

### ☁️ Cloud Deployment

Deploy on any cloud provider with Docker support:

#### Quick Deploy (Any VPS)
```bash
# Install Docker and deploy
curl -fsSL https://get.docker.com | sh
curl -fsSL https://raw.githubusercontent.com/Taumoutsh/ffc_races_history/main/install.sh | bash
```

#### Supported Platforms
- **DigitalOcean**: Ubuntu droplets ($6/month minimum)
- **AWS EC2**: t3.micro or larger
- **Google Cloud**: e2-micro or larger  
- **Azure**: Standard B1s or larger
- **Any VPS**: With Docker support

### 📖 Deployment Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete step-by-step deployment guide
- **[CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md)** - Cloud provider specific instructions
- **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** - Ultra-simple deployment reference

### 🔧 Deployment Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `simple` | Single container, basic setup | Development, testing |
| `production` | Optimized with resource limits | Production deployment |
| `full-stack` | Complete setup with proxy, SSL, backups | Enterprise deployment |

### 🌐 Access URLs

After deployment:
- **Frontend**: `http://your-domain:8080`
- **API**: `http://your-domain:3001/api`
- **Health Check**: `http://your-domain:3001/api/health`

### 🛠️ Management Commands

```bash
# View status
docker-compose ps

# View logs  
docker-compose logs -f

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Update and redeploy
git pull && ./deploy.sh
```

## 🗄️ Database System

### Architecture
- **SQLite Database**: `database/cycling_data.db`
- **REST API Server**: `api/server.py` (Flask)
- **React Frontend**: Fetches data via API calls

### Database Schema
```sql
-- Core tables
races                # Race information
cyclists             # Normalized cyclist data
race_results         # Results linking races and cyclists
scraping_info        # Metadata and timestamps

-- Indexes for performance
idx_race_results_*   # Fast lookups
idx_cyclists_name    # Name-based search
```

### API Endpoints
```
GET /api/health                    # Health check
GET /api/races                     # List all races
GET /api/races/{id}                # Race details with participants
GET /api/cyclists/search?q={query} # Search cyclists
GET /api/cyclists/{id}             # Cyclist details and history
GET /api/stats                     # Database statistics
GET /api/export/yaml               # Export in YAML format
POST /api/research/entry-list      # Analyze entry lists
```

### Benefits of Database System
- **Performance**: Faster search and data access
- **Scalability**: Better handling of large datasets
- **Real-time Search**: API-powered instant search
- **Web Hosting**: Suitable for deployment
- **Data Integrity**: Proper database constraints
- **Backup/Restore**: Standard database tools

## 🕷️ Data Scraping

The project includes both legacy YAML scraper and new database scraper.

### New Database Scraper (Recommended)

```bash
# Activate virtual environment
source scraper_env/bin/activate

# Run database scraper
python cycling_scraper_db.py
```

**Features:**
- Saves directly to SQLite database
- Incremental updates (skips existing races)
- Better error handling and logging
- Progress tracking with statistics
- Automatic cyclist normalization

### Legacy YAML Scraper

```bash
python cycling_scraper.py
```

**Note**: For new installations, use the database scraper. The YAML scraper is maintained for backward compatibility.

### Scraper Features
- **Incremental Updates**: Only scrapes new races
- **Race Detection**: Automatically finds and processes race results
- **Data Validation**: Ensures data quality and consistency
- **Progress Tracking**: Shows scraping progress with detailed logging
- **Error Handling**: Robust error handling with retry mechanisms
- **Rate Limiting**: Respectful 1-second delays between requests

## 🔧 Setup Scripts

### `setup_database.sh`
- Creates Python virtual environment
- Installs all dependencies
- Sets up SQLite database with schema
- Migrates existing YAML data
- Shows database statistics

### `start_api.sh`
- Activates Python environment
- Starts Flask API server
- Provides health checks
- Serves database endpoints

### `test_database.py`
- Tests database connectivity
- Validates search functionality
- Checks API endpoints
- Provides debugging information

## 📊 Data Migration

### From YAML to Database

```bash
# Manual migration
python database/migrate_yaml_to_db.py public/data.yaml database/cycling_data.db

# Or use setup script (recommended)
./setup_database.sh
```

### Migration Features
- **Preserves all data**: Races, cyclists, results
- **Normalizes cyclists**: Removes duplicates
- **Cleans data**: Club names, formatting
- **Creates history**: Individual cyclist race history
- **Validates integrity**: Ensures data consistency

### Backward Compatibility
The system maintains compatibility with existing YAML format:
- API exports YAML-compatible format
- React hooks handle both data sources
- Graceful fallback to local data

## ⚙️ Configuration

### Environment Variables (`.env`)
```bash
# API Configuration
VITE_API_URL=http://localhost:3001/api

# Database Configuration (for server)
DB_PATH=database/cycling_data.db

# Server Configuration
PORT=3001
DEBUG=false
```

### Default Cyclist Setup

Edit `src/config/appConfig.js`:

```javascript
export const appConfig = {
  defaultCyclist: {
    firstName: 'JOHN',
    lastName: 'DOE'
  }
};
```

## 🏗️ Architecture

### Frontend (React)
```
src/
├── components/           # React components
│   ├── PerformanceChart.jsx
│   ├── RaceLeaderboardModal.jsx
│   ├── CyclistProfile.jsx
│   ├── RacesList.jsx        # NEW: Races panel with sortable table
│   └── SelectAsDefaultButton.jsx
├── hooks/               # Custom hooks
│   ├── useApiData.js    # NEW: API data hook
│   └── useYamlData.js   # Legacy YAML hook
├── config/              # Configuration
└── locales/             # Translations
```

### Backend (Python)
```
database/
├── schema.sql           # Database schema
├── database.py          # Database access layer
└── migrate_yaml_to_db.py # Migration script

api/
└── server.py           # Flask REST API server

cycling_scraper_db.py   # Database scraper
```

### Key Files

**Core Application:**
- **`database.py`**: Core database operations
- **`useApiData.js`**: React hook for API data
- **`server.py`**: REST API endpoints
- **`cycling_scraper_db.py`**: Database scraper

**Deployment:**
- **`deploy.sh`**: One-command deployment script
- **`install.sh`**: Download and deploy from scratch
- **`Dockerfile`**: Multi-stage container build
- **`docker-compose.yml`**: Basic container orchestration
- **`docker-compose.production.yml`**: Production deployment with SSL, backups
- **`DEPLOYMENT.md`**: Complete deployment guide
- **`CLOUD_DEPLOYMENT.md`**: Cloud provider instructions

## 🔧 Development

### Available Scripts

**Frontend:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

**Backend:**
```bash
./setup_database.sh     # Setup database system
./start_api.sh          # Start API server
python test_database.py # Test database functionality
```

### Tech Stack

**Frontend:**
- React 19.1.0 with hooks
- Vite 6.3.5 for build/dev
- Recharts 2.15.3 for charts
- Fetch API for backend communication

**Backend:**
- Python 3.8+ for scraping and API
- SQLite 3 for database
- Flask for REST API
- BeautifulSoup4 for web scraping
- PyYAML for data processing

**Deployment & Infrastructure:**
- Docker & Docker Compose for containerization
- Multi-stage builds for optimized images
- Nginx for reverse proxy and SSL termination
- Alpine Linux for minimal container size
- Automated deployment scripts

### Development Workflow

1. **Database Changes**: Update `schema.sql` and `database.py`
2. **API Changes**: Modify `api/server.py`
3. **Frontend Changes**: Update React components and hooks
4. **Testing**: Use `test_database.py` for backend testing

## 🌐 Advanced Deployment

### Manual Deployment (Alternative to Docker)

#### Database Deployment
1. Copy `database/cycling_data.db` to server
2. Install Python dependencies: `pip install -r requirements.txt`
3. Start API server: `python api/server.py`
4. Configure environment variables

#### Frontend Deployment
1. Set `VITE_API_URL` in `.env` to production API URL
2. Build frontend: `npm run build`
3. Deploy `dist/` folder to web server

#### Example Production Setup
```bash
# Environment variables for production
export VITE_API_URL=https://yourserver.com/api
export DB_PATH=/path/to/cycling_data.db
export PORT=3001

# Start API server
python api/server.py

# Build and deploy frontend
npm run build
# Copy dist/ to web server
```

### 🔒 Production Considerations

#### Resource Requirements
| Deployment | RAM | CPU | Storage | Cost/Month |
|------------|-----|-----|---------|------------|
| Simple | 512MB | 0.5 | 10GB | $5-10 |
| Production | 1GB | 1 | 25GB | $10-20 |
| Full-Stack | 2GB | 2 | 50GB | $20-40 |

#### Security Features
- SSL/TLS certificate support
- Firewall configuration
- Automatic security updates
- Database backup automation
- Resource monitoring and limits

## 🧪 Testing

### Database Testing
```bash
python test_database.py
```

**Tests:**
- Database connectivity
- Search functionality (returns 38 results for "thomas")
- Cyclist lookup and history
- Race details and participants
- API endpoint health checks

### Manual Testing
1. Start API server: `./start_api.sh`
2. Start React app: `npm run dev`
3. Test search functionality in browser
4. Check browser console for API logs

## 🆘 Troubleshooting

### Common Issues

**"table already exists" error:**
- Fixed in schema with `IF NOT EXISTS`
- Re-run `./setup_database.sh`

**Search not working:**
- Check API server is running: `./start_api.sh`
- Verify database has data: `python test_database.py`
- Check browser console for error messages

**API connection failed:**
- Ensure API server is running on port 3001
- Check `VITE_API_URL` in `.env`
- Verify virtual environment is activated

**No search results:**
- Database might be empty
- Run migration: `python database/migrate_yaml_to_db.py`
- Check database stats: `python test_database.py`

### Debug Tools
- **Browser Console**: Shows API calls and responses
- **`test_database.py`**: Validates database functionality
- **API Health Check**: `http://localhost:3001/api/health`

## 🎯 Roadmap

### Completed ✅
- [x] Database migration system
- [x] REST API backend
- [x] Real-time search functionality with French accent support
- [x] Multi-language support (EN/FR) with complete translation coverage
- [x] Research from Entry List functionality with team/club data
- [x] Dynamic default cyclist selection with persistent storage
- [x] Real-time chart updates and state synchronization
- [x] Smart button states with visual feedback
- [x] Case-insensitive and accent-normalized search
- [x] Local network deployment support
- [x] Cross-device compatibility
- [x] Default cyclist highlighting with green theme
- [x] Auto-formatting for club names
- [x] **Chart rendering reliability** - Fixed line visibility and chronological ordering
- [x] **Production-ready code** - Removed debug logs and optimized performance
- [x] **Enhanced data validation** - Proper number conversion and null handling
- [x] **🏁 Races panel implementation** - Dedicated modal for browsing all races
- [x] **Sortable races table** - Click headers to sort by any column
- [x] **Unified race navigation** - Consistent leaderboard access throughout app
- [x] **Complete sentence case translations** - Proper text formatting across all languages
- [x] **📊 Chart pagination system** - Smart navigation for performance charts with 10-race display limit
- [x] **⏮️⏭️ Hover navigation buttons** - Smooth left/right arrows for 5-race increments
- [x] **📈 Pagination indicator** - Shows current race range with multilingual support
- [x] **🇫🇷 Enhanced French translations** - Natural language improvements for better user experience
- [x] **🐳 Docker containerization** - Complete Docker deployment with multi-stage builds
- [x] **🚀 One-command deployment** - `./deploy.sh` script for easy deployment anywhere
- [x] **☁️ Cloud deployment support** - Ready-to-deploy on all major cloud providers
- [x] **📖 Comprehensive deployment docs** - Complete guides for all deployment scenarios
- [x] **🔒 Production security** - SSL support, resource limits, health checks, backups
- [x] **⚔️ Performance comparison feature** - Interactive dual-line charts for cyclist comparisons
- [x] **🎯 Smart comparison visibility** - Only shows when meaningful comparisons exist
- [x] **📊 Intelligent race matching** - Multi-criteria race identification for accurate comparisons
- [x] **🌍 Multilingual comparison support** - Complete translation coverage for comparison feature

### Planned 🔄
- [ ] Advanced filtering options (date range, region, club)
- [ ] Data export functionality (PDF, CSV)
- [ ] Cyclist statistics dashboard
- [ ] Dark mode toggle
- [ ] Mobile-optimized interface
- [ ] Real-time scraper integration with progress bar
- [ ] Database backup/restore tools

---

Built with ❤️ using React, Python, and SQLite.