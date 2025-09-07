@echo off
echo 🚴 Race Cycling History App - Windows Launcher
echo ===============================================
echo.

REM Check if dependencies are installed
if not exist node_modules (
    echo ❌ Dependencies not installed
    echo Please run: install-dependencies.bat
    echo.
    pause
    exit /b 1
)

if not exist venv (
    echo ❌ Python environment not found
    echo Please run: install-dependencies.bat
    echo.
    pause
    exit /b 1
)

REM Set environment variables
set PYTHONPATH=%CD%;%PYTHONPATH%
set DB_PATH=%CD%\backend\database\cycling_data.db

REM Create database directory if it doesn't exist
if not exist backend\database mkdir backend\database

REM Setup database if it doesn't exist
if not exist "%DB_PATH%" (
    echo 📊 Setting up database...
    call venv\Scripts\activate.bat
    python -c "import sys; sys.path.append('.'); from backend.database.models_optimized import CyclingDatabase; db = CyclingDatabase('%DB_PATH%'); print('✅ Database created!')"
    if %ERRORLEVEL% neq 0 (
        echo ❌ Database setup failed
        pause
        exit /b 1
    )
    echo.
)

echo 🚀 Starting Race Cycling History App...
echo.
echo 📱 Application URLs:
echo    Frontend: http://localhost:5173
echo    API:      http://localhost:3001/api/health
echo.
echo ⚠️  Keep this window open while using the app
echo    Press Ctrl+C to stop the application
echo.

REM Start API server in background
echo 🌐 Starting API server...
call venv\Scripts\activate.bat
start /b cmd /c "python -m backend.api.server"

REM Wait for API to start
timeout /t 3 /nobreak >nul

REM Start frontend development server
echo 🎨 Starting frontend...
npm run dev