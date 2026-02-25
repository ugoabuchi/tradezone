# TradeZone Installation Troubleshooting Guide

Quick solutions for common deployment issues.

---

## 🔴 Critical Issues

### Issue: "Permission Denied" when running install.sh

**Error Message:**
```
-bash: ./install.sh: Permission denied
```

**Solution:**
```bash
chmod +x install.sh
sudo bash install.sh
```

**Explanation:** Script needs execute permission and root privileges for system package installation.

---

### Issue: Script Says "Please run with root/sudo"

**Error Message:**
```
This script must be run as root or with sudo privileges
```

**Solution:**
```bash
sudo bash install.sh
```

**Explanation:** Installation requires root access for package management and system configuration.

---

### Issue: "apt-get: command not found"

**Error Message:**
```
bash: apt-get: command not found
```

**Cause:** Running on CentOS/RHEL instead of Ubuntu/Debian

**Solution:**
```bash
# For CentOS/RHEL, install script will auto-detect and use yum
sudo bash install.sh

# Or install manually:
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs postgresql postgresql-server
```

**Explanation:** Different Linux distributions use different package managers.

---

## 🔴 Installation Failures

### Issue: Node.js Installation Fails

**Error Message:**
```
Cannot locate the following packages: nodejs
```

**Solution - Option A: Add NodeSource Repository**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**Solution - Option B: Use Snap**
```bash
sudo snap install node --classic
```

**Solution - Option C: Manual Installation**
```bash
wget https://nodejs.org/dist/v18.18.0/node-v18.18.0-linux-x64.tar.xz
tar -xf node-v18.18.0-linux-x64.tar.xz
sudo mv node-v18.18.0-linux-x64 /opt/nodejs
sudo ln -s /opt/nodejs/bin/node /usr/bin/node
sudo ln -s /opt/nodejs/bin/npm /usr/bin/npm
node --version
```

---

### Issue: PostgreSQL Installation Fails

**Error Message:**
```
E: Unable to locate package postgresql
```

**Solution:**
```bash
# Add PostgreSQL official repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
sudo apt install -y postgresql postgresql-contrib

# Verify installation
sudo systemctl start postgresql
sudo systemctl status postgresql
```

---

### Issue: npm install Fails - "Cannot find module"

**Error Message:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution 1 - Clean Install:**
```bash
cd /path/to/tradezone/backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Solution 2 - Use Legacy Peer Deps:**
```bash
npm install --legacy-peer-deps
```

**Solution 3 - Update npm:**
```bash
npm install -g npm@latest
npm install
```

---

### Issue: TypeScript Compilation Fails

**Error Message:**
```
error TS2307: Cannot find module '@types/...'
error TS2717: Subsequent property declarations must have the same type
```

**Solution 1 - Install Missing Types:**
```bash
cd backend
npm install --save-dev @types/node @types/express @types/jsonwebtoken
```

**Solution 2 - Fix TypeScript Version:**
```bash
npm install --save-dev typescript@5.0.0
```

**Solution 3 - Clean Rebuild:**
```bash
cd backend
rm -rf dist
npm run build
```

---

## 🟠 Database Issues

### Issue: PostgreSQL Connection Error

**Error Message:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
Error: password authentication failed for user "tradezone"
```

**Solution 1 - Check PostgreSQL Status:**
```bash
sudo systemctl status postgresql

# If not running:
sudo systemctl start postgresql
sudo systemctl restart postgresql
```

**Solution 2 - Verify Credentials:**
```bash
# Check .env file
cat /var/www/tradezone/backend/.env | grep DATABASE_URL

# Test connection
sudo -u postgres psql -l

# Connect to tradezone database
sudo -u postgres psql -d tradezone -c "SELECT 1;"
```

**Solution 3 - Reset Database User:**
```bash
# Connect as postgres superuser
sudo -u postgres psql

# In psql prompt:
DROP USER IF EXISTS tradezone;
CREATE USER tradezone WITH PASSWORD 'newpassword';
ALTER USER tradezone CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE tradezone TO tradezone;
\q
```

**Solution 4 - Fix Connection String:**
```bash
# Update in .env
nano /var/www/tradezone/backend/.env

# Should look like:
DATABASE_URL=postgresql://tradezone:password@localhost:5432/tradezone

# For Unix socket (if localhost doesn't work):
DATABASE_URL=postgresql://tradezone:password@/tradezone?host=/var/run/postgresql
```

