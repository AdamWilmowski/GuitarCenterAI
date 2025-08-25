from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from models.database import db
from datetime import datetime

class User(UserMixin, db.Model):
    """User model for authentication and user management"""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    saved_descriptions = db.relationship('SavedDescription', backref='user', lazy=True)
    corrections = db.relationship('ModelCorrection', backref='user', lazy=True)
    
    def get_id(self):
        """Return the user ID as a string for Flask-Login"""
        return str(self.id)
    
    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password hash"""
        return check_password_hash(self.password_hash, password)
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = datetime.utcnow()
        db.session.commit()
    
    def __repr__(self):
        return f'<User {self.username}>'

def get_user_by_username(username):
    """Get user by username"""
    return User.query.filter_by(username=username).first()

def get_user_by_id(user_id):
    """Get user by ID"""
    return User.query.get(user_id)

def verify_user(username, password):
    """Verify user credentials"""
    user = get_user_by_username(username)
    if user and user.check_password(password):
        user.update_last_login()
        return True
    return False

def create_user(username, email, password, role='user'):
    """Create a new user"""
    user = User(username=username, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user
