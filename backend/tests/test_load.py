"""
Load testing for API endpoints
"""

import unittest
import concurrent.futures
import time
import statistics
import sys
import os
import json

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import app


class LoadTestResult:
    """Container for load test results"""

    def __init__(self):
        self.response_times = []
        self.status_codes = []
        self.errors = []
        self.total_requests = 0
        self.successful_requests = 0

    def add_result(self, response_time, status_code, error=None):
        self.total_requests += 1
        self.response_times.append(response_time)
        self.status_codes.append(status_code)

        if error:
            self.errors.append(error)
        elif 200 <= status_code < 300:
            self.successful_requests += 1

    def get_summary(self):
        if not self.response_times:
            return {"error": "No requests completed"}

        return {
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "success_rate": self.successful_requests / self.total_requests,
            "avg_response_time": statistics.mean(self.response_times),
            "median_response_time": statistics.median(self.response_times),
            "min_response_time": min(self.response_times),
            "max_response_time": max(self.response_times),
            "95th_percentile": statistics.quantiles(self.response_times, n=20)[18],  # 95th percentile
            "error_count": len(self.errors),
            "status_code_distribution": self._get_status_distribution()
        }

    def _get_status_distribution(self):
        from collections import Counter
        return dict(Counter(self.status_codes))


class LoadTester:
    """Load testing utility"""

    def __init__(self, app):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = app.test_client()

    def _make_request(self, endpoint, method='GET', data=None, headers=None):
        """Make a single request and measure response time"""
        start_time = time.time()

        try:
            if method == 'GET':
                response = self.client.get(endpoint, headers=headers)
            elif method == 'POST':
                response = self.client.post(endpoint,
                    json=data,
                    headers=headers or {'Content-Type': 'application/json'})
            else:
                raise ValueError(f"Unsupported method: {method}")

            response_time = time.time() - start_time
            return response_time, response.status_code, None

        except Exception as e:
            response_time = time.time() - start_time
            return response_time, 0, str(e)

    def run_load_test(self, endpoint, method='GET', data=None, headers=None,
                     num_requests=100, concurrent_users=10):
        """Run load test with specified parameters"""

        results = LoadTestResult()

        # Create thread pool for concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            # Submit all requests
            futures = [
                executor.submit(self._make_request, endpoint, method, data, headers)
                for _ in range(num_requests)
            ]

            # Collect results
            for future in concurrent.futures.as_completed(futures):
                response_time, status_code, error = future.result()
                results.add_result(response_time, status_code, error)

        return results