---

### Issue: Database Migrations Failed

**Error Message:**
```
Error: Migration X failed
Error: Already exists (SQLSTATE 42P07)
```

**Solution 1 - Check Migration Status:**
```bash
cd /var/www/tradezone/backend

# Check current migrations
sudo -u tradezone npm run query "SELECT * FROM migrations;"

# View logs
tail -50 /var/log/tradezone/backend.log
```

**Solution 2 - Manual Migration Rollback:**
```bash
# If migration file exists but table wasn't created:
sudo -u postgres psql -d tradezone < /var/www/tradezone/backend/migrations/001_create_users_table.sql

# To reset and re-run all:
sudo systemctl stop tradezone.service
sudo -u postgres psql -c "DROP DATABASE IF EXISTS tradezone; CREATE DATABASE tradezone OWNER tradezone;"
sudo systemctl start tradezone.service
```

**Solution 3 - Verify Database State:**
```bash
# List all tables
sudo -u postgres psql -d tradezone -c "\dt"

# List specific table structure
sudo -u postgres psql -d tradezone -c "\d users"
```

---

### Issue: Database Disk Space Error

**Error Message:**
```
FATAL: remaining connection slots are reserved for non-replication superuser connections
ERROR: out of memory
```

**Solution:**
```bash
# Check disk usage
df -h

# Find large files in database
sudo du -sh /var/lib/postgresql/14/main

# Clean old logs
sudo journalctl --vacuum=100M

# Clear npm cache
npm cache clean --force

# Find and remove old backups
find /home -name "*backup*" -type f -exec du -h {} \;
```

---

## 🟠 Port/Network Issues

### Issue: Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3001
Error: listen EADDRINUSE: address already in use :::5432
```

**Solution 1 - Find What's Using Port:**
```bash
# Check port 3001
sudo lsof -i :3001

# Or with netstat
sudo netstat -tulpn | grep :3001

# Or with ss
sudo ss -tulpn | grep :3001
```

**Solution 2 - Kill Process Using Port:**
```bash
# Find PID and kill it
sudo kill -9 PID

# Or use fuser
sudo fuser -k 3001/tcp
```

**Solution 3 - Change Port in Script (before installation):**
```bash
# Edit install.sh, find PORT=3001 and change to:
PORT=3002

# Then run
sudo bash install.sh
```

**Solution 4 - Restart Service:**
```bash
sudo systemctl restart tradezone.service
sudo systemctl restart apache2
```

---

### Issue: Cannot Access Domain

**Error Message:**
```
ERR_CONNECTION_REFUSED
ERR_NAME_NOT_RESOLVED
Connection timeout
```

**Solution 1 - Check DNS Resolution:**
```bash
# Verify domain points to your IP
nslookup your-domain.com
dig your-domain.com

# Expected: Should show your VPS IP
```

**Solution 2 - Check Firewall:**
```bash
# Verify ports are open
sudo ufw status

# Open required ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

**Solution 3 - Check Apache2:**
```bash
# Test Apache2 config
sudo apache2ctl configtest

# View status
sudo systemctl status apache2

# Check if listening on 80/443
sudo ss -tulpn | grep apache2
```

**Solution 4 - Check Server IP:**
```bash
# Verify correct IP
hostname -I

# Update DNS to this IP if different
```

---

### Issue: Firefox/Chrome Shows "Connection Refused"

**Error Message:**
```
Unable to connect
Connection refused
```

**Solution 1 - Check Backend Running:**
```bash
# Verify service is running
sudo systemctl status tradezone.service

# Start if not running
sudo systemctl start tradezone.service
```

**Solution 2 - Test Locally:**
```bash
# SSH into VPS
ssh root@your-vps-ip

# Test from VPS
curl http://localhost:3001
curl http://localhost:3001/health

# If shows HTML, server is running
```

**Solution 3 - Check Apache2 Config:**
```bash
# View Apache2 config
cat /etc/apache2/sites-available/tradezone.conf

# Should proxy requests to localhost:3001
# Look for: ProxyPass http://localhost:3001/
```

---

## 🟠 SSL/TLS Issues

### Issue: SSL Certificate Not Installing

**Error Message:**
```
Error creating new order :: too many certificates already issued
Error: ACME challenge failed
```

**Solution 1 - Manual SSL Setup:**
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-apache

# Try again
sudo certbot --apache -d your-domain.com -m your-email@example.com --agree-tos

