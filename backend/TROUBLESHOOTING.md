# Santa's AI Gift Finder Backend - Troubleshooting Runbook

This runbook provides systematic troubleshooting procedures for common issues with the Santa's AI Gift Finder backend.

## Table of Contents

1. [Quick Health Checks](#quick-health-checks)
2. [Application Issues](#application-issues)
3. [Database Issues](#database-issues)
4. [Redis/Cache Issues](#rediscache-issues)
5. [Performance Issues](#performance-issues)
6. [Security Issues](#security-issues)
7. [Monitoring and Alerting](#monitoring-and-alerting)
8. [Emergency Procedures](#emergency-procedures)

## Quick Health Checks

### Overall System Health

```bash
# Check application health endpoint
curl -s http://localhost/api/health | jq .

# Check application status
sudo systemctl status santas-api

# Check application logs
sudo journalctl -u santas-api -n 50 --no-pager

# Check system resources
htop
df -h
free -h
```

### Component Health Checks

```bash
# Database connectivity
psql -U santas_api -d santas_gifts -c "SELECT 1;"

# Redis connectivity
redis-cli ping

# Check Redis memory usage
redis-cli info memory

# Check application processes
ps aux | grep gunicorn
ps aux | grep python
```

## Application Issues

### Application Won't Start

**Symptoms:**
- Service fails to start
- Port 8000 is not listening
- Gunicorn errors in logs

**Troubleshooting Steps:**

1. **Check configuration files:**
   ```bash
   # Validate Python syntax
   python -m py_compile app.py

   # Check environment variables
   source venv/bin/activate
   python -c "import os; print(os.environ.get('DATABASE_URL'))"

   # Validate requirements
   pip check
   ```

2. **Check dependencies:**
   ```bash
   # Test spaCy model loading
   python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('spaCy OK')"

   # Test NLTK data
   python -c "import nltk; nltk.data.find('vader_lexicon'); print('NLTK OK')"
   ```

3. **Check file permissions:**
   ```bash
   ls -la /opt/santas-gift-finder/backend/
   sudo -u santas-api test -w /opt/santas-gift-finder/backend/logs/
   ```

4. **Check systemd service:**
   ```bash
   sudo systemctl status santas-api
   sudo journalctl -u santas-api --no-pager | tail -20
   ```

**Resolution:**
```bash
# Restart service
sudo systemctl restart santas-api

# Check logs after restart
sudo journalctl -u santas-api -f
```

### High Memory Usage

**Symptoms:**
- Application consuming excessive RAM
- Out of memory errors
- System slowdown

**Troubleshooting Steps:**

1. **Check memory usage:**
   ```bash
   # Check process memory
   ps aux --sort=-%mem | head -10

   # Check Python memory usage
   python -c "
   import psutil
   import os
   process = psutil.Process(os.getpid())
   print(f'Memory usage: {process.memory_info().rss / 1024 / 1024:.1f} MB')
   "
   ```

2. **Check for memory leaks:**
   ```bash
   # Monitor memory growth
   watch -n 5 'ps aux | grep gunicorn'
   ```

3. **Check cache memory usage:**
   ```bash
   redis-cli info memory
   redis-cli dbsize
   ```

**Resolution:**
```bash
# Clear Redis cache
redis-cli FLUSHDB

# Restart application
sudo systemctl restart santas-api

# Adjust Gunicorn workers
# Edit gunicorn.conf.py and reduce workers
sudo systemctl reload santas-api
```

### Slow Response Times

**Symptoms:**
- API responses taking >2 seconds
- Timeout errors
- User complaints about performance

**Troubleshooting Steps:**

1. **Check system resources:**
   ```bash
   # CPU usage
   top -b -n1 | head -20

   # Disk I/O
   iostat -x 1 5

   # Network
   nload
   ```

2. **Check database performance:**
   ```bash
   # Slow queries
   psql -U santas_api -d santas_gifts -c "
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query
   FROM pg_stat_activity
   WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '1 second'
   ORDER BY duration DESC;
   "

   # Database connections
   psql -U santas_api -d santas_gifts -c "
   SELECT count(*) as connections FROM pg_stat_activity;
   "
   ```

3. **Check cache hit rates:**
   ```bash
   curl -s http://localhost/api/metrics | jq '.cache'
   ```

4. **Profile application performance:**
   ```bash
   # Use py-spy for profiling
   pip install py-spy
   py-spy top --pid $(pgrep -f gunicorn)
   ```

**Resolution:**
```bash
# Optimize database queries
# Add missing indexes
psql -U santas_api -d santas_gifts -c "
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gift_search
ON gift USING gin(to_tsvector('english', name || ' ' || description));
"

# Clear and warm cache
redis-cli FLUSHDB
# Run cache warming script

# Scale up resources
# Increase Gunicorn workers in gunicorn.conf.py
sudo systemctl reload santas-api
```

## Database Issues

### Database Connection Errors

**Symptoms:**
- "Connection refused" errors
- Database connection pool exhausted
- Application unable to connect to PostgreSQL

**Troubleshooting Steps:**

1. **Check database service:**
   ```bash
   sudo systemctl status postgresql
   sudo journalctl -u postgresql --no-pager | tail -20
   ```

2. **Check connection limits:**
   ```bash
   psql -U postgres -c "SHOW max_connections;"
   psql -U santas_api -d santas_gifts -c "
   SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';
   "
   ```

3. **Check database credentials:**
   ```bash
   # Test connection
   psql -U santas_api -d santas_gifts -c "SELECT version();"
   ```

4. **Check network connectivity:**
   ```bash
   telnet localhost 5432
   nc -zv localhost 5432
   ```

**Resolution:**
```bash
# Restart database
sudo systemctl restart postgresql

# Check disk space
df -h /var/lib/postgresql

# Increase connection limits if needed
# Edit postgresql.conf
sudo nano /etc/postgresql/12/main/postgresql.conf
# max_connections = 200

sudo systemctl restart postgresql
```

### Database Performance Issues

**Symptoms:**
- Slow query execution
- Database CPU usage high
- Lock contention

**Troubleshooting Steps:**

1. **Identify slow queries:**
   ```sql
   SELECT
       pid,
       now() - pg_stat_activity.query_start AS duration,
       query,
       state
   FROM pg_stat_activity
   WHERE state != 'idle'
   ORDER BY duration DESC
   LIMIT 10;
   ```

2. **Check table statistics:**
   ```sql
   ANALYZE VERBOSE gift;
   SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup
   FROM pg_stat_user_tables
   WHERE schemaname = 'public';
   ```

3. **Check index usage:**
   ```sql
   SELECT
       schemaname, tablename, indexname,
       idx_scan, idx_tup_read, idx_tup_fetch
   FROM pg_stat_user_indexes
   ORDER BY idx_scan DESC;
   ```

**Resolution:**
```sql
-- Update table statistics
ANALYZE gift;

-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_gift_category_age ON gift(category, age_min, age_max);
CREATE INDEX CONCURRENTLY idx_gift_name_trgm ON gift USING gin(name gin_trgm_ops);

-- Vacuum and reindex
VACUUM ANALYZE gift;
REINDEX TABLE gift;
```

## Redis/Cache Issues

### Redis Connection Errors

**Symptoms:**
- Cache operations failing
- Redis connection refused
- Application falling back to database queries

**Troubleshooting Steps:**

1. **Check Redis service:**
   ```bash
   sudo systemctl status redis-server
   redis-cli ping
   ```

2. **Check Redis configuration:**
   ```bash
   redis-cli info server
   redis-cli config get maxmemory
   redis-cli config get maxmemory-policy
   ```

3. **Check Redis memory usage:**
   ```bash
   redis-cli info memory
   redis-cli dbsize
   ```

4. **Check application Redis configuration:**
   ```bash
   # Test Redis connection from Python
   python -c "
   import redis
   r = redis.Redis(host='localhost', port=6379, decode_responses=True)
   print('Redis ping:', r.ping())
   "
   ```

**Resolution:**
```bash
# Restart Redis
sudo systemctl restart redis-server

# Clear Redis if memory issues
redis-cli FLUSHALL

# Adjust Redis memory limits
sudo nano /etc/redis/redis.conf
# maxmemory 512mb
# maxmemory-policy allkeys-lru

sudo systemctl restart redis-server
```

### Cache Invalidation Issues

**Symptoms:**
- Stale data being served
- Cache not updating after data changes
- Inconsistent results

**Troubleshooting Steps:**

1. **Check cache keys:**
   ```bash
   redis-cli keys "*"
   redis-cli keys "search:*"
   redis-cli keys "nlp:*"
   ```

2. **Check cache TTL:**
   ```bash
   redis-cli ttl "search:some_key"
   ```

3. **Monitor cache hit/miss rates:**
   ```bash
   curl -s http://localhost/api/metrics | jq '.cache'
   ```

**Resolution:**
```bash
# Clear specific cache patterns
redis-cli keys "search:*" | xargs redis-cli del
redis-cli keys "nlp:*" | xargs redis-cli del

# Clear all cache
redis-cli FLUSHDB

# Restart application to reload cache warming
sudo systemctl restart santas-api
```

## Performance Issues

### High CPU Usage

**Symptoms:**
- CPU usage >80%
- Slow response times
- System becoming unresponsive

**Troubleshooting Steps:**

1. **Identify CPU-intensive processes:**
   ```bash
   top -b -n1 | head -20
   ps aux --sort=-%cpu | head -10
   ```

2. **Profile Python code:**
   ```bash
   # Install profiling tools
   pip install py-spy

   # Profile running process
   py-spy top --pid $(pgrep -f gunicorn)
   ```

3. **Check for infinite loops or recursive calls:**
   ```bash
   # Check application logs for errors
   sudo journalctl -u santas-api --no-pager | grep -i error | tail -10
   ```

**Resolution:**
```bash
# Reduce Gunicorn workers
# Edit gunicorn.conf.py
workers = 2  # Reduce from 4

sudo systemctl reload santas-api

# Check for and fix code issues
# Look for inefficient algorithms in NLP processing
# Optimize database queries
```

### Memory Leaks

**Symptoms:**
- Gradual increase in memory usage
- Application restarts due to OOM
- System memory exhaustion

**Troubleshooting Steps:**

1. **Monitor memory usage over time:**
   ```bash
   # Install monitoring tools
   sudo apt install sysstat

   # Monitor memory
   sar -r 1 10
   ```

2. **Check for memory leaks in Python:**
   ```bash
   # Use memory profiler
   pip install memory-profiler

   # Profile memory usage
   python -m memory_profiler app.py
   ```

3. **Check cache memory growth:**
   ```bash
   # Monitor Redis memory
   watch -n 5 'redis-cli info memory | grep used_memory_human'
   ```

**Resolution:**
```bash
# Implement memory limits
# Edit gunicorn.conf.py
worker_class = "gthread"
threads = 2
worker_connections = 500

# Clear caches regularly
# Add cache TTL enforcement
# Implement connection pooling limits

sudo systemctl restart santas-api
```

## Security Issues

### Authentication Failures

**Symptoms:**
- Users unable to log in
- JWT token validation errors
- Authentication middleware failures

**Troubleshooting Steps:**

1. **Check JWT configuration:**
   ```bash
   # Verify JWT secret
   grep JWT_SECRET_KEY /opt/santas-gift-finder/backend/.env

   # Test JWT generation
   python -c "
   from flask_jwt_extended import create_access_token
   token = create_access_token(identity='test')
   print('JWT generation OK')
   "
   ```

2. **Check user database:**
   ```sql
   -- Check user table
   SELECT id, username, email FROM "user" LIMIT 5;

   -- Check password hashing
   SELECT username, password_hash FROM "user" WHERE username = 'testuser';
   ```

3. **Check authentication logs:**
   ```bash
   sudo journalctl -u santas-api | grep -i auth | tail -10
   ```

**Resolution:**
```bash
# Rotate JWT secret if compromised
# Update .env file
echo "JWT_SECRET_KEY=$(openssl rand -hex 32)" >> .env

# Restart application
sudo systemctl restart santas-api

# Clear user sessions
redis-cli keys "session:*" | xargs redis-cli del
```

### Rate Limiting Issues

**Symptoms:**
- Legitimate requests being blocked
- Rate limiting too aggressive
- Users complaining about 429 errors

**Troubleshooting Steps:**

1. **Check rate limit configuration:**
   ```bash
   # Check Flask-Limiter configuration in app.py
   grep -A 10 "limiter" /opt/santas-gift-finder/backend/app.py
   ```

2. **Check Redis rate limit keys:**
   ```bash
   redis-cli keys "flask_limiter:*"
   redis-cli get "flask_limiter:127.0.0.1:/api/search:1"
   ```

3. **Monitor rate limit violations:**
   ```bash
   curl -s http://localhost/api/metrics | jq '.rate_limits'
   ```

**Resolution:**
```python
# Adjust rate limits in app.py
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["500 per day", "100 per hour"],  # Increase limits
    storage_uri=os.getenv('REDIS_URL', "redis://localhost:6379/1")
)

# Clear rate limit counters
redis-cli keys "flask_limiter:*" | xargs redis-cli del
```

## Monitoring and Alerting

### Setting Up Alerts

**Application Metrics Alerts:**

```bash
# High error rate alert
curl -s http://localhost/api/metrics | jq -e '.errors | length > 10'

# High response time alert
curl -s http://localhost/api/metrics | jq -e '.performance.avg_response_time > 2.0'

# Low cache hit rate alert
curl -s http://localhost/api/metrics | jq -e '.cache.hit_rate < 0.8'
```

**System Alerts:**

```bash
# High CPU usage
cpu_usage=$(top -b -n1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
if (( $(echo "$cpu_usage > 80" | bc -l) )); then
    echo "High CPU usage: $cpu_usage%"
fi

# Low disk space
disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
if (( disk_usage > 90 )); then
    echo "Low disk space: $disk_usage%"
fi

# Database connection issues
if ! psql -U santas_api -d santas_gifts -c "SELECT 1;" &>/dev/null; then
    echo "Database connection failed"
fi
```

### Log Analysis

```bash
# Search for errors
sudo journalctl -u santas-api | grep -i error | tail -20

# Count errors by hour
sudo journalctl -u santas-api --since "1 hour ago" | grep -c "ERROR"

# Find slow requests
sudo journalctl -u santas-api | grep "response_time" | sort -k3 -n | tail -10

# Monitor rate limiting
sudo journalctl -u santas-api | grep "Rate limit" | wc -l
```

## Emergency Procedures

### Application Down

**Immediate Actions:**

1. **Check service status:**
   ```bash
   sudo systemctl status santas-api
   ```

2. **Attempt restart:**
   ```bash
   sudo systemctl restart santas-api
   ```

3. **Check logs:**
   ```bash
   sudo journalctl -u santas-api --no-pager | tail -50
   ```

4. **Fallback deployment:**
   ```bash
   # If restart fails, rollback to previous version
   cd /opt/santas-gift-finder/backend
   git checkout HEAD~1
   sudo systemctl restart santas-api
   ```

### Database Corruption

**Recovery Steps:**

1. **Stop application:**
   ```bash
   sudo systemctl stop santas-api
   ```

2. **Check database integrity:**
   ```bash
   psql -U santas_api -d santas_gifts -c "SELECT pg_isready();"
   ```

3. **Restore from backup:**
   ```bash
   # Find latest backup
   ls -la /opt/santas-backups/*.sql.gz | tail -1

   # Restore backup
   gunzip /opt/santas-backups/santas_gifts_20231201_020000.sql.gz
   psql -U santas_api -d santas_gifts < /opt/santas-backups/santas_gifts_20231201_020000.sql
   ```

4. **Restart application:**
   ```bash
   sudo systemctl start santas-api
   ```

### Complete System Failure

**Disaster Recovery:**

1. **Assess damage:**
   - Check system logs
   - Verify hardware integrity
   - Contact infrastructure provider

2. **Restore from backups:**
   - Database backups
   - Application code backups
   - Configuration backups

3. **Rebuild system:**
   - Reinstall dependencies
   - Restore configurations
   - Deploy application

4. **Test recovery:**
   - Verify application functionality
   - Run health checks
   - Load test system

## Prevention Measures

### Regular Maintenance

```bash
# Weekly tasks
# Update system packages
sudo apt update && sudo apt upgrade -y

# Vacuum database
psql -U santas_api -d santas_gifts -c "VACUUM ANALYZE;"

# Clear old logs
sudo journalctl --vacuum-time=7d

# Check disk usage
df -h
```

### Monitoring Setup

```bash
# Install monitoring stack
sudo apt install prometheus prometheus-node-exporter

# Configure alerts
# Set up Grafana dashboards
# Configure log aggregation
```

### Backup Verification

```bash
# Test backup integrity
gunzip -c /opt/santas-backups/latest.sql.gz | head -10

# Test restore procedure monthly
# Document backup test results
```

## Contact Information

**Emergency Contacts:**
- Primary: DevOps Team - devops@santas-gift-finder.com - +1-555-0123
- Secondary: Development Team - dev@santas-gift-finder.com - +1-555-0124
- Infrastructure Provider: AWS Support - 1-888-280-4331

**Escalation Path:**
1. Try troubleshooting runbook first
2. Contact DevOps team
3. Escalate to Development team
4. Contact Infrastructure provider
5. Declare incident and notify stakeholders

**Documentation Updates:**
When resolving new issues, update this runbook with the solution for future reference.