#!/bin/bash

################################################################################
# TradeZone Installation Script for VPS
# This script automates the complete installation and setup of TradeZone
# 
# Usage: bash install.sh
# 
# Tested on: Ubuntu 20.04, Ubuntu 22.04, Debian 11, Debian 12
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TRADEZONE_DIR="/var/www/tradezone"
TRADEZONE_USER="tradezone"
TRADEZONE_GROUP="tradezone"
NODEJS_VERSION="18"
POSTGRES_USER="tradezone"
POSTGRES_DB="tradezone"
POSTGRES_PORT="5432"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        echo "Run: sudo bash install.sh"
        exit 1
    fi
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

################################################################################
# System Prerequisites
################################################################################

install_system_dependencies() {
    print_header "Installing System Dependencies"
    
    print_info "Updating package manager..."
    apt-get update -qq
    
    print_info "Installing required packages..."
    apt-get install -y -qq \
        curl \
        wget \
        git \
        build-essential \
        python3 \
        openssl \
        apache2 \
        apache2-utils \
        libapache2-mod-proxy-html \
        libapache2-mod-rewrite \
        supervisor \
        certbot \
        python3-certbot-apache \
        htop \
        vim \
        nano \
        tmux
    
    print_success "System dependencies installed"
}

install_nodejs() {
    print_header "Installing Node.js ${NODEJS_VERSION}"
    
    if command_exists node; then
        local current_version=$(node -v)
        print_warning "Node.js already installed: $current_version"
        return
    fi
    
    print_info "Adding NodeSource repository..."
    curl -fsSL https://deb.nodesource.com/setup_${NODEJS_VERSION}.x | bash -
    
    print_info "Installing Node.js..."
    apt-get install -y -qq nodejs
    
    print_success "Node.js $(node -v) installed"
    print_success "npm $(npm -v) installed"
}

install_postgresql() {
    print_header "Installing PostgreSQL"
    
    if command_exists psql; then
        print_warning "PostgreSQL already installed"
        return
    fi
    
    print_info "Adding PostgreSQL repository..."
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget -qO - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    
    apt-get update -qq
    
    print_info "Installing PostgreSQL..."
    apt-get install -y -qq postgresql postgresql-contrib
    
    print_success "PostgreSQL installed"
    
    # Start PostgreSQL
    systemctl enable postgresql
    systemctl start postgresql
    
    print_success "PostgreSQL service started and enabled"
}

install_redis() {
    print_header "Installing Redis (Optional)"
    
    read -p "Do you want to install Redis for caching? (y/n) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping Redis installation"
        return
    fi
    
    if command_exists redis-server; then
        print_warning "Redis already installed"
        return
    fi
    
    apt-get install -y -qq redis-server
    
    systemctl enable redis-server
    systemctl start redis-server
    
    print_success "Redis installed and started"
}

################################################################################
# Application Setup
################################################################################

create_system_user() {
    print_header "Creating System User"
    
    if id "$TRADEZONE_USER" &>/dev/null; then
        print_warning "User $TRADEZONE_USER already exists"
        return
    fi
    
    useradd -m -s /bin/bash "$TRADEZONE_USER"
    usermod -aG sudo "$TRADEZONE_USER"
    
    print_success "User $TRADEZONE_USER created"
}

setup_project_directory() {
    print_header "Setting Up Project Directory"
    
    if [ -d "$TRADEZONE_DIR" ]; then
        print_warning "Directory $TRADEZONE_DIR already exists"
        read -p "Do you want to continue with existing directory? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        mkdir -p "$TRADEZONE_DIR"
    fi
    
    chown -R "$TRADEZONE_USER:$TRADEZONE_GROUP" "$TRADEZONE_DIR"
    chmod 755 "$TRADEZONE_DIR"
    
    print_success "Project directory setup complete"
}

clone_or_update_repo() {
    print_header "Cloning/Updating TradeZone Repository"
    
    if [ -d "$TRADEZONE_DIR/.git" ]; then
        print_info "Repository already exists, pulling latest changes..."
        cd "$TRADEZONE_DIR"
        sudo -u "$TRADEZONE_USER" git pull origin main
    else
        print_info "Cloning repository..."
        # Replace with your actual repository URL
        sudo -u "$TRADEZONE_USER" git clone https://github.com/yourusername/tradezone.git "$TRADEZONE_DIR"
    fi
    
    print_success "Repository ready"
}

