# TradeZone VPS Installation Guide

**Quick Version:** Run `bash install.sh` on your VPS and follow the prompts!

---

## 📋 Prerequisites

### Minimum Requirements
- **OS:** Ubuntu 20.04+ or Debian 11+
- **RAM:** 2GB minimum (4GB+ recommended)
- **Disk Space:** 10GB minimum
- **CPU:** 1 vCore minimum (2vCore+ recommended)
- **Access:** Root or sudo privileges

### Recommended Specs (Production)
- **OS:** Ubuntu 22.04 LTS
- **RAM:** 4GB or more
- **Disk:** 20GB+ SSD
- **CPU:** 2+ vCores
- **Bandwidth:** Unlimited or high limit

### Domain & DNS
- Valid domain name
- DNS already configured
- SSL certificate (auto-setup via Let's Encrypt)

---

## 🚀 Installation Steps

### Step 1: Prepare VPS

SSH into your VPS:
```bash
ssh root@your-vps-ip
```

Update system:
```bash
apt update && apt upgrade -y
```

### Step 2: Download Installation Script

**Option A: Using curl**
```bash
curl -O https://raw.githubusercontent.com/yourusername/tradezone/main/install.sh
chmod +x install.sh
```

**Option B: Using git clone**
```bash
git clone https://github.com/yourusername/tradezone.git
cd tradezone
chmod +x install.sh
```

**Option C: Manual download**
1. Download `install.sh` from repository
2. Upload to VPS via SCP or SFTP
3. Run: `chmod +x install.sh`

### Step 3: Run Installation Script

```bash
sudo bash install.sh
```

The script will:
1. ✅ Install system dependencies (Node.js, PostgreSQL, Apache2, etc.)
2. ✅ Create `tradezone` system user
3. ✅ Setup project directory
4. ✅ Clone/update repository
5. ✅ Create and configure database
6. ✅ Install Node dependencies
7. ✅ Build frontend
8. ✅ Run database migrations
9. ✅ Configure Apache2
10. ✅ Setup SSL (optional)
11. ✅ Create systemd service
12. ✅ Start all services

**Expected duration:** 5-15 minutes depending on VPS speed

### Step 4: Post-Installation Configuration

After script completes, you'll see the summary. Follow these steps:

#### 4a. Update Environment Variables

```bash
sudo nano /var/www/tradezone/backend/.env
```

Update these values:
- `CORS_ORIGIN` - Your domain
- `JWT_SECRET` - Already generated (secure)
- `DATABASE_URL` - Already configured
- `STRIPE_API_KEY` - Add your Stripe key
- `PAYPAL_CLIENT_ID` - Add your PayPal credentials
- `PAYSTACK_PUBLIC_KEY` - Add your Paystack key
- `KRAKEN_API_KEY` - Add your Kraken key (optional)

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

#### 4b. Update Apache2 Domain

```bash
sudo sed -i 's/yourdomain.com/your-actual-domain.com/g' /etc/apache2/sites-available/tradezone.conf
sudo systemctl restart apache2
```

#### 4c. Setup SSL Certificate

If not done during installation:

```bash
sudo certbot --apache -d your-domain.com -m your-email@example.com --agree-tos -n
```

---

## 🔑 Configuration Details

### Database Credentials

During installation, a random password is generated. Find it in:
```bash
grep "POSTGRES_USER\|DB_PASSWORD" /var/www/tradezone/backend/.env
```

Or check installation logs:
```bash
tail -100 ~/.install_log
```

### Environment Variables Reference

**Backend (.env)**
```
# Database (auto-configured)
DATABASE_URL=postgresql://tradezone:PASSWORD@localhost:5432/tradezone

# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# JWT (auto-generated)
JWT_SECRET=auto-generated-secure-value
JWT_EXPIRY=7d

# Your Domain
CORS_ORIGIN=https://your-domain.com

# Payment Gateways - Add Your Keys
STRIPE_API_KEY=sk_live_xxxxx
PAYPAL_CLIENT_ID=xxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx

# Kraken API (Optional - for Forex)
KRAKEN_API_KEY=your-key
KRAKEN_API_SECRET=your-secret

# Others (usually don't need changing)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
PAYMENT_GATEWAY_MODE=sandbox  # Change to 'live' for production
```

**Frontend (.env)**
```
VITE_API_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com
```

---

## 📊 Service Management

### Check Service Status

```bash
# Backend status
sudo systemctl status tradezone.service

# Apache2 status
sudo systemctl status apache2

# PostgreSQL status
sudo systemctl status postgresql

# Redis status (if installed)
sudo systemctl status redis-server
```

### Start/Stop Services

```bash
# Start backend
sudo systemctl start tradezone.service

# Stop backend
sudo systemctl stop tradezone.service

# Restart backend
sudo systemctl restart tradezone.service

# View logs
sudo journalctl -u tradezone.service -f
tail -f /var/log/tradezone/backend.log
```

### Enable Auto-Start

All services are auto-enabled. If needed, re-enable:

```bash
sudo systemctl enable tradezone.service
sudo systemctl enable apache2
sudo systemctl enable postgresql
```

---

## 🔍 Monitoring & Logs

### View Logs

```bash
# Recent logs
tail -50 /var/log/tradezone/backend.log

# Follow logs (real-time)
tail -f /var/log/tradezone/backend.log

# System logs
journalctl -u tradezone.service -f

# Apache2 errors
tail -f /var/log/apache2/error.log
```

### Check Resources

```bash
# CPU/Memory usage
htop

# Disk usage
df -h

# Network connections
netstat -tuln | grep 3001
```

### Health Checks

```bash
# API health check
curl https://your-domain.com/health

# Backend running?
curl http://localhost:3001/health

# Frontend accessible?
curl -I https://your-domain.com
```

---

## 🛡️ Security Setup

### Firewall Configuration

The script sets up UFW (Uncomplicated Firewall):

```bash
# Check firewall status
sudo ufw status

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall (if not enabled)
sudo sudo ufw enable
```

### SSL/TLS Maintenance

```bash
# Renew certificate manually
sudo certbot renew --dry-run

# View certificate info
sudo certbot certificates

# Auto-renewal status
sudo systemctl status certbot.timer
```

### Update Passwords

Change PostgreSQL password:
```bash
sudo -u postgres psql
\c tradezone
ALTER USER tradezone WITH PASSWORD 'newpassword';
\q
```

---

## 🆘 Troubleshooting

### Service Won't Start

**Problem:** `systemctl status tradezone.service` shows error

**Solution:**
```bash
# Check logs
sudo journalctl -u tradezone.service -n 50

# Check if port 3001 is in use
sudo lsof -i :3001

# Restart service
sudo systemctl restart tradezone.service
```

### Database Connection Error

**Problem:** "Cannot connect to database"

**Solution:**
```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Verify credentials in .env
grep DATABASE_URL /var/www/tradezone/backend/.env

# Test connection
sudo -u postgres psql -c "SELECT version();"

# Restart database
sudo systemctl restart postgresql
```

### Apache2 502 Bad Gateway

**Problem:** Getting 502 error accessing site

**Solution:**
```bash
# Check backend running
sudo systemctl status tradezone.service

# Verify port 3001 is listening
ss -tulpn | grep 3001

# Check Apache2 config
sudo apache2ctl configtest

# View Apache2 error log
sudo tail -50 /var/log/apache2/error.log
```

### SSL Certificate Issues

**Problem:** SSL not working or expired

**Solution:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal
```

### High Memory Usage

**Problem:** Server using lots of RAM

**Solution:**
```bash
# Check what's using memory
ps aux --sort=-%mem | head

# Restart backend
sudo systemctl restart tradezone.service

# Install optional: memory monitoring tool
sudo apt install -y nethogs

# Monitor network/memory
sudo nethogs
```

---

## 📈 Performance Optimization

### Enable Caching

If Redis was installed:
```bash
# Verify Redis running
sudo systemctl status redis-server

# Update backend to use Redis
# Edit: /var/www/tradezone/backend/.env
# Add: REDIS_URL=redis://localhost:6379
```

### Optimize Apache2

The script already includes:
- Gzip compression ✅
- SSL optimizations ✅
- Caching headers ✅
- ProxyPass with connection pooling ✅
- Security headers ✅

### Database Optimization

```bash
# Analyze query performance
sudo -u postgres psql -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"

# View slow queries
sudo -u postgres psql -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### Monitor Resources

```bash
# Install and run monitoring tool
sudo apt install -y htop
htop

# Or with top
top
```

---

## 🔄 Updating Application

### Update Code

```bash
cd /var/www/tradezone

# Pull latest
sudo -u tradezone git pull origin main

# Rebuild frontend
cd frontend && sudo -u tradezone npm run build && cd ..

# Restart backend
sudo systemctl restart tradezone.service
```

### Update Dependencies

```bash
cd /var/www/tradezone

# Check for updates
npm outdated

# Update packages
sudo -u tradezone npm update

# Rebuild
cd frontend && sudo -u tradezone npm run build && cd ..

# Restart
sudo systemctl restart tradezone.service
```

### Database Migrations

Applied automatically on startup. If needed manually:

```bash
cd /var/www/tradezone/backend

# Run migrations
sudo -u tradezone npm run migrate

# Or with direct command:
sudo -u tradezone DATABASE_URL="postgresql://..." npm run migrate
```

---

## 📊 Backup & Restore

### Backup Database

```bash
# Full backup
sudo -u postgres pg_dump tradezone > tradezone-backup-$(date +%Y%m%d).sql

# Compressed backup
sudo -u postgres pg_dump tradezone | gzip > tradezone-backup-$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# From SQL file
sudo -u postgres psql tradezone < tradezone-backup-20260225.sql

# From compressed file
gunzip -c tradezone-backup-20260225.sql.gz | sudo -u postgres psql tradezone
```

### Backup Application Files

```bash
# Backup entire app directory
sudo tar -czf tradezone-backup-$(date +%Y%m%d).tar.gz /var/www/tradezone

# Backup only source code (exclude node_modules)
sudo tar -czf tradezone-src-backup-$(date +%Y%m%d).tar.gz \
  --exclude=/var/www/tradezone/node_modules \
  --exclude=/var/www/tradezone/backend/node_modules \
  --exclude=/var/www/tradezone/frontend/node_modules \
  /var/www/tradezone
```

---

## 🚀 Deployment Checklist

- [ ] VPS running and accessible
- [ ] Installation script completed successfully
- [ ] Environment variables updated with correct values
- [ ] Domain DNS configured and pointing to VPS
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Backend service running (`systemctl status tradezone.service`)
- [ ] Frontend accessible via domain
- [ ] Database migrations completed
- [ ] Apache2 serving frontend and proxying API
- [ ] Firewall rules configured
- [ ] Payment gateway credentials added
- [ ] Kraken API keys added (if using Forex)
- [ ] Admin account created
- [ ] Backup system configured
- [ ] Monitoring/alerting setup (optional)

---

## 📞 Support Resources

### Documentation
- API Docs: `/var/www/tradezone/PAYMENT_API_DOCS.md`
- Setup Guide: `/var/www/tradezone/PAYMENT_GATEWAYS_GUIDE.md`
- Admin Guide: `/var/www/tradezone/ADMIN_PAYMENT_CONFIG.md`

### Logs Location
- Backend: `/var/log/tradezone/backend.log`
- Apache2: `/var/log/apache2/`
- System: `journalctl -u tradezone.service`

### Common Commands

```bash
# SSH into app directory
cd /var/www/tradezone

# Check service
sudo systemctl status tradezone.service

# View logs
tail -f /var/log/tradezone/backend.log

# Restart services
sudo systemctl restart tradezone.service
sudo systemctl restart apache2

# Check database
sudo -u postgres psql tradezone

# Manual database reset (dangerous!)
sudo systemctl stop tradezone.service
sudo -u postgres psql -c "DROP DATABASE tradezone;"
sudo systemctl start tradezone.service
```

---

## 🆘 Need Help?

1. **Check logs:** Official issues usually show up in logs
2. **Verify environment:** Make sure .env is configured correctly
3. **Check services:** Ensure all services are running
4. **Review docs:** Full docs in `/var/www/tradezone/`
5. **Contact support:** Open an issue on GitHub

---

## ✅ Quick Verification

After installation, verify everything works:

```bash
# Check all services running
sudo systemctl status tradezone.service
sudo systemctl status apache2
sudo systemctl status postgresql

# Test API
curl http://localhost:3001/health

# Test frontend
curl -I https://your-domain.com

# View portal in browser
# Go to: https://your-domain.com
```

---

**Installation Complete!** Your TradeZone is now live! 🎉

---

*Last updated: February 25, 2026*
*Version: 1.0*

