# Santa's AI Gift Finder Backend - Production Deployment Guide

This guide provides comprehensive instructions for deploying the Santa's AI Gift Finder backend to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Redis Setup](#redis-setup)
5. [Application Deployment](#application-deployment)
6. [Load Balancing](#load-balancing)
7. [Monitoring Setup](#monitoring-setup)
8. [Security Configuration](#security-configuration)
9. [Performance Tuning](#performance-tuning)
10. [Backup and Recovery](#backup-and-recovery)

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 20.04+ or CentOS 7+ or Windows Server 2019+
- **CPU**: 2+ cores (4+ recommended for production)
- **RAM**: 4GB minimum (8GB+ recommended)
- **Storage**: 20GB+ available disk space
- **Network**: Stable internet connection

### Software Dependencies

- Python 3.8+
- PostgreSQL 12+ or MySQL 8.0+ (SQLite for development only)
- Redis 6.0+
- Nginx (for production serving)
- SSL certificate (Let's Encrypt recommended)

### Required Packages

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip postgresql redis-server nginx certbot

# CentOS/RHEL
sudo yum install python3 python3-pip postgresql-server redis nginx certbot

# macOS (development)
brew install python3 postgresql redis nginx
```

## Environment Setup

### 1. Create Application User

```bash
# Create dedicated user for the application
sudo useradd -m -s /bin/bash santas-api
sudo usermod -aG www-data santas-api

# Create application directories
sudo mkdir -p /opt/santas-gift-finder
sudo chown -R santas-api:santas-api /opt/santas-gift-finder
```

### 2. Clone Repository

```bash
# Switch to application user
sudo -u santas-api bash

# Clone the repository
cd /opt/santas-gift-finder
git clone https://github.com/your-org/santas-ai-gift-finder.git .
cd backend
```

### 3. Python Environment Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install spaCy model
python -m spacy download en_core_web_sm
```

### 4. Environment Configuration

Create production environment file:

```bash
# Create .env file
cp .env.example .env

# Edit with production values
nano .env
```

**Production .env configuration:**

```env
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=your-super-secure-secret-key-here

# Database Configuration
DATABASE_URL=postgresql://santas_api:your_secure_password@localhost:5432/santas_gifts

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_CACHE_DB=1

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-here

# External Services
COMMIT_SHA=$(git rev-parse HEAD)
```

## Database Setup

### PostgreSQL Setup

```bash
# Create database and user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE santas_gifts;
CREATE USER santas_api WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE santas_gifts TO santas_api;
ALTER USER santas_api CREATEDB;
\q
```

### Database Migration

```bash
# Activate virtual environment
source venv/bin/activate

# Initialize database
python -c "from app import db; db.create_all()"

# Seed initial data
python -c "from app import seed_database; seed_database()"
```

### Database Optimization

Create indexes for production performance:

```sql
-- Connect to database
psql -d santas_gifts -U santas_api

-- Create performance indexes
CREATE INDEX CONCURRENTLY idx_gift_name ON gift USING gin(to_tsvector('english', name));
CREATE INDEX CONCURRENTLY idx_gift_description ON gift USING gin(to_tsvector('english', description));
CREATE INDEX CONCURRENTLY idx_gift_category_age ON gift(category, age_min, age_max);
CREATE INDEX CONCURRENTLY idx_user_email ON "user"(email);
CREATE INDEX CONCURRENTLY idx_user_username ON "user"(username);
```

## Redis Setup

### Production Redis Configuration

```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Key production settings:
maxmemory 256mb
maxmemory-policy allkeys-lru
tcp-keepalive 300
timeout 300
databases 16
save 900 1
save 300 10
save 60 10000
```

### Redis Security

```bash
# Set Redis password
sudo nano /etc/redis/redis.conf
# Add: requirepass your_redis_password

# Restart Redis
sudo systemctl restart redis-server

# Update .env with Redis password
echo "REDIS_PASSWORD=your_redis_password" >> .env
```

## Application Deployment

### 1. Gunicorn Configuration

Create Gunicorn configuration file:

```bash
# Create gunicorn config
nano gunicorn.conf.py
```

**gunicorn.conf.py:**

```python
# Gunicorn configuration for production
bind = "127.0.0.1:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2
user = "santas-api"
group = "santas-api"
tmp_upload_dir = None
pidfile = "/opt/santas-gift-finder/backend/gunicorn.pid"
logfile = "/opt/santas-gift-finder/backend/logs/gunicorn.log"
loglevel = "info"
accesslog = "/opt/santas-gift-finder/backend/logs/access.log"
errorlog = "/opt/santas-gift-finder/backend/logs/error.log"
```

### 2. Systemd Service

Create systemd service file:

```bash
sudo nano /etc/systemd/system/santas-api.service
```

**santas-api.service:**

```ini
[Unit]
Description=Santa's AI Gift Finder API
After=network.target postgresql.service redis-server.service

[Service]
User=santas-api
Group=santas-api
WorkingDirectory=/opt/santas-gift-finder/backend
Environment="PATH=/opt/santas-gift-finder/backend/venv/bin"
ExecStart=/opt/santas-gift-finder/backend/venv/bin/gunicorn --config gunicorn.conf.py app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 3. Start Application

```bash
# Enable and start service
sudo systemctl enable santas-api
sudo systemctl start santas-api

# Check status
sudo systemctl status santas-api

# View logs
sudo journalctl -u santas-api -f
```

## Load Balancing

### Nginx Configuration

```bash
# Create Nginx site configuration
sudo nano /etc/nginx/sites-available/santas-api
```

**santas-api nginx config:**

```nginx
upstream santas_api {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    server 127.0.0.1:8003;
}

server {
    listen 80;
    server_name api.santas-gift-finder.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static file caching
    location /api/assets/ {
        alias /opt/santas-gift-finder/frontend/build/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API endpoints
    location /api/ {
        proxy_pass http://santas_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint (no auth required)
    location /api/health {
        proxy_pass http://santas_api;
        access_log off;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.santas-gift-finder.com;
    return 301 https://$server_name$request_uri;
}
```

### SSL Certificate Setup

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.santas-gift-finder.com

# Test renewal
sudo certbot renew --dry-run
```

## Monitoring Setup

### Application Monitoring

```bash
# Install monitoring tools
sudo apt install prometheus-node-exporter

# Configure log rotation
sudo nano /etc/logrotate.d/santas-api

# Log rotation configuration
/opt/santas-gift-finder/backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 santas-api santas-api
    postrotate
        systemctl reload santas-api
    endscript
}
```

### Health Check Monitoring

Create health check script:

```bash
# Create health check script
sudo nano /usr/local/bin/santas-health-check.sh
```

**santas-health-check.sh:**

```bash
#!/bin/bash

# Health check script for Santa's API
HEALTH_URL="http://localhost/api/health"
EXPECTED_STATUS="healthy"

response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ "$response" -eq 200 ]; then
    health_data=$(curl -s $HEALTH_URL)
    status=$(echo $health_data | jq -r '.status')

    if [ "$status" = "$EXPECTED_STATUS" ]; then
        echo "Service is healthy"
        exit 0
    else
        echo "Service status: $status"
        exit 1
    fi
else
    echo "HTTP status: $response"
    exit 1
fi
```

Make executable and test:

```bash
sudo chmod +x /usr/local/bin/santas-health-check.sh
sudo /usr/local/bin/santas-health-check.sh
```

## Security Configuration

### Firewall Setup

```bash
# Configure UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Verify firewall status
sudo ufw status
```

### SSL/TLS Configuration

```bash
# Generate strong Diffie-Hellman parameters
sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

# Update Nginx SSL configuration
sudo nano /etc/nginx/sites-available/santas-api

# Add to server block:
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_dhparam /etc/ssl/certs/dhparam.pem;
add_header Strict-Transport-Security "max-age=63072000" always;
```

### Database Security

```sql
-- Secure database user permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO santas_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO santas_api;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO santas_api;

-- Create read-only user for monitoring
CREATE USER santas_monitor WITH PASSWORD 'monitor_password';
GRANT CONNECT ON DATABASE santas_gifts TO santas_monitor;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO santas_monitor;
```

## Performance Tuning

### Database Tuning

**postgresql.conf optimizations:**

```ini
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connection settings
max_connections = 100
tcp_keepalives_idle = 60
tcp_keepalives_interval = 10

# Query planning
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Application Tuning

**Environment variables for performance:**

```env
# Gunicorn workers (rule of thumb: 2 * CPU cores + 1)
WEB_CONCURRENCY=5

# Database connection pool
SQLALCHEMY_POOL_SIZE=10
SQLALCHEMY_MAX_OVERFLOW=20
SQLALCHEMY_POOL_RECYCLE=300

# Redis connection pool
REDIS_MAX_CONNECTIONS=20

# Cache TTL settings
CACHE_DEFAULT_TTL=3600
SEARCH_CACHE_TTL=1800
NLP_CACHE_TTL=3600
```

### Monitoring Performance

```bash
# Monitor application performance
sudo apt install htop iotop

# Database monitoring
sudo apt install pg_top

# Network monitoring
sudo apt install nload

# Log monitoring
sudo apt install logwatch
```

## Backup and Recovery

### Database Backup

Create backup script:

```bash
# Create backup directory
sudo mkdir -p /opt/santas-backups
sudo chown santas-api:santas-api /opt/santas-backups

# Create backup script
sudo nano /opt/santas-gift-finder/backup.sh
```

**backup.sh:**

```bash
#!/bin/bash

# Database backup script
BACKUP_DIR="/opt/santas-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/santas_gifts_$DATE.sql"

# Create backup
pg_dump -U santas_api -h localhost santas_gifts > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Automated Backups

```bash
# Make executable
sudo chmod +x /opt/santas-gift-finder/backup.sh

# Add to crontab for daily backups at 2 AM
sudo crontab -e

# Add line:
0 2 * * * /opt/santas-gift-finder/backup.sh
```

### Recovery Procedure

```bash
# Stop application
sudo systemctl stop santas-api

# Restore database
gunzip /opt/santas-backups/santas_gifts_20231201_020000.sql.gz
psql -U santas_api -h localhost santas_gifts < /opt/santas-backups/santas_gifts_20231201_020000.sql

# Clear Redis cache
redis-cli FLUSHALL

# Restart application
sudo systemctl start santas-api
```

## Deployment Checklist

- [ ] System prerequisites installed
- [ ] Application user created
- [ ] Repository cloned and configured
- [ ] Python environment set up
- [ ] Database created and configured
- [ ] Redis installed and secured
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Nginx configured and tested
- [ ] Application deployed with systemd
- [ ] Monitoring and logging configured
- [ ] Security hardening applied
- [ ] Backup procedures tested
- [ ] Performance benchmarks completed

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues and solutions.

## Support

For deployment support:
- Email: devops@santas-gift-finder.com
- Documentation: https://docs.santas-gift-finder.com/deployment