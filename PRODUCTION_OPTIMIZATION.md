# TradeZone Production Optimization Guide

Comprehensive guide for optimizing TradeZone for high-traffic production environments.

---

## 📊 Performance Baseline

Before optimization, establish baseline metrics:

```bash
# Current memory usage
free -h

# Current disk I/O
iostat -xm 1 5

# Current CPU usage
top -bn1 | head -20

# Current database size
du -sh /var/lib/postgresql/14/main

# Current application logs size
du -sh /var/log/tradezone/
```

Record these values to measure improvement after optimization.

---

## 🚀 Node.js/Backend Optimization

### 1. Enable Clustering

Create `/var/www/tradezone/backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'tradezone-api',
    script: './dist/index.js',
    instances: 'max',        // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/tradezone/backend-error.log',
    out_file: '/var/log/tradezone/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=512'
  }]
};
```

Update systemd service to use PM2:

```bash
sudo systemctl stop tradezone.service

# Edit service file
sudo nano /etc/systemd/system/tradezone.service
```

Update the service file:

```ini
[Unit]
Description=TradeZone Application (PM2)
After=network.target

[Service]
Type=exec
User=tradezone
WorkingDirectory=/var/www/tradezone/backend
ExecStart=/usr/bin/pm2 start ecosystem.config.js --no-daemon
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl start tradezone.service

# Verify
pm2 status
```

**Expected Result:** Shows 2-16 processes (depending on CPU count)

---

### 2. Memory Optimization

Update Node.js memory settings:

```bash
# Edit service or startup command
export NODE_OPTIONS="--max-old-space-size=1024 --gc-interval=15000"

# Or in ecosystem.config.js
node_args: '--max-old-space-size=1024 --gc-interval=15000 --expose-gc'
```

For very high traffic, set explicit memory:

```bash
# Calculate: RAM - 1GB for OS - 512MB for DB = Available for Node
# Example for 4GB VPS: 4GB - 1GB - 0.5GB = 2.5GB available
export NODE_OPTIONS="--max-old-space-size=2560"
```

Enable aggressive garbage collection:

```javascript
// In index.ts, add:
if (global.gc) {
  setInterval(() => {
    global.gc();
  }, 30000);  // GC every 30 seconds
}
```

---

### 3. Connection Pooling Optimization

Update database pool in `backend/src/config/database.ts`:

```javascript
const pool = new pg.Pool({
  max: 20,                    // Max connections (increase from default 10)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  application_name: 'tradezone-api',
  // Connection reuse optimization
  statement_cache_size: 25,
  query_timeout: 30000
});
```

For high concurrency, increase further:

```javascript
const pool = new pg.Pool({
  max: 50,                    // For >100 req/sec
  min: 5,                     // Maintain minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  query_timeout: 60000        // 60 second timeout for complex queries
});
```

---

### 4. Express Request Optimization

Add compression and caching middleware in `index.ts`:

```javascript
import compression from 'compression';

// Increase body size limits for large payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// Enable gzip compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6  // Compression level 1-9 (6 is balanced)
}));

// Add response caching headers
app.use((req, res, next) => {
  // Cache GET requests for 1 hour
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=3600');
  } else {
    res.set('Cache-Control', 'no-store');
  }
  next();
});
```

---

## 💾 Database Optimization

### 1. PostgreSQL Configuration

Edit `/etc/postgresql/14/main/postgresql.conf`:

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Update these settings based on server RAM:

```ini
# For 2GB server:
shared_buffers = 512MB           # 25% of RAM
effective_cache_size = 1536MB    # 75% of RAM
work_mem = 32MB
wal_buffers = 16MB

# For 4GB server:
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 64MB
wal_buffers = 16MB

# For 8GB+ server:
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 128MB
wal_buffers = 16MB

# Connection settings
max_connections = 200
max_prepared_transactions = 100

# Performance settings
random_page_cost = 1.1           # For SSD
effective_io_concurrency = 200

# Logging
log_min_duration_statement = 1000  # Log queries >1 second
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

---

### 2. Create Database Indexes

```bash
sudo -u postgres psql -d tradezone << 'EOF'

