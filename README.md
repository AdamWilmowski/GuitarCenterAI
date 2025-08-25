# Guitar AI Description Generator

A Flask-based web application that generates detailed descriptions of guitars and guitar companies using OpenAI's GPT-3.5. The app includes a learning system that improves over time based on user corrections and examples.

## Features

- **Guitar Descriptions**: Generate comprehensive descriptions of guitars based on input specifications
- **Company Descriptions**: Create detailed company profiles for guitar manufacturers
- **AI Learning**: The system learns from corrections and examples to improve future descriptions
- **User Authentication**: Simple login system for limited access
- **Clean Interface**: Modern, responsive web interface
- **Correction System**: Users can correct AI-generated descriptions and the system learns from these corrections
- **Modular Architecture**: Clean, maintainable code structure with separate modules for different concerns

## Setup Instructions

### Prerequisites

- Python 3.7 or higher
- OpenAI API key

### Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   - Copy `env.example` to `.env`
   - Edit `.env` and add your configuration:
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your actual values:
   ```
   SECRET_KEY=your-secret-key-change-this-in-production
   OPENAI_API_KEY=your-actual-openai-api-key
   ```

4. **Run the application**:
   ```bash
   python run.py
   ```
   or
   ```bash
   python app.py
   ```

5. **Access the application**:
   - Open your browser and go to `http://localhost:5000`
   - Login with username: `admin` and password: `admin123`

## Usage

### Generating Descriptions

1. **Guitar Descriptions**:
   - Go to the "Guitar Descriptions" tab
   - Enter guitar details (model, specifications, features, etc.)
   - Click "Generate Description"
   - The AI will create a comprehensive description

2. **Company Descriptions**:
   - Go to the "Company Descriptions" tab
   - Enter company information (history, products, achievements, etc.)
   - Click "Generate Description"
   - The AI will create a detailed company profile

### Learning Features

1. **Saving Examples**:
   - After generating a description, click "Save as Example"
   - This helps the AI understand your preferred style

2. **Correcting Descriptions**:
   - Click "Correct Description" on any generated text
   - Edit the description in the modal
   - Submit the correction
   - The AI will consider this correction in future generations

3. **Viewing Learning Data**:
   - Go to the "Learning Data" tab
   - View recent corrections and saved examples
   - This shows how the AI is learning from your input

## File Structure

```
GuitarAIAPI/
├── app.py                 # Main Flask application (factory pattern)
├── run.py                 # Startup script with environment checks
├── requirements.txt       # Python dependencies
├── env.example           # Environment variables template
├── learning_data.json    # AI learning data (created automatically)
├── config/
│   ├── __init__.py
│   └── settings.py       # Application configuration
├── models/
│   ├── __init__.py
│   └── user.py           # User model and authentication
├── routes/
│   ├── __init__.py
│   ├── auth.py           # Authentication routes
│   └── main.py           # Main application routes
├── utils/
│   ├── __init__.py
│   ├── ai_service.py     # OpenAI API service
│   └── learning_data.py  # Learning data utilities
├── templates/
│   ├── base.html         # Base template
│   ├── login.html        # Login page
│   └── index.html        # Main application interface
└── static/
    ├── css/
    │   └── style.css     # Custom styles
    └── js/
        └── app.js        # JavaScript functionality
```

## Architecture

The application follows a modular architecture:

- **Config**: Centralized configuration management
- **Models**: Data models and business logic
- **Routes**: HTTP route handlers organized by feature
- **Utils**: Utility functions and services
- **Templates**: HTML templates
- **Static**: CSS, JavaScript, and other static assets

### Key Components

- **AIService**: Handles all OpenAI API interactions
- **LearningData**: Manages the AI learning system
- **User Model**: Handles authentication and user management
- **Blueprints**: Organized route handling for auth and main features

## Configuration

### Adding Users

To add more users, edit the `users` dictionary in `models/user.py`:

```python
users = {
    'admin': {
        'username': 'admin',
        'password_hash': generate_password_hash('admin123'),
        'role': 'admin'
    },
    'user2': {
        'username': 'user2',
        'password_hash': generate_password_hash('password123'),
        'role': 'user'
    }
}
```

### OpenAI Configuration

The app uses OpenAI's GPT-3.5-turbo model. You can modify the model or parameters in `config/settings.py`:

```python
OPENAI_MODEL = "gpt-3.5-turbo"
OPENAI_MAX_TOKENS = 500
OPENAI_TEMPERATURE = 0.7
```

## Security Notes

- Change the default admin password in production
- Use a strong SECRET_KEY
- Consider using a proper database for user management in production
- The app is designed for limited access (2-3 users)

## Troubleshooting

### Common Issues

1. **OpenAI API Error**: Make sure your API key is correct and has sufficient credits
2. **Import Errors**: Ensure all dependencies are installed with `pip install -r requirements.txt`
3. **Port Already in Use**: Change the port in `config/settings.py` or stop other services using port 5000

### Logs

The application will show error messages in the console. Check the browser's developer console for JavaScript errors.

## Future Enhancements

- Database integration for better data persistence
- User management system
- Export functionality for descriptions
- Image upload and analysis
- More detailed guitar specifications
- Historical data tracking
- API rate limiting
- Caching for better performance

## License

This project is for educational and personal use. Please respect OpenAI's terms of service when using their API.
