# Cycling History App - Automated Scraping

This directory contains scripts for automated weekly data scraping using cron jobs.

## 📁 Files

### `weekly-scrape.sh`
Orchestration script that processes all 4 regions sequentially by calling the existing `scrape-region.sh` script:
- `pays-de-la-loire`
- `bretagne`
- `nouvelle-aquitaine`
- `centre-val-de-loire`

**Features:**
- Uses the existing `scrape-region.sh` script (which includes automatic backup)
- Sequential processing with rate limiting (30s delay between regions)
- Comprehensive logging and error handling
- Leverages all existing functionality from `scrape-region.sh`

### `setup-cron.sh`
Interactive setup script for configuring the crontab entry.

**Features:**
- Detects and handles existing cron entries
- Validates script existence and permissions
- Provides helpful management commands

## 🚀 Quick Setup

### 1. Setup Cron Job (One-time)
```bash
cd cron
./setup-cron.sh
```

### 2. Test Manual Execution
```bash
cd cron
./weekly-scrape.sh
```

## 📅 Schedule

- **Frequency**: Every Thursday at 3:00 AM
- **Cron Expression**: `0 3 * * 4`

## 📋 Log Files

### Scraping Logs
```bash
# Main scraping logs
tail -f ~/projects/race-cycling-app/logs/weekly-scrape.log

# Cron execution logs
tail -f ~/projects/race-cycling-app/logs/cron.log
```

### Log Locations
- **Scraping logs**: `~/projects/race-cycling-app/logs/weekly-scrape.log`
- **Cron logs**: `~/projects/race-cycling-app/logs/cron.log`
- **Database backups**: `~/database-backups/`

## 🔧 Management Commands

### View Current Crontab
```bash
crontab -l
```

### Edit Crontab Manually
```bash
crontab -e
```

### Remove Cron Job
```bash
crontab -l | grep -v "weekly-scrape.sh" | crontab -
```

### Check Cron Service Status
```bash
# On most Linux systems
systemctl status cron

# On macOS
sudo launchctl list | grep cron
```

## 🗄️ Database Backups

Backups are automatically created before each scraping session:
- **Location**: `~/database-backups/`
- **Format**: `cycling_data_weekly_YYYYMMDD_HHMMSS.db`
- **Retention**: Manual cleanup (consider adding cleanup script if needed)

## ⚠️ Troubleshooting

### Cron Not Running?
1. Check if cron service is running
2. Verify crontab entry exists: `crontab -l`
3. Check cron logs: `tail -f /var/log/cron` (Linux) or `log show --predicate 'process == "cron"' --style syslog` (macOS)

### Script Fails?
1. Test manual execution: `./weekly-scrape.sh`
2. Check Docker containers: `docker compose ps`
3. Verify database permissions: `ls -la ~/projects/race-cycling-app/data/`
4. Review scraping logs: `tail -f ~/projects/race-cycling-app/logs/weekly-scrape.log`

### Docker Issues?
1. Ensure application is deployed: `cd ~/projects/race-cycling-app && docker compose ps`
2. Check Docker service: `systemctl status docker` (Linux) or check Docker Desktop (macOS/Windows)
3. Restart application: `cd ~/projects/race-cycling-app && docker compose restart`

## 📊 Monitoring

### Check Last Execution
```bash
# Check last modification of log files
ls -la ~/projects/race-cycling-app/logs/

# View recent log entries
tail -20 ~/projects/race-cycling-app/logs/weekly-scrape.log
```

### Verify Data Updates
```bash
# Check database modification time
ls -la ~/projects/race-cycling-app/data/cycling_data.db

# Check recent backups
ls -la ~/database-backups/ | tail -5
```

## 🎯 Next Steps

After setup, the system will automatically:
1. **Thursday 3:00 AM**: Create database backup
2. **Thursday 3:01 AM**: Start scraping pays-de-la-loire
3. **Thursday 3:XX AM**: Continue with bretagne (after 30s delay)
4. **Thursday 3:XX AM**: Continue with nouvelle-aquitaine (after 30s delay)
5. **Thursday 3:XX AM**: Finish with centre-val-de-loire (after 30s delay)
6. **Thursday 3:XX AM**: Generate summary report

Total expected runtime: 5-15 minutes depending on data volume and network conditions.

## 🔗 Dependencies

The weekly scraping system relies on:
- **`scrape-region.sh`**: Main regional scraper script (located in project root)
- **Docker containers**: Must be running for scraping to work
- **Application deployment**: Must be deployed using `deploy-docker-race-cycling-app.sh`

## 🔄 How it Works

1. **`weekly-scrape.sh`** orchestrates the process
2. For each region, it calls **`scrape-region.sh <region>`**
3. **`scrape-region.sh`** handles:
   - Database backup creation
   - Docker container validation
   - Running the optimized scraper
   - Error handling and logging

The cron system leverages existing, tested functionality rather than duplicating code!