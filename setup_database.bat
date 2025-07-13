@echo off
REM Race Cycling History - Database Setup Script for Windows
REM This script sets up the SQLite database and runs the initial data scraping

echo ==========================================
echo Race Cycling History - Database Setup
echo ==========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and add it to your PATH
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Create necessary directories
echo Creating directories...
if not exist "database" mkdir database
if not exist "backend\logs" mkdir backend\logs

echo Setting up Python virtual environment...
if not exist "scraper_env" (
    echo Creating virtual environment...
    python -m venv scraper_env
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create virtual environment
        echo Please ensure Python is properly installed with venv module
        pause
        exit /b 1
    )
)

echo Activating virtual environment...
call scraper_env\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

echo Installing Python dependencies...
pip install -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo WARNING: Could not install some dependencies
    echo Please check backend\requirements.txt and install manually if needed
)

echo.
echo Setting up the SQLite database...
REM Set Python path for imports (Windows syntax)
set PYTHONPATH=%CD%\backend;%PYTHONPATH%
cd backend
python database\setup_database.py

if %errorlevel% equ 0 (
    echo.
    echo Database setup completed successfully!
    echo.
    echo Running initial data scraping...
    python scrapers\cycling_scraper_db_optimized.py
    
    if %errorlevel% equ 0 (
        echo.
        echo ==========================================
        echo Setup completed successfully!
        echo Database is ready with initial race data
        echo ==========================================
        echo.
        echo You can now:
        echo 1. Start the API server with: start_api.bat
        echo 2. Start the React app with: npm run dev
        echo 3. Run additional scraping with: run_scraper.bat
    ) else (
        echo.
        echo WARNING: Initial scraping failed
        echo Database is set up but may be empty
        echo You can run run_scraper.bat later to populate data
    )
) else (
    echo.
    echo ==========================================
    echo ERROR: Database setup failed
    echo Check the error messages above
    echo ==========================================
)

cd ..
echo.
echo Press any key to exit...
pause >nul