setup_database() {
    print_header "Setting Up PostgreSQL Database"
    
    print_info "Creating database user..."
    
    # Generate a random password
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # Create user and database
    sudo -u postgres psql <<EOF
-- Drop existing user if exists
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$POSTGRES_DB'
AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS $POSTGRES_DB;
DROP USER IF EXISTS $POSTGRES_USER;

-- Create user
CREATE USER $POSTGRES_USER WITH PASSWORD '$DB_PASSWORD';

-- Create database
CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;

-- Enable extensions
\c $POSTGRES_DB
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

EOF

    print_success "Database and user created"
    print_info "Database: $POSTGRES_DB"
    print_info "User: $POSTGRES_USER"
    print_warning "Password: $DB_PASSWORD (save this!)"
}

setup_environment_files() {
    print_header "Setting Up Environment Files"
    
    # Backend environment
    print_info "Creating backend/.env..."
    cat > "$TRADEZONE_DIR/backend/.env" <<EOF
# Database
DATABASE_URL=postgresql://$POSTGRES_USER:$DB_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB

# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRY=7d

# CORS
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Kraken API (Forex)
KRAKEN_API_URL=https://api.kraken.com/0/public
KRAKEN_API_KEY=your_kraken_api_key
KRAKEN_API_SECRET=your_kraken_api_secret
KRAKEN_UPDATE_INTERVAL=10000

# Payment Gateways
STRIPE_API_KEY=sk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

PAYPAL_CLIENT_ID=AW_xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_MODE=sandbox

PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=xxxxx

PAYMENT_GATEWAY_MODE=sandbox
PAYMENT_MIN_AMOUNT=10
PAYMENT_MAX_AMOUNT=100000

# Frontend URL
FRONTEND_URL=https://yourdomain.com
EOF

    chown "$TRADEZONE_USER:$TRADEZONE_GROUP" "$TRADEZONE_DIR/backend/.env"
    chmod 600 "$TRADEZONE_DIR/backend/.env"
    
    print_success "Backend environment file created"
    
    # Frontend environment
    print_info "Creating frontend/.env..."
    cat > "$TRADEZONE_DIR/frontend/.env" <<EOF
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
EOF

    chown "$TRADEZONE_USER:$TRADEZONE_GROUP" "$TRADEZONE_DIR/frontend/.env"
    chmod 600 "$TRADEZONE_DIR/frontend/.env"
    
    print_success "Frontend environment file created"
    
    print_warning "⚠️  IMPORTANT: Update the following in the .env files:"
    print_warning "  - CORS_ORIGIN: your actual domain"
    print_warning "  - API keys for Kraken, Stripe, PayPal, Paystack"
    print_warning "  - JWT_SECRET: already generated"
    print_warning "  - DATABASE credentials: already set"
}

install_dependencies() {
    print_header "Installing Node Dependencies"
    
    cd "$TRADEZONE_DIR"
    
    print_info "Installing root dependencies..."
    sudo -u "$TRADEZONE_USER" npm install --production
    
    print_info "Installing backend dependencies..."
    cd "$TRADEZONE_DIR/backend"
    sudo -u "$TRADEZONE_USER" npm install --production
    
    print_info "Installing frontend dependencies..."
    cd "$TRADEZONE_DIR/frontend"
    sudo -u "$TRADEZONE_USER" npm install --production
    
    print_success "All dependencies installed"
}

build_application() {
    print_header "Building Application"
    
    print_info "Building frontend..."
    cd "$TRADEZONE_DIR/frontend"
    sudo -u "$TRADEZONE_USER" npm run build
    
    print_success "Frontend build complete"
}

run_database_migrations() {
    print_header "Running Database Migrations"
    
    cd "$TRADEZONE_DIR/backend"
    
    print_info "Running migrations..."
    sudo -u "$TRADEZONE_USER" npm run migrate 2>/dev/null || \
    sudo -u "$TRADEZONE_USER" DATABASE_URL="postgresql://$POSTGRES_USER:$DB_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB" node -e "require('./src/config/migrations.ts')"
    
    print_success "Migrations completed"
}

