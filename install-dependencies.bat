@echo off
setlocal enabledelayedexpansion

echo Race Cycling History App - Automatic Dependency Installer
echo ================================================================
echo.

REM Set execution policy for PowerShell commands
echo Setting PowerShell execution policy...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force" 2>nul

REM Create downloads directory
if not exist downloads mkdir downloads

echo ========================================
echo Remove Python from WindowsApps
echo ========================================
echo.
echo This script removes Python stub executables from WindowsApps
echo that redirect to the Microsoft Store and can interfere with
echo regular Python installations.
echo.

REM Set the WindowsApps path
set "WINDOWSAPPS=%LOCALAPPDATA%\Microsoft\WindowsApps"

echo Checking WindowsApps directory:
echo %WINDOWSAPPS%
echo.

REM Check if the directory exists
if not exist "%WINDOWSAPPS%" (
    echo [ERROR] WindowsApps directory not found!
    echo.
    pause
    exit /b 1
)

REM Check and remove python.exe
if exist "%WINDOWSAPPS%\python.exe" (
    echo [FOUND] python.exe in WindowsApps
    echo Removing python.exe...
    del /f /q "%WINDOWSAPPS%\python.exe" 2>nul
    if !errorlevel! equ 0 (
        echo [OK] python.exe removed successfully
    ) else (
        echo [ERROR] Failed to remove python.exe - may need admin rights
        echo Trying with takeown...
        takeown /f "%WINDOWSAPPS%\python.exe" >nul 2>&1
        icacls "%WINDOWSAPPS%\python.exe" /grant %USERNAME%:F >nul 2>&1
        del /f /q "%WINDOWSAPPS%\python.exe" 2>nul
        if !errorlevel! equ 0 (
            echo [OK] python.exe removed after permission change
        ) else (
            echo [ERROR] Could not remove python.exe
        )
    )
) else (
    echo [OK] python.exe not found in WindowsApps
)

echo.

REM Check and remove python3.exe
if exist "%WINDOWSAPPS%\python3.exe" (
    echo [FOUND] python3.exe in WindowsApps
    echo Removing python3.exe...
    del /f /q "%WINDOWSAPPS%\python3.exe" 2>nul
    if !errorlevel! equ 0 (
        echo [OK] python3.exe removed successfully
    ) else (
        echo [ERROR] Failed to remove python3.exe - may need admin rights
        echo Trying with takeown...
        takeown /f "%WINDOWSAPPS%\python3.exe" >nul 2>&1
        icacls "%WINDOWSAPPS%\python3.exe" /grant %USERNAME%:F >nul 2>&1
        del /f /q "%WINDOWSAPPS%\python3.exe" 2>nul
        if !errorlevel! equ 0 (
            echo [OK] python3.exe removed after permission change
        ) else (
            echo [ERROR] Could not remove python3.exe
        )
    )
) else (
    echo [OK] python3.exe not found in WindowsApps
)

echo.

REM Check and remove python3.x.exe variants (like python3.10.exe, python3.11.exe, etc.)
echo Checking for other Python variants...
set "FOUND_VARIANTS=0"
for %%f in ("%WINDOWSAPPS%\python3.*.exe") do (
    if exist "%%f" (
        set "FOUND_VARIANTS=1"
        echo [FOUND] %%~nxf
        del /f /q "%%f" 2>nul
        if !errorlevel! equ 0 (
            echo [OK] %%~nxf removed
        ) else (
            echo [ERROR] Could not remove %%~nxf
        )
    )
)

if !FOUND_VARIANTS! equ 0 (
    echo [OK] No Python version variants found
)

echo.

REM Also check for pip executables
if exist "%WINDOWSAPPS%\pip.exe" (
    echo [FOUND] pip.exe in WindowsApps
    echo Removing pip.exe...
    del /f /q "%WINDOWSAPPS%\pip.exe" 2>nul
    if !errorlevel! equ 0 (
        echo [OK] pip.exe removed successfully
    ) else (
        echo [ERROR] Failed to remove pip.exe
    )
) else (
    echo [OK] pip.exe not found in WindowsApps
)

if exist "%WINDOWSAPPS%\pip3.exe" (
    echo [FOUND] pip3.exe in WindowsApps
    echo Removing pip3.exe...
    del /f /q "%WINDOWSAPPS%\pip3.exe" 2>nul
    if !errorlevel! equ 0 (
        echo [OK] pip3.exe removed successfully
    ) else (
        echo [ERROR] Failed to remove pip3.exe
    )
) else (
    echo [OK] pip3.exe not found in WindowsApps
)

echo.
echo ========================================
echo Cleanup complete!
echo ========================================
echo.

echo Checking system requirements...
echo.

