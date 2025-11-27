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

with app.app_context():
    db.create_all()
    # Seed some data if empty
    if Gift.query.count() == 0:
        # Add sample gifts
        pass  # Integrate from KNOWLEDGE_BASE

@app.route('/api/search', methods=['POST'])
def search():
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
        'recommendations': processed['recommendations']
    })

@app.route('/api/compare', methods=['POST'])
def compare():
    data = request.json
    product = data.get('product_name', '')
    prices = compare_prices(product)
    return jsonify({'prices': prices})

@app.route('/api/categories', methods=['GET'])
def categories():
    cats = Category.query.all()
    return jsonify([{'name': c.name} for c in cats])

@app.route('/api/filters', methods=['GET'])
def filters():
    return jsonify({
        'ages': [0, 5, 12, 18, 100],
        'prices': [0, 50, 100, 500]
    })

if __name__ == '__main__':
    app.run(debug=True)