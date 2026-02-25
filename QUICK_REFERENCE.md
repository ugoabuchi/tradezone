# TradeZone Quick Reference - One Page Cheat Sheet

## 🚀 Quick Deploy (Copy & Paste)

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Get installation script
curl -O https://raw.githubusercontent.com/yourusername/tradezone/main/install.sh

# Make executable and run
chmod +x install.sh && sudo bash install.sh

# Answer prompts for:
# - Your domain name
# - Your email (for SSL)
# - Payment gateway API keys (optional)

# Wait 5-15 minutes... Done! 🎉
```

---

## 📋 Essential Documents (By Need)

| Need | Document | Read Time |
|------|----------|-----------|
| **First deployment** | `VPS_INSTALLATION_GUIDE.md` | 30m |
| **Verify it works** | `POST_INSTALLATION_CHECKLIST.md` | 45m |
| **Something broken** | `INSTALLATION_TROUBLESHOOTING.md` | 15m |
| **Make it faster** | `PRODUCTION_OPTIMIZATION.md` | 2h |
| **Run production** | `MONITORING_MAINTENANCE.md` | 1h |
| **Add payments** | `PAYMENT_GATEWAYS_GUIDE.md` | 1h |
| **API reference** | `PAYMENT_API_DOCS.md` | 1h |
| **Lost?** | `DEPLOYMENT_OPERATIONS_INDEX.md` | 10m |

---

## 🔧 Common Tasks

### Check If Everything Is Running
```bash
# All services status
sudo systemctl status tradezone.service apache2 mysql

# Backend health
curl http://localhost:3001/health

# Access website
# Go to: https://your-domain.com
```

### View Logs
```bash
# Recent backend logs
tail -50 /var/log/tradezone/backend.log

# Follow logs (live)
tail -f /var/log/tradezone/backend.log

# System logs
journalctl -u tradezone.service -f
```

### Restart Services
```bash
# Restart backend
sudo systemctl restart tradezone.service

# Restart all
sudo systemctl restart tradezone.service apache2 mysql

# Start the daily check
./daily-check.sh  # (from root dir)
```

### Update Payments Configuration
```bash
sudo nano /var/www/tradezone/backend/.env

# Update these fields:
# STRIPE_API_KEY=sk_live_...
# PAYPAL_CLIENT_ID=...
# PAYSTACK_PUBLIC_KEY=pk_live_...

# Save (Ctrl+X, Y, Enter) then restart:
sudo systemctl restart tradezone.service
```

---

## 📊 Performance Monitoring

### Resource Usage
```bash
# Quick check
free -h          # Memory
df -h /          # Disk
top -bn1 | head  # CPU

# Detailed monitoring
htop             # Interactive
watch -n 1 'ps aux | head'  # Update every second
```

### Database Check
```bash
# Check database (MySQL)
sudo mysql -u root -e "SHOW DATABASES;"

# Check tables
sudo mysql -u tradezone -ptradezone_password tradezone -e "SHOW TABLES;"
```

### API Health
```bash
# Test API endpoint
curl https://your-domain.com/api/markets

# Test API with auth
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-domain.com/api/orders
```

---

## 🚨 Emergency Commands

### Service Is Down
```bash
# Check status
sudo systemctl status tradezone.service

# View error
journalctl -u tradezone.service -n 50

# Restart it
sudo systemctl restart tradezone.service

# Check again
sudo systemctl status tradezone.service
```

### Can't Connect to Database
```bash
# Check if MySQL running
sudo systemctl status mysql

# Start it
sudo systemctl start mysql

# Test connection
mysql -u tradezone -ptradezone_password -e "SELECT 1;" tradezone
```

### Port Already in Use
```bash
# Find what's using port 3001
sudo lsof -i :3001

# Kill the process (replace PID)
sudo kill -9 PID

# Restart backend
sudo systemctl restart tradezone.service
```

### Disk Running Out of Space
```bash
# Check usage
df -h

