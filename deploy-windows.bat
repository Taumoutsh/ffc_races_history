@echo off
REM Race Cycling History App - Windows Deployment Script
REM =====================================================

echo.
echo 🚴 Race Cycling History App - Windows Deployment
echo ===============================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running or not installed
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Check if docker-compose is available
docker-compose version >nul 2>&1
if %errorlevel% neq 0 (
    docker compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Docker Compose is not available
        pause
        exit /b 1
    )
    set COMPOSE_CMD=docker compose
) else (
    set COMPOSE_CMD=docker-compose
)

echo ✅ Docker Compose is available

REM Stop and remove existing containers
echo.
echo 🛑 Stopping existing containers...
%COMPOSE_CMD% down

REM Build and start the application
echo.
echo 🔨 Building application...
%COMPOSE_CMD% build --no-cache

if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✅ Build completed successfully

echo.
echo 🚀 Starting application...
%COMPOSE_CMD% up -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start application
    echo.
    echo Checking logs:
    %COMPOSE_CMD% logs
    pause
    exit /b 1
)

echo.
echo ⏳ Waiting for application to be ready...
timeout /t 15 /nobreak >nul

REM Check if the application is healthy
echo.
echo 🔍 Checking application health...

REM Check API health
curl -f http://localhost:3001/api/health >nul 2>&1
if %errorlevel% eq 0 (
    echo ✅ API server is healthy
) else (
    echo ⚠️  API server might not be ready yet
)

REM Check frontend
curl -f http://localhost:8080 >nul 2>&1
if %errorlevel% eq 0 (
    echo ✅ Frontend is accessible
) else (
    echo ⚠️  Frontend might not be ready yet
)

echo.
echo 🎉 Deployment Complete!
echo.
echo 📱 Access your application:
echo   Frontend: http://localhost:8080
echo   API:      http://localhost:3001/api
echo   Health:   http://localhost:3001/api/health
echo.
echo 📊 Management commands:
echo   View logs:    %COMPOSE_CMD% logs -f
echo   View status:  %COMPOSE_CMD% ps
echo   Restart:      %COMPOSE_CMD% restart
echo   Stop:         %COMPOSE_CMD% down
echo.
echo ✨ Your Race Cycling History App is now running!
echo.

pause