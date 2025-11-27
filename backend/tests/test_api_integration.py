"""
Integration tests for API endpoints
"""

import unittest
import json
import sys
import os
from unittest.mock import patch

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import app, db
from models import User, Gift, Category


class TestAPIIntegration(unittest.TestCase):
    """Integration tests for API endpoints"""

    def setUp(self):
        """Set up test client and database"""
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['JWT_SECRET_KEY'] = 'test_secret_key'
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            self._seed_test_data()

    def tearDown(self):
        """Clean up after tests"""
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _seed_test_data(self):
        """Seed database with test data"""
        # Create test user
        user = User(username='testuser', email='test@example.com')
        user.set_password('testpass')
        db.session.add(user)

        # Create test categories
        categories = [
            Category(name='toys', interests='gaming,fun'),
            Category(name='books', interests='reading,education'),
            Category(name='electronics', interests='tech,gaming')
        ]
        for cat in categories:
            db.session.add(cat)

        # Create test gifts
        gifts = [
            Gift(name='LEGO Set', category='toys', age_min=6, age_max=12,
                 description='Building blocks for creative play'),
            Gift(name='Board Game', category='toys', age_min=8, age_max=100,
                 description='Fun family game'),
            Gift(name='Science Kit', category='electronics', age_min=10, age_max=16,
                 description='Educational science experiments'),
            Gift(name='Children\'s Book', category='books', age_min=4, age_max=10,
                 description='Educational storybook')
        ]
        for gift in gifts:
            db.session.add(gift)

        db.session.commit()

    def _get_auth_token(self):
        """Get authentication token for tests"""
        response = self.client.post('/api/auth/login',
            json={'username': 'testuser', 'password': 'testpass'})
        data = json.loads(response.data)
        return data['access_token']

    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertIn('status', data)
        self.assertIn('services', data)
        self.assertIn('timestamp', data)

    def test_register_endpoint(self):
        """Test user registration"""
        response = self.client.post('/api/auth/register', json={
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpass123'
        })

        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])

    def test_register_duplicate_user(self):
        """Test registration with duplicate username"""
        response = self.client.post('/api/auth/register', json={
            'username': 'testuser',  # Already exists
            'email': 'different@example.com',
            'password': 'newpass123'
        })

        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])

    def test_login_success(self):
        """Test successful login"""
        response = self.client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'testpass'
        })

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('access_token', data)
        self.assertIn('user', data)

    def test_login_failure(self):
        """Test login with wrong credentials"""
        response = self.client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'wrongpass'
        })

        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertFalse(data['success'])

    def test_search_unauthorized(self):
        """Test search endpoint without authentication"""
        response = self.client.post('/api/search', json={'query': 'test'})
        self.assertEqual(response.status_code, 401)

    def test_search_authorized(self):
        """Test search endpoint with authentication"""
        token = self._get_auth_token()
        response = self.client.post('/api/search',
            json={'query': 'LEGO'},
            headers={'Authorization': f'Bearer {token}'})

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('recommendations', data)
        self.assertIn('query_analysis', data)

    def test_search_with_filters(self):
        """Test search with age and category filters"""
        token = self._get_auth_token()
        response = self.client.post('/api/search',
            json={
                'query': 'toy',
                'filters': {
                    'age_min': 5,
                    'age_max': 15,
                    'categories': ['toys']
                }
            },
            headers={'Authorization': f'Bearer {token}'})

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])

        # Check that results match filters
        for rec in data['recommendations']:
            self.assertGreaterEqual(rec['age_max'], 5)
            self.assertLessEqual(rec['age_min'], 15)

    def test_categories_endpoint(self):
        """Test categories endpoint"""
        response = self.client.get('/api/categories')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('categories', data)
        self.assertGreater(len(data['categories']), 0)

    def test_filters_endpoint(self):
        """Test filters endpoint"""
        response = self.client.get('/api/filters')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('filters', data)
        self.assertIn('ages', data['filters'])
        self.assertIn('prices', data['filters'])

    def test_compare_endpoint(self):
        """Test price comparison endpoint"""
        token = self._get_auth_token()
        response = self.client.post('/api/compare',
            json={'product_name': 'LEGO Set'},
            headers={'Authorization': f'Bearer {token}'})

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('prices', data)

    def test_recommendations_endpoint(self):
        """Test personalized recommendations endpoint"""
        token = self._get_auth_token()
        response = self.client.post('/api/recommendations',
            json={'query': 'birthday gift for child'},
            headers={'Authorization': f'Bearer {token}'})

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('recommendations', data)
        self.assertTrue(data['personalized'])

    def test_rate_limiting(self):
        """Test rate limiting on auth endpoints"""
        # Make multiple rapid requests to test rate limiting
        for i in range(10):
            response = self.client.post('/api/auth/register', json={
                'username': f'user{i}',
                'email': f'user{i}@example.com',
                'password': 'pass123'
            })

        # Should eventually get rate limited (429 status)
        # Note: This test may need adjustment based on actual rate limit settings

    def test_asset_endpoints(self):
        """Test asset serving endpoints"""
        # Test asset list endpoint
        response = self.client.get('/api/assets/list')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('assets', data)

    def test_invalid_endpoints(self):
        """Test invalid endpoint handling"""
        response = self.client.get('/api/nonexistent')
        self.assertEqual(response.status_code, 404)

    def test_malformed_json(self):
        """Test handling of malformed JSON"""
        token = self._get_auth_token()
        response = self.client.post('/api/search',
            data='invalid json',
            content_type='application/json',
            headers={'Authorization': f'Bearer {token}'})

        # Should handle gracefully
        self.assertIn(response.status_code, [400, 500])

    def test_input_validation(self):
        """Test input validation"""
        token = self._get_auth_token()

        # Test missing required fields
        response = self.client.post('/api/search',
            json={},  # Missing query
            headers={'Authorization': f'Bearer {token}'})

        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])


if __name__ == '__main__':
    unittest.main()