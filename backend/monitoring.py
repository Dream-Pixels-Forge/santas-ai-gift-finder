"""
Monitoring utilities for Santa's AI Gift Finder backend.
Provides comprehensive logging, metrics collection, and health monitoring.
"""

import time
import logging
import psutil
import os
from functools import wraps
from flask import request, g
from datetime import datetime
import uuid
import redis
from collections import defaultdict, deque
import threading
from typing import Dict, List, Any, Optional

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('logs/app.log', mode='a')
    ]
)

logger = logging.getLogger(__name__)

class MonitoringService:
    """Central monitoring service for the application"""

    def __init__(self):
        self.redis_client = None
        self.metrics = defaultdict(lambda: defaultdict(float))
        self.request_times = deque(maxlen=1000)  # Keep last 1000 request times
        self.error_counts = defaultdict(int)
        self.cache_hits = 0
        self.cache_misses = 0
        self.rate_limit_hits = defaultdict(int)

        # Initialize Redis for metrics storage
        try:
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                db=int(os.getenv('REDIS_DB', 0)),
                decode_responses=True
            )
            self.redis_client.ping()  # Test connection
            logger.info("Redis connection established for monitoring")
        except redis.ConnectionError:
            logger.warning("Redis not available, using in-memory metrics only")

    def get_request_id(self) -> str:
        """Generate or retrieve request ID"""
        if not hasattr(g, 'request_id'):
            g.request_id = str(uuid.uuid4())
        return g.request_id

    def log_request_start(self):
        """Log the start of a request"""
        request_id = self.get_request_id()
        g.start_time = time.time()

        logger.info(f"REQUEST_START - ID: {request_id} - {request.method} {request.path} - IP: {request.remote_addr}")

        # Store request metadata
        if self.redis_client:
            self.redis_client.hset(f"request:{request_id}", mapping={
                'method': request.method,
                'path': request.path,
                'ip': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', ''),
                'start_time': str(g.start_time),
                'status': 'in_progress'
            })

    def log_request_end(self, response_status: int, response_size: int = 0):
        """Log the end of a request with performance metrics"""
        request_id = self.get_request_id()
        duration = time.time() - getattr(g, 'start_time', time.time())

        self.request_times.append(duration)

        # Update metrics
        self.metrics['requests']['total'] += 1
        self.metrics['requests'][f'status_{response_status}'] += 1
        self.metrics['performance']['avg_response_time'] = sum(self.request_times) / len(self.request_times)

        logger.info(
            f"REQUEST_END - ID: {request_id} - {request.method} {request.path} - "
            f"Status: {response_status} - Duration: {duration:.3f}s - Size: {response_size} bytes"
        )

        # Update Redis metrics
        if self.redis_client:
            self.redis_client.hset(f"request:{request_id}", mapping={
                'duration': str(duration),
                'status': str(response_status),
                'response_size': str(response_size),
                'end_time': str(time.time())
            })

            # Update global metrics
            self.redis_client.hincrby('metrics:requests:total', 1)
            self.redis_client.hincrby(f'metrics:requests:status_{response_status}', 1)
            self.redis_client.set('metrics:performance:avg_response_time', str(self.metrics['performance']['avg_response_time']))

    def log_error(self, error_type: str, error_message: str, traceback: str = None):
        """Log application errors"""
        request_id = self.get_request_id()

        self.error_counts[error_type] += 1
        self.metrics['errors'][error_type] += 1

        logger.error(
            f"ERROR - ID: {request_id} - Type: {error_type} - Message: {error_message} - "
            f"Path: {request.path if request else 'N/A'}"
        )

        if self.redis_client:
            error_data = {
                'request_id': request_id,
                'type': error_type,
                'message': error_message,
                'path': request.path if request else 'N/A',
                'timestamp': str(time.time())
            }
            if traceback:
                error_data['traceback'] = traceback

            self.redis_client.lpush('errors', str(error_data))
            self.redis_client.hincrby(f'metrics:errors:{error_type}', 1)

    def log_cache_hit(self, key: str):
        """Log cache hit"""
        self.cache_hits += 1
        self.metrics['cache']['hits'] += 1

        if self.redis_client:
            self.redis_client.hincrby('metrics:cache:hits', 1)

    def log_cache_miss(self, key: str):
        """Log cache miss"""
        self.cache_misses += 1
        self.metrics['cache']['misses'] += 1

        if self.redis_client:
            self.redis_client.hincrby('metrics:cache:misses', 1)

    def log_rate_limit_hit(self, identifier: str, limit_type: str):
        """Log rate limit violation"""
        self.rate_limit_hits[limit_type] += 1
        self.metrics['rate_limits'][limit_type] += 1

        logger.warning(f"RATE_LIMIT - Identifier: {identifier} - Type: {limit_type}")

        if self.redis_client:
            self.redis_client.hincrby(f'metrics:rate_limits:{limit_type}', 1)

    def get_system_metrics(self) -> Dict[str, Any]:
        """Get current system resource metrics"""
        try:
            return {
                'cpu_percent': psutil.cpu_percent(interval=1),
                'memory_percent': psutil.virtual_memory().percent,
                'memory_used_mb': psutil.virtual_memory().used / 1024 / 1024,
                'memory_available_mb': psutil.virtual_memory().available / 1024 / 1024,
                'disk_usage_percent': psutil.disk_usage('/').percent,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {e}")
            return {}

    def get_health_status(self) -> Dict[str, Any]:
        """Comprehensive health check"""
        health_data = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'services': {},
            'metrics': dict(self.metrics),
            'system': self.get_system_metrics()
        }

        # Check database connectivity
        try:
            from models import db
            db.engine.execute('SELECT 1')
            health_data['services']['database'] = 'healthy'
        except Exception as e:
            health_data['services']['database'] = 'unhealthy'
            health_data['status'] = 'degraded'
            logger.error(f"Database health check failed: {e}")

        # Check Redis connectivity
        if self.redis_client:
            try:
                self.redis_client.ping()
                health_data['services']['redis'] = 'healthy'
            except Exception as e:
                health_data['services']['redis'] = 'unhealthy'
                logger.error(f"Redis health check failed: {e}")
        else:
            health_data['services']['redis'] = 'not_configured'

        # Check NLP service
        try:
            from nlp_processor import process_query
            test_result = process_query("test query")
            health_data['services']['nlp'] = 'healthy' if test_result else 'degraded'
        except Exception as e:
            health_data['services']['nlp'] = 'unhealthy'
            health_data['status'] = 'degraded'
            logger.error(f"NLP health check failed: {e}")

        # Performance metrics
        if self.request_times:
            health_data['performance'] = {
                'avg_response_time': sum(self.request_times) / len(self.request_times),
                'total_requests': len(self.request_times),
                'error_rate': sum(self.error_counts.values()) / max(len(self.request_times), 1),
                'cache_hit_rate': self.cache_hits / max(self.cache_hits + self.cache_misses, 1)
            }

        return health_data

    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get comprehensive metrics summary"""
        return {
            'requests': dict(self.metrics['requests']),
            'errors': dict(self.error_counts),
            'performance': dict(self.metrics['performance']),
            'cache': {
                'hits': self.cache_hits,
                'misses': self.cache_misses,
                'hit_rate': self.cache_hits / max(self.cache_hits + self.cache_misses, 1)
            },
            'rate_limits': dict(self.rate_limit_hits),
            'system': self.get_system_metrics(),
            'timestamp': datetime.now().isoformat()
        }

# Global monitoring instance
monitoring = MonitoringService()

def monitor_request(f):
    """Decorator to monitor Flask requests"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        monitoring.log_request_start()
        try:
            response = f(*args, **kwargs)
            # Get response status and size
            status = getattr(response, 'status_code', 200)
            size = len(response.get_data()) if hasattr(response, 'get_data') else 0
            monitoring.log_request_end(status, size)
            return response
        except Exception as e:
            monitoring.log_error(type(e).__name__, str(e))
            monitoring.log_request_end(500)
            raise
    return decorated_function

def log_performance(operation: str):
    """Decorator to log performance of specific operations"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = f(*args, **kwargs)
                duration = time.time() - start_time
                logger.info(f"PERFORMANCE - {operation} - Duration: {duration:.3f}s")
                return result
            except Exception as e:
                duration = time.time() - start_time
                logger.error(f"PERFORMANCE_ERROR - {operation} - Duration: {duration:.3f}s - Error: {e}")
                raise
        return wrapper
    return decorator