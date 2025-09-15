# Race Cycling History App - CLAUDE.md

## 📋 Project Overview

**Application Name:** Race Cycling History  
**Framework:** React + Vite + SQLite Database Backend  
**Purpose:** Interactive cycling race performance tracking and analysis  
**Data Source:** SQLite database with REST API  
**Default Cyclist:** John Doe (configurable dynamically via UI)  
**Version:** 2.9.4 - Admin Message System & Modern Forms

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

### 4. ⚔️ Performance Comparison Feature (v2.7.0, Enhanced v2.9.2)
- **Smart Visibility:** Only appears for non-default cyclists with common races
- **Dual View Mode:** Chart/Table toggle similar to cyclist profile
- **Enhanced Chart:** Fixed iPhone legend overflow with responsive sizing
- **Comparison Table:** 4-column layout (Date, Race, Cyclist Position, Default Position)
- **Mobile Optimized:** Compact panels and smart text adaptation
- **Race Matching:** By race_id or race_name + date
- **Multilingual:** English/French support
- **Component:** `ComparisonView.jsx`

### 5. Search & Navigation
- Real-time search with French accent support
- Searches first name, last name, combinations
- 🏁 Races Panel: Full-screen modal with search/pagination

### 6. 🌐 **Future Race Analysis Tool** (v2.9.0)
- **Multi-Website Support:** Auto-scraping from paysdelaloirecyclisme.fr and velo.ffc.fr
- **One-Click Analysis:** URL input → automatic data extraction → instant cyclist results
- **Category Filtering:** Only includes Open 1-3 and Access 1-2 categories (excludes Access 3-4)
- **Smart Numbering:** Estimated numbers with organizer club prioritization
- **Enhanced PDF Export:** Custom filename format with race date and export timestamp
- **Streamlined UI:** Simplified workflow without manual data entry

### 7. 📅 **Date Filter System** (v2.9.3)
- **Universal Filtering:** Year-based filtering across all components
- **Smart Defaults:** Current year (2025) pre-selected for immediate visibility
- **Granular Control:** Individual year selection/deselection via checkboxes
- **Hide-All Capability:** When no years selected, all data hidden
- **Components Coverage:** Performance Chart, Race List, Cyclist Profiles, Comparison Views
- **LocalStorage Persistence:** Filter state saved across sessions
- **Responsive Design:** Aligned with existing UI elements (buttons, search inputs)
- **Multilingual Support:** Proper singular/plural forms in English/French

### 8. 📢 **Admin Message System** (v2.9.4)
- **Persistent Announcements:** Administrators can broadcast messages to all users
- **Banner Display:** Messages appear as prominent banners at the top of the main page
- **Message Types:** Support for Info (ℹ️), Success (✅), Warning (⚠️), and Error (❌) with color-coded styling
- **Admin Management:** Create, edit, activate/deactivate, and delete messages through admin panel
- **Modern UI:** Dark theme forms with glassmorphism effects and modern input styling
- **No User Dismissal:** Messages stay visible until administrators remove them
- **Multilingual:** Full English/French translation support including "Last updated" timestamps
- **Visual Hierarchy:** Circular icon backgrounds with color-coded borders and gradients
- **Responsive Design:** Mobile-optimized with proper touch targets and spacing
- **Component:** `MessagePanel.jsx` with `UserManagement.jsx` admin interface