class TestLoadTesting(unittest.TestCase):
    """Load testing test cases"""

    def setUp(self):
        """Set up load tester"""
        self.load_tester = LoadTester(app)

        # Seed database for testing
        with app.app_context():
            from app import db
            db.create_all()

    def test_health_endpoint_load(self):
        """Load test health endpoint"""
        results = self.load_tester.run_load_test('/api/health',
            num_requests=50, concurrent_users=5)

        summary = results.get_summary()

        print(f"\nHealth Endpoint Load Test Results:")
        print(f"Total Requests: {summary['total_requests']}")
        print(f"Success Rate: {summary['success_rate']:.2%}")
        print(f"Average Response Time: {summary['avg_response_time']:.3f}s")
        print(f"95th Percentile: {summary['95th_percentile']:.3f}s")

        # Assertions
        self.assertGreater(summary['success_rate'], 0.95)  # At least 95% success
        self.assertLess(summary['avg_response_time'], 1.0)  # Under 1 second average
        self.assertLess(summary['95th_percentile'], 2.0)  # Under 2 seconds 95th percentile

    def test_categories_endpoint_load(self):
        """Load test categories endpoint"""
        results = self.load_tester.run_load_test('/api/categories',
            num_requests=30, concurrent_users=3)

        summary = results.get_summary()

        print(f"\nCategories Endpoint Load Test Results:")
        print(f"Success Rate: {summary['success_rate']:.2%}")
        print(f"Average Response Time: {summary['avg_response_time']:.3f}s")

        self.assertGreater(summary['success_rate'], 0.95)
        self.assertLess(summary['avg_response_time'], 0.5)

    def test_filters_endpoint_load(self):
        """Load test filters endpoint"""
        results = self.load_tester.run_load_test('/api/filters',
            num_requests=30, concurrent_users=3)

        summary = results.get_summary()

        print(f"\nFilters Endpoint Load Test Results:")
        print(f"Success Rate: {summary['success_rate']:.2%}")
        print(f"Average Response Time: {summary['avg_response_time']:.3f}s")

        self.assertGreater(summary['success_rate'], 0.95)
        self.assertLess(summary['avg_response_time'], 0.5)

    def test_concurrent_user_simulation(self):
        """Simulate multiple concurrent users"""
        # Test with higher concurrency
        results = self.load_tester.run_load_test('/api/health',
            num_requests=100, concurrent_users=20)

        summary = results.get_summary()

        print(f"\nConcurrent User Test Results (20 concurrent users):")
        print(f"Success Rate: {summary['success_rate']:.2%}")
        print(f"Average Response Time: {summary['avg_response_time']:.3f}s")
        print(f"Max Response Time: {summary['max_response_time']:.3f}s")

        # With high concurrency, we expect some degradation but still good performance
        self.assertGreater(summary['success_rate'], 0.90)
        self.assertLess(summary['avg_response_time'], 2.0)

    def test_memory_usage_under_load(self):
        """Test memory usage during load"""
        import psutil
        import os

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        # Run load test
        results = self.load_tester.run_load_test('/api/health',
            num_requests=200, concurrent_users=10)

        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory

        print(f"\nMemory Usage Test:")
        print(f"Initial Memory: {initial_memory:.1f} MB")
        print(f"Final Memory: {final_memory:.1f} MB")
        print(f"Memory Increase: {memory_increase:.1f} MB")

        # Memory increase should be reasonable (less than 50MB for this test)
        self.assertLess(memory_increase, 50.0)

    def test_rate_limiting_under_load(self):
        """Test rate limiting behavior under load"""
        # Test auth endpoint which has rate limiting
        results = self.load_tester.run_load_test('/api/auth/register',
            method='POST',
            data={
                'username': 'testuser',
                'email': 'test@example.com',
                'password': 'testpass123'
            },
            num_requests=50, concurrent_users=5)

        summary = results.get_summary()

        print(f"\nRate Limiting Test Results:")
        print(f"Status Code Distribution: {summary['status_code_distribution']}")

        # Should see some 429 (Too Many Requests) status codes due to rate limiting
        status_counts = summary['status_code_distribution']
        rate_limited_requests = status_counts.get(429, 0)

        print(f"Rate Limited Requests: {rate_limited_requests}")

        # Rate limiting should kick in
        self.assertGreater(rate_limited_requests, 0)


def run_performance_benchmark():
    """Run comprehensive performance benchmark"""
    print("Running Santa's AI Gift Finder Performance Benchmark")
    print("=" * 60)

    load_tester = LoadTester(app)

    endpoints_to_test = [
        ('/api/health', 'GET', None),
        ('/api/categories', 'GET', None),
        ('/api/filters', 'GET', None),
    ]

    for endpoint, method, data in endpoints_to_test:
        print(f"\nTesting {endpoint}...")
        results = load_tester.run_load_test(endpoint, method, data,
            num_requests=100, concurrent_users=10)

        summary = results.get_summary()

        print(f"  Requests: {summary['total_requests']}")
        print(f"  Success Rate: {summary['success_rate']:.2%}")
        print(f"  Avg Response Time: {summary['avg_response_time']:.3f}s")
        print(f"  95th Percentile: {summary['95th_percentile']:.3f}s")
        print(f"  Max Response Time: {summary['max_response_time']:.3f}s")

        # Performance criteria
        if summary['success_rate'] >= 0.95 and summary['avg_response_time'] <= 1.0:
            print("  ✅ PASSED")
        else:
            print("  ❌ FAILED")

    print("\nBenchmark completed!")


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'benchmark':
        run_performance_benchmark()
    else:
        unittest.main()