@echo off
echo 🕷️ Race Cycling Data Scraper - Windows
echo =====================================
echo.

REM Check if Python environment exists
if not exist venv (
    echo ❌ Python environment not found
    echo Please run: install-dependencies.bat
    echo.
    pause
    exit /b 1
)

REM Activate Python environment
call venv\Scripts\activate.bat

REM Set environment variables
set PYTHONPATH=%CD%;%PYTHONPATH%
set DB_PATH=%CD%\backend\database\cycling_data.db

REM Create database directory if it doesn't exist
if not exist backend\database mkdir backend\database

REM Setup database if it doesn't exist
if not exist "%DB_PATH%" (
    echo 📊 Database not found, creating...
    python -c "import sys; sys.path.append('.'); from backend.database.models_optimized import CyclingDatabase; db = CyclingDatabase('%DB_PATH%'); print('✅ Database created!')"
    if %ERRORLEVEL% neq 0 (
        echo ❌ Database creation failed
        pause
        exit /b 1
    )
    echo.
)

echo 🔧 Available scrapers:
echo.
echo   1. Standard scraper (cycling_scraper_db.py)
echo   2. Optimized scraper (cycling_scraper_db_optimized.py)
echo   3. Exit
echo.
set /p choice="Choose scraper (1-3): "

if "%choice%"=="1" (
    echo 🏃 Running standard scraper...
    echo This will collect race data from paysdelaloirecyclisme.fr
    echo.
    python backend\scrapers\cycling_scraper_db.py
) else if "%choice%"=="2" (
    echo 🚀 Running optimized scraper...
    echo This will collect race data from paysdelaloirecyclisme.fr (faster)
    echo.
    python backend\scrapers\cycling_scraper_db_optimized.py
) else if "%choice%"=="3" (
    echo 👋 Exiting...
    exit /b 0
) else (
    echo ❌ Invalid choice
    pause
    exit /b 1
)

if %ERRORLEVEL% equ 0 (
    echo.
    echo 🎉 Scraping completed successfully!
    echo.
    echo 📊 Database updated: %DB_PATH%
    echo.
    echo 🚀 You can now run the app with: run-app.bat
) else (
    echo.
    echo ❌ Scraping failed with error code: %ERRORLEVEL%
    echo.
    echo 🔧 Troubleshooting:
    echo   - Check your internet connection
    echo   - Verify the target website is accessible
    echo   - Try running the other scraper option
)

echo.
pause