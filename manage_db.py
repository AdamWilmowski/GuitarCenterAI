#!/usr/bin/env python3
"""
Database management script for Guitar AI Application
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app import create_app
from models.database import db
from models.user import User
from models.descriptions import SavedDescription, ReturnedDescription, ModelCorrection, ModelAdjustment, AIPrompt
from werkzeug.security import generate_password_hash

def init_db():
    """Initialize the database with tables and default data"""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # Check if admin user exists
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            # Create default admin user
            admin_user = User(
                username='admin',
                email='admin@guitarai.com',
                password_hash=generate_password_hash('admin123')
            )
            db.session.add(admin_user)
            db.session.commit()
            print("✅ Default admin user created!")
            print("   Username: admin")
            print("   Password: admin123")
        else:
            print("ℹ️  Admin user already exists")
        
        print("\n🎸 Guitar AI Database initialized successfully!")
        print("📝 You can now run the application with: python run.py")

if __name__ == '__main__':
    init_db()

