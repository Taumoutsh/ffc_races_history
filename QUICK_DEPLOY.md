# 🚀 Quick Deploy Guide

Deploy the Race Cycling History App anywhere in minutes!

## ⚡ One-Command Deploy

### Option 1: If you have the code
```bash
./deploy.sh
```

### Option 2: Install from scratch
```bash
curl -fsSL https://raw.githubusercontent.com/Taumoutsh/ffc_races_history/main/install.sh | bash
```

### Option 3: Custom domain
```bash
DOMAIN=yourdomain.com ./deploy.sh
```

### Option 4: Production mode
```bash
DEPLOYMENT_MODE=production DOMAIN=yourdomain.com ./deploy.sh
```

## 🌐 Access Your App

After deployment, access at:
- **Frontend:** http://localhost:8080
- **API:** http://localhost:3001/api

## 🔧 Management

```bash
# View status
docker-compose ps

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down
```

## ☁️ Cloud Deployment

### DigitalOcean
```bash
# On your droplet
curl -fsSL https://get.docker.com | sh
git clone <repo> && cd race-cycling-app
DOMAIN=$DROPLET_IP ./deploy.sh
```

### AWS EC2
```bash
# On your EC2 instance
sudo apt install docker.io docker-compose -y
git clone <repo> && cd race-cycling-app
DOMAIN=$EC2_PUBLIC_IP ./deploy.sh
```

### Any VPS
```bash
# Requirements: Docker + Docker Compose
git clone <repo> && cd race-cycling-app
DOMAIN=$SERVER_IP ./deploy.sh
```

## 🎯 That's it!

Your cycling app is now running! 🚴‍♂️

For detailed instructions, see:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md) - Cloud-specific instructions