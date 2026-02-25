# TradeZone Monitoring & Maintenance Guide

Comprehensive guide for maintaining and monitoring your TradeZone production deployment.

---

## 📋 Daily Maintenance Tasks

### Morning Check (5 minutes)

Run every morning before business hours:

```bash
#!/bin/bash
# save as: /home/tradezone/daily-check.sh

echo "=== TradeZone Daily Health Check ==="
echo "Time: $(date)"
echo ""

# Service status
echo "1. Service Status:"
systemctl status tradezone.service | grep Active
systemctl status nginx | grep Active
systemctl status postgresql | grep Active

# System resources
echo ""
echo "2. System Resources:"
free -h | grep Mem
df -h / | tail -1

# Database
echo ""
echo "3. Database Status:"
sudo -u postgres psql -d tradezone -c "SELECT datname, numbackends FROM pg_stat_database WHERE datname = 'tradezone';" | tail -1

# API health
echo ""
echo "4. API Health:"
curl -s http://localhost:3001/health || echo "API Down!"

# SSL Certificate
echo ""
echo "5. SSL Certificate:"
sudo certbot certificates | grep tradezone -A 2

echo ""
echo "=== Check Complete ==="
```

Make executable and run:

```bash
chmod +x /home/tradezone/daily-check.sh
./daily-check.sh
```

---

### Make It Automatic

Set up cron job:

```bash
# Edit crontab
sudo crontab -e

# Add line:
0 8 * * * /home/tradezone/daily-check.sh >> /var/log/tradezone/daily-check.log 2>&1
```

This runs every day at 8 AM and logs results.

---

## 🔍 Monitoring Setup

### 1. System Monitoring with Telegraf + InfluxDB (Optional)

For detailed metrics, install monitoring stack:

```bash
# Install Telegraf (metrics collector)
wget -q https://dl.influxdata.com/telegraf/releases/telegraf_1.26.0_amd64.deb
sudo dpkg -i telegraf_1.26.0_amd64.deb

# Install InfluxDB (time-series database)
curl https://repos.influxdata.com/influxdb.key | gpg --dearmor | sudo tee /usr/share/keyrings/influxdb-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/influxdb-archive-keyring.gpg] https://repos.influxdata.com/debian bullseye stable" | sudo tee /etc/apt/sources.list.d/influxdb.list

sudo apt update
sudo apt install -y influxdb2 influxdb2-client

# Install Grafana (visualization)
sudo apt install -y grafana-server
```

---

### 2. Application Monitoring with PM2+

```bash
# Install PM2 monitoring service
npm install -g pm2

# Setup PM2 service
sudo pm2 startup systemd -u tradezone --hp /var/www/tradezone
pm2 save

# Install PM2 monitoring package
pm2 install pm2-auto-pull

# Enable web dashboard
pm2 web --port 9615
```

Access dashboard: `http://your-domain.com:9615`

---

### 3. Log Aggregation Setup

For centralized log management, use ELK Stack (optional):

```bash
# Install Elasticsearch
curl -fsSL https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-7.x.list
sudo apt update && sudo apt install elasticsearch

# Install Kibana
sudo apt install kibana

# Install Logstash
sudo apt install logstash
```

Or use simpler solution like Loki:

```bash
# Install Loki (lightweight log aggregation)
wget https://github.com/grafana/loki/releases/download/v2.8.0/loki-linux-amd64.zip
unzip loki-linux-amd64.zip
sudo mv loki-linux-amd64 /usr/local/bin/loki
sudo chmod +x /usr/local/bin/loki
```

---

### 4. Uptime Monitoring

Use free uptime monitoring services:

