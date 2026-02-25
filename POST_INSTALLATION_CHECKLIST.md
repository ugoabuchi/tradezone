# TradeZone Post-Installation Verification Checklist

Complete these checks after running the installation script to ensure everything is working correctly.

---

## ✅ Immediate Post-Installation (5 minutes)

### 1. Service Status Check
```bash
# All three main services should be "active (running)"
sudo systemctl status tradezone.service
sudo systemctl status apache2
sudo systemctl status postgresql
```

**Expected Output:**
```
● tradezone.service - TradeZone Application
   Loaded: loaded (/etc/systemd/system/tradezone.service; enabled; vendor preset: enabled)
   Active: active (running) since [date]
```

**✅ Pass/❌ Fail:** [ ]

---

### 2. Backend Health Check
```bash
# Should respond with {"status":"ok"} or similar
curl http://localhost:3001/health
```

**Expected Output:**
```json
{"status":"ok"}
```

**✅ Pass/❌ Fail:** [ ]

---

### 3. Apache2 Status
```bash
sudo apache2ctl configtest
sudo systemctl status apache2 | grep Active
```

**Expected Output:**
```
Syntax OK
     Active: active (running) since ...
```

**✅ Pass/❌ Fail:** [ ]

---

### 4. Database Connection
```bash
# Should list the tradezone database
mysql -u root -proot_password -e "SHOW DATABASES LIKE 'tradezone';"
```

**Expected Output:**
```
 tradezone  | tradezone | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =Tc/tradezone ...
```

**✅ Pass/❌ Fail:** [ ]

---

## ✅ Frontend Verification (2 minutes)

### 5. Frontend Built Successfully
```bash
# Should show files in dist directory
ls -lah /var/www/tradezone/frontend/dist | head -20
```

**Expected Output:**
```
total 2.5M
drwxr-xr-x  4 tradezone tradezone 4.0K Feb 25 15:30 .
drwxr-xr-x  8 tradezone tradezone 4.0K Feb 25 15:25 ..
-rw-r--r--  1 tradezone tradezone 1.2K Feb 25 15:30 index.html
drwxr-xr-x  2 tradezone tradezone 4.0K Feb 25 15:30 assets
```

**✅ Pass/❌ Fail:** [ ]

---

### 6. Frontend Accessible via Domain
```bash
# Should return HTML (200 status)
curl -I https://your-domain.com
```

**Expected Output:**
```
HTTP/2 200
Content-Type: text/html; charset=UTF-8
Content-Length: 1234
```

**⚠️ Note:** Replace `your-domain.com` with your actual domain

**✅ Pass/❌ Fail:** [ ]

---

### 7. Frontend Content Loads
Open your browser and navigate to: **https://your-domain.com**

**Expected:**
- Page loads without errors
- No blank screen
- Logo/branding visible
- Can navigate to pages

**✅ Pass/❌ Fail:** [ ]

---

## ✅ Database Verification (3 minutes)

### 8. Database Tables Created
```bash
# Should list all tables
mysql -u tradezone -p tradezone -e "SHOW TABLES;"
```

**Expected Tables:**
```
                 List of relations
 Schema |          Name           | Type  | Owner
--------+-------------------------+-------+----------
 public | users                   | table | tradezone
 public | wallets                 | table | tradezone
 public | orders                  | table | tradezone
 public | transactions            | table | tradezone
 public | payments                | table | tradezone  (new)
 public | payment_gateway_configs | table | tradezone  (new)
```

**✅ Pass/❌ Fail:** [ ]

---

### 9. Users Table Populated
```bash
# Should show at least 0 users (empty is OK)
mysql -u tradezone -ptradezone_password tradezone -e "SELECT COUNT(*) as user_count FROM users;"
```

**Expected Output:**
```
 user_count
------------
          0
(1 row)
```

**✅ Pass/❌ Fail:** [ ]

---

### 10. Database Connection String Works
```bash
# Should work without errors
DATABASE_URL="mysql://tradezone:password@localhost:3306/tradezone" node -e "
const mysql = require('mysql2/promise');
(async () => {
  try {
    const pool = mysql.createPool(process.env.DATABASE_URL);
    const [rows] = await pool.query('SELECT 1');
    console.log('SUCCESS: Database connected');
    await pool.end();
  } catch (err) {
    console.error('FAIL:', err.message);
    process.exit(1);
  }
})();
"
```

**Expected Output:**
```
SUCCESS: Database connected
```

**⚠️ Note:** Make sure to use the actual password from .env file

**✅ Pass/❌ Fail:** [ ]

---

## ✅ Environment Configuration (3 minutes)

### 11. Backend Environment Variables Set
```bash
# All critical variables should be present
grep -E "DATABASE_URL|JWT_SECRET|PORT|CORS_ORIGIN" /var/www/tradezone/backend/.env
```

**Expected Output:**
```
DATABASE_URL=mysql://tradezone:...
JWT_SECRET=...non-empty...
PORT=3001
CORS_ORIGIN=https://your-domain.com
```

**✅ Pass/❌ Fail:** [ ]

---

### 12. Frontend Environment Variables Set
```bash
# API and WebSocket URLs should be set
cat /var/www/tradezone/frontend/.env
```

**Expected Output:**
```
VITE_API_URL=https://api.your-domain.com
VITE_WS_URL=wss://your-domain.com
```

**⚠️ Note:** URLs should match your domain configuration

**✅ Pass/❌ Fail:** [ ]

---

## ✅ SSL/TLS Verification (2 minutes)

### 13. SSL Certificate Installed
```bash
# Should show your domain and certificate info
sudo certbot certificates
```

**Expected Output:**
```
Found the following certificates:
  Certificate Name: your-domain.com
    Domains: your-domain.com
    Expiry Date: 2026-05-25
    Valid: True
```

**✅ Pass/❌ Fail:** [ ]

---

### 14. HTTPS Working
```bash
# Should connect without certificate errors
curl -I https://your-domain.com 2>&1 | grep -E "HTTP|SSL"
```

**Expected Output:**
```
HTTP/2 200
```

**⚠️ Note:** Should NOT show SSL certificate errors

**✅ Pass/❌ Fail:** [ ]

---

### 15. Certificate Auto-Renewal Enabled
```bash
# Should show active timer
sudo systemctl status certbot.timer
```

**Expected Output:**
```
● certbot.timer - Run certbot twice daily
   Loaded: loaded (/etc/systemd/system/certbot.timer; enabled; vendor preset: enabled)
   Active: active (waiting) since ...
```

**✅ Pass/❌ Fail:** [ ]

---

## ✅ API Functionality (5 minutes)

### 16. Public API Endpoints Working
```bash
# Test multiple endpoints
curl https://your-domain.com/api/markets
curl https://your-domain.com/api/prices
curl https://your-domain.com/api/status
```

**Expected Output:**
```json
{"success":true,"data":[...]}
// or similar successful response
```

**⚠️ Note:** 401 Unauthorized is OK for auth endpoints; 502 is NOT OK

**✅ Pass/❌ Fail:** [ ]

---

### 17. API Error Responses are Proper
```bash
# Should return JSON error, not HTML error page
curl -s https://your-domain.com/api/invalid-endpoint | head -c 50
```

**Expected Output:** (starts with `{`)
```
{"error":"Not found"...
```

**⚠️ Note:** Should NOT start with `<html>` or show 502 error

**✅ Pass/❌ Fail:** [ ]

---

### 18. CORS Headers Present
```bash
# Should include CORS headers
curl -I -H "Origin: https://your-domain.com" https://your-domain.com/api/markets | grep -i access-control
```

**Expected Output:**
```
access-control-allow-origin: https://your-domain.com
access-control-allow-credentials: true
```

**✅ Pass/❌ Fail:** [ ]

---

## ✅ Security Verification (3 minutes)

### 19. Firewall Rules Configured
```bash
# Should show allowed rules for ssh, http, https
sudo ufw status | grep -E "22|80|443"
```

**Expected Output:**
```
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

**✅ Pass/❌ Fail:** [ ]

---

### 20. Apache2 Security Headers Present
```bash
# Should show security headers
curl -I https://your-domain.com | grep -i "x-content-type-options\|x-frame-options\|strict-transport-security"
```

**Expected Output:**
```
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
strict-transport-security: max-age=31536000
```

**✅ Pass/❌ Fail:** [ ]

---

### 21. Password Hashing Configured
```bash
# Verify bcrypt is configured in auth
grep -i "bcrypt\|argon" /var/www/tradezone/backend/src/services/AuthService.ts
```

**Expected Output:** (contains bcrypt/crypto references)
```
bcrypt
```

**✅ Pass/❌ Fail:** [ ]

---

## ✅ Payment System Verification (3 minutes)

### 22. Payment Database Tables Exist
```bash
# Should show payment-related tables
mysql -u tradezone -ptradezone_password tradezone -e "SHOW TABLES LIKE '%payment%';"
```

**Expected Output:**
```
 public | payment_gateway_configs | table | tradezone
 public | payments                | table | tradezone
 public | payment_ledger          | table | tradezone
 public | payment_reconciliation  | table | tradezone
 public | refunds                 | table | tradezone
```

**✅ Pass/❌ Fail:** [ ]

---

### 23. Payment Services Installed
```bash
# Should show payment service files
ls -la /var/www/tradezone/backend/src/services/ | grep -i payment
```

**Expected Output:**
```
PaymentGatewayService.ts
PaymentService.ts
StripePaymentGateway.ts
PayPalPaymentGateway.ts
PaystackPaymentGateway.ts
```

**✅ Pass/❌ Fail:** [ ]

---

### 24. Payment Routes Configured
```bash
# Should show payment routes in app
grep -i "payment" /var/www/tradezone/backend/src/index.ts
```

**Expected Output:** (shows payment route imports)
```
import paymentRoutes from './routes/payments';
app.use('/api/payments', paymentRoutes);
```

**✅ Pass/❌ Fail:** [ ]

---

## ✅ Performance & Resource Checks (2 minutes)

### 25. Server Resource Usage OK
```bash
# CPU and memory should be reasonable
free -h
df -h /
```

**Expected Output:**
```
               total        used        free
Mem:           7.8Gi       2.1Gi       5.1Gi
// Disk should have > 5GB free
Filesystem      Size  Used Avail Use%
/dev/sda1       20G   8.0G  12G   40%
```

**⚠️ Alert if:** RAM usage >80% or disk usage >80%

**✅ Pass/❌ Fail:** [ ]

---

### 26. Application Log Size Reasonable
```bash
# Logs shouldn't be huge
du -sh /var/log/tradezone/
ls -lh /var/log/tradezone/backend.log
```

**Expected Output:**
```
# Log size should be under 100MB for new installation
-rw-r--r-- 1 tradezone tradezone 2.3M Feb 25 15:30 /var/log/tradezone/backend.log
```

**⚠️ Alert if:** Logs > 500MB (might have excessive errors)

**✅ Pass/❌ Fail:** [ ]

---

### 27. Database Performance OK
```bash
# Analyze database performance
mysql -u tradezone -ptradezone_password tradezone -e "ANALYZE TABLE users; SELECT table_schema, table_name, table_rows FROM information_schema.tables WHERE table_schema='tradezone';"
```

**Expected Output:**
```
  schemaname | tablename  | rows
-----------+--------+------
 public    | users      |    0
 public    | wallets    |    0
 public    | orders     |    0
```

**✅ Pass/❌ Fail:** [ ]

---

## ✅ Manual Functional Testing (10 minutes)

### 28. Access Admin Dashboard
1. Open https://your-domain.com/admin
2. Should show admin login page
3. Should allow navigation to different admin sections

**Expected:**
- Page loads without errors
- Admin interface visible
- Navigation works

**✅ Pass/❌ Fail:** [ ]

---

### 29. Create Test User Account
1. Go to https://your-domain.com
2. Click "Register" or "Sign Up"
3. Fill in form: Email, Password, Name
4. Submit registration

**Expected:**
- Form submits without errors
- Redirects to dashboard or login
- User appears in database

**Verify:**
```bash
mysql -u tradezone -ptradezone_password tradezone -e "SELECT email FROM users ORDER BY created_at DESC LIMIT 1;"
```

**✅ Pass/❌ Fail:** [ ]

---

### 30. Test Login Function
1. Use test account from step 29
2. Enter email and password on login page
3. Click login

**Expected:**
- Logs in successfully
- Redirects to dashboard
- Sees user portfolio/balance

**✅ Pass/❌ Fail:** [ ]

---

### 31. Test Payment Gateway Configuration
1. Go to Admin > Payment Settings
2. Check that Stripe field shows (empty or configured)
3. Check PayPal field shows (empty or configured)
4. Check Paystack field shows (empty or configured)

**Expected:**
- All payment gateway options visible
- Can enter/edit API keys
- Changes save without errors

**✅ Pass/❌ Fail:** [ ]

---

## ✅ Log Review (2 minutes)

### 32. No Critical Errors in Logs
```bash
# Check for errors in last 100 lines
tail -100 /var/log/tradezone/backend.log | grep -i "error\|fatal\|critical"
```

**Expected Output:**
- Minimal or no errors
- No "Fatal" or "Critical" messages
- Normal startup/operation logs only

**⚠️ Alert if:** Many ERROR lines indicating problems

**✅ Pass/❌ Fail:** [ ]

---

### 33. Systemd Service Healthy
```bash
# Service should have no recent failures
journalctl -u tradezone.service -p err -n 20
```

**Expected Output:**
```
# No output or only old errors from before installation
```

**✅ Pass/❌ Fail:** [ ]

---

## 📊 Summary Results

### Total Checks: 33
**Passed:** ___/33
**Failed:** ___/33

### Priority Failures
- **Critical:** Services 1-4, Database 8-9, Backend 16
- **High:** Auth 29-30, Frontend 5-7
- **Medium:** Configuration 11-12, Security 20
- **Low:** Logs 32-33

---

## 🟢 All Tests Pass? Checklist

If **ALL tests pass**, your installation is complete and successful! ✅

```bash
✅ Services running
✅ Database connected
✅ Frontend accessible
✅ API responding
✅ SSL/TLS working
✅ Security configured
✅ Users can register
✅ Users can login
✅ Payment system ready
✅ No critical errors
```

### Next Steps After Verification
1. **Backup database:** `mysqldump -u tradezone -ptradezone_password tradezone > backup-$(date +%Y%m%d).sql`
2. **Configure payment keys:** Update Stripe, PayPal, Paystack credentials
3. **Add admin users:** Create admin accounts for your team
4. **Set up monitoring:** Optional - install error tracking, uptime monitoring
5. **Configure backups:** Set up automated daily backups

---

## 🟡 Some Tests Failed? Checklist

If you have **1-3 failed tests:**

1. **Identify which tests failed** - Note the numbers above
2. **Check troubleshooting guide:** See `INSTALLATION_TROUBLESHOOTING.md`
3. **Review logs:** `tail -50 /var/log/tradezone/backend.log`
4. **Restart services:** `sudo systemctl restart tradezone.service`
5. **Re-run failed tests** to confirm fixes

### Common Quick Fixes

```bash
# Quick restart everything
sudo systemctl restart tradezone.service apache2 mysql

# Check all services
systemctl status tradezone.service apache2 mysql

# View recent errors
journalctl -u tradezone.service -n 30

# Force rebuild frontend (if frontend tests fail)
cd /var/www/tradezone/frontend
sudo -u tradezone npm run build
sudo systemctl reload apache2
```

---

## 🔴 Many Tests Failed? Checklist

If **>5 tests fail:**

1. **Review installation logs:**
   ```bash
   tail -200 /var/log/tradezone/backend.log
   tail -50 /var/log/nginx/error.log
   journalctl -u tradezone.service -n 100
   ```

2. **Check critical services:**
   ```bash
   sudo systemctl status tradezone.service
   sudo systemctl status mysql
   sudo systemctl status apache2
   ```

3. **Review your domain/DNS:**
   ```bash
   nslookup your-domain.com
   dig your-domain.com
   curl -v https://your-domain.com 2>&1 | head -30
   ```

4. **Consider full reinstall:**
   ```bash
   # Only if you have persistent issues
   sudo systemctl stop tradezone.service
   sudo bash /home/tradezone/install.sh  # Run again
   ```

5. **Open GitHub issue:** Include logs and error details

---

## 📞 Support Information

### If You Need Help:
1. **Check logs first:** See locations in section above
2. **Use troubleshooting guide:** `INSTALLATION_TROUBLESHOOTING.md`
3. **Review this checklist:** Identify which specific test fails
4. **Quick reference:** `START_HERE_PAYMENTS.md` for common config

### Useful Quick Commands

```bash
# All in one status check
for service in tradezone.service apache2 mysql redis-server; do
  echo "=== $service ==="
  sudo systemctl status $service | grep -E "Active|running"
done

# Check all critical directories
ls -la /var/www/tradezone/backend/.env
ls -la /var/www/tradezone/frontend/dist/index.html
ls -la /etc/apache2/sites-enabled/tradezone.conf

# Quick database check
mysql -u tradezone -ptradezone_password tradezone -e "SELECT VERSION(); SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='tradezone';"

# Full resource check
echo "=== Memory ==="; free -h; echo "=== Disk ==="; df -h /; echo "=== Uptime ==="; uptime
```

---

**Verification Complete!** 🎉

Your TradeZone installation is now verified and ready for production use.

---

*Last updated: February 25, 2026*
*Version: 1.0*

