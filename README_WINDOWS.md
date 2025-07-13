# Race Cycling History - Windows Setup Guide

This guide helps you set up and run the Race Cycling History app on Windows.

## 📋 Prerequisites

### Required Software
1. **Python 3.8+**
   - Download from: https://www.python.org/downloads/
   - ⚠️ **Important**: Check "Add Python to PATH" during installation
   
2. **Node.js 18+**
   - Download from: https://nodejs.org/
   - Includes npm package manager

3. **Git** (optional, for cloning the repository)
   - Download from: https://git-scm.com/download/win

## 🚀 Quick Start

### 1. Get the Project
```bash
# Option A: Clone with Git
git clone https://github.com/Taumoutsh/ffc_races_history.git
cd ffc_races_history

# Option B: Download ZIP and extract
```

### 2. Database Setup
Double-click `setup_database.bat` or run in Command Prompt:
```cmd
setup_database.bat
```

This script will:
- Install Python dependencies
- Create the SQLite database
- Run initial data scraping
- Set up all necessary directories

### 3. Start the API Server
Double-click `start_api.bat` or run:
```cmd
start_api.bat
```

The API server will start at `http://localhost:3001`

### 4. Start the React App
Open a new Command Prompt and run:
```cmd
npm install
npm run dev
```

The React app will be available at `http://localhost:5173`

## 📜 Available Windows Scripts

### `setup_database.bat`
- **Purpose**: Complete database setup and initial data scraping
- **When to use**: First time setup or database reset
- **What it does**:
  - Creates database directories
  - Installs Python dependencies
  - Sets up SQLite database schema
  - Runs initial data scraping from paysdelaloirecyclisme.fr

### `start_api.bat` 
- **Purpose**: Start the Flask API server
- **When to use**: Every time you want to run the app
- **What it does**:
  - Starts the backend API at `http://localhost:3001`
  - Serves race data, cyclist information, and research tools
  - Required for the React app to function

### `run_scraper.bat`
- **Purpose**: Update database with new race data
- **When to use**: Periodically to get latest race results
- **What it does**:
  - Scrapes new data from paysdelaloirecyclisme.fr
  - Updates the SQLite database
  - Adds new races and cyclists

## 🔧 Manual Setup (Alternative)

If the batch scripts don't work, follow these manual steps:

### Backend Setup
```cmd
cd backend
pip install -r requirements.txt
python database/setup_database.py
python scrapers/cycling_scraper.py
python api/server.py
```

### Frontend Setup (in new terminal)
```cmd
npm install
npm run dev
```

## 📊 Usage

1. **Search Cyclists**: Use the search bar to find specific cyclists
2. **View Race History**: Click on cyclists to see their performance charts
3. **Analyze Races**: Click on chart points to view race leaderboards
4. **Research Tool**: Use the "Future Race Analysis" section to analyze upcoming races
5. **Export Data**: Generate PDF reports of your research

## 🐛 Troubleshooting

### Common Issues

**"Python is not recognized"**
- Reinstall Python and check "Add Python to PATH"
- Or manually add Python to your system PATH

**"pip is not recognized"**
- Python installation issue - reinstall Python
- Ensure pip is included in the installation

**Database errors**
- Delete the `database` folder and run `setup_database.bat` again
- Check that you have write permissions in the project directory

**API server won't start**
- Check if port 3001 is already in use
- Try restarting your computer
- Run `netstat -an | findstr :3001` to check port usage

**React app won't start**
- Run `npm install` again
- Try deleting `node_modules` and running `npm install`
- Check Node.js version with `node --version`

### Getting Help

1. Check the error messages in the Command Prompt
2. Ensure all prerequisites are properly installed
3. Try running the manual setup steps
4. Check the main CLAUDE.md file for additional information

## 🔄 Updating the App

To get the latest updates:

```cmd
git pull origin main
npm install
setup_database.bat
```

## 📁 Project Structure

```
race-cycling-app/
├── backend/
│   ├── api/server.py          # Flask API server
│   ├── database/              # Database setup scripts
│   ├── scrapers/              # Data scraping tools
│   └── requirements.txt       # Python dependencies
├── src/                       # React app source code
├── database/                  # SQLite database files
├── setup_database.bat         # Windows database setup
├── start_api.bat             # Windows API server starter
├── run_scraper.bat           # Windows scraper runner
└── package.json              # Node.js dependencies
```

## 🎯 Next Steps

After setup, you can:
- Explore the cyclist database
- Analyze race performance trends
- Use the research tool for upcoming races
- Export findings to PDF reports
- Set up automated scraping schedules

Happy cycling data analysis! 🚴‍♂️📊