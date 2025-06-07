# FFC Races History Viewer

(This whole app has been developed thanks to Claude by Anthropic AI)

A modern React web application for visualizing cycling race data and performance analytics. Built with React + Vite, featuring interactive charts, cyclist profiles, and comprehensive race leaderboards.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![Vite](https://img.shields.io/badge/Vite-6.3.5-purple.svg)

## ✨ Features

### 📊 Performance Analytics
- **Interactive Performance Charts**: Line graphs showing race positions over time
- **Clickable Data Points**: Click any point to view full race leaderboards
- **Dynamic Tooltips**: Hover for detailed race information

### 🏆 Race Management
- **Complete Race Leaderboards**: View all participants with rankings
- **Interactive Modals**: Beautiful, responsive modal windows
- **Participant Details**: Full cyclist information including ID, region, and team

### 👤 Cyclist Profiles
- **Individual Performance History**: Complete race history for any cyclist
- **Sortable Data**: Sort by date, location, or position
- **Interactive Tables**: Click races to view leaderboards
- **Performance Overview**: Total races and statistics

### 🔍 Search & Discovery
- **Real-time Search**: Find cyclists as you type
- **Smart Matching**: Search by first name, last name, or cyclist ID
- **Instant Results**: Live search results with race counts

### ⚙️ Configuration
- **Configurable Default Cyclist**: Easy configuration file setup
- **Customizable UI**: Header titles and labels
- **Flexible Data Structure**: Works with any cyclist in the dataset

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd race-cycling-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Generate your data**
   - **Important**: The `public/data.yaml` file must be generated using the Python scraper
   - See [Data Scraping](#️-data-scraping) section below for scraper setup
   - Alternatively, create your own YAML following the [Data Format](#-data-format) structure

4. **Configure default cyclist** (optional)
   - Edit `src/config/appConfig.js`
   - Update `defaultCyclist.firstName` and `defaultCyclist.lastName`

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   - Navigate to `http://localhost:5173`

## 🕷️ Data Scraping

**Required Step**: This project includes a Python scraper (`cycling_scraper.py`) that **must be run** to generate the `public/data.yaml` file needed by the application.

### Prerequisites for Scraping
- Python 3.8+
- Virtual environment (recommended)

### Scraper Setup

1. **Create virtual environment**
   ```bash
   python -m venv scraper_env
   source scraper_env/bin/activate  # On Windows: scraper_env\Scripts\activate
   ```

2. **Install Python dependencies**
   ```bash
   pip install requests beautifulsoup4 pyyaml
   ```

3. **Run the scraper**
   ```bash
   python cycling_scraper.py
   ```

### Scraper Features
- **Incremental Updates**: Only scrapes new races, preserving existing data
- **Race Detection**: Automatically finds and processes race results
- **Data Validation**: Ensures data quality and consistency
- **Progress Tracking**: Shows scraping progress with detailed logging
- **Error Handling**: Robust error handling with retry mechanisms

### Output
The scraper generates the **required** `public/data.yaml` file with complete race data and racer histories. Without this file, the application will not have any data to display.

⚠️ **Important**: Make sure to run the scraper before starting the React application, as it depends on the generated data file.

## 📊 Data Format

The application expects a YAML file with the following structure:

```yaml
scraping_info:
  timestamp: "2025-06-07T..."
  total_races: 150
  total_racers: 500

races:
  race_001:
    date: "24 mai 2025"
    name: "SAMPLE CYCLING RACE (Category A)"
    participants:
    - name: '10073339054'
      rank: 1
      raw_data:
      - '1'           # Position
      - '10073339054' # Cyclist ID
      - 'DOE'         # Last name
      - 'JOHN'        # First name
      - 'SAMPLE REGION' # Region
      - '5272184 SAMPLE CYCLING CLUB' # Team

racers_history:
  '10001217837':
  - date: "30 mars 2025"
    race_id: race_065
    race_name: "SAMPLE RACE (Category B)"
    rank: 1
```

### Data Requirements
- **Date Format**: French format (e.g., "24 mai 2025")
- **Participant Data**: Array with position, ID, lastname, firstname, region, team
- **Race IDs**: Unique identifiers for each race
- **Racer History**: Individual performance tracking by cyclist ID

### Manual Data Creation
If you prefer to create data manually or use a different source, ensure your YAML follows the structure above. The scraper is specifically designed for paysdelaloirecyclisme.fr but the data format is generic enough for other sources.

**Note**: The easiest way to get started is to run the included Python scraper which will automatically generate a properly formatted `data.yaml` file with real cycling race data.

## ⚙️ Configuration

### Default Cyclist Setup

Edit `src/config/appConfig.js` to change the default cyclist:

```javascript
export const appConfig = {
  defaultCyclist: {
    firstName: 'JOHN',      // Cyclist's first name
    lastName: 'DOE',        // Cyclist's last name
  },
  
  ui: {
    headerTitle: 'FFC Races History',
    headerSubtitle: 'Interactive cycling race performance tracking'
  },
  
  chart: {
    title: 'Race Performance History',
    yAxisLabel: 'Position',
    xAxisLabel: 'Race Date'
  }
};
```

### Available Options

| Option | Description | Example |
|--------|-------------|---------|
| `defaultCyclist.firstName` | Default cyclist's first name | `'MARIE'` |
| `defaultCyclist.lastName` | Default cyclist's last name | `'BERNARD'` |
| `ui.headerTitle` | Main application title | `'My Cycling App'` |
| `ui.headerSubtitle` | Application description | `'Race analytics dashboard'` |

## 🏗️ Architecture

### Project Structure
```
src/
├── components/           # React components
│   ├── PerformanceChart.jsx    # Main chart component
│   ├── RaceLeaderboardModal.jsx # Race details modal
│   └── CyclistProfile.jsx      # Cyclist profile page
├── hooks/               # Custom React hooks
│   └── useYamlData.js          # Data management hook
├── config/              # Configuration files
│   └── appConfig.js            # App configuration
├── assets/              # Static assets
└── App.jsx             # Main application component
```

### Key Components

#### `PerformanceChart`
- Renders interactive line chart using Recharts
- Handles click events for race selection
- Responsive design with custom tooltips

#### `RaceLeaderboardModal`
- Displays complete race results
- Sortable participant table
- Cyclist profile navigation

#### `CyclistProfile`
- Shows individual cyclist performance
- Sortable race history table
- Chart/table view toggle

#### `useYamlData`
- Manages data loading and parsing
- Provides search functionality
- Handles cyclist data retrieval

## 🎨 UI Features

### Modern Design
- **Glass morphism effects**: Blur backgrounds and transparency
- **Gradient accents**: Beautiful color gradients throughout
- **Responsive layout**: Works on all screen sizes
- **Smooth animations**: Hover effects and transitions

### Interactive Elements
- **Clickable charts**: Direct interaction with data points
- **Modal windows**: Overlay interface for detailed views
- **Real-time search**: Instant filtering and results
- **Sortable tables**: Column-based sorting with visual indicators

### Accessibility
- **Keyboard navigation**: Full keyboard support
- **Screen reader friendly**: Proper ARIA labels
- **High contrast**: Clear visual hierarchy
- **Responsive text**: Scalable typography

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Tech Stack
- **React 19.1.0**: Modern React with hooks
- **Vite 6.3.5**: Fast build tool and dev server
- **Recharts 2.15.3**: Chart and graph library
- **js-yaml 4.1.0**: YAML parsing
- **ESLint**: Code linting and formatting

### Scraper Tech Stack
- **Python 3.8+**: Core scraping logic
- **BeautifulSoup4**: HTML parsing
- **Requests**: HTTP client
- **PyYAML**: YAML data processing

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **Data Processing**: Extend `useYamlData` hook
3. **Configuration**: Update `appConfig.js`
4. **Styling**: Use inline styles following existing patterns

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit: `git commit -m 'Add feature'`
5. Push: `git push origin feature-name`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Data Format](#-data-format) requirements
2. Verify your YAML file is valid
3. Ensure the default cyclist exists in your data
4. Check browser console for error messages

## 🎯 Roadmap

- [ ] Export functionality (PDF, CSV)
- [ ] Advanced filtering options
- [ ] Performance comparison between cyclists
- [ ] Dark mode toggle
- [ ] Mobile-optimized interface
- [ ] Data validation and error handling

---

Built with ❤️ using React and modern web technologies.