### 9. Multi-language Support
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
GET /api/messages                  # Get active admin messages (public)
GET /api/admin/messages            # Get all admin messages (admin only)
POST /api/admin/messages           # Create admin message (admin only)
PUT /api/admin/messages/{id}       # Update admin message (admin only)
DELETE /api/admin/messages/{id}    # Delete admin message (admin only)
```

### Performance
- 1,990 cyclists, 111 races, 5,610 results
- Database-indexed search < 100ms
- Real-time API with async handlers

## 🔧 Technical Stack

### Frontend
- **React:** 19.1.0, **Vite:** 6.3.5, **Recharts:** 2.15.3
- **ESLint:** Code linting, **js-yaml:** Legacy YAML support
- **jsPDF:** 2.5.1, **jsPDF-AutoTable:** 3.8.2 for PDF generation

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
│   ├── PerformanceChart.jsx      # v2.9.3 - Enhanced with DateFilter integration
│   ├── ComparisonView.jsx        # v2.7.0 - Upgraded v2.9.2 with table mode
│   ├── DateFilter.jsx            # v2.9.3 - Universal year filtering component
│   ├── RacesList.jsx             # v2.9.3 - Enhanced with date filtering
│   ├── MessagePanel.jsx          # v2.9.4 - Admin message system banner
│   ├── RaceLeaderboardModal.jsx
│   └── admin/
│       └── UserManagement.jsx    # v2.9.4 - Enhanced with modern message forms
├── hooks/
│   ├── useApiData.js             # Enhanced with scrapeRaceData function
│   └── useYamlData.js
├── contexts/
│   └── LanguageContext.jsx
├── utils/
│   ├── dateUtils.js              # v2.7.0 - Date parsing & percentage utilities, v2.9.3 - Enhanced filtering
│   ├── dateFilterStorage.js      # v2.9.3 - LocalStorage persistence for date filters
│   ├── pdfGenerator.js           # v2.8.0 - Enhanced PDF export with custom filenames
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
- **Responsive Design:** Mobile-first approach with comprehensive mobile optimizations
- **Mobile Interface:** Emoji-only buttons, reduced font sizes, compact layouts

## 📈 Version History

### v2.9.4 (Current) - Admin Message System & Modern Forms
- 📢 **Admin Message System:** Complete announcement system for broadcasting messages to all users
- 🎨 **Banner Display:** Messages appear as prominent top-page banners with color-coded message types (Info, Success, Warning, Error)
- 🔧 **Admin Management:** Full CRUD operations for messages through enhanced admin panel
- 🌙 **Modern UI Design:** Dark theme forms with glassmorphism effects, modern inputs, and responsive styling
- 📱 **Mobile Optimized:** Touch-friendly interface with proper spacing and responsive design
- 🚫 **Persistent Messages:** No user dismissal - messages stay visible until administrators remove them
- 🌐 **Multilingual Support:** Complete English/French translations including "Last updated" timestamps
- ⚡ **Enhanced Forms:** Redesigned user creation and message forms with modern styling and side-by-side button layouts
- 🎯 **Visual Hierarchy:** Circular icon backgrounds, color-coded borders, and gradient styling
- 📅 **Updated Timestamps:** Messages display last modification date instead of creation date
- 🔄 **API Integration:** New REST endpoints for message management (/api/messages, /api/admin/messages)
- 🗂️ **New Components:** MessagePanel.jsx for public display, enhanced UserManagement.jsx for admin control

### v2.9.3 - Date Filter System & Enhanced UX
- 📅 **Universal Date Filter:** Year-based filtering system across all components (Performance Chart, Race List, Cyclist Profiles, Comparison Views)
- 🎯 **Smart Defaults:** Current year (2025) pre-selected for immediate data visibility
- 🔄 **Hide-All Capability:** When no years selected, all tables and charts hide data completely
- 💾 **LocalStorage Persistence:** Filter state automatically saved and restored across sessions
- 📐 **UI Integration:** Date filters properly aligned with existing buttons and search inputs
- 🌍 **Enhanced Translations:** Fixed singular/plural forms for "year(s)" in English and "année(s)" in French
- 🔧 **Component Updates:** PerformanceChart enhanced with integrated DateFilter in header section
- ❌ **Simplified UX:** Removed "Select All/Deselect All" button for more granular control
- 🗂️ **New Components:** DateFilter.jsx, dateFilterStorage.js, enhanced dateUtils.js filtering

### v2.9.2 - Enhanced Comparison & Mobile UX
- ⚔️ **Upgraded Comparison View:** Renamed from ComparisonChart to ComparisonView with dual chart/table modes
- 📅 **Enhanced Comparison Table:** Added date column with 4-column layout (Date, Race, Cyclist Position, Default Position)
- 📱 **iPhone Legend Fix:** Resolved chart legend overflow with responsive text sizing and truncation
- 🎛️ **Compact Mobile Panels:** Reduced comparison info panel size by 30% on iPhone for better space utilization
- 🔤 **Smart Text Adaptation:** Mobile shows "races" vs desktop "common races" for space optimization
- 🗑️ **Auto-Analysis Clear Button:** Added functional clear button for race URL input with proper mobile layout
- 🎨 **Language Switcher Update:** Reversed French/English positions with matching color scheme (French=blue, English=red)
- 📊 **Consistent Top % Styling:** Fixed background width inconsistency for single vs double digit percentages
- 📐 **Mobile Table Optimization:** Adjusted position column width and responsive column distribution
- 🌍 **Cross-Platform Support:** Complete Windows batch script equivalents for all Unix shell scripts

### v2.9.1 - Mobile-Optimized Interface
- 📱 **Comprehensive Mobile Optimization:** All buttons show emoji-only on mobile devices (<768px)
- 🔤 **Responsive Typography:** Reduced font sizes on mobile (title: 1rem-2.5rem, subtitle: 0.625rem-1.125rem)
- 🎛️ **Compact Layouts:** Reduced padding, margins, and spacing across all components
- 🔽 **Space-Efficient Panels:** "How to Use" and "Dataset Overview" panels 40% more compact on mobile
- 📊 **Optimized Tables:** Search results, race lists, and cyclist tables with mobile-specific sizing
- 🎨 **Adaptive UI Elements:** Language switcher, navigation buttons, and form controls optimized for touch
- 📐 **Improved Layout Flow:** Search input field sizing prevents button wrapping on mobile
- 🎯 **Enhanced Accessibility:** Maintained 44px minimum touch targets while reducing visual footprint

### v2.9.0 - Advanced Race Scraping & Analysis
- 🌐 **Multi-Website Scraping:** Support for paysdelaloirecyclisme.fr and velo.ffc.fr
- 🎯 **Category Filtering:** Auto-filters to include only Open 1-3 and Access 1-2 categories
- ⚡ **Streamlined Workflow:** One-click URL → scraping → analysis → results
- 📄 **Smart PDF Filenames:** YYYY-MM-DD_RaceName_data_export_DateTime.pdf format
- 🔧 **UI Improvements:** Removed manual entry forms, added horizontal scroll prevention
- 🔤 **Updated Translations:** "Future race analysis tool" branding

### v2.8.0 - Enhanced Research & PDF Export
- 🔢 **Estimated Number System:** Sequential numbering based on alphabetical sorting (club first, then lastname)
- 🏆 **Organizer Club Prioritization:** Cyclists from organizer club get priority numbers (1, 2, 3...)
- 📄 **PDF Export Feature:** Complete research results with clickable cyclist histories
- 📱 **Mobile-Optimized PDF:** iPhone-friendly layout with table of contents navigation
- 🌐 **Enhanced Translations:** Complete multilingual support for new features
- 🎨 **Visual Enhancements:** Organizer club highlighting and improved UI

### v2.7.0 - Performance Comparison & Top %
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

**Last Updated:** January 2025  
**Current Version:** 2.9.4  
**License:** MIT  
**Repository:** https://github.com/Taumoutsh/ffc_races_history