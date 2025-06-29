# Race Cycling History App - CLAUDE.md

## 📋 Project Overview

**Application Name:** Race Cycling History  
**Framework:** React + Vite + SQLite Database Backend  
**Purpose:** Interactive cycling race performance tracking and analysis  
**Data Source:** SQLite database with REST API  
**Default Cyclist:** John Doe (configurable dynamically via UI)  
**Version:** 2.7.0 - Performance Comparison Feature

## 🚀 Core Features

### 1. Performance Chart
- Interactive Recharts visualization with race dates (French format)
- Chart pagination: 10 races max with hover navigation (← previous 5, → next 5)
- Click points to view race leaderboards
- Glassmorphism design with smooth animations

### 2. Race Leaderboard Modal
- Complete participant lists with sortable positions
- Medal indicators for top 3 finishers
- Click cyclists to view their profiles
- Default cyclist highlighted in green

### 3. Cyclist Profile Modal
- Dual view: Table/Chart display
- Sortable race history by date, location, position, **Top %**
- SelectAsDefaultButton (⭐) in top-right corner
- **NEW:** Performance Comparison Button (v2.7.0)
- **NEW:** Top % column with red-to-green gradient (lower % = better performance)
- **NEW:** Average Top % display in cyclist info card

### 4. ⚔️ Performance Comparison Feature (v2.7.0)
- **Smart Visibility:** Only appears for non-default cyclists with common races
- **Dual-line Chart:** Blue (current) vs Green (default) performance comparison
- **Race Matching:** By race_id or race_name + date
- **Multilingual:** English/French support
- **Component:** `ComparisonChart.jsx`

### 5. Search & Navigation
- Real-time search with French accent support
- Searches first name, last name, combinations
- 🏁 Races Panel: Full-screen modal with search/pagination
- Research from Entry List: Analyze racer lists against database

### 6. Multi-language Support
- English/French with React Context
- Complete UI element coverage
- Header toggle switcher

## 🗄️ Database System

### Architecture
- **SQLite Database:** `database/cycling_data.db`
- **REST API:** Flask server (`api/server.py`)
- **React Frontend:** `useApiData` hook

### API Endpoints
```
GET /api/health                    # Health check
GET /api/races                     # List races
GET /api/races/{id}                # Race details
GET /api/cyclists/search?q={}      # Search cyclists
GET /api/cyclists/{id}             # Cyclist details
POST /api/research/entry-list      # Entry list analysis
```

### Performance
- 1,990 cyclists, 111 races, 5,610 results
- Database-indexed search < 100ms
- Real-time API with async handlers

## 🔧 Technical Stack

### Frontend
- **React:** 19.1.0, **Vite:** 6.3.5, **Recharts:** 2.15.3
- **ESLint:** Code linting, **js-yaml:** Legacy YAML support

### Backend
- **Python:** 3.8+, **SQLite:** 3, **Flask:** 2.3.0+
- **Flask-CORS:** 4.0.0+, **BeautifulSoup4:** 4.12.0+

### Deployment
- **Docker:** 20.10+, **Alpine Linux:** 3.18+
- **Nginx:** 1.24+, **Docker Compose:** 2.0+

## 📁 File Structure

```
src/
├── components/
│   ├── CyclistProfile.jsx
│   ├── PerformanceChart.jsx
│   ├── ComparisonChart.jsx       # NEW v2.7.0
│   └── RaceLeaderboardModal.jsx
├── hooks/
│   ├── useApiData.js
│   └── useYamlData.js
├── contexts/
│   └── LanguageContext.jsx
├── utils/
│   ├── dateUtils.js              # NEW v2.7.0 - Date parsing & percentage utilities
│   └── defaultCyclistStorage.js
└── config/
    └── appConfig.js
```

## 🚀 Setup & Deployment

### Docker Deployment (Recommended)
```bash
git clone https://github.com/Taumoutsh/ffc_races_history.git
cd ffc_races_history
./deploy.sh
```
Access at: `http://localhost:8080`

### Development Setup
```bash
# Install dependencies
npm install

# Setup database
./setup_database.sh

# Start API (terminal 1)
./start_api.sh

# Start React (terminal 2)
npm run dev
```

### Available Commands
```bash
# Development
npm run dev                      # Start dev server
npm run build                    # Production build
npm run lint                     # Code linting

# Database
./setup_database.sh              # Setup database
./start_api.sh                   # Start API server
python test_database.py          # Test functionality
python cycling_scraper_db.py     # Run scraper

# Deployment
./deploy.sh                      # Deploy with Docker
DEPLOYMENT_MODE=production ./deploy.sh  # Production mode
```

## 🕷️ Data Scraper

### Python Scraper
- **File:** `backend/scrapers/cycling_scraper.py`
- **Target:** paysdelaloirecyclisme.fr (Pays de la Loire races)
- **Features:** Incremental updates, region extraction, rate limiting
- **Output:** Direct-to-database storage

### Key Capabilities
- Race detection via CSS selectors
- Precise region extraction from `p.header-race__place`
- Participant data with UCI ID management
- Retry logic with exponential backoff
- French date format handling

## 📊 Development Standards

### Architecture Patterns
- **Separation of Concerns:** Components, hooks, services, contexts
- **State Management:** Local (useState), Global (Context), Server (custom hooks)
- **Component Structure:** Hooks → Event handlers → Computed values → Render

### Code Organization
- **Components:** PascalCase (`CyclistProfile.jsx`)
- **Hooks:** camelCase with "use" prefix (`useApiData.js`)
- **Constants:** SCREAMING_SNAKE_CASE
- **Styling:** Inline styles for dynamic theming

### Performance & Security
- **Memoization:** React.memo, useMemo, useCallback
- **Code Splitting:** Lazy loading
- **Input Validation:** All user inputs sanitized
- **Environment Variables:** Never commit secrets

## 🎯 Special Features

### Default Cyclist System
- **Highlighting:** Green background/border in all tables
- **Storage:** localStorage (client-side only)
- **Dynamic Selection:** ⭐ button in cyclist profiles
- **Real-time Updates:** Context-driven highlighting

### UI/UX Features
- **Glassmorphism:** Modern blur effects and gradients
- **Auto-formatting:** Club names, proper case names, French dates
- **Interactive Elements:** Hover effects, smooth animations
- **Responsive Design:** Mobile-first approach

## 📈 Version History

### v2.7.0 (Current) - Performance Comparison & Top %
- ⚔️ Cyclist performance comparison charts
- 📊 Top % column with gradient colors (1% green = best, 100% red = worst)
- 📈 Average Top % display in cyclist info
- 🔤 Enhanced translation system with interpolation

### v2.6.0 - Deployment & Packaging
- 🐳 Docker containerization with Alpine Linux
- ☁️ Cloud-ready deployment (AWS, GCP, Azure)
- 🔒 Production security features

### v2.5.0 - Chart Pagination
- 📊 10-race pagination with smooth navigation
- 🎯 Precise race region extraction

### v2.4.0 - Races Panel
- 🏁 Full-screen races browser modal

### v2.3.0 - Bug Fixes
- 🔧 Chart rendering improvements
- 🎨 UI/UX enhancements

### v2.2.0 - Enhanced Search
- 🔍 French accent normalization
- ⚡ Real-time chart updates

### v2.1.0 - Dynamic Default Cyclist
- ⭐ localStorage-based cyclist selection

### v2.0.0 - Database System
- 🗄️ SQLite migration from YAML
- 🌐 REST API implementation

---

**Last Updated:** December 2025  
**Current Version:** 2.7.0  
**License:** MIT  
**Repository:** https://github.com/Taumoutsh/ffc_races_history