# Or for DNS validation
sudo certbot --manual --preferred-challenges dns -d your-domain.com
```

**Solution 2 - Rate Limit Issue (Too Many Attempts):**
```bash
# Use staging environment (no rate limits)
sudo certbot --apache -d your-domain.com --staging

# Wait 1 hour, then retry with live
sudo certbot --apache -d your-domain.com
```

**Solution 3 - Check Renewal:**
```bash
# Check certificate status
sudo certbot certificates

# Manual renewal
sudo certbot renew --dry-run

# If dry run passes, renew:
sudo certbot renew
```

---

### Issue: "SSL_ERROR_BAD_CERT_DOMAIN"

**Error Message:**
```
Error: The certificate is not valid for the requested domain
```

**Cause:** Domain in certificate doesn't match requested domain

**Solution:**
```bash
# Update domain in install.sh before running, or manually:
sudo certbot --apache -d correct-domain.com

# Or update Apache2 config:
sudo nano /etc/apache2/sites-available/tradezone.conf
# Change: ServerName yourdomain.com;
# To: ServerName your-correct-domain.com;

# Reload Apache2
sudo systemctl reload apache2
```

---

### Issue: SSL Certificate Expired

**Error Message:**
```
Your certificate will expire in 7 days
expired certificate
```

**Solution:**
```bash
# Check status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Force renewal if needed
sudo certbot renew --force-renewal

# Auto-renewal should be running:
sudo systemctl status certbot.timer
```

---

## 🟡 Performance Issues

### Issue: Slow Response Times

**Symptoms:**
- API takes 10+ seconds to respond
- Frontend loads slowly
- Website times out

**Solution 1 - Check Server Resources:**
```bash
# View real-time stats
htop

# Check specific service
ps aux | grep node

# Memory usage
free -h

# Disk I/O
iotop
```

**Solution 2 - Restart Services:**
```bash
# Often fixes temporary slowness
sudo systemctl restart tradezone.service
sudo systemctl restart apache2
sudo systemctl restart postgresql
```

**Solution 3 - Optimize Database:**
```bash
# Analyze database
sudo -u postgres vacuumdb -d tradezone -a -v

# Reindex
sudo -u postgres reindexdb -d tradezone
```

**Solution 4 - Enable Caching:**
```bash
# If Redis is installed
sudo systemctl start redis-server
sudo systemctl status redis-server

# Update backend to use Redis
nano /var/www/tradezone/backend/.env
# Add: REDIS_URL=redis://localhost:6379

sudo systemctl restart tradezone.service
```

---

### Issue: High Memory Usage

**Error Message:**
```
Out of memory
Process killed (OOM killer)
```

**Solution 1 - Identify Memory Hog:**
```bash
# Sort by memory usage
ps aux --sort=-%mem | head -20

# Check node process
ps aux | grep node
```

**Solution 2 - Increase Swap (Temporary):**
```bash
# Create swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Verify
sudo swapon -s
```

**Solution 3 - Restart Process:**
```bash
# Restart backend to clear memory
sudo systemctl restart tradezone.service

# Monitor memory after restart
watch -n 1 'ps aux --sort=-%mem | head'
```

---

## 🟡 Application Issues

### Issue: "Cannot GET /" or Blank Page

**Problem:** Frontend not serving

**Solution 1 - Check Frontend Build:**
```bash
# Check if frontend built
ls -la /var/www/tradezone/frontend/dist

# If empty, rebuild
cd /var/www/tradezone/frontend
sudo -u tradezone npm run build
```

**Solution 2 - Check Apache2 Config:**
```bash
# View Apache2 configuration
sudo cat /etc/apache2/sites-available/tradezone.conf

# Should include:
# DocumentRoot /var/www/tradezone/frontend/dist
# <Directory /var/www/tradezone/frontend/dist> with rewrite rules
```

**Solution 3 - Reload Apache2:**
```bash
sudo apache2ctl configtest
sudo systemctl reload apache2
```

---

### Issue: API Errors in Browser Console

**Error Messages:**
```
Failed to load resource: the server responded with a status of 502
Cannot POST /api/...
Unexpected token < in JSON at position 0
```

**Solution 1 - Check Backend:**
```bash
# Is backend running?
sudo systemctl status tradezone.service

# Check backend logs
tail -50 /var/log/tradezone/backend.log

