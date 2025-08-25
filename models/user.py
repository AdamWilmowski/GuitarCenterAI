from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class User(UserMixin):
    """User model for authentication"""
    
    def __init__(self, username, role='user'):
        self.id = username
        self.username = username
        self.role = role

# Simple user storage (in production, use a database)
users = {
    'admin': {
        'username': 'admin',
        'password_hash': generate_password_hash('admin123'),
        'role': 'admin'
    }
}

def get_user(username):
    """Get user by username"""
    if username in users:
        user_data = users[username]
        return User(user_data['username'], user_data['role'])
    return None

def verify_user(username, password):
    """Verify user credentials"""
    if username in users:
        return check_password_hash(users[username]['password_hash'], password)
    return False

def add_user(username, password, role='user'):
    """Add a new user"""
    users[username] = {
        'username': username,
        'password_hash': generate_password_hash(password),
        'role': role
    }
