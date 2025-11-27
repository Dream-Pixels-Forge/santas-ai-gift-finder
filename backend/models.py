from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Gift(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)  # Index for search
    description = db.Column(db.Text)
    category = db.Column(db.String(100), index=True)  # Index for category filtering
    age_min = db.Column(db.Integer, default=0, index=True)  # Index for age filtering
    age_max = db.Column(db.Integer, default=100, index=True)  # Index for age filtering
    image = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Composite index for common age range queries
    __table_args__ = (
        db.Index('idx_gift_age_range', 'age_min', 'age_max'),
        db.Index('idx_gift_category_age', 'category', 'age_min', 'age_max'),
    )

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True)
    interests = db.Column(db.Text)  # JSON string of interests