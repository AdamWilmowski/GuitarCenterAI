#!/usr/bin/env python3
"""
Guitar AI Description Generator - Startup Script
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Check if required environment variables are set
if not os.getenv('OPENAI_API_KEY'):
    print("Error: OPENAI_API_KEY not found in environment variables.")
    print("Please create a .env file with your OpenAI API key.")
    print("See env.example for reference.")
    sys.exit(1)

if not os.getenv('SECRET_KEY'):
    print("Warning: SECRET_KEY not found. Using default key (not recommended for production).")

# Import and run the Flask app
from app import app
from config.settings import Config

if __name__ == '__main__':
    print("🎸 Starting Guitar AI Description Generator...")
    print("📝 Access the application at: http://localhost:5000")
    print("🔑 Default login: admin / admin123")
    print("⚠️  Remember to change the default password!")
    print("-" * 50)
    
    app.run(
        debug=Config.DEBUG,
        host=Config.HOST,
        port=Config.PORT
    )
