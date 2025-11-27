from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from models import db, Gift, Category, User
from nlp_processor import process_query
from price_comparison import compare_prices
from monitoring import monitoring, monitor_request, log_performance
from cache import cache, cached_search, cached_nlp, cached_categories
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from werkzeug.exceptions import BadRequest
from email_validator import validate_email, EmailNotValidError
import os
import re
import mimetypes
from functools import wraps
from difflib import SequenceMatcher
from collections import defaultdict
import random
from datetime import datetime

load_dotenv()

app = Flask(__name__)
# Configure restrictive CORS - only allow specific origins
CORS(app, origins=["http://localhost:3000", "https://your-frontend-domain.com"])
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///instance/gifts.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY')

# Database connection pooling for better performance
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,  # Recycle connections every 5 minutes
    'pool_size': 10,
    'max_overflow': 20
}

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=os.getenv('REDIS_URL', "redis://localhost:6379/1")
)

# Create logs directory
os.makedirs('backend/logs', exist_ok=True)

def validate_input(data, required_fields):
    """Validate input data and sanitize"""
    if not data:
        raise BadRequest('No data provided')

    for field in required_fields:
        if field not in data or not data[field].strip():
            raise BadRequest(f'{field} is required')

    # Sanitize strings
    for key, value in data.items():
        if isinstance(value, str):
            # Remove potentially dangerous characters
            data[key] = re.sub(r'[<>]', '', value.strip())

    return data

@app.route('/')
def home():
    return jsonify({
        'message': 'Santa\'s AI Gift Finder API is running! 🎅',
        'version': '1.0.0',
        'endpoints': {
            'register': '/api/auth/register (POST)',
            'login': '/api/auth/login (POST)',
            'search': '/api/search (POST)',
            'recommendations': '/api/recommendations (POST)',
            'compare': '/api/compare (POST)',
            'categories': '/api/categories (GET)',
            'filters': '/api/filters (GET)',
            'assets_images': '/api/assets/images/<filename> (GET)',
            'assets_3d': '/api/assets/3d/<filename> (GET)',
            'assets_list': '/api/assets/list (GET)',
            'health': '/api/health (GET)'
        }
    })

@app.route('/api/auth/register', methods=['POST'])
@monitor_request
@limiter.limit("5 per minute")
def register():
    try:
        data = request.json
        data = validate_input(data, ['username', 'email', 'password'])

        # Validate email format
        try:
            validate_email(data['email'])
        except EmailNotValidError:
            raise BadRequest('Invalid email format')

        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            raise BadRequest('Username already exists')
        if User.query.filter_by(email=data['email']).first():
            raise BadRequest('Email already exists')

        # Validate password strength
        if len(data['password']) < 8:
            raise BadRequest('Password must be at least 8 characters long')

        # Create user
        user = User(username=data['username'], email=data['email'])
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()

        return jsonify({'message': 'User registered successfully', 'success': True}), 201
    except BadRequest as e:
        return jsonify({'error': str(e), 'success': False}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Registration failed', 'success': False}), 500

@app.route('/api/auth/login', methods=['POST'])
@monitor_request
@limiter.limit("10 per minute")
def login():
    try:
        data = request.json
        data = validate_input(data, ['username', 'password'])

        user = User.query.filter_by(username=data['username']).first()
        if not user or not user.check_password(data['password']):
            raise BadRequest('Invalid username or password')

        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'access_token': access_token,
            'user': {'id': user.id, 'username': user.username, 'email': user.email},
            'success': True
        })
    except BadRequest as e:
        return jsonify({'error': str(e), 'success': False}), 401
    except Exception as e:
        return jsonify({'error': 'Login failed', 'success': False}), 500

@app.route('/api/health')
@monitor_request
def health_check():
    """Comprehensive health check endpoint"""
    health_data = monitoring.get_health_status()
    return jsonify(health_data)

@app.route('/api/metrics')
@monitor_request
def metrics():
    """Get application metrics"""
    return jsonify(monitoring.get_metrics_summary())