:CheckGit
REM Check if Git is installed
echo Checking for Git...
where git >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Git is already installed:
    for /f "delims=" %%i in ('git --version 2^>nul') do echo %%i
    echo.
    goto :CheckNode
) else (
    echo [!] Git not found - downloading and installing...
    echo.
    
    REM Detect system architecture
    if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
        set "GIT_URL=https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
        set "GIT_INSTALLER=Git-2.43.0-64-bit.exe"
    ) else (
        set "GIT_URL=https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-32-bit.exe"
        set "GIT_INSTALLER=Git-2.43.0-32-bit.exe"
    )
    
    REM Download Git installer
    echo Downloading Git for Windows...
    powershell -Command "try { Invoke-WebRequest -Uri '%GIT_URL%' -OutFile 'downloads\%GIT_INSTALLER%' -UseBasicParsing } catch { exit 1 }"
    
    if exist "downloads\%GIT_INSTALLER%" (
        echo Installing Git - this may take a few minutes...
        echo Please wait, installing silently...
        
        REM Silent install with recommended settings
        start /wait "downloads\%GIT_INSTALLER%" /VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS /COMPONENTS="icons,ext\reg\shellhere,assoc,assoc_sh" /PATH="C:\Program Files\Git"
        
        REM Add Git to PATH for current session
        set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\Git\bin"
        
        echo [OK] Git installation completed
        echo.
    ) else (
        echo [ERROR] Failed to download Git installer
        echo Please install Git manually from: https://git-scm.com/download/win
        echo.
        echo Press any key to continue without Git...
        pause >nul
    )
)

:CheckNode
REM Check if Node.js is installed
echo Checking for Node.js...
where node >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Node.js is already installed:
    for /f "delims=" %%i in ('node --version 2^>nul') do echo Node version: %%i
    for /f "delims=" %%i in ('npm --version 2^>nul') do echo NPM version: %%i
    echo.
    goto :CheckPython
) else (
    echo [!] Node.js not found - downloading and installing...
    echo.
    
    REM Download Node.js installer
    echo Downloading Node.js 20 LTS...
    powershell -Command "try { Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile 'downloads\nodejs.msi' -UseBasicParsing } catch { exit 1 }"
    
    if exist downloads\nodejs.msi (
        echo Installing Node.js - this may take a few minutes...
        msiexec /i downloads\nodejs.msi /quiet /norestart
        
        REM Add Node.js to PATH for current session
        set "PATH=%PATH%;%ProgramFiles%\nodejs"
        
        echo [OK] Node.js installation completed
        echo.
    ) else (
        echo [ERROR] Failed to download Node.js installer
        echo Please install Node.js manually from: https://nodejs.org/
        pause
        exit /b 1
    )
)

:CheckPython
REM Check if Python is installed
echo Checking for Python...
where python >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Python is already installed:
    for /f "delims=" %%i in ('python --version 2^>nul') do echo %%i
    echo.
    goto :RefreshPath
) else (
    REM Try py launcher as well
    where py >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Python is already installed via py launcher:
        for /f "delims=" %%i in ('py --version 2^>nul') do echo %%i
        echo.
        goto :RefreshPath
    ) else (
        echo [!] Python not found - downloading and installing...
        echo.
        
        REM Download Python installer
        echo Downloading Python 3.11...
        powershell -Command "try { Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe' -OutFile 'downloads\python.exe' -UseBasicParsing } catch { exit 1 }"
        
        if exist downloads\python.exe (
            echo Installing Python - this may take a few minutes...
            downloads\python.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
            
            REM Add Python to PATH for current session
            set "PATH=%PATH%;C:\Program Files\Python311;C:\Program Files\Python311\Scripts"
            
            echo [OK] Python installation completed
            echo.
        ) else (
            echo [ERROR] Failed to download Python installer
            echo Please install Python manually from: https://www.python.org/
            pause
            exit /b 1
        )
    )
)

:RefreshPath
REM Refresh PATH from registry for current session
echo Refreshing environment variables...
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SystemPath=%%b"
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "UserPath=%%b"
if defined SystemPath set "PATH=%SystemPath%"
if defined UserPath set "PATH=%PATH%;%UserPath%"

:VerifyInstalls
REM Verify installations work
echo.
echo Verifying installations...

set GIT_OK=0
set NODE_OK=0
set PYTHON_OK=0

where git >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Git verified
    set GIT_OK=1
) else (
    echo [WARNING] Git not found in PATH
)

where node >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Node.js verified
    set NODE_OK=1
) else (
    echo [WARNING] Node.js not found in PATH
)

where python >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Python verified
    set PYTHON_OK=1
) else (
    where py >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Python verified via py launcher
        set PYTHON_OK=1
    ) else (
        echo [WARNING] Python not found in PATH
    )
)

if !GIT_OK! equ 0 (
    echo.
    echo [WARNING] Git could not be verified. You may need to:
    echo   1. Close this command prompt
    echo   2. Open a new command prompt
    echo   3. Run this script again
    echo.
    echo Press any key to continue anyway or close this window to exit...
    pause >nul
)