- **UptimeRobot** (https://uptimerobot.com) - Free tier monitors 50 endpoints
- **Pingdom** (https://www.pingdom.com) - Free monitoring
- **StatusCake** (https://www.statuscake.com) - Dedicated status pages

Setup UptimeRobot:

1. Sign up for free account
2. Add monitor: `https://your-domain.com`
3. Set check interval: 5 minutes
4. Enable alerts to your email/phone

---

## 📊 Performance Monitoring

### 1. Real-time Resource Monitoring

```bash
# Install and use htop for interactive monitoring
sudo apt install -y htop
htop

# Or use top (built-in)
top

# Watch specific process
watch -n 1 'ps aux | grep node'

# Monitor disk I/O
sudo apt install -y iotop
sudo iotop

# Monitor network
nethogs
```

### 2. Database Performance Monitoring

```bash
# Setup continuous monitoring
watch -n 5 'sudo -u postgres psql -d tradezone -c "
  SELECT 
    datname, 
    numbackends as connections, 
    blks_hit::float/(blks_hit+blks_read)*100 as hit_ratio 
  FROM pg_stat_database 
  WHERE datname = '\''tradezone'\'';
"'

# Detailed query analysis
sudo -u postgres psql -d tradezone << 'EOF'
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT 
  query,
  calls,
  total_time::numeric(10,2) as total_time_ms,
  mean_time::numeric(10,2) as avg_time_ms,
  max_time::numeric(10,2) as max_time_ms
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;
EOF
```

### 3. API Request Metrics

Add request logging middleware in backend:

```typescript
// In index.ts
import morgan from 'morgan';
import fs from 'fs';

const accessLogStream = fs.createWriteStream(
  '/var/log/tradezone/access.log',
  { flags: 'a' }
);

app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));  // Console output

// Custom metrics middleware
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
});
```

---

## 🔄 Backup Strategy

### 1. Database Backup

Setup automatic daily backups:

```bash
# Create backup directory
sudo mkdir -p /backups/databases
sudo chown postgres:postgres /backups/databases

# Create backup script
cat > /home/tradezone/backup-db.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/backups/databases"
BACKUP_FILE="$BACKUP_DIR/tradezone-$(date +%Y%m%d-%H%M%S).sql.gz"

# Backup database
sudo -u postgres pg_dump tradezone | gzip > "$BACKUP_FILE"

# Keep only last 30 days
find "$BACKUP_DIR" -type f -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

chmod +x /home/tradezone/backup-db.sh

# Schedule with cron
sudo crontab -e
# Add: 0 3 * * * /home/tradezone/backup-db.sh >> /var/log/tradezone/backup.log 2>&1
```

### 2. Application Files Backup

```bash
# Create app backup script
cat > /home/tradezone/backup-app.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/backups/application"
BACKUP_FILE="$BACKUP_DIR/tradezone-$(date +%Y%m%d).tar.gz"

# Backup only important files (exclude node_modules)
tar -czf "$BACKUP_FILE" \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git \
  -C /var/www tradezone

# Keep only last 7 backups
cd "$BACKUP_DIR" && ls -t | tail -n +8 | xargs -r rm

echo "App backup completed: $BACKUP_FILE"
EOF

chmod +x /home/tradezone/backup-app.sh

# Weekly backup
sudo crontab -e
# Add: 0 4 * * 0 /home/tradezone/backup-app.sh >> /var/log/tradezone/backup.log 2>&1
```

### 3. Remote Backup

For production, backup to cloud storage:

```bash
# Install AWS CLI
sudo apt install -y awscli

# Configure AWS credentials
aws configure

# Upload backup to S3
aws s3 cp /backups/databases/tradezone-20260225.sql.gz s3://your-bucket/backups/

# Or use rsync for remote server
rsync -azv /backups/ backups@backup-server.com:/remote/backups/tradezone/
```

---

## 🔧 Regular Maintenance Tasks

### Weekly Tasks

```bash
#!/bin/bash
# save as: /home/tradezone/weekly-maintenance.sh

echo "=== TradeZone Weekly Maintenance ==="
date

# 1. Database optimization
echo "1. Running database optimization..."
sudo -u postgres vacuumdb -d tradezone -a
sudo -u postgres reindexdb -d tradezone

# 2. Check logs for errors
echo ""
echo "2. Checking for errors in logs..."
grep -i "error\|fatal\|critical" /var/log/tradezone/backend.log | tail -10 || echo "No critical errors"

# 3. Update database statistics
echo ""
echo "3. Analyzing database..."
sudo -u postgres psql -d tradezone -c "ANALYZE;"

# 4. Check disk space
echo ""
echo "4. Disk usage:"
df -h /

# 5. Verify backups
echo ""
echo "5. Recent backups:"
ls -lh /backups/databases/ | tail -5

echo ""
echo "=== Weekly Maintenance Complete ==="
```

---

### Monthly Tasks

```bash
#!/bin/bash
# save as: /home/tradezone/monthly-maintenance.sh

echo "=== TradeZone Monthly Maintenance ==="

# 1. Update system packages
echo "1. Updating system..."
sudo apt update && sudo apt upgrade -y

# 2. Update Node.js dependencies
echo ""
echo "2. Checking for dependency updates..."
cd /var/www/tradezone
npm outdated

# 3. Review and clean logs
echo ""
echo "3. Cleaning old logs..."
find /var/log/tradezone -type f -mtime +90 -delete
find /var/log/nginx -type f -mtime +30 -delete

# 4. Database statistics
echo ""
echo "4. Database status:"
sudo -u postgres psql -d tradezone -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
  FROM pg_tables 
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# 5. Certificate expiry check
echo ""
echo "5. SSL Certificate status:"
sudo certbot certificates

# 6. Review error logs
echo ""
echo "6. Error summary (last 30 days):"
find /var/log/tradezone -name "*.log" -type f -newermt "30 days ago" \
  -exec grep -i "error\|fatal" {} + | sort | uniq -c | sort -rn | head -20

echo ""
echo "=== Monthly Maintenance Complete ==="
```

---

## 🚨 Alert Configuration

### 1. Email Alerts for Errors

```bash
# Create alert script
cat > /home/tradezone/alert-on-error.sh << 'EOF'
#!/bin/bash

# Check for errors in last 5 minutes
ERROR_COUNT=$(tail -1000 /var/log/tradezone/backend.log | grep -i "error" | wc -l)

if [ $ERROR_COUNT -gt 10 ]; then
  # Send email alert
  mail -s "TradeZone Alert: $ERROR_COUNT errors in backend" admin@example.com << BODY
  High error count detected in backend logs.
  Errors in last hour: $ERROR_COUNT
  
  Recent errors:
  $(tail -1000 /var/log/tradezone/backend.log | grep -i "error" | tail -5)
BODY
  
  echo "Alert sent at $(date)" >> /var/log/tradezone/alerts.log
fi
EOF

chmod +x /home/tradezone/alert-on-error.sh

# Run every 5 minutes
*/5 * * * * /home/tradezone/alert-on-error.sh
```

### 2. Service Down Alert

```bash
cat > /home/tradezone/alert-if-down.sh << 'EOF'
#!/bin/bash

# Check if service is running
if ! systemctl is-active --quiet tradezone.service; then
  # Service is down!
  mail -s "CRITICAL: TradeZone Backend is DOWN" admin@example.com << BODY
  The TradeZone backend service is not running.
  
  Attempting automatic restart...
BODY

  # Try to restart
  systemctl restart tradezone.service
  sleep 5
  
  if systemctl is-active --quiet tradezone.service; then
    mail -s "RESOLVED: TradeZone Backend Restarted" admin@example.com << BODY
    The service was successfully restarted.
BODY
  fi
fi
EOF

chmod +x /home/tradezone/alert-if-down.sh

# Run every minute
* * * * * /home/tradezone/alert-if-down.sh
```

---

## 📈 Performance Tracking

### Monthly Performance Report

```bash
#!/bin/bash
# save as: /home/tradezone/performance-report.sh

REPORT_FILE="/var/log/tradezone/performance-report-$(date +%Y%m).txt"

{
  echo "=== TradeZone Performance Report ==="
  echo "Month: $(date +%B\ %Y)"
  echo "Generated: $(date)"
  echo ""
  
  echo "1. Uptime:"
  uptime
  
  echo ""
  echo "2. Average Response Time (last 7 days):"
  grep "HTTP" /var/log/tradezone/access.log \
    | awk '{print $(NF-1)}' | tail -100000 \
    | awk '{sum+=$1; count++} END {print "Average: " sum/count " ms"}'
  
  echo ""
  echo "3. Database Size:"
  sudo -u postgres psql -d tradezone -c "
    SELECT pg_size_pretty(pg_database_size('tradezone'));
  "
  
  echo ""
  echo "4. Table Sizes:"
  sudo -u postgres psql -d tradezone -c "
    SELECT 
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  "
  
  echo ""
  echo "5. Error Rate (last 7 days):"
  ERROR_COUNT=$(grep "ERROR\|error" /var/log/tradezone/backend.log | wc -l)
  TOTAL_COUNT=$(wc -l < /var/log/tradezone/backend.log)
  ERROR_RATE=$(echo "scale=2; $ERROR_COUNT * 100 / $TOTAL_COUNT" | bc)
  echo "Error Rate: $ERROR_RATE%"
  
  echo ""
  echo "=== End of Report ==="
  
} | tee "$REPORT_FILE"

# Email the report
mail -s "TradeZone Performance Report - $(date +%B)" admin@example.com < "$REPORT_FILE"
```

---

## 🆘 Emergency Procedures

### Service Recovery

```bash
# If service is down:

# 1. Check status
sudo systemctl status tradezone.service

# 2. View recent errors
journalctl -u tradezone.service -n 50 | grep -i error

# 3. Check database connection
sudo -u postgres psql -d tradezone -c "SELECT 1;"

# 4. Restart service
sudo systemctl restart tradezone.service

# 5. Monitor logs
tail -f /var/log/tradezone/backend.log
```

### Database Recovery

```bash
# If database is corrupted or won't start:

# 1. Stop the application
sudo systemctl stop tradezone.service

# 2. Start PostgreSQL manually for checking
sudo systemctl restart postgresql

# 3. Check database
sudo -u postgres psql -d tradezone -c "SELECT version();"

# 4. If database is corrupted, use backup:
sudo -u postgres psql << 'EOF'
DROP DATABASE tradezone;
CREATE DATABASE tradezone OWNER tradezone;
EOF

# 5. Restore from backup
gunzip < /backups/databases/tradezone-20260225.sql.gz | \
  sudo -u postgres psql -d tradezone

# 6. Restart application
sudo systemctl start tradezone.service
```

### Full System Restart

```bash
# In case of severe issues:

# 1. Stop all services gracefully
sudo systemctl stop tradezone.service
sudo systemctl stop nginx
sudo systemctl stop postgresql
sudo systemctl stop redis-server

# Wait 10 seconds
sleep 10

# 2. Start services in correct order
sudo systemctl start postgresql
sleep 5
sudo systemctl start redis-server
sleep 5  
sudo systemctl start tradezone.service
sleep 5
sudo systemctl start nginx

# 3. Verify all running
systemctl status tradezone.service nginx postgresql redis-server
```

---

## 📋 Maintenance Checklist

### Daily
- [ ] Check service status
- [ ] Monitor error logs
- [ ] Verify backup completion

### Weekly
- [ ] Database optimization
- [ ] Review error patterns
- [ ] Check disk space
- [ ] Verify SSL certificate (expiry check)

### Monthly
- [ ] Update system packages
- [ ] Update Node.js dependencies
- [ ] Clean old logs
- [ ] Database statistics analysis
- [ ] Generate performance report
- [ ] Review security logs

### Quarterly
- [ ] Security audit review
- [ ] Database backup restore test
- [ ] Load testing
- [ ] Update all documentation

### Annually
- [ ] Full system security audit
- [ ] Disaster recovery drill
- [ ] Hardware upgrade assessment
- [ ] SLA review and metrics
- [ ] Compliance audit

---

## 🔒 Security Maintenance

### Monthly Security Checks

```bash
#!/bin/bash
# save as: /home/tradezone/security-check.sh

echo "=== Security Audit ==="

# 1. Check for weak SSH settings
echo "1. SSH Security:"
sudo sshd -T | grep -E "PermitRootLogin|PasswordAuthentication|PubkeyAuthentication"

# 2. Check firewall rules
echo ""
echo "2. Firewall Status:"
sudo ufw status

# 3. Check file permissions
echo ""
echo "3. Critical File Permissions:"
ls -la /var/www/tradezone/backend/.env
ls -la /etc/nginx/sites-available/tradezone
ls -la /etc/systemd/system/tradezone.service

# 4. Check for world-writable files
echo ""
echo "4. World-Writable Files (should be none):"
find /var/www/tradezone -type f -perm -002 2>/dev/null || echo "None found (good)"

# 5. Check SSL configuration
echo ""
echo "5. SSL Configuration:"
sudo certbot certificates

# 6. Test SSL score
echo ""
echo "6. Testing SSL Configuration (requires internet)..."
curl -s "https://api.ssllabs.com/api/v3/analyze?host=your-domain.com" | grep grade

echo ""
echo "=== Security Audit Complete ==="
```

---

## 🎯 Performance Targets

Set and track these SLOs:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Response Time | <200ms | >500ms |
| Frontend Load Time | <2s | >5s |
| Uptime | 99.9% | <99% |
| Error Rate | <0.1% | >0.5% |
| Database Query Time | <100ms | >500ms |
| CPU Usage | <70% | >85% |
| Memory Usage | <75% | >90% |
| Disk Usage | <70% | >85% |

---

## 📞 Support Contacts

### Key Contacts

- **System Administrator:** [Your Email]
- **Database Administrator:** [Your Email]
- **On-Call Engineer:** [Rotation List]
- **Hosting Provider Support:** [Support Channel]

### Escalation Path

1. **Level 1:** Automated alerts & auto-recovery
2. **Level 2:** On-call engineer investigates
3. **Level 3:** Senior engineer/DBA involved
4. **Level 4:** Vendor support engaged

---

## 🧹 Cleanup Commands

Regular cleanup to keep system clean:

```bash
# Clean Docker images (if using Docker)
docker image prune -a -f

# Clean old logs
find /var/log -type f -mtime +90 -delete

# Clean npm cache
npm cache clean --force

# Clean temporary files
sudo rm -rf /tmp/*
sudo rm -rf /var/tmp/*

# Remove old backups (keep 30 days)
find /backups -type f -mtime +30 -delete
```

---

## 📚 Documentation

Maintain updated documentation:

1. **[Maintained]** Runbook - How to perform common tasks
2. **[Maintained]** Architecture Diagram - System design
3. **[Maintained]** Deployment Guide - How to deploy updates
4. **[Maintained]** Disaster Recovery Plan - What to do if issues occur
5. **[Maintained]** Contact List - Who to call for what

---

*Last updated: February 25, 2026*
*Version: 1.0*

