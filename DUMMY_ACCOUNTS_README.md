# TradeZone - Dummy Account Credentials

## Overview

This file contains the default dummy account credentials created during the TradeZone installation process. These accounts are provided for **testing and development purposes only** and should be replaced with real accounts before deploying to production.

---

## 📋 Account Credentials

### Admin Account
```
Email:    admin@tradezone.local
Password: Admin@123456
Role:     Administrator
```

**Permissions:**
- Full system access
- User management
- Platform configuration
- Payment gateway settings
- API key management
- Reporting and analytics

---

### Regular User Account
```
Email:    user@tradezone.local
Password: User@123456
Role:     Standard User
```

**Permissions:**
- Buy/Sell orders
- View market data
- Portfolio management
- Order history
- Account settings
- Limited to personal data only

---

## 🔐 Security Warnings

⚠️ **CRITICAL: READ BEFORE GOING TO PRODUCTION**

1. **These passwords are created during installation and stored in plaintext** in `/var/www/tradezone/DUMMY_ACCOUNTS.txt`
2. **Change these passwords immediately** after the first successful login
3. **Delete the credentials file** after you've logged in and changed passwords: `rm /var/www/tradezone/DUMMY_ACCOUNTS.txt`
4. **Never use these credentials in production environments**
5. **Enable two-factor authentication (2FA)** for all admin accounts
6. **Implement strong password policies** requiring:
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, and special characters
   - Password expiration every 90 days

---

## 🚀 First Login Steps

### 1. Access the Application
```
URL: https://yourdomain.com
```

### 2. Login with Admin Account
```
Email:    admin@tradezone.local
Password: Admin@123456
```

### 3. Change Admin Password
- Navigate to: **Settings → Security → Change Password**
- Create a strong password (minimum 12 characters)
- Save the new password securely

### 4. Create Additional Admin Accounts
- Go to: **Admin Panel → User Management**
- Create new admin accounts for your team
- Use strong, unique passwords for each user
- Enable 2FA for all admin accounts

### 5. Test with Regular User
- Log out of admin account
- Login with test user account:
  - Email: `user@tradezone.local`
  - Password: `User@123456`
- Test user functionality (trading, orders, portfolio)
- Change password

### 6. Delete Dummy Accounts (Production)
Once you've verified functionality:
1. Login as admin
2. Go to: **Admin Panel → User Management**
3. Delete both dummy accounts:
   - `admin@tradezone.local`
   - `user@tradezone.local`

---

## 📊 Database Information

If you need to access the database directly:

```
Database Type:  MySQL
Host:           localhost
Port:           3306
Database:       tradezone
User:           tradezone
```

**Connection string:**
```bash
mysql -h localhost -u tradezone -p tradezone
```

### Database Location
The database credentials are stored in:
- Backend config: `/var/www/tradezone/backend/.env`
- Database password is in the DATABASE_URL environment variable

---

## 🔄 Password Reset (if locked out)

If you forget your password or get locked out:

### Option 1: Direct Database Update (Development Only)
```bash
# SSH into server
ssh user@yourdomain.com

# Connect to database
mysql -u tradezone -p tradezone

# Update password with bcrypt hash
-- Generate bcrypt hash password using NodeJS or online tool
-- Then update the hash:
UPDATE users SET password_hash = '<new_bcrypt_hash>' 
WHERE email = 'admin@tradezone.local';
```

### Option 2: Using Application Reset
If password reset is implemented:
1. Click "Forgot Password" on login screen
2. Enter email address
3. Check email for reset link
4. Follow reset instructions

---

## ✅ Installation Verification Checklist

After installation, verify:

- [ ] Frontend accessible at `https://yourdomain.com`
- [ ] API responding at `https://yourdomain.com/api/markets`
- [ ] Admin login works with provided credentials
- [ ] User login works with provided credentials
- [ ] WebSocket connection working (real-time updates)
- [ ] SSL certificate valid (trust warning should not appear)
- [ ] Database backup strategy in place
- [ ] Monitoring/logging configured
- [ ] Firewall rules verified
- [ ] Old credentials file deleted (`/var/www/tradezone/DUMMY_ACCOUNTS.txt`)

---

## 📝 Environment Variables

The installation script creates environment files at:

### Backend Configuration
```
/var/www/tradezone/backend/.env
```

Key variables:
```bash
DATABASE_URL=mysql://tradezone:password@localhost:3306/tradezone
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### Frontend Configuration
```
/var/www/tradezone/frontend/.env
```

Key variables:
```bash
VITE_API_URL=https://yourdomain.com
VITE_WS_URL=wss://yourdomain.com
```

---

## 🆘 Troubleshooting

### Cannot Login
1. Verify credentials are correct (check email spelling)
2. Check database is running: `systemctl status mysql`
3. Check backend service: `systemctl status tradezone.service`
4. View logs: `journalctl -u tradezone.service -n 50`

### Password Expired
- Run password reset via "Forgot Password" link
- Or reset in database (see Password Reset section above)

### Session Timeout
- Default session timeout is usually 24 hours
- Check JWT_EXPIRY in `.env` file
- Logout and login again with fresh token

### Cannot Access Application
1. Check Apache is running: `systemctl status apache2`
2. Check SSL certificate: `sudo certbot certificates`
3. Check domain DNS: `nslookup yourdomain.com`
4. View Apache errors: `sudo tail -f /var/log/apache2/error.log`

---

## 📚 Additional Resources

- **Installation Guide:** [VPS_INSTALLATION_GUIDE.md](VPS_INSTALLATION_GUIDE.md)
- **Deployment Checklist:** [POST_INSTALLATION_CHECKLIST.md](POST_INSTALLATION_CHECKLIST.md)
- **Troubleshooting:** [INSTALLATION_TROUBLESHOOTING.md](INSTALLATION_TROUBLESHOOTING.md)
- **API Documentation:** [PAYMENT_API_DOCS.md](PAYMENT_API_DOCS.md)

---

## 🔄 Migration to Production

When moving to production:

1. **Create new admin accounts** with strong passwords
2. **Delete dummy accounts** completely
3. **Update all environment variables** for production
4. **Enable HTTPS/SSL** (automatically set up by installation)
5. **Configure backups** for database
6. **Setup monitoring** for uptime
7. **Enable logging** and log rotation
8. **Configure alerting** for critical issues
9. **Test disaster recovery** procedures
10. **Review security checklist** twice

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting guide
2. Review application logs
3. Review database logs
4. Check system resources (disk, RAM, CPU)
5. Contact your DevOps team

---

## 📄 File Management

**Location of credential backups:**
```
/var/www/tradezone/DUMMY_ACCOUNTS.txt
```

This file is:
- Created during installation
- Contains plaintext passwords
- Should be **deleted immediately after first login**
- Readable only by root (chmod 600)

---

**Installation Date:** Check the timestamp in `/var/www/tradezone/DUMMY_ACCOUNTS.txt`

**Last Updated:** When `setup_dummy_accounts()` function executed

---

⚠️ **Security Reminder:** Change all default credentials before using this system in any environment beyond local development. Maintain this file securely and delete it once you've created permanent accounts.