if !NODE_OK! equ 0 (
    echo.
    echo [WARNING] Node.js could not be verified. You may need to:
    echo   1. Close this command prompt
    echo   2. Open a new command prompt
    echo   3. Run this script again
    echo.
    echo Press any key to continue anyway or close this window to exit...
    pause >nul
)

if !PYTHON_OK! equ 0 (
    echo.
    echo [WARNING] Python could not be verified. You may need to:
    echo   1. Close this command prompt
    echo   2. Open a new command prompt  
    echo   3. Run this script again
    echo.
    echo Press any key to continue anyway or close this window to exit...
    pause >nul
)

echo.

:ConfigureGit
REM Configure Git if it was just installed
where git >nul 2>&1
if !errorlevel! equ 0 (
    echo Configuring Git settings...
    
    REM Check if user.name is already set
    git config --global user.name >nul 2>&1
    if !errorlevel! neq 0 (
        echo.
        echo Git needs to be configured with your name and email.
        echo You can set them now or skip and configure later.
        echo.
        set /p "GIT_NAME=Enter your name (or press Enter to skip): "
        if not "!GIT_NAME!"=="" (
            git config --global user.name "!GIT_NAME!"
            echo [OK] Git user name set
        )
        
        set /p "GIT_EMAIL=Enter your email (or press Enter to skip): "
        if not "!GIT_EMAIL!"=="" (
            git config --global user.email "!GIT_EMAIL!"
            echo [OK] Git user email set
        )
    ) else (
        echo [OK] Git already configured
    )
    
    REM Set some recommended Git settings
    git config --global core.autocrlf true 2>nul
    git config --global init.defaultBranch main 2>nul
    echo [OK] Git settings configured
    echo.
)

:InstallDependencies
REM Install Node.js dependencies
if exist package.json (
    echo Installing Node.js packages...
    call npm install 2>nul
    call npm install @rollup/rollup-win32-x64-msvc 2>nul
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install Node.js dependencies
        echo Trying again with verbose output...
        call npm install
        if !errorlevel! neq 0 (
            echo [ERROR] npm install failed. Please check package.json
            pause
            exit /b 1
        )
    )
    echo [OK] Node.js packages installed
) else (
    echo [WARNING] No package.json found, skipping Node.js package installation
)

echo.

REM Setup Python environment
echo Setting up Python environment...

REM Try to find Python executable
set PYTHON_CMD=python
where python >nul 2>&1
if !errorlevel! neq 0 (
    where py >nul 2>&1
    if !errorlevel! equ 0 (
        set PYTHON_CMD=py -3
    ) else (
        echo [ERROR] Python executable not found
        pause
        exit /b 1
    )
)

REM Create virtual environment
echo Creating Python virtual environment...
!PYTHON_CMD! -m venv venv 2>nul
if !errorlevel! neq 0 (
    echo [ERROR] Failed to create Python virtual environment
    echo Trying with verbose output...
    !PYTHON_CMD! -m venv venv
    pause
    exit /b 1
)

REM Activate virtual environment and install dependencies
echo Activating virtual environment...
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    
    echo Upgrading pip...
    python -m pip install --upgrade pip 2>nul
    
    if exist requirements.txt (
        echo Installing Python packages from requirements.txt...
        python -m pip install -r requirements.txt 2>nul
        if !errorlevel! neq 0 (
            echo [WARNING] Some packages may have failed to install
            echo Retrying with verbose output...
            python -m pip install -r requirements.txt
        )
        echo [OK] Python packages installed
    ) else (
        echo [WARNING] No requirements.txt found, skipping Python package installation
    )
    
    REM Deactivate virtual environment
    call deactivate
) else (
    echo [ERROR] Virtual environment activation script not found
    pause
    exit /b 1
)

:Complete
echo.
echo ========================================
echo Installation Summary
echo ========================================
where git >nul 2>&1
if !errorlevel! equ 0 (
    for /f "delims=" %%i in ('git --version 2^>nul') do echo [OK] %%i
) else (
    echo [!] Git: Not found
)

where node >nul 2>&1
if !errorlevel! equ 0 (
    for /f "delims=" %%i in ('node --version 2^>nul') do echo [OK] Node.js: %%i
) else (
    echo [!] Node.js: Not found
)

where python >nul 2>&1
if !errorlevel! equ 0 (
    for /f "delims=" %%i in ('python --version 2^>nul') do echo [OK] %%i
) else (
    where py >nul 2>&1
    if !errorlevel! equ 0 (
        for /f "delims=" %%i in ('py --version 2^>nul') do echo [OK] %%i
    ) else (
        echo [!] Python: Not found
    )
)

echo ========================================
echo.
echo Installation completed successfully!
echo.
echo Ready to run the application with: run-app.bat
echo.
echo NOTE: If Git, Node.js or Python were just installed, you may need to:
echo   1. Close this command prompt
echo   2. Open a new command prompt
echo   3. Run this script again to verify everything works
echo.
pause
exit /b 0