@echo off
echo Race Cycling Data Scraper - Windows
echo ===================================
echo.

REM Set default values
set REGION=%1
if "%REGION%"=="" set REGION=pays-de-la-loire

REM Validate region
if "%REGION%"=="pays-de-la-loire" goto valid_region
if "%REGION%"=="bretagne" goto valid_region
if "%REGION%"=="nouvelle-aquitaine" goto valid_region
echo Invalid region: %REGION%
echo Available regions: pays-de-la-loire, bretagne, nouvelle-aquitaine
pause
exit /b 1

:valid_region

REM Check if Python environment exists
if not exist venv (
    echo Python environment not found
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

REM Display region information
if "%REGION%"=="pays-de-la-loire" set REGION_NAME=Pays de la Loire
if "%REGION%"=="bretagne" set REGION_NAME=Bretagne  
if "%REGION%"=="nouvelle-aquitaine" set REGION_NAME=Nouvelle-Aquitaine

echo Running database scraper...
echo Target region: %REGION_NAME% (%REGION%)
echo This may take several minutes...
echo.

python backend\scrapers\cycling_scraper_db_optimized.py --region %REGION%

if %ERRORLEVEL% equ 0 (
    echo.
    echo Scraping completed successfully!
    echo Database updated: %DB_PATH%
    echo You can now run the app with: run-app.bat
) else (
    echo.
    echo Scraping failed with error code: %ERRORLEVEL%
    echo Check your internet connection and try again
)

echo.
pause