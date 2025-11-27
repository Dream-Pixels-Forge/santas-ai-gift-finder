from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Gift, Category
from nlp_processor import process_query
from price_comparison import compare_prices
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///gifts.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

@app.route('/')
def home():
    return jsonify({
        'message': 'Santa\'s AI Gift Finder API is running! 🎅',
        'version': '1.0.0',
        'endpoints': {
            'search': '/api/search (POST)',
            'compare': '/api/compare (POST)',
            'categories': '/api/categories (GET)',
            'filters': '/api/filters (GET)',
            'health': '/api/health (GET)'
        }
    })

@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'santas-gift-finder-backend',
        'timestamp': os.environ.get('COMMIT_SHA', 'unknown')
    })

@app.route('/api/search', methods=['POST'])
def search():
    try:
        data = request.json
        query = data.get('query', '')
        if not query:
            return jsonify({'error': 'Query required'}), 400
        
        processed = process_query(query)
        
        # Enrich with prices
        for rec in processed['recommendations']:
            rec['prices'] = compare_prices(rec['name'])
            rec['rating'] = 4.5  # Mock
        
        return jsonify({
            'query_analysis': processed,
            'recommendations': processed['recommendations'],
            'success': True
        })
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/compare', methods=['POST'])
def compare():
    try:
        data = request.json
        product = data.get('product_name', '')
        if not product:
            return jsonify({'error': 'Product name required'}), 400
        
        prices = compare_prices(product)
        return jsonify({'prices': prices, 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/categories', methods=['GET'])
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
def filters():
    return jsonify({
        'success': True,
        'filters': {
            'ages': [0, 5, 12, 18, 100],
            'prices': [0, 50, 100, 500]
        }
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Seed some data if empty
        if Gift.query.count() == 0:
            # Add sample gifts
            pass  # Integrate from KNOWLEDGE_BASE
    
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)