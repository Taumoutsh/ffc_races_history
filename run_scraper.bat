@echo off
REM Race Cycling History - Database Scraper Script for Windows
REM This script runs the cycling data scraper to update the database

echo =====================================
echo Race Cycling History - Data Scraper
echo =====================================
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

REM Check if we're in the correct directory
if not exist "backend\scrapers\cycling_scraper.py" (
    echo ERROR: cycling_scraper.py not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if database directory exists
if not exist "database" (
    echo Creating database directory...
    mkdir database
)

echo Starting the cycling data scraper...
echo This will update the database with new race data from paysdelaloirecyclisme.fr
echo.

REM Run the scraper
cd backend
python scrapers\cycling_scraper.py

REM Check if scraper ran successfully
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Scraper completed successfully!
    echo Database has been updated with new data
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERROR: Scraper failed with exit code %errorlevel%
    echo Check the error messages above
    echo ========================================
)

cd ..
echo.
echo Press any key to exit...
pause >nul