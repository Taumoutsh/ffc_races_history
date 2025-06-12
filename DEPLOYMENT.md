# 🚀 Race Cycling History App - Deployment Guide

Complete step-by-step guide for deploying the Race Cycling History app on a public server.

## **📋 Prerequisites**
- A VPS or cloud server (DigitalOcean, AWS, Linode, etc.)
- Domain name (optional but recommended)
- SSH access to your server

---

## **🖥️ Step 1: Server Setup**

### **1.1 Choose and Setup Server**
```bash
# Example: Ubuntu 20.04+ server with at least:
# - 1GB RAM
# - 1 CPU core  
# - 25GB storage
```

### **1.2 Connect to Server**
```bash
ssh root@your-server-ip
# or
ssh username@your-server-ip
```

### **1.3 Update System**
```bash
sudo apt update && sudo apt upgrade -y
```

### **1.4 Install Required Software**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.8+
sudo apt install python3 python3-pip python3-venv -y

# Install Nginx (web server)
sudo apt install nginx -y

# Install PM2 (process manager)
sudo npm install -g pm2

# Install certbot for SSL (optional)
sudo apt install certbot python3-certbot-nginx -y
```

---

## **⬆️ Step 2: Upload Your Code**

### **2.1 Create Application Directory**
```bash
sudo mkdir -p /var/www/race-cycling-app
sudo chown $USER:$USER /var/www/race-cycling-app
cd /var/www/race-cycling-app
```

### **2.2 Upload Code (choose one method)**

**Option A: Git Clone**
```bash
git clone https://github.com/Taumoutsh/ffc_races_history.git .
```

**Option B: SCP Upload**
```bash
# From your local machine:
scp -r /path/to/your/project/* username@your-server-ip:/var/www/race-cycling-app/
```

**Option C: rsync (recommended)**
```bash
# From your local machine:
rsync -avz --exclude 'node_modules' --exclude 'scraper_env' --exclude '*.db' \
  /path/to/your/project/ username@your-server-ip:/var/www/race-cycling-app/
```

---

## **🐍 Step 3: Setup Backend (API)**

### **3.1 Create Python Environment**
```bash
cd /var/www/race-cycling-app
python3 -m venv scraper_env
source scraper_env/bin/activate
pip install -r requirements.txt
```

### **3.2 Setup Database**
```bash
# If you have existing data:
./setup_database.sh

# Or create empty database:
mkdir -p database
python3 -c "
from database.database import CyclingDatabase
db = CyclingDatabase('database/cycling_data.db')
db.create_tables()
print('Database created successfully')
"
```

### **3.3 Create Production Environment File**
```bash
cat > .env.production << EOF
DB_PATH=/var/www/race-cycling-app/database/cycling_data.db
PORT=3001
DEBUG=false
HOST=0.0.0.0
EOF
```

### **3.4 Test API**
```bash
# Test API works
source scraper_env/bin/activate
python api/server.py &
curl http://localhost:3001/api/health
# Should return JSON with status: healthy
pkill -f "python api/server.py"
```

---

## **⚛️ Step 4: Build Frontend**

### **4.1 Install Dependencies**
```bash
npm install
```

### **4.2 Create Production Environment**
```bash
cat > .env.production << EOF
VITE_API_URL=http://your-domain.com/api
# or use IP: VITE_API_URL=http://your-server-ip/api
EOF
```

### **4.3 Build for Production**
```bash
npm run build
```

This creates a `dist/` folder with optimized static files.

---

## **🔄 Step 5: Process Management with PM2**

### **5.1 Create PM2 Configuration**
```bash
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'cycling-api',
    script: 'api/server.py',
    interpreter: '/var/www/race-cycling-app/scraper_env/bin/python',
    cwd: '/var/www/race-cycling-app',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DB_PATH: '/var/www/race-cycling-app/database/cycling_data.db'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/cycling-api-error.log',
    out_file: '/var/log/cycling-api-out.log',
    log_file: '/var/log/cycling-api.log'
  }]
};
EOF
```

### **5.2 Start API with PM2**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Follow the instructions PM2 gives you
```

### **5.3 Verify API is Running**
```bash
pm2 status
curl http://localhost:3001/api/health
```

---

## **🌐 Step 6: Configure Nginx**

### **6.1 Create Nginx Configuration**
```bash
sudo cat > /etc/nginx/sites-available/race-cycling-app << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain or IP
    
    # Serve React app
    location / {
        root /var/www/race-cycling-app/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Proxy API requests to Python backend
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF
```

### **6.2 Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/race-cycling-app /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

---

## **🔒 Step 7: Setup SSL (Optional but Recommended)**

### **7.1 Get SSL Certificate**
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### **7.2 Verify Auto-Renewal**
```bash
sudo certbot renew --dry-run
```

---

## **🔥 Step 8: Setup Firewall**

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## **✅ Step 9: Final Verification**

### **9.1 Check All Services**
```bash
# Check Nginx
sudo systemctl status nginx

# Check PM2
pm2 status

# Check API health
curl http://localhost:3001/api/health

# Check website
curl http://your-domain.com
```

### **9.2 Test in Browser**
- Visit `http://your-domain.com` (or `https://` if SSL is setup)
- Test search functionality
- Check that charts load correctly
- Verify API calls work in browser console

---

## **🔄 Step 10: Deployment Automation (Optional)**

### **10.1 Create Deployment Script**
```bash
cat > deploy.sh << EOF
#!/bin/bash
echo "🚀 Deploying Race Cycling App..."

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build frontend
VITE_API_URL=http://your-domain.com/api npm run build

# Restart API
pm2 restart cycling-api

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Deployment complete!"
EOF

chmod +x deploy.sh
```

---

## **📊 Step 11: Monitoring (Optional)**

### **11.1 Setup Log Monitoring**
```bash
# View API logs
pm2 logs cycling-api

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### **11.2 Setup Monitoring Dashboard**
```bash
pm2 install pm2-web
# Access at http://your-server-ip:9615
```

---

## **🎯 Quick Checklist**

- [ ] Server setup with Node.js, Python, Nginx
- [ ] Code uploaded to `/var/www/race-cycling-app`
- [ ] Python environment created and database setup
- [ ] Frontend built with production API URL
- [ ] PM2 managing API process
- [ ] Nginx configured and running
- [ ] SSL certificate installed (recommended)
- [ ] Firewall configured
- [ ] All services tested and working

## **🌐 Access Your App**
Once everything is deployed:
- **Website**: `https://your-domain.com`
- **API**: `https://your-domain.com/api/health`

## **🔧 Troubleshooting**

### **Common Issues:**

**API not responding:**
```bash
pm2 restart cycling-api
pm2 logs cycling-api
```

**Frontend not loading:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

**Database connection errors:**
```bash
# Check database permissions
ls -la database/cycling_data.db
# Should be readable by the user running the API
```

**CORS errors:**
- Check that `VITE_API_URL` in frontend matches your domain
- Verify Nginx CORS headers are correct

**SSL certificate issues:**
```bash
sudo certbot certificates
sudo certbot renew
```

---

## **📈 Performance Optimization**

### **Database Optimization:**
```bash
# Add indexes for better performance
sqlite3 database/cycling_data.db "VACUUM;"
```

### **Nginx Caching:**
Add to your Nginx config:
```nginx
# Cache API responses
location /api/ {
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    # ... other proxy settings
}
```

### **PM2 Cluster Mode:**
For high traffic, update `ecosystem.config.js`:
```javascript
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

---

Your Race Cycling History app is now live and accessible worldwide! 🎉🚴‍♂️

For support or questions, refer to the main README.md or create an issue in the repository.