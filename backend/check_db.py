import os
from models import db, Gift, Category
from flask import Flask

app = Flask(__name__)
db_path = os.path.join(os.getcwd(), 'instance', 'gifts.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
db.init_app(app)

print(f'Database path: {db_path}')
print(f'Database exists: {os.path.exists(db_path)}')

with app.app_context():
    try:
        print('Gifts count:', Gift.query.count())
        print('Categories count:', Category.query.count())
        if Gift.query.count() > 0:
            print('Sample gift:', Gift.query.first().name)
        if Category.query.count() > 0:
            print('Sample category:', Category.query.first().name)
    except Exception as e:
        print('Error:', e)