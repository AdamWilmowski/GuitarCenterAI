from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

def init_db(app):
    """Initialize the database with the Flask app"""
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        
        # Create default admin user if it doesn't exist
        from models.user import User
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            admin_user = User(
                username='admin',
                email='admin@guitarai.com',
                role='admin'
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            db.session.commit()
            print("✅ Default admin user created")