-- Indexes on users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Indexes on orders table
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- Indexes on transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Indexes on wallets table
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_currency ON wallets(currency);

-- Indexes on payments table
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway ON payments(gateway);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Analyze tables
ANALYZE;

EOF
```

Verify indexes:

```bash
sudo -u postgres psql -d tradezone -c "\d+ orders" | grep indexes
```

---

### 3. Query Optimization

Enable query logging to find slow queries:

```bash
sudo -u postgres psql << 'EOF'
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries > 1 second
SELECT pg_reload_conf();
EOF
```

View slow queries:

```bash
tail -50 /var/log/postgresql/postgresql.log | grep "duration:"
```

Common optimization patterns:

```sql
-- INSTEAD OF:
SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at;

-- DO:
SELECT id, symbol, type, price, quantity, status, created_at 
FROM orders 
WHERE user_id = $1 
ORDER BY created_at DESC
LIMIT 100;

-- Add EXPLAIN to see query plan:
EXPLAIN ANALYZE SELECT ... FROM orders ...;
```

---

### 4. Table Maintenance

Set up automated maintenance:

```bash
# Create cron job
sudo crontab -e

# Add these lines:
# VACUUM and ANALYZE daily at 2 AM
0 2 * * * /usr/bin/sudo -u postgres /usr/lib/postgresql/14/bin/vacuumdb -d tradezone -a -z

# Reindex weekly on Sunday at 3 AM
0 3 * * 0 /usr/bin/sudo -u postgres /usr/lib/postgresql/14/bin/reindexdb -d tradezone

# Backup daily at 4 AM
0 4 * * * /usr/bin/sudo -u postgres /usr/bin/pg_dump tradezone | gzip > /backups/tradezone-$(date +\%Y\%m\%d).sql.gz
```

---

## ⚡ Caching Layer - Redis

### 1. Install and Configure Redis

```bash
sudo apt install -y redis-server

# Optimize Redis configuration
sudo nano /etc/redis/redis.conf
```

Update `/etc/redis/redis.conf`:

```ini
# Memory management
maxmemory 512mb              # Adjust based on available RAM
maxmemory-policy allkeys-lru # Evict least recently used keys

# Persistence (balance between safety and performance)
save ""                      # Disable RDB for performance
appendonly yes              # Enable AOF for durability
appendfsync everysec        # Compromise between speed and safety

# Network
timeout 0
tcp-backlog 511
```

Restart Redis:

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

---

### 2. Implement Redis in Backend

Install Redis client:

```bash
cd /var/www/tradezone/backend
npm install redis
```

Create cache service in `src/services/CacheService.ts`:

```typescript
import { createClient } from 'redis';

const redis = createClient({
  host: 'localhost',
  port: 6379,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
});

redis.on('error', (err) => console.error('Redis error:', err));
redis.connect();

export class CacheService {
  static async get(key: string) {
    return await redis.get(key);
  }

  static async set(key: string, value: any, ttl: number = 3600) {
    await redis.setEx(key, ttl, JSON.stringify(value));
  }

  static async invalidate(pattern: string) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  }
}
```

Use in controllers for frequently accessed data:

```typescript
import { CacheService } from '../services/CacheService';

async getMarkets() {
  const cacheKey = 'markets:all';
  const cached = await CacheService.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }

  const markets = await MarketService.getAllMarkets();
  await CacheService.set(cacheKey, markets, 300); // Cache 5 minutes
  
  return markets;
}
```

Update `.env`:

```bash
REDIS_URL=redis://localhost:6379
```

---

## 🌐 Nginx Optimization

### 1. Performance Tuning

Edit `/etc/nginx/nginx.conf`:

```bash
sudo nano /etc/nginx/nginx.conf
```

Update worker processes:

```nginx
# Use number of CPU cores
worker_processes auto;
worker_rlimit_nofile 100000;

# Connection optimization
events {
  worker_connections 4096;   # Increase from default 1024
  use epoll;                 # Efficient connection processing
  multi_accept on;
}

http {
  # Keepalive optimization
  keepalive_timeout 65;
  keepalive_requests 100;

  # Compression
  gzip on;
  gzip_vary on;
  gzip_proxied any;
  gzip_comp_level 6;
  gzip_types text/plain text/css text/xml text/javascript 
    application/json application/javascript application/xml+rss 
    application/rss+xml application/atom+xml image/svg+xml 
    text/x-js text/x-component text/x-cross-domain-policy;

  # Buffer optimization
  client_body_buffer_size 10M;
  client_max_body_size 50M;

  # Timeouts
  client_body_timeout 10s;
  client_header_timeout 10s;
  keepalive_timeout 5s 5s;
  send_timeout 10s;

  # Rate limiting
  limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
  limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
}
```

---

### 2. Enable HTTP/2 and TLS 1.3

Ensure `listen` directive in site config includes HTTP/2:

```bash
sudo nano /etc/nginx/sites-available/tradezone
```

Update:

```nginx
listen 443 ssl http2;          # Enable HTTP/2
listen [::]:443 ssl http2;

# TLS settings
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;

# OCSP stapling for performance
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Session optimization
ssl_session_cache shared:SSL:50m;
ssl_session_timeout 1d;
ssl_session_tickets off;
```

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### 3. Caching Headers

In `/etc/nginx/sites-available/tradezone`:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
  expire 1y;
  add_header Cache-Control "public, immutable";
}

location / {
  try_files $uri @backend;
  
  # Cache HTML for 5 minutes
  expires 5m;
  add_header Cache-Control "public, max-age=300";
}

location @backend {
  proxy_pass http://localhost:3001;
  proxy_cache_bypass $http_pragma $http_authorization;
  
  # Cache API responses for 1 minute  
  proxy_cache_valid 200 1m;
  proxy_cache_key "$scheme$request_method$host$request_uri";
  add_header X-Cache-Status $upstream_cache_status;
}
```

---

## 🎯 Load Balancing Configuration

For high-traffic environments, set up load balancing:

```nginx
upstream backend {
  least_conn;  # Use least connections algorithm
  
  server localhost:3001 weight=1;
  server localhost:3002 weight=1;
  server localhost:3003 weight=1;
  
  keepalive 32;  # Connection pooling
}

server {
  location @backend {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    
    proxy_connect_timeout 5s;
    proxy_send_timeout 10s;
    proxy_read_timeout 10s;
  }
}
```

Start multiple Node.js instances:

```bash
# In ecosystem.config.js
instances: 'max'  # Will use all CPU cores

# Or specify number
instances: 4      # Run 4 Node.js processes
```

---

## 📊 Monitoring & Metrics

### 1. Install Monitoring Tools

```bash
# Install system monitoring
sudo apt install -y sysstat htop nethogs

# Real-time monitoring
htop

# Network monitoring
nethogs

# Process monitoring
ps aux --sort=-%mem
```

### 2. Set Up Logging Analysis

Install and configure log rotation:

```bash
sudo nano /etc/logrotate.d/tradezone
```

```
/var/log/tradezone/*.log {
  daily
  rotate 14
  compress
  delaycompress
  notifempty
  create 0640 tradezone tradezone
  sharedscripts
  postrotate
    systemctl reload tradezone.service > /dev/null 2>&1 || true
  endscript
}
```

### 3. Monitor Application Metrics

Use PM2 monitoring:

```bash
# Install PM2 monitoring
pm2 install pm2-auto-pull
pm2 install pm2-logrotate

# Web dashboard (port 9615)
pm2 web

# View real-time metrics
pm2 monit
```

---

## 🔍 Performance Benchmarking

### 1. Load Testing

Install Apache Bench:

```bash
sudo apt install -y apache2-utils

# Test endpoint
ab -n 10000 -c 100 https://your-domain.com/api/markets

# With authentication
ab -n 10000 -c 100 -H "Authorization: Bearer TOKEN" https://your-domain.com/api/orders
```

For more complex testing, use wrk:

```bash
# Install wrk
git clone https://github.com/wg/wrk.git
cd wrk && make && sudo cp wrk /usr/bin/

# Test with concurrency
wrk -t8 -c400 -d30s https://your-domain.com/api/markets
```

---

### 2. Database Performance Analysis

```bash
# Analyze slow queries
sudo -u postgres psql -d tradezone << 'EOF'
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
EOF

# Connection pool statistics
sudo -u postgres psql -d tradezone -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"
```

---

## 🛡️ Security Hardening

### 1. SSL/TLS Optimization

Update SSL configuration:

```bash
# Mozilla SSL Configuration Generator
# https://ssl-config.mozilla.org/

# Test SSL score
curl -I https://your-domain.com

# Use SSL Labs for detailed analysis
# https://www.ssllabs.com/ssltest/
```

---

### 2. Rate Limiting Enhancement

Implement per-endpoint rate limiting:

```typescript
import rateLimit from 'express-rate-limit';

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,                     // 5 login attempts
  skipSuccessfulRequests: true,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 30,                    // 30 API calls per minute
});

app.post('/login', loginLimiter, authRoutes);
app.use('/api/', apiLimiter);
app.use(generalLimiter);
```

---

### 3. DDoS Protection

Enable additional security:

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure for Nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

---

## 📈 Scaling Recommendations

### Vertical Scaling (More Powerful Server)

Upgrade VPS specifications:
- **CPU:** 2 cores → 4 cores → 8 cores
- **RAM:** 2GB → 4GB → 8GB → 16GB
- **Storage:** SSD with more IOPS

### Horizontal Scaling (Multiple Servers)

For production with heavy traffic:

```
┌─────────────────────────────────────┐
│         Load Balancer (nginx)       │
│  (Distributes requests)             │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
    ┌──▼──┐         ┌──▼──┐
    │ API │         │ API │
    │ #1  │         │ #2  │
    └────┬┘         └┬────┘
         │          │
    ┌────▼──────────▼────┐
    │  PostgreSQL DB     │
    │  (Single/Replicated)
    └────────────────────┘
```

Configuration:

1. **Database server:** Separate dedicated PostgreSQL instance
2. **Cache server:** Separate Redis instance
3. **API servers:** Multiple load-balanced Node.js instances
4. **CDN:** For static assets (frontend, images)

---

## ✅ Post-Optimization Checklist

After implementing optimizations:

- [ ] Cluster mode enabled (multiple processes)
- [ ] Database indexes created
- [ ] PostgreSQL settings optimized
- [ ] Redis caching configured
- [ ] Nginx gzip enabled
- [ ] HTTP/2 enabled
- [ ] Rate limiting implemented
- [ ] Log rotation configured
- [ ] Monitoring setup complete
- [ ] Load testing completed
- [ ] Baseline metrics recorded
- [ ] Post-optimization metrics recorded
- [ ] Performance improvement >20%
- [ ] No errors in logs
- [ ] SSL/TLS score A or higher

---

## 🚨 Common Optimization Mistakes

❌ **Don't:**
- Increase memory limits without measuring
- Cache everything without TTL
- Run too many Node.js processes (limit to CPU count)
- Skip database indexes
- Use default PostgreSQL settings for production
- Cache authenticated requests globally

✅ **Do:**
- Measure before and after optimization
- Cache with appropriate TTLs
- Monitor resource usage constantly
- Create targeted indexes based on queries
- Adjust database configuration per server size
- Use Redis for session/cache, not database queries

---

## 📞 Optimization Support

### Performance Monitoring URL
- PM2 Dashboard: `https://your-domain.com:9615` (if enabled)

### Key Metrics to Watch
- Response time: <200ms (API), <1s (frontend)
- Error rate: <0.1%
- CPU usage: <70%
- Memory usage: <80%
- Database connections: <50 of max available

### When to Scale Further
- Average response time > 500ms
- CPU consistently > 80%
- Memory consistently > 85%
- Database query latency > 1s

---

*Last updated: February 25, 2026*
*Version: 1.0*

