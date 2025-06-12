# ☁️ Cloud Deployment Guide

Quick deployment instructions for popular cloud providers.

## 🚀 One-Click Deployment

For any server with Docker support:

```bash
# Clone and deploy in one command
git clone <your-repo-url> race-cycling-app
cd race-cycling-app
./deploy.sh
```

**Access at:** `http://your-server-ip:8080`

---

## ☁️ Cloud Provider Instructions

### 🌊 DigitalOcean Droplet

**1. Create Droplet**
- Choose: Ubuntu 22.04, Basic plan, $6/month minimum
- Add your SSH key

**2. Deploy**
```bash
# Connect to droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Deploy app
git clone <your-repo-url> /opt/race-cycling-app
cd /opt/race-cycling-app
DOMAIN=your-droplet-ip ./deploy.sh
```

### 🟠 AWS EC2

**1. Launch Instance**
- AMI: Ubuntu Server 22.04 LTS
- Instance type: t3.micro (free tier) or t3.small
- Security group: Allow ports 22, 80, 8080, 3001

**2. Deploy**
```bash
# Connect to instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install Docker
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker ubuntu
newgrp docker

# Deploy app
git clone <your-repo-url> /opt/race-cycling-app
cd /opt/race-cycling-app
sudo chown -R ubuntu:ubuntu .
DOMAIN=your-instance-ip ./deploy.sh
```

### ☁️ Google Cloud Platform

**1. Create VM Instance**
- Machine type: e2-micro or e2-small
- Boot disk: Ubuntu 22.04 LTS
- Firewall: Allow HTTP/HTTPS traffic

**2. Deploy**
```bash
# Connect via SSH from GCP console or:
gcloud compute ssh your-instance-name

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Deploy app
git clone <your-repo-url> /opt/race-cycling-app
cd /opt/race-cycling-app
DOMAIN=$(curl -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/external-ip) ./deploy.sh
```

### 🔷 Azure

**1. Create Virtual Machine**
- Image: Ubuntu Server 22.04 LTS
- Size: Standard B1s or B2s
- Networking: Allow inbound ports 22, 80, 8080, 3001

**2. Deploy**
```bash
# Connect to VM
ssh azureuser@your-vm-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker azureuser
newgrp docker

# Deploy app
git clone <your-repo-url> /opt/race-cycling-app
cd /opt/race-cycling-app
DOMAIN=your-vm-ip ./deploy.sh
```

### 🐙 GitHub Codespaces

**1. Open in Codespace**
- Go to your GitHub repository
- Click "Code" → "Codespaces" → "Create codespace"

**2. Deploy**
```bash
# In the codespace terminal
./deploy.sh

# Forward ports 8080 and 3001 via Codespaces UI
# Access via the forwarded URLs
```

---

## 🔧 Deployment Modes

### Simple Mode (Default)
```bash
./deploy.sh
```
- Single container
- Perfect for development/testing
- Minimal resource usage

### Production Mode
```bash
DEPLOYMENT_MODE=production ./deploy.sh
```
- Optimized for production
- Resource limits
- Better logging
- Health checks

### Full-Stack Mode
```bash
DEPLOYMENT_MODE=full-stack ./deploy.sh
```
- Includes reverse proxy
- Automatic backups
- SSL ready
- Enterprise features

---

## 🌐 Custom Domain Setup

### 1. Point Domain to Server
Add DNS A record: `your-domain.com` → `your-server-ip`

### 2. Deploy with Domain
```bash
DOMAIN=your-domain.com ./deploy.sh
```

### 3. Setup SSL (Optional)
```bash
# Install certbot on your server
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Update deployment with SSL
SSL_ENABLED=true DOMAIN=your-domain.com DEPLOYMENT_MODE=production ./deploy.sh
```

---

## 📊 Resource Requirements

| Deployment Mode | RAM   | CPU    | Storage | Cost/Month |
|----------------|-------|--------|---------|------------|
| Simple         | 512MB | 0.5 CPU| 10GB    | $5-10      |
| Production     | 1GB   | 1 CPU  | 25GB    | $10-20     |
| Full-Stack     | 2GB   | 2 CPU  | 50GB    | $20-40     |

---

## 🛠️ Management Commands

```bash
# View status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Update and redeploy
git pull && ./deploy.sh

# Backup database
docker-compose exec race-cycling-app cp /app/data/cycling_data.db /app/backups/manual_backup_$(date +%Y%m%d).db
```

---

## 🔒 Security Recommendations

### 1. Firewall Setup
```bash
# Ubuntu/Debian
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8080  # If not using reverse proxy
```

### 2. Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull && docker-compose up -d
```

### 3. SSL Certificate
- Use Let's Encrypt (free)
- Redirect HTTP to HTTPS
- Keep certificates updated

---

## 🔍 Troubleshooting

### Service Not Starting
```bash
# Check logs
docker-compose logs

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart race-cycling-app
```

### Port Already in Use
```bash
# Find what's using the port
sudo netstat -tulpn | grep :8080

# Use different ports
PORT=8081 API_PORT=3002 ./deploy.sh
```

### Database Issues
```bash
# Check database file
ls -la data/cycling_data.db

# Reset database (⚠️ This deletes all data)
rm data/cycling_data.db
docker-compose restart
```

### Performance Issues
```bash
# Check resource usage
docker stats

# Upgrade to production mode
DEPLOYMENT_MODE=production ./deploy.sh
```

---

## 📈 Monitoring

### Basic Monitoring
```bash
# Watch resource usage
watch docker stats

# Monitor logs
docker-compose logs -f --tail=50
```

### Advanced Monitoring (Optional)
- Add Grafana + Prometheus
- Use cloud provider monitoring
- Set up log aggregation

---

## 🔄 Backup Strategy

### Automatic Backups (Full-stack mode)
- Daily database backups
- Stored in `./backups/` directory
- Keeps last 7 backups

### Manual Backup
```bash
# Create backup
cp data/cycling_data.db backups/manual_$(date +%Y%m%d_%H%M%S).db

# Download backup (from local machine)
scp user@server:/opt/race-cycling-app/backups/manual_*.db ./
```

---

## 🎯 Quick Start Checklist

- [ ] Server with Docker installed
- [ ] Ports 8080 and 3001 open in firewall
- [ ] Domain pointed to server (if using custom domain)
- [ ] Run `./deploy.sh`
- [ ] Test access at `http://your-server:8080`
- [ ] Setup SSL if using custom domain
- [ ] Configure regular backups

---

**🚴 Your Race Cycling History App is now deployed and ready for the world!**

For detailed documentation, see [DEPLOYMENT.md](DEPLOYMENT.md)