# Find large files
du -sh /var/log/tradezone/
du -sh /var/lib/mysql/

# Clean old logs
sudo journalctl --vacuum=100M
```

---

## 🔐 Security Checks

### SSL Certificate Status
```bash
# Check expiry
sudo certbot certificates

# Renew manually
sudo certbot renew

# Test SSL
curl -I https://your-domain.com
```

### Firewall Rules
```bash
# Check status
sudo ufw status

# Allow ports if needed
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
```

### Update System (Monthly)
```bash
sudo apt update
sudo apt upgrade -y
sudo systemctl reboot  # If needed
```

---

## 📈 Scale & Optimize

### Enable Clustering (Use All Cores)
- Edit: `ecosystem.config.js`
- Set: `instances: 'max'`
- Restart: `sudo systemctl restart tradezone.service`
- Check: `pm2 status`

### Enable Redis Cache
1. Edit `.env`: `REDIS_URL=redis://localhost:6379`
2. Restart: `sudo systemctl restart tradezone.service`
3. Check: `redis-cli ping` (should return PONG)

### Database Optimization
```bash
# Create indexes
mysql -u tradezone -ptradezone_password tradezone << 'EOF'
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
ANALYZE;
EOF

# Optimize
mysqlcheck -u tradezone -ptradezone_password --optimize tradezone

```

---

## 💾 Backup & Restore

### Backup Database Now
```bash
mysqldump -u tradezone -ptradezone_password tradezone | gzip > tradezone-$(date +%Y%m%d).sql.gz
```

### Setup Daily Backups
```bash
# Already done! Backups run daily at 3 AM

# Check recent backups
ls -lh /backups/databases/

# Verify backup is working
cat /var/log/tradezone/backup.log
```

### Restore from Backup
```bash
# Stop app first
sudo systemctl stop tradezone.service

# Drop and recreate database
mysql -u root -proot_password -e "DROP DATABASE IF EXISTS tradezone;"
mysql -u root -proot_password -e "CREATE DATABASE tradezone; GRANT ALL PRIVILEGES ON tradezone.* TO 'tradezone'@'localhost';"

# Restore from backup
gunzip < /backups/databases/tradezone-20260225.sql.gz | \
  mysql -u tradezone -ptradezone_password tradezone

# Start app
sudo systemctl start tradezone.service
```

---

## 📍 Key File Locations

```
/var/www/tradezone/               # Application root
├── backend/
│   ├── .env                       # Backend config
│   ├── src/                       # Source code
│   └── dist/                      # Compiled code
├── frontend/
│   ├── .env                       # Frontend config
│   └── dist/                      # Built static files
└── migrations/                    # Database schemas

/etc/apache2/sites-available/      # Apache2 config
/etc/systemd/system/               # Service files
/var/log/tradezone/                # Application logs
/etc/ssl/letsencrypt/              # SSL certificates
/backups/                          # Backup directory
```

---

## 🎯 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| **Service won't start** | `journalctl -u tradezone.service -n 50` → check error → fix → restart |
| **Can't access website** | Check DNS: `nslookup your-domain.com` → Check Apache2: `sudo apache2ctl configtest` |
| **API returns 502** | Check backend: `systemctl status tradezone.service` → check logs → restart |
| **Slow response** | Check resources: `free -h` / `df -h` / `top` → check logs → optimize |
| **Database error** | Check DB: `mysql -u tradezone -ptradezone_password -e "SELECT 1;" tradezone` → check logs |
| **Payment not working** | Verify API keys in `.env` → Check logs → Run webhook test |
| **SSL error** | Check cert: `sudo certbot certificates` → Renew: `sudo certbot renew` |

---

## 🔍 Verification Checklist (Quick)

