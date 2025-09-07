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
) else (
    REM Create backup of existing database
    echo 💾 Creating database backup...
    
    REM Generate timestamp using PowerShell (more reliable)
    for /f "usebackq delims=" %%i in (`powershell -Command "Get-Date -Format 'yyyyMMdd_HHmmss'"`) do set timestamp=%%i
    
    REM Create backup filename
    set BACKUP_PATH=%CD%\backend\database\cycling_data_backup_%timestamp%.db
    
    REM Copy the database to backup
    copy "%DB_PATH%" "%BACKUP_PATH%" >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo ✅ Backup created: cycling_data_backup_%timestamp%.db
    ) else (
        echo ⚠️ Backup creation failed, continuing anyway...
    )
    echo.
)

echo Scraping started...
python backend\scrapers\cycling_scraper_db_optimized.py

if %ERRORLEVEL% equ 0 (
    echo.
    echo 🎉 Scraping completed successfully!
    echo.
    echo 📊 Database updated: %DB_PATH%
    if defined timestamp if exist "%BACKUP_PATH%" (
        echo 💾 Previous version backed up as: cycling_data_backup_%timestamp%.db
    )
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
    if defined timestamp if exist "%BACKUP_PATH%" (
        echo   - Your original database backup is safe: cycling_data_backup_%timestamp%.db
    )
)

echo.
pause