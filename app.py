import os
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import openai
from dotenv import load_dotenv

load_dotenv()

from flask import Flask
from flask_login import LoginManager
from config.settings import Config
from models.database import db, init_db
from models.user import get_user_by_id
from routes.auth import auth_bp
from routes.main import main_bp
from routes.api import (
    descriptions_bp,
    saved_descriptions_bp,
    corrections_bp,
    learning_data_bp,
    examples_bp,
    prompts_bp
)

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = Config.SQLALCHEMY_TRACK_MODIFICATIONS
    
    # Set UTF-8 encoding for proper Polish character support
    app.config['JSON_AS_ASCII'] = False
    app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
    
    # Initialize database
    init_db(app)
    
    # Initialize Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    
    @login_manager.user_loader
    def load_user(user_id):
        """Load user by ID"""
        try:
            # Ensure user_id is a valid integer
            if not user_id or not str(user_id).isdigit():
                return None
            return get_user_by_id(int(user_id))
        except (ValueError, TypeError):
            return None
    
    @login_manager.unauthorized_handler
    def unauthorized():
        """Handle unauthorized access"""
        return redirect(url_for('auth.login'))
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    
    # Register API blueprints
    app.register_blueprint(descriptions_bp)
    app.register_blueprint(saved_descriptions_bp)
    app.register_blueprint(corrections_bp)
    app.register_blueprint(learning_data_bp)
    app.register_blueprint(examples_bp)
    app.register_blueprint(prompts_bp)
    
    return app

# Create the application instance
app = create_app()

if __name__ == '__main__':
    app.run(
        debug=Config.DEBUG,
        host=Config.HOST,
        port=5001
    )
