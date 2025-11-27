"""
Caching implementation for Santa's AI Gift Finder backend.
Provides Redis-based caching for search results, NLP processing, and asset metadata.
"""

import json
import hashlib
import time
from typing import Any, Optional, Dict, List
from functools import wraps
import redis
import os
from monitoring import monitoring

class CacheService:
    """Redis-based caching service with TTL and invalidation strategies"""

    def __init__(self):
        self.redis_client = None
        self.default_ttl = 3600  # 1 hour default TTL

        # Initialize Redis connection
        try:
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                db=int(os.getenv('REDIS_CACHE_DB', 2)),  # Separate DB for cache
                decode_responses=True
            )
            self.redis_client.ping()
            print("Cache service: Redis connection established")
        except redis.ConnectionError:
            print("Cache service: Redis not available, using fallback mode")
            self.redis_client = None

    def _generate_key(self, prefix: str, data: Any) -> str:
        """Generate a consistent cache key from data"""
        if isinstance(data, dict):
            # Sort keys for consistent hashing
            data_str = json.dumps(data, sort_keys=True)
        elif isinstance(data, (list, tuple)):
            data_str = json.dumps(data, sort_keys=True)
        else:
            data_str = str(data)

        # Create hash of the data
        data_hash = hashlib.md5(data_str.encode()).hexdigest()
        return f"{prefix}:{data_hash}"

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.redis_client:
            return None

        try:
            value = self.redis_client.get(key)
            if value:
                monitoring.log_cache_hit(key)
                return json.loads(value)
            else:
                monitoring.log_cache_miss(key)
                return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """Set value in cache with TTL"""
        if not self.redis_client:
            return False

        try:
            ttl = ttl or self.default_ttl
            serialized_value = json.dumps(value)
            return self.redis_client.setex(key, ttl, serialized_value)
        except Exception as e:
            print(f"Cache set error: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.redis_client:
            return False

        try:
            return bool(self.redis_client.delete(key))
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False

    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching a pattern"""
        if not self.redis_client:
            return 0

        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            print(f"Cache invalidate pattern error: {e}")
            return 0

    def get_or_set(self, key: str, func, ttl: int = None, *args, **kwargs):
        """Get from cache or compute and cache result"""
        cached_value = self.get(key)
        if cached_value is not None:
            return cached_value

        # Compute the value
        result = func(*args, **kwargs)

        # Cache the result
        self.set(key, result, ttl)

        return result

    # Specific caching methods for different data types

    def get_search_results(self, query: str, filters: Dict[str, Any]) -> Optional[Dict]:
        """Get cached search results"""
        key = self._generate_key("search", {"query": query, "filters": filters})
        return self.get(key)

    def set_search_results(self, query: str, filters: Dict[str, Any], results: Dict, ttl: int = 1800) -> bool:
        """Cache search results (30 minutes TTL)"""
        key = self._generate_key("search", {"query": query, "filters": filters})
        return self.set(key, results, ttl)

    def get_nlp_processing(self, query: str) -> Optional[Dict]:
        """Get cached NLP processing results"""
        key = self._generate_key("nlp", query)
        return self.get(key)

    def set_nlp_processing(self, query: str, results: Dict, ttl: int = 3600) -> bool:
        """Cache NLP processing results (1 hour TTL)"""
        key = self._generate_key("nlp", query)
        return self.set(key, results, ttl)

    def get_asset_metadata(self, asset_type: str, filename: str) -> Optional[Dict]:
        """Get cached asset metadata"""
        key = f"asset:{asset_type}:{filename}"
        return self.get(key)

    def set_asset_metadata(self, asset_type: str, filename: str, metadata: Dict, ttl: int = 86400) -> bool:
        """Cache asset metadata (24 hours TTL)"""
        key = f"asset:{asset_type}:{filename}"
        return self.set(key, metadata, ttl)

    def get_categories(self) -> Optional[List[Dict]]:
        """Get cached categories"""
        return self.get("categories:list")

    def set_categories(self, categories: List[Dict], ttl: int = 3600) -> bool:
        """Cache categories list (1 hour TTL)"""
        return self.set("categories:list", categories, ttl)

    def invalidate_search_cache(self) -> int:
        """Invalidate all search-related cache"""
        return self.invalidate_pattern("search:*")

    def invalidate_nlp_cache(self) -> int:
        """Invalidate all NLP processing cache"""
        return self.invalidate_pattern("nlp:*")

    def invalidate_asset_cache(self, asset_type: str = None) -> int:
        """Invalidate asset cache, optionally for specific type"""
        if asset_type:
            return self.invalidate_pattern(f"asset:{asset_type}:*")
        else:
            return self.invalidate_pattern("asset:*")

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        if not self.redis_client:
            return {"status": "redis_unavailable"}

        try:
            info = self.redis_client.info()
            keys = self.redis_client.keys("*")
            return {
                "total_keys": len(keys) if keys else 0,
                "memory_used": info.get('used_memory_human', 'unknown'),
                "connected_clients": info.get('connected_clients', 0),
                "uptime_days": info.get('uptime_in_days', 0),
                "hit_rate": monitoring.metrics['cache']['hits'] / max(monitoring.metrics['cache']['hits'] + monitoring.metrics['cache']['misses'], 1)
            }
        except Exception as e:
            return {"error": str(e)}

    def warmup_popular_searches(self):
        """Warm up cache with popular search queries"""
        popular_queries = [
            "birthday gift for 10 year old boy",
            "christmas gift for wife",
            "anniversary present",
            "baby shower gift",
            "graduation gift",
            "wedding gift",
            "valentine's day gift"
        ]

        print("Warming up cache with popular searches...")
        for query in popular_queries:
            try:
                # This would trigger actual search and caching
                # For now, just log the intent
                print(f"Would cache popular query: {query}")
            except Exception as e:
                print(f"Error warming up {query}: {e}")

# Global cache instance
cache = CacheService()

def cached_search(ttl: int = 1800):
    """Decorator for caching search results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract query and filters from request
            from flask import request
            data = request.get_json() or {}
            query = data.get('query', '')
            filters = data.get('filters', {})

            # Try to get from cache first
            cached_result = cache.get_search_results(query, filters)
            if cached_result:
                return cached_result

            # Execute the function
            result = func(*args, **kwargs)

            # Cache the result
            cache.set_search_results(query, filters, result, ttl)

            return result
        return wrapper
    return decorator

def cached_nlp(ttl: int = 3600):
    """Decorator for caching NLP processing results"""
    def decorator(func):
        @wraps(func)
        def wrapper(query, *args, **kwargs):
            # Try to get from cache first
            cached_result = cache.get_nlp_processing(query)
            if cached_result:
                return cached_result

            # Execute the function
            result = func(query, *args, **kwargs)

            # Cache the result
            cache.set_nlp_processing(query, result, ttl)

            return result
        return wrapper
    return decorator

def cached_categories(ttl: int = 3600):
    """Decorator for caching categories"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Try to get from cache first
            cached_result = cache.get_categories()
            if cached_result:
                return cached_result

            # Execute the function
            result = func(*args, **kwargs)

            # Cache the result
            cache.set_categories(result, ttl)

            return result
        return wrapper
    return decorator