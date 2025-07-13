@echo off
REM Race Cycling History - API Server Script for Windows
REM This script starts the Flask API server

echo ======================================
echo Race Cycling History - API Server
echo ======================================
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

REM Check if we're in the correct directory and API server exists
if not exist "backend\api\server.py" (
    echo ERROR: server.py not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if database exists
if not exist "database\cycling_data.db" (
    echo WARNING: Database not found
    echo Please run setup_database.bat first to set up the database
    echo.
    set /p choice="Continue anyway? (y/N): "
    if /i not "%choice%"=="y" (
        echo Exiting...
        pause
        exit /b 1
    )
)

REM Check if virtual environment exists
if not exist "scraper_env" (
    echo ERROR: Virtual environment not found
    echo Please run setup_database.bat first to create the environment
    pause
    exit /b 1
)

echo Activating Python virtual environment...
call scraper_env\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

echo Installing/updating Python dependencies...
pip install -r backend\requirements.txt >nul 2>&1

echo.
echo Starting Flask API server...
echo API will be available at: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo ======================================
echo.

REM Start the API server
cd backend
python api\server.py

REM If we get here, the server stopped
cd ..
echo.
echo API server stopped.
echo Press any key to exit...
pause >nul