@app.route('/api/search', methods=['POST'])
@jwt_required()
@monitor_request
@limiter.limit("30 per minute")
@log_performance("search")
@cached_search(ttl=1800)  # 30 minutes cache
def search():
    try:
        data = request.json
        data = validate_input(data, ['query'])

        # Extract optional filters
        filters = data.get('filters', {})
        age_min = filters.get('age_min')
        age_max = filters.get('age_max')
        price_min = filters.get('price_min')
        price_max = filters.get('price_max')
        categories = filters.get('categories', [])
        limit = min(data.get('limit', 10), 50)  # Max 50 results

        processed = process_query(data['query'])

        # Build optimized database query with advanced filtering
        query = Gift.query

        # Apply category filtering
        if categories:
            query = query.filter(Gift.category.in_(categories))

        # Apply age filtering with optimized conditions
        if age_min is not None:
            query = query.filter(Gift.age_max >= age_min)
        if age_max is not None:
            query = query.filter(Gift.age_min <= age_max)

        # Apply text search if query contains specific terms
        if len(data['query'].strip()) > 2:
            search_term = f"%{data['query']}%"
            query = query.filter(
                db.or_(
                    Gift.name.ilike(search_term),
                    Gift.description.ilike(search_term),
                    Gift.category.ilike(search_term)
                )
            )

        # Limit database results for better performance (get more than needed for scoring)
        db_limit = min(limit * 3, 100)  # Get up to 3x the requested results, max 100
        all_gifts = query.limit(db_limit).all()

        # Score and rank results
        scored_gifts = []
        query_lower = data['query'].lower()
        interests = processed.get('interests', [])
        entities = processed.get('entities', [])

        for gift in all_gifts:
            score = 0

            # Exact name match gets highest score
            if query_lower in gift.name.lower():
                score += 100

            # Category match
            for interest in interests:
                if interest.lower() in gift.category.lower():
                    score += 50
                    break

            # Fuzzy name matching using SequenceMatcher
            name_similarity = SequenceMatcher(None, query_lower, gift.name.lower()).ratio()
            score += name_similarity * 30

            # Description matching
            if gift.description:
                desc_similarity = SequenceMatcher(None, query_lower, gift.description.lower()).ratio()
                score += desc_similarity * 20

            # Age relevance
            if processed.get('age'):
                user_age = processed['age']
                if gift.age_min <= user_age <= gift.age_max:
                    score += 25
                elif abs(user_age - gift.age_min) <= 2 or abs(user_age - gift.age_max) <= 2:
                    score += 10

            # Relationship-based scoring
            relationship = processed.get('relationship')
            if relationship:
                # Gifts for specific relationships might have higher relevance
                if relationship in ['niece', 'nephew'] and gift.age_min <= 12:
                    score += 15
                elif relationship in ['wife', 'husband'] and gift.age_min >= 18:
                    score += 15

            scored_gifts.append((gift, score))

        # Sort by score descending
        scored_gifts.sort(key=lambda x: x[1], reverse=True)

        # Apply price filtering (mock prices for now)
        filtered_gifts = []
        for gift, score in scored_gifts:
            # Mock price - in real implementation, this would come from price_comparison
            mock_price = 19.99 + (gift.id % 10) * 5  # Simple mock pricing

            if price_min is not None and mock_price < price_min:
                continue
            if price_max is not None and mock_price > price_max:
                continue

            filtered_gifts.append({
                'id': gift.id,
                'name': gift.name,
                'description': gift.description,
                'category': gift.category,
                'age_min': gift.age_min,
                'age_max': gift.age_max,
                'image': gift.image or f'/api/assets/images/hero-bg-{gift.id % 13:02d}.jpg',
                'prices': [{'retailer': 'Amazon', 'price': mock_price}],
                'rating': 4.0 + (gift.id % 10) * 0.1,  # Mock rating
                'relevance_score': round(score, 2)
            })

        # Limit results
        recommendations = filtered_gifts[:limit]

        # If no database results, fall back to processed recommendations
        if not recommendations:
            recommendations = processed.get('recommendations', [])

        return jsonify({
            'query_analysis': processed,
            'recommendations': recommendations,
            'total_results': len(filtered_gifts),
            'filters_applied': {
                'age_range': {'min': age_min, 'max': age_max},
                'price_range': {'min': price_min, 'max': price_max},
                'categories': categories
            },
            'success': True
        })
    except BadRequest as e:
        return jsonify({'error': str(e), 'success': False}), 400
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/compare', methods=['POST'])
@jwt_required()
@monitor_request
@limiter.limit("20 per minute")
def compare():
    try:
        data = request.json
        data = validate_input(data, ['product_name'])

        # prices = compare_prices(data['product_name'])
        prices = [{'retailer': 'Amazon', 'price': 29.99}]  # Mock
        return jsonify({'prices': prices, 'success': True})
    except BadRequest as e:
        return jsonify({'error': str(e), 'success': False}), 400
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/categories', methods=['GET'])
@monitor_request
@limiter.limit("60 per minute")
@cached_categories(ttl=3600)  # 1 hour cache
def categories():
    try:
        cats = Category.query.all()
        return jsonify({
            'categories': [{'name': c.name} for c in cats],
            'success': True
        })
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/filters', methods=['GET'])
@monitor_request
@limiter.limit("60 per minute")
def filters():
    return jsonify({
        'success': True,
        'filters': {
            'ages': [0, 5, 12, 18, 100],
            'prices': [0, 50, 100, 500]
        }
    })

