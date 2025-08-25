import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-this')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    
    # Database settings
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///guitar_ai.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # File paths
    LEARNING_DATA_FILE = 'learning_data.json'
    
    # OpenAI settings
    OPENAI_MODEL = "gpt-3.5-turbo"
    OPENAI_MAX_TOKENS = 1500
    OPENAI_TEMPERATURE = 0.7
    
    # Flask settings
    DEBUG = True
    HOST = '0.0.0.0'
    PORT = 5001