# Test API directly
curl http://localhost:3001/api/markets
```

**Solution 2 - Check Nginx Proxy:**
```bash
# Verify Nginx config has proxy_pass
sudo grep -A5 "location /api" /etc/nginx/sites-available/tradezone

# Should show:
# location /api/ {
#     proxy_pass http://localhost:3001;
# }

# Reload if needed
sudo systemctl reload nginx
```

**Solution 3 - Check CORS Settings:**
```bash
# Update .env with correct domain
nano /var/www/tradezone/backend/.env
# CORS_ORIGIN=https://your-domain.com

sudo systemctl restart tradezone.service
```

---

### Issue: Login/Authentication Not Working

**Error Message:**
```
Invalid credentials
JWT malformed
401 Unauthorized
```

**Solution 1 - Check JWT Secret:**
```bash
# Verify JWT_SECRET is set
grep JWT_SECRET /var/www/tradezone/backend/.env

# Should NOT be empty
# If empty, generate new:
openssl rand -base64 32
# Copy output to JWT_SECRET in .env
```

**Solution 2 - Clear Browser Storage:**
```
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Click "Clear Site Data"
4. Try login again
```

**Solution 3 - Check Database:**
```bash
# Verify users table exists
sudo -u postgres psql -d tradezone -c "\dt users"

# Check users
sudo -u postgres psql -d tradezone -c "SELECT id, email FROM users LIMIT 5;"
```

---

## 🟡 WebSocket Issues

### Issue: WebSocket Connection Error

**Error Message:**
```
WebSocket is closed before the connection is established
Cannot connect to WebSocket
```

**Solution 1 - Check WebSocket URL:**
```bash
# Verify .env has correct URL
cat /var/www/tradezone/frontend/.env

# Should be:
# VITE_WS_URL=wss://your-domain.com (or ws://localhost:3001 for dev)
```

**Solution 2 - Check Backend WebSocket:**
```bash
# Verify it's enabled in backend
grep -i "websocket\|socket.io" /var/www/tradezone/backend/src/index.ts

# Should have Socket.io setup
```

**Solution 3 - Nginx WebSocket Support:**
```bash
# Check Nginx config
sudo grep -A10 "location /socket" /etc/nginx/sites-available/tradezone

# Should include:
# proxy_http_version 1.1;
# proxy_set_header Upgrade $http_upgrade;
# proxy_set_header Connection "upgrade";
```

**Solution 4 - Restart and Rebuild:**
```bash
cd /var/www/tradezone/frontend
npm run build
sudo systemctl restart tradezone.service
sudo systemctl reload nginx
```

---

## 🔵 Verification Steps

After fixing issues, run these checks:

```bash
# 1. Services running?
sudo systemctl status tradezone.service
sudo systemctl status nginx
sudo systemctl status postgresql

# 2. Backend responding?
curl http://localhost:3001/health

# 3. Frontend accessible?
curl -I https://your-domain.com

# 4. Database OK?
sudo -u postgres psql -d tradezone -c "SELECT COUNT(*) FROM users;"

# 5. Logs clean?
tail -20 /var/log/tradezone/backend.log | grep -i error

# 6. DNS resolves?
nslookup your-domain.com
```

All green? You're good! 🎉

---

## 📚 Additional Resources

### Log Files
- Backend: `/var/log/tradezone/backend.log`
- Nginx: `/var/log/nginx/error.log`
- PostgreSQL: `/var/log/postgresql/`
- Systemd: `journalctl -u tradezone.service`

### Configuration Files
- Backend env: `/var/www/tradezone/backend/.env`
- Nginx: `/etc/nginx/sites-available/tradezone`
- Systemd: `/etc/systemd/system/tradezone.service`
- PostgreSQL: `/etc/postgresql/14/main/postgresql.conf`

### Useful Commands

```bash
# Emergency restart everything
sudo systemctl restart tradezone.service nginx postgresql

# View all systemd services
systemctl list-units --type=service

# Check disk space
df -h
du -sh /var/www/tradezone

# Monitor live
watch -n 1 'systemctl status tradezone.service'

# Full application restart
sudo systemctl stop tradezone.service
sudo systemctl stop nginx
sudo systemctl start postgresql
sleep 2
sudo systemctl start tradezone.service
sudo systemctl start nginx
```

---

**Still having issues?** Open an issue on GitHub with:
1. Your OS/VPS version
2. Error message from logs
3. Steps to reproduce
4. Output of: `uname -a && node --version && npm --version`

