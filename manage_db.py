#!/usr/bin/env python3
"""
Database management script for Guitar AI Application
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def init_database():
    """Initialize the database"""
    from app import create_app
    from models.database import db
    
    app = create_app()
    with app.app_context():
        db.create_all()
        print("✅ Database initialized successfully!")
        
        # Check if admin user exists
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
        else:
            print("ℹ️  Admin user already exists")

def reset_database():
    """Reset the database (WARNING: This will delete all data)"""
    from app import create_app
    from models.database import db
    
    confirm = input("⚠️  This will delete ALL data. Are you sure? (yes/no): ")
    if confirm.lower() != 'yes':
        print("❌ Database reset cancelled")
        return
    
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()
        print("✅ Database reset successfully!")
        
        # Create admin user
        from models.user import User
        admin_user = User(
            username='admin',
            email='admin@guitarai.com',
            role='admin'
        )
        admin_user.set_password('admin123')
        db.session.add(admin_user)
        db.session.commit()
        print("✅ Default admin user created")

def show_stats():
    """Show database statistics"""
    from app import create_app
    from models.user import User
    from models.descriptions import SavedDescription, ReturnedDescription, ModelCorrection, ModelAdjustment
    
    app = create_app()
    with app.app_context():
        print("📊 Database Statistics:")
        print(f"Users: {User.query.count()}")
        print(f"Saved Descriptions: {SavedDescription.query.count()}")
        print(f"Returned Descriptions: {ReturnedDescription.query.count()}")
        print(f"Model Corrections: {ModelCorrection.query.count()}")
        print(f"Model Adjustments: {ModelAdjustment.query.count()}")
        
        # Show recent activity
        print("\n🕒 Recent Activity:")
        recent_descriptions = ReturnedDescription.query.order_by(ReturnedDescription.created_at.desc()).limit(5).all()
        if recent_descriptions:
            print("Recent Generated Descriptions:")
            for desc in recent_descriptions:
                print(f"  - {desc.created_at.strftime('%Y-%m-%d %H:%M')}: {desc.description_type} description")
        else:
            print("  No recent activity")

def create_user():
    """Create a new user"""
    from app import create_app
    from models.user import create_user
    
    app = create_app()
    with app.app_context():
        username = input("Username: ")
        email = input("Email: ")
        password = input("Password: ")
        role = input("Role (user/admin): ") or 'user'
        
        try:
            user = create_user(username, email, password, role)
            print(f"✅ User '{username}' created successfully!")
        except Exception as e:
            print(f"❌ Error creating user: {e}")

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python manage_db.py [command]")
        print("Commands:")
        print("  init     - Initialize database")
        print("  reset    - Reset database (WARNING: deletes all data)")
        print("  stats    - Show database statistics")
        print("  user     - Create a new user")
        return
    
    command = sys.argv[1].lower()
    
    if command == 'init':
        init_database()
    elif command == 'reset':
        reset_database()
    elif command == 'stats':
        show_stats()
    elif command == 'user':
        create_user()
    else:
        print(f"❌ Unknown command: {command}")

if __name__ == '__main__':
    main()

