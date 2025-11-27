"""
Unit tests for caching functionality
"""

import unittest
from unittest.mock import patch, MagicMock
import sys
import os
import json

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from cache import CacheService, cache


class TestCacheService(unittest.TestCase):
    """Test cases for cache service functionality"""

    def setUp(self):
        """Set up test fixtures"""
        self.cache_service = CacheService()
        self.test_key = "test_key"
        self.test_value = {"data": "test_value", "number": 42}
        self.test_ttl = 60

    def tearDown(self):
        """Clean up after tests"""
        # Clear any test keys
        if self.cache_service.redis_client:
            try:
                self.cache_service.redis_client.flushdb()
            except:
                pass

    def test_cache_service_initialization(self):
        """Test cache service initialization"""
        self.assertIsInstance(self.cache_service, CacheService)
        # Redis client might be None if Redis is not available
        self.assertTrue(hasattr(self.cache_service, 'redis_client'))

    def test_generate_key(self):
        """Test key generation"""
        prefix = "test"
        data = {"query": "test query", "filters": {"age": 10}}

        key = self.cache_service._generate_key(prefix, data)
        self.assertIsInstance(key, str)
        self.assertTrue(key.startswith(prefix + ":"))

        # Same data should generate same key
        key2 = self.cache_service._generate_key(prefix, data)
        self.assertEqual(key, key2)

        # Different data should generate different key
        data2 = {"query": "different query", "filters": {"age": 10}}
        key3 = self.cache_service._generate_key(prefix, data2)
        self.assertNotEqual(key, key3)

    def test_get_set_cache(self):
        """Test basic get/set cache operations"""
        # Test set
        result = self.cache_service.set(self.test_key, self.test_value, self.test_ttl)
        if self.cache_service.redis_client:
            self.assertTrue(result)
        else:
            self.assertFalse(result)

        # Test get
        retrieved = self.cache_service.get(self.test_key)
        if self.cache_service.redis_client:
            self.assertEqual(retrieved, self.test_value)
        else:
            self.assertIsNone(retrieved)

    def test_get_or_set(self):
        """Test get_or_set functionality"""
        call_count = 0

        def test_func():
            nonlocal call_count
            call_count += 1
            return {"result": "computed", "call": call_count}

        # First call should compute
        result1 = self.cache_service.get_or_set("test_func", test_func, ttl=60)
        self.assertEqual(result1["result"], "computed")
        self.assertEqual(call_count, 1)

        # Second call should use cache
        result2 = self.cache_service.get_or_set("test_func", test_func, ttl=60)
        if self.cache_service.redis_client:
            self.assertEqual(result2, result1)
            self.assertEqual(call_count, 1)  # Function should not be called again
        else:
            self.assertEqual(result2["call"], 2)  # Function called again without cache

    def test_search_results_caching(self):
        """Test search results caching methods"""
        query = "birthday gift for child"
        filters = {"age_min": 5, "age_max": 12}
        results = [{"id": 1, "name": "Test Gift", "score": 95}]

        # Test caching
        success = self.cache_service.set_search_results(query, filters, results)
        if self.cache_service.redis_client:
            self.assertTrue(success)
        else:
            self.assertFalse(success)

        # Test retrieval
        cached = self.cache_service.get_search_results(query, filters)
        if self.cache_service.redis_client:
            self.assertEqual(cached, results)
        else:
            self.assertIsNone(cached)

    def test_nlp_caching(self):
        """Test NLP processing caching"""
        query = "gift for 10 year old"
        nlp_result = {
            "age": 10,
            "interests": ["gift"],
            "relationship": None,
            "sentiment": {"compound": 0.0}
        }

        # Test caching
        success = self.cache_service.set_nlp_processing(query, nlp_result)
        if self.cache_service.redis_client:
            self.assertTrue(success)
        else:
            self.assertFalse(success)

        # Test retrieval
        cached = self.cache_service.get_nlp_processing(query)
        if self.cache_service.redis_client:
            self.assertEqual(cached, nlp_result)
        else:
            self.assertIsNone(cached)

    def test_categories_caching(self):
        """Test categories caching"""
        categories = [
            {"name": "toys", "count": 50},
            {"name": "books", "count": 30}
        ]

        # Test caching
        success = self.cache_service.set_categories(categories)
        if self.cache_service.redis_client:
            self.assertTrue(success)
        else:
            self.assertFalse(success)

        # Test retrieval
        cached = self.cache_service.get_categories()
        if self.cache_service.redis_client:
            self.assertEqual(cached, categories)
        else:
            self.assertIsNone(cached)

    def test_asset_metadata_caching(self):
        """Test asset metadata caching"""
        asset_type = "images"
        filename = "hero-bg-01.jpg"
        metadata = {
            "size": 1024000,
            "dimensions": {"width": 1920, "height": 1080},
            "format": "jpg"
        }

        # Test caching
        success = self.cache_service.set_asset_metadata(asset_type, filename, metadata)
        if self.cache_service.redis_client:
            self.assertTrue(success)
        else:
            self.assertFalse(success)

        # Test retrieval
        cached = self.cache_service.get_asset_metadata(asset_type, filename)
        if self.cache_service.redis_client:
            self.assertEqual(cached, metadata)
        else:
            self.assertIsNone(cached)

    def test_cache_invalidation(self):
        """Test cache invalidation"""
        # Set some test data
        self.cache_service.set("test:key1", "value1")
        self.cache_service.set("test:key2", "value2")
        self.cache_service.set("other:key3", "value3")

        if self.cache_service.redis_client:
            # Test pattern invalidation
            deleted = self.cache_service.invalidate_pattern("test:*")
            self.assertGreaterEqual(deleted, 2)

            # Check that keys were deleted
            self.assertIsNone(self.cache_service.get("test:key1"))
            self.assertIsNone(self.cache_service.get("test:key2"))
            self.assertIsNotNone(self.cache_service.get("other:key3"))

    def test_cache_stats(self):
        """Test cache statistics"""
        stats = self.cache_service.get_cache_stats()
        self.assertIsInstance(stats, dict)
        self.assertIn("status", stats)

        if self.cache_service.redis_client:
            self.assertEqual(stats["status"], "connected")
            self.assertIn("total_keys", stats)
        else:
            self.assertEqual(stats["status"], "redis_unavailable")

    @patch('cache.redis.Redis')
    def test_redis_connection_error(self, mock_redis):
        """Test behavior when Redis connection fails"""
        mock_redis.side_effect = Exception("Connection failed")

        cache_service = CacheService()
        self.assertIsNone(cache_service.redis_client)

        # Operations should return appropriate fallback values
        self.assertIsNone(cache_service.get("test"))
        self.assertFalse(cache_service.set("test", "value"))
        self.assertEqual(cache_service.invalidate_pattern("*"), 0)


if __name__ == '__main__':
    unittest.main()