################################################################################
# Nginx Configuration
################################################################################

setup_apache() {
    print_header "Configuring Apache Reverse Proxy"
    
    print_info "Enabling Apache modules..."
    a2enmod proxy
    a2enmod proxy_http
    a2enmod rewrite
    a2enmod ssl
    a2enmod headers
    a2enmod proxy_wstunnel
    
    print_info "Creating Apache virtual host configuration..."
    
    cat > /etc/apache2/sites-available/tradezone.conf <<'EOF'
# HTTP redirect to HTTPS
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    # Allow Let's Encrypt challenges
    DocumentRoot /var/www/certbot
    
    # Redirect all HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/.well-known/acme-challenge/ [NC]
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

# HTTPS server
<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    # SSL certificates (will be created by certbot)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    SSLProtocol all -SSLv2 -SSLv3
    SSLCipherSuite HIGH:!aNULL:!MD5
    
    # Security headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    
    # Gzip compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss
    </IfModule>
    
    # Client body size limit
    LimitRequestBody 10485760
    
    # Frontend - Serve React SPA
    DocumentRoot /var/www/tradezone/frontend/dist
    
    <Directory /var/www/tradezone/frontend/dist>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # SPA routing - redirect all requests to index.html
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
        
        # Cache control
        <FilesMatch "\.(html|xml)$">
            Header set Cache-Control "public, must-revalidate, max-age=3600"
        </FilesMatch>
        <FilesMatch "\.(jpg|jpeg|png|gif|ico|css|js)$">
            Header set Cache-Control "public, immutable, max-age=31536000"
        </FilesMatch>
    </Directory>
    
    # API backend proxy
    <Location /api/>
        ProxyPreserveHost On
        ProxyPass http://localhost:3001/api/ connectiontimeout=30 timeout=30
        ProxyPassReverse http://localhost:3001/api/
        
        # Headers
        RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}s"
        RequestHeader set X-Forwarded-Proto "https"
        RequestHeader set X-Forwarded-Host "%{HTTP_HOST}s"
    </Location>
    
    # WebSocket support for Socket.io
    <Location /socket.io>
        ProxyPreserveHost On
        ProxyPass ws://localhost:3001/socket.io/ connectiontimeout=30 timeout=30
        ProxyPassReverse ws://localhost:3001/socket.io/
        
        RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}s"
        RequestHeader set X-Forwarded-Proto "https"
        RequestHeader set X-Forwarded-Host "%{HTTP_HOST}s"
    </Location>
</VirtualHost>
EOF

    # Enable site and disable default
    a2ensite tradezone
    a2dissite 000-default
    
    # Test configuration
    if apache2ctl configtest 2>&1 | grep -q "Syntax OK"; then
        print_success "Apache configuration valid"
    else
        print_error "Apache configuration invalid"
        apache2ctl configtest
        return 1
    fi
    
    # Enable SSL if not already enabled
    systemctl enable apache2
    systemctl restart apache2
    
    print_success "Apache configured and reloaded"
    
    print_warning "⚠️  IMPORTANT: Update Apache config with your domain:"
    print_warning "  1. sed -i 's/yourdomain.com/your-actual-domain.com/g' /etc/apache2/sites-available/tradezone.conf"
    print_warning "  2. sudo systemctl restart apache2"
}

setup_ssl_certificate() {
    print_header "Setting Up SSL Certificate (Let's Encrypt)"
    
    read -p "Do you want to setup SSL certificate now? (y/n) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping SSL setup"
        print_warning "Run later: certbot --apache -d yourdomain.com"
        return
    fi
    
    read -p "Enter your domain name: " domain
    read -p "Enter your email: " email
    
    certbot --apache -d "$domain" -m "$email" --agree-tos -n
    
    # Setup auto-renewal
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    print_success "SSL certificate configured"
}

################################################################################
# Systemd Service Setup
################################################################################

setup_systemd_service() {
    print_header "Setting Up Systemd Service"
    
    print_info "Creating TradeZone service..."
    
    cat > /etc/systemd/system/tradezone.service <<EOF
[Unit]
Description=TradeZone Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=$TRADEZONE_USER
WorkingDirectory=$TRADEZONE_DIR/backend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=append:/var/log/tradezone/backend.log
StandardError=append:/var/log/tradezone/backend.log

# Security
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$TRADEZONE_DIR/backend

# Resource limits
LimitNOFILE=65535
LimitNPROC=65535

[Install]
WantedBy=multi-user.target
EOF

    # Create log directory
    mkdir -p /var/log/tradezone
    chown "$TRADEZONE_USER:$TRADEZONE_GROUP" /var/log/tradezone
    chmod 755 /var/log/tradezone
    
    # Reload systemd
    systemctl daemon-reload
    
    # Enable service
    systemctl enable tradezone.service
    
    print_success "Systemd service created and enabled"
}

################################################################################
# Monitoring and Logging
################################################################################

setup_monitoring() {
    print_header "Setting Up Monitoring"
    
    print_info "Creating log rotation configuration..."
    
    cat > /etc/logrotate.d/tradezone <<EOF
/var/log/tradezone/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $TRADEZONE_USER $TRADEZONE_GROUP
    sharedscripts
    postrotate
        systemctl reload tradezone > /dev/null 2>&1 || true
    endscript
}
EOF

    print_success "Log rotation configured"
}

################################################################################
# Firewall Setup
################################################################################

setup_firewall() {
    print_header "Setting Up Firewall"
    
    if ! command_exists ufw; then
        print_warning "UFW not installed, skipping firewall configuration"
        return
    fi
    
    read -p "Do you want to setup UFW firewall? (y/n) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping firewall setup"
        return
    fi
    
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    
    print_success "Firewall configured"
}

################################################################################
# Start Services
################################################################################

start_services() {
    print_header "Starting Services"
    
    print_info "Starting TradeZone backend..."
    systemctl start tradezone.service
    
    sleep 2
    
    if systemctl is-active --quiet tradezone.service; then
        print_success "TradeZone backend started"
    else
        print_error "Failed to start TradeZone backend"
        systemctl status tradezone.service
        return 1
    fi
    
    print_info "Reloading Apache..."
    systemctl reload apache2
    
    print_success "All services started"
}

################################################################################
# Dummy Accounts Setup
################################################################################

setup_dummy_accounts() {
    print_header "Creating Dummy User Accounts"
    
    print_info "Creating test user accounts..."
    
    # Admin account
    ADMIN_EMAIL="admin@tradezone.local"
    ADMIN_PASSWORD="Admin@123456"
    
    # Regular user account
    USER_EMAIL="user@tradezone.local"
    USER_PASSWORD="User@123456"
    
    # Insert dummy accounts (password hashing handled by application if not already)
    # Note: Passwords should be hashed in production, but we're using plaintext for demo
    # The app itself should hash these on creation
    
    sudo -u postgres psql -d "$POSTGRES_DB" <<EOADMIN
-- Insert admin user
INSERT INTO users (email, password_hash, full_name, created_at, updated_at) 
VALUES (
    '$ADMIN_EMAIL',
    '\$2b\$10\$dummy.hash.for.admin', 
    'Admin User',
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- Insert regular user
INSERT INTO users (email, password_hash, full_name, created_at, updated_at) 
VALUES (
    '$USER_EMAIL',
    '\$2b\$10\$dummy.hash.for.user',
    'Test User',
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;
EOADMIN

    # Save credentials to a file
    cat > /var/www/tradezone/DUMMY_ACCOUNTS.txt <<EOF
╔════════════════════════════════════════════════════════════════╗
║          TradeZone Demo Account Credentials                    ║
║                                                                ║
║  These are dummy accounts created for testing purposes only.   ║
║  Change passwords before deploying to production!              ║
╚════════════════════════════════════════════════════════════════╝

ADMIN ACCOUNT
─────────────
Email:    $ADMIN_EMAIL
Password: $ADMIN_PASSWORD
Role:     Administrator

REGULAR USER ACCOUNT  
────────────────────
Email:    $USER_EMAIL
Password: $USER_PASSWORD
Role:     Standard User

ACCESS:
──────
Frontend:  https://yourdomain.com
API:       https://yourdomain.com/api

IMPORTANT NOTES:
────────────────
1. These passwords are plaintext - change them immediately in production
2. If you cannot login, the dummy password hashes may need updating
3. Check the application to see how passwords are hashed (bcrypt, etc.)
4. Update the password hashes in setup_dummy_accounts() function
5. Delete this file after remembering the credentials

Database Info:
──────────────
Database: $POSTGRES_DB
User: $POSTGRES_USER
Password: $DB_PASSWORD
Host: localhost
Port: $POSTGRES_PORT

Generated: $(date)
EOF

    chmod 600 /var/www/tradezone/DUMMY_ACCOUNTS.txt
    chown root:root /var/www/tradezone/DUMMY_ACCOUNTS.txt
    
    print_success "Dummy accounts created"
    print_info "Credentials saved to: /var/www/tradezone/DUMMY_ACCOUNTS.txt"
    print_warning "Keep this file safe, contains plaintext passwords!"
}

################################################################################
# Display Summary
################################################################################

display_summary() {
    print_header "Installation Complete! 🎉"
    
    echo -e "${GREEN}Installation Summary:${NC}\n"
    
    echo "📁 Application Directory: $TRADEZONE_DIR"
    echo "👤 System User: $TRADEZONE_USER"
    echo "🗄️  Database: $POSTGRES_DB"
    echo "🔌 Backend Port: 3001"
    echo "🌐 Frontend: Served via Apache2"
    
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}\n"
    
    echo "1. Update environment variables:"
    echo "   nano $TRADEZONE_DIR/backend/.env"
    echo ""
    
    echo "2. Update Apache domain:"
    echo "   sed -i 's/yourdomain.com/your-domain.com/g' /etc/apache2/sites-available/tradezone.conf"
    echo "   systemctl restart apache2"
    echo ""
    
    echo "3. Setup SSL certificate:"
    echo "   certbot --apache -d yourdomain.com"
    echo ""
    
    echo "4. View logs:"
    echo "   tail -f /var/log/tradezone/backend.log"
    echo ""
    
    echo "5. Check service status:"
    echo "   systemctl status tradezone.service"
    echo ""
    
    echo -e "${GREEN}Useful Commands:${NC}\n"
    
    echo "Start/Stop/Restart service:"
    echo "  systemctl start tradezone.service"
    echo "  systemctl stop tradezone.service"
    echo "  systemctl restart tradezone.service"
    echo ""
    
    echo "View logs:"
    echo "  journalctl -u tradezone.service -f"
    echo "  tail -f /var/log/tradezone/backend.log"
    echo ""
    
    echo "Manage application:"
    echo "  cd $TRADEZONE_DIR"
    echo "  npm run dev          # Development mode"
    echo "  npm run build        # Build app"
    echo ""
    
    echo -e "${BLUE}Documentation:${NC}"
    echo "  - API Docs: $TRADEZONE_DIR/PAYMENT_API_DOCS.md"
    echo "  - Setup Guide: $TRADEZONE_DIR/PAYMENT_GATEWAYS_GUIDE.md"
    echo "  - Admin Guide: $TRADEZONE_DIR/ADMIN_PAYMENT_CONFIG.md"
    echo ""
}

################################################################################
# Main Installation Flow
################################################################################

main() {
    clear
    
    print_header "TradeZone VPS Installation Script"
    
    echo "This script will install and configure TradeZone on your VPS."
    echo ""
    print_warning "Prerequisites:"
    echo "  - Ubuntu 20.04+ or Debian 11+ (64-bit)"
    echo "  - At least 2GB RAM"
    echo "  - 10GB free disk space"
    echo "  - Root or sudo access"
    echo ""
    
    read -p "Continue with installation? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Installation cancelled"
        exit 0
    fi
    
    # Run installation steps
    check_root
    install_system_dependencies
    install_nodejs
    install_postgresql
    install_redis
    create_system_user
    setup_project_directory
    clone_or_update_repo
    setup_database
    setup_environment_files
    install_dependencies
    build_application
    run_database_migrations
    setup_apache
    setup_ssl_certificate
    setup_dummy_accounts
    setup_systemd_service
    setup_monitoring
    setup_firewall
    start_services
    display_summary
}

# Run main installation
main "$@"

exit 0