@app.route('/api/assets/images/<filename>')
@monitor_request
@limiter.limit("100 per minute")
def get_image_asset(filename):
    """Serve image assets with security headers and caching"""
    try:
        # Validate filename to prevent directory traversal
        if not re.match(r'^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$', filename):
            return jsonify({'error': 'Invalid filename'}), 400

        # Path to frontend build images directory
        images_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build', 'images')

        # Check if file exists
        if not os.path.exists(os.path.join(images_dir, filename)):
            return jsonify({'error': 'Asset not found'}), 404

        # Serve file with security headers
        response = send_from_directory(images_dir, filename)

        # Add security and caching headers
        response.headers['Cache-Control'] = 'public, max-age=86400'  # 24 hours
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Content-Security-Policy'] = "default-src 'none'; img-src 'self'"

        return response
    except Exception as e:
        return jsonify({'error': 'Failed to serve asset', 'details': str(e)}), 500

@app.route('/api/assets/3d/<filename>')
@monitor_request
@limiter.limit("100 per minute")
def get_3d_asset(filename):
    """Serve 3D model assets with security headers and caching"""
    try:
        # Validate filename to prevent directory traversal
        if not re.match(r'^[a-zA-Z0-9_-]+\.(glb|gltf|obj|fbx)$', filename):
            return jsonify({'error': 'Invalid filename'}), 400

        # Path to frontend build 3d_assets directory
        assets_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build', '3d_assets')

        # Check if file exists
        if not os.path.exists(os.path.join(assets_dir, filename)):
            return jsonify({'error': 'Asset not found'}), 404

        # Serve file with security headers
        response = send_from_directory(assets_dir, filename)

        # Add security and caching headers
        response.headers['Cache-Control'] = 'public, max-age=86400'  # 24 hours
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Content-Security-Policy'] = "default-src 'none'"

        return response
    except Exception as e:
        return jsonify({'error': 'Failed to serve asset', 'details': str(e)}), 500

@app.route('/api/assets/list', methods=['GET'])
@monitor_request
@limiter.limit("30 per minute")
def list_assets():
    """List available assets with metadata"""
    try:
        images_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build', 'images')
        assets_3d_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build', '3d_assets')

        images = []
        if os.path.exists(images_dir):
            for file in os.listdir(images_dir):
                if file.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                    file_path = os.path.join(images_dir, file)
                    stat = os.stat(file_path)
                    images.append({
                        'filename': file,
                        'type': 'image',
                        'size': stat.st_size,
                        'modified': stat.st_mtime,
                        'url': f'/api/assets/images/{file}'
                    })

        models_3d = []
        if os.path.exists(assets_3d_dir):
            for file in os.listdir(assets_3d_dir):
                if file.endswith(('.glb', '.gltf', '.obj', '.fbx')):
                    file_path = os.path.join(assets_3d_dir, file)
                    stat = os.stat(file_path)
                    models_3d.append({
                        'filename': file,
                        'type': '3d_model',
                        'size': stat.st_size,
                        'modified': stat.st_mtime,
                        'url': f'/api/assets/3d/{file}'
                    })

        return jsonify({
            'success': True,
            'assets': {
                'images': images,
                'models_3d': models_3d
            }
        })
    except Exception as e:
        return jsonify({'error': 'Failed to list assets', 'details': str(e)}), 500