```bash
# Copy & paste this to verify everything:

echo "=== TradeZone Quick Check ==="

# 1. Services
echo "1. Services:"
systemctl is-active tradezone.service && echo "✅ Backend" || echo "❌ Backend"
systemctl is-active apache2 && echo "✅ Apache2" || echo "❌ Apache2"
systemctl is-active mysql && echo "✅ Database" || echo "❌ Database"

# 2. API
echo ""
echo "2. API:"
curl -s http://localhost:3001/health > /dev/null && echo "✅ API" || echo "❌ API"

# 3. Website
echo ""
echo "3. Website:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://your-domain.com

# 4. Database
echo ""
echo "4. Database:"
mysql -u tradezone -ptradezone_password -e "SELECT COUNT(*) FROM users;" tradezone 2>/dev/null && echo "✅ DB" || echo "❌ DB"

echo ""
echo "=== Done ==="
```

---

## 📞 Getting Help

### Check Documentation
1. Is it deployment? → **VPS_INSTALLATION_GUIDE.md**
2. Is something broken? → **INSTALLATION_TROUBLESHOOTING.md**
3. Need to verify? → **POST_INSTALLATION_CHECKLIST.md**
4. Performance issue? → **PRODUCTION_OPTIMIZATION.md**
5. Operational task? → **MONITORING_MAINTENANCE.md**
6. Lost? → **DEPLOYMENT_OPERATIONS_INDEX.md**

### Check Logs
```bash
tail -50 /var/log/tradezone/backend.log
journalctl -u tradezone.service -n 50
sudo tail -50 /var/log/apache2/error.log
```

### Check Status
```bash
systemctl status tradezone.service
curl http://localhost:3001/health
ps aux | grep node
```

---

## ⏰ Maintenance Schedule

| Task | Frequency | Time |
|------|-----------|------|
| Check status | Daily | 5m |
| Review errors | Daily | 5m |
| Database backup | Daily (auto) | - |
| Database VACUUM | Weekly | 15m |
| Log cleanup | Weekly | 5m |
| Update packages | Monthly | 30m |
| Security audit | Quarterly | 1h |
| Full backup test | Quarterly | 1h |

---

## 🏆 Best Practices

✅ **DO:**
- Check logs first when diagnosing issues
- Backup before making major changes
- Test updates in staging first
- Monitor resource usage regularly
- Keep documentation updated

❌ **DON'T:**
- Run commands without understanding them
- Ignore warnings/errors in logs
- Change production.env without backup
- Let logs grow unbounded
- Skip security updates

---

## 📊 Common Metrics to Monitor

```bash
# Monthly tracking
free -h              # RAM usage
df -h /              # Disk usage
uptime               # System uptime
ps aux | wc -l       # Process count
tail -1000 /var/log/tradezone/backend.log | grep -i error | wc -l  # Error count
```

---

## 🚀 Performance Targets

| Metric | Target | Alert |
|--------|--------|-------|
| Response Time | <200ms | >500ms |
| Error Rate | <0.1% | >1% |
| CPU Usage | <70% | >85% |
| Memory Usage | <75% | >90% |
| Disk Usage | <70% | >85% |
| Uptime | 99.9% | <99% |

---

## 🎯 In Case of Emergency

### Total Service Down
```bash
sudo systemctl stop tradezone.service
sudo systemctl stop apache2
sudo systemctl restart mysql
sleep 5
sudo systemctl start tradezone.service
sleep 5
sudo systemctl start apache2

# Verify
sudo systemctl status tradezone.service apache2 mysql
```

### Cannot Access Web
```bash
# Check DNS
nslookup your-domain.com

# Check Apache2
sudo apache2ctl configtest
sudo systemctl restart apache2

# Check firewall
sudo ufw status

# Check backend
curl http://localhost:3001
```

### Data Recovery
```bash
# Restore latest backup
gunzip < /backups/databases/tradezone-LATEST.sql.gz | \
  mysql -u tradezone -p tradezone

# Restart
sudo systemctl restart tradezone.service
```

---

**Everything You Need to Know On One Page!** 

Last Updated: February 25, 2026 | Print Friendly: Yes 📄

