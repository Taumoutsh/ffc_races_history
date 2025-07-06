# Windows Deployment Guide

## 🚴 Race Cycling History App - Windows Docker Deployment

This guide explains how to deploy the Race Cycling History App on Windows using Docker.

## Prerequisites

1. **Docker Desktop for Windows** installed and running
   - Download from: https://docs.docker.com/desktop/windows/
   - Make sure it's running (Docker icon in system tray)

2. **Git for Windows** (optional, for cloning)
   - Download from: https://git-scm.com/download/win

## Quick Start

### Option 1: Using Batch File (Recommended for Windows)

1. Open Command Prompt or PowerShell as Administrator
2. Navigate to the project directory:
   ```cmd
   cd path\to\race-cycling-app
   ```
3. Run the Windows deployment script:
   ```cmd
   deploy-windows.bat
   ```

### Option 2: Manual Docker Commands

1. Open Command Prompt or PowerShell
2. Navigate to the project directory
3. Build and start the application:
   ```cmd
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

## Access Your Application

Once deployed, access your application at:

- **Frontend**: http://localhost:8080
- **API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## Management Commands

### View Application Status
```cmd
docker-compose ps
```

### View Logs
```cmd
docker-compose logs -f
```

### Restart Application
```cmd
docker-compose restart
```

### Stop Application
```cmd
docker-compose down
```

### Update Application
```cmd
docker-compose down
git pull
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### Container Keeps Restarting

1. Check logs:
   ```cmd
   docker-compose logs cycling-app
   ```

2. Check if ports are available:
   ```cmd
   netstat -an | findstr "8080\|3001"
   ```

3. If ports are in use, stop the conflicting services or change ports in `docker-compose.yml`

### Build Fails

1. Make sure Docker Desktop is running
2. Check available disk space (Docker needs several GB)
3. Try cleaning Docker cache:
   ```cmd
   docker system prune -a
   ```

### API Not Responding

1. Wait longer (first startup can take 1-2 minutes)
2. Check if the database volume has enough space
3. Restart the container:
   ```cmd
   docker-compose restart cycling-app
   ```

### Frontend Shows "Load Failed"

1. Check if API is running: http://localhost:3001/api/health
2. Check browser console for CORS errors
3. Restart the application:
   ```cmd
   docker-compose restart
   ```

## Network Access from Other Devices

To access the app from other devices on your network:

1. Find your Windows machine's IP address:
   ```cmd
   ipconfig
   ```
   Look for the "IPv4 Address" (usually starts with 192.168.x.x)

2. Update the API URL in the Docker environment (optional):
   - Edit `docker-compose.yml`
   - Change `VITE_API_URL` to use your IP address
   - Rebuild: `docker-compose build --no-cache`

3. Access from other devices:
   - Frontend: `http://YOUR_IP:8080`
   - API: `http://YOUR_IP:3001/api`

## Database Initialization

The Docker container will automatically:

1. **Copy existing database**: If `backend/database/cycling_data.db` exists, it will be copied to the container
2. **Use backup database**: If no main database exists, it will look for backup files (`cycling_data_backup_*.db`)
3. **Create new database**: If no database files are found, it will create a fresh database

## Data Persistence

Your database and logs are stored in Docker volumes:
- Database: `cycling_data` volume (persistent across container restarts)
- Logs: `cycling_logs` volume

To backup your data:
```cmd
docker run --rm -v cycling_data:/data -v %cd%:/backup alpine tar czf /backup/cycling_data_backup.tar.gz /data
```

To restore from backup:
```cmd
docker run --rm -v cycling_data:/data -v %cd%:/backup alpine tar xzf /backup/cycling_data_backup.tar.gz -C /
```

## Performance Tips

1. **Allocate more resources to Docker**:
   - Right-click Docker Desktop tray icon
   - Go to Settings → Resources
   - Increase Memory to 4GB+ and CPU to 2+ cores

2. **Use SSD storage** for better performance

3. **Close unnecessary applications** to free up system resources

## Security Notes

- The application runs on localhost by default
- For production deployment, consider:
  - Setting up SSL certificates
  - Using environment variables for secrets
  - Restricting network access
  - Regular security updates

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. View application logs: `docker-compose logs -f`
3. Check Docker Desktop logs in the GUI
4. Create an issue in the project repository with:
   - Error messages
   - Docker version: `docker --version`
   - Windows version
   - Steps to reproduce

## Configuration

The Docker deployment uses these default settings:

- **Frontend Port**: 8080
- **API Port**: 3001
- **Database**: SQLite (persistent volume)
- **Environment**: Production
- **Auto-restart**: Enabled

To customize these settings, edit the `docker-compose.yml` file before deployment.