@app.route('/api/recommendations', methods=['POST'])
@jwt_required()
@monitor_request
@limiter.limit("25 per minute")
@log_performance("recommendations")
def get_personalized_recommendations():
    """Get personalized recommendations based on user preferences and NLP analysis"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        data = validate_input(data, ['query'])

        # Process the query
        processed = process_query(data['query'])

        # Get personalized recommendations
        recommendations = get_recommendations(user_id, processed, top_n=8)

        return jsonify({
            'query_analysis': processed,
            'recommendations': recommendations,
            'personalized': True,
            'success': True
        })
    except BadRequest as e:
        return jsonify({'error': str(e), 'success': False}), 400
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

def get_recommendations(user_id, processed_query, top_n=5):
    """Enhanced recommendation engine with collaborative filtering and NLP insights"""
    try:
        # Get user's search history (mock for now - in real implementation, store user interactions)
        user_interests = processed_query.get('interests', [])
        user_age = processed_query.get('age')
        user_relationship = processed_query.get('relationship')
        sentiment = processed_query.get('sentiment', {})
        entities = processed_query.get('entities', [])

        # Basic collaborative filtering: find similar users based on interests
        similar_users_interests = []

        # For now, use category-based similarity
        all_gifts = Gift.query.all()
        category_scores = defaultdict(float)

        # Score gifts based on multiple factors
        scored_gifts = []
        for gift in all_gifts:
            score = 0
            reasons = []

            # Interest matching
            for interest in user_interests:
                if (interest.lower() in gift.category.lower() or
                    interest.lower() in gift.name.lower() or
                    (gift.description and interest.lower() in gift.description.lower())):
                    score += 30
                    reasons.append(f"matches interest: {interest}")
                    break

            # Age appropriateness
            if user_age:
                if gift.age_min <= user_age <= gift.age_max:
                    score += 25
                    reasons.append(f"age appropriate for {user_age}")
                elif abs(user_age - gift.age_min) <= 3 or abs(user_age - gift.age_max) <= 3:
                    score += 10
                    reasons.append(f"near age range for {user_age}")

            # Relationship-based recommendations
            if user_relationship:
                if user_relationship in ['niece', 'nephew'] and gift.age_min <= 12:
                    score += 20
                    reasons.append(f"suitable for {user_relationship}")
                elif user_relationship in ['wife', 'husband'] and gift.age_min >= 18:
                    score += 20
                    reasons.append(f"romantic gift for {user_relationship}")
                elif user_relationship in ['mom', 'dad'] and gift.age_min >= 30:
                    score += 15
                    reasons.append(f"parent gift for {user_relationship}")

            # Sentiment-based recommendations
            if sentiment.get('compound', 0) > 0.5:
                # Positive sentiment - recommend fun/experiential gifts
                if any(word in gift.category.lower() for word in ['gaming', 'art', 'science', 'outdoor']):
                    score += 15
                    reasons.append("positive sentiment suggests experiential gift")
            elif sentiment.get('compound', 0) < -0.5:
                # Negative sentiment - recommend comforting gifts
                if any(word in gift.category.lower() for word in ['book', 'home', 'comfort']):
                    score += 15
                    reasons.append("sentiment suggests comforting gift")

            # Seasonal/contextual recommendations
            current_month = datetime.now().month
            if current_month in [12, 1]:  # Winter holidays
                if any(word in gift.name.lower() for word in ['christmas', 'holiday', 'winter', 'snow']):
                    score += 10
                    reasons.append("seasonal: winter holidays")
            elif current_month in [10, 11]:  # Halloween/Thanksgiving
                if any(word in gift.name.lower() for word in ['pumpkin', 'thanksgiving', 'autumn']):
                    score += 10
                    reasons.append("seasonal: fall holidays")

            # Entity-based recommendations
            for entity in entities:
                if entity['label'] == 'PERSON' and entity['text'].lower() in gift.name.lower():
                    score += 20
                    reasons.append(f"matches entity: {entity['text']}")
                elif entity['label'] == 'ORG' and entity['text'].lower() in gift.description.lower():
                    score += 15
                    reasons.append(f"related to: {entity['text']}")

            # Collaborative filtering: similar categories get bonus
            category_gifts = Gift.query.filter_by(category=gift.category).all()
            if len(category_gifts) > 1:
                score += 5  # Small bonus for categories with multiple items

            if score > 0:
                scored_gifts.append({
                    'gift': gift,
                    'score': score,
                    'reasons': reasons
                })

        # Sort by score and get top recommendations
        scored_gifts.sort(key=lambda x: x['score'], reverse=True)
        top_gifts = scored_gifts[:top_n]

        # Format recommendations
        recommendations = []
        for item in top_gifts:
            gift = item['gift']
            mock_price = 19.99 + (gift.id % 10) * 5

            recommendations.append({
                'id': gift.id,
                'name': gift.name,
                'description': gift.description,
                'category': gift.category,
                'age_min': gift.age_min,
                'age_max': gift.age_max,
                'image': gift.image or f'/api/assets/images/hero-bg-{gift.id % 13:02d}.jpg',
                'prices': [{'retailer': 'Amazon', 'price': mock_price}],
                'rating': 4.0 + (gift.id % 10) * 0.1,
                'relevance_score': round(item['score'], 2),
                'recommendation_reasons': item['reasons']
            })

        return recommendations

    except Exception as e:
        print(f"Recommendation engine error: {e}")
        return []

def seed_database():
    """Seed the database with initial data from KNOWLEDGE_BASE"""
    from nlp_processor import KNOWLEDGE_BASE

    # Seed categories
    categories = {}
    for interest, gifts in KNOWLEDGE_BASE.items():
        for gift in gifts:
            cat_name = gift.get('category', 'general')
            if cat_name not in categories:
                categories[cat_name] = [interest]
            elif interest not in categories[cat_name]:
                categories[cat_name].append(interest)

    for cat_name, interests in categories.items():
        if not Category.query.filter_by(name=cat_name).first():
            category = Category(name=cat_name, interests=','.join(interests))
            db.session.add(category)

    # Seed gifts
    for interest, gifts in KNOWLEDGE_BASE.items():
        for gift_data in gifts:
            if not Gift.query.filter_by(name=gift_data['name']).first():
                gift = Gift(
                    name=gift_data['name'],
                    category=gift_data.get('category', 'general'),
                    age_min=gift_data.get('age_min', 0),
                    age_max=gift_data.get('age_max', 100),
                    image=gift_data.get('image', ''),
                    description=f"A great gift for someone interested in {interest}"
                )
                db.session.add(gift)

    # Add some additional sample gifts
    sample_gifts = [
        {'name': 'LEGO Creator Set', 'category': 'building', 'age_min': 6, 'age_max': 12, 'description': 'Creative building blocks for imaginative play'},
        {'name': 'Board Game Collection', 'category': 'gaming', 'age_min': 8, 'age_max': 100, 'description': 'Fun family board games'},
        {'name': 'Art Supply Kit', 'category': 'art', 'age_min': 5, 'age_max': 18, 'description': 'Complete art supplies for young artists'},
        {'name': 'Science Experiment Kit', 'category': 'science', 'age_min': 8, 'age_max': 16, 'description': 'Hands-on science experiments'},
        {'name': 'Remote Control Car', 'category': 'tech', 'age_min': 6, 'age_max': 14, 'description': 'Exciting RC car for outdoor fun'},
        {'name': 'Cookbook for Kids', 'category': 'cooking', 'age_min': 8, 'age_max': 16, 'description': 'Easy recipes for young chefs'},
        {'name': 'Gardening Tools Set', 'category': 'outdoor', 'age_min': 10, 'age_max': 100, 'description': 'Quality tools for gardening enthusiasts'},
        {'name': 'Wireless Headphones', 'category': 'tech', 'age_min': 12, 'age_max': 100, 'description': 'High-quality audio experience'},
        {'name': 'Puzzle Collection', 'category': 'puzzles', 'age_min': 5, 'age_max': 100, 'description': 'Challenging puzzles for all ages'},
        {'name': 'Sports Equipment', 'category': 'sports', 'age_min': 6, 'age_max': 100, 'description': 'Complete sports gear set'}
    ]

    for gift_data in sample_gifts:
        if not Gift.query.filter_by(name=gift_data['name']).first():
            gift = Gift(
                name=gift_data['name'],
                category=gift_data['category'],
                age_min=gift_data['age_min'],
                age_max=gift_data['age_max'],
                description=gift_data['description']
            )
            db.session.add(gift)

    db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Seed database if empty
        if Gift.query.count() == 0:
            seed_database()

    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)