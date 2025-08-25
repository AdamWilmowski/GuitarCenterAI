# Guitar AI Description Generator

A Flask-based web application that generates detailed descriptions of guitars and guitar companies using OpenAI's GPT-3.5. The app includes a learning system that improves over time based on user corrections and examples, with a robust SQLite database backend.

## Features

- **Guitar Descriptions**: Generate comprehensive descriptions of guitars based on input specifications
- **Company Descriptions**: Create detailed company profiles for guitar manufacturers
- **AI Learning**: The system learns from corrections and examples to improve future descriptions
- **Database Storage**: SQLite database for persistent storage of all data
- **User Management**: Multi-user system with role-based access
- **Clean Interface**: Modern, responsive web interface
- **Correction System**: Users can correct AI-generated descriptions and the system learns from these corrections
- **Modular Architecture**: Clean, maintainable code structure with separate modules for different concerns
- **RESTful API**: Well-organized API endpoints for all functionality

## Database Schema

The application uses SQLite with the following tables:

- **users**: User accounts and authentication
- **saved_descriptions**: Reference descriptions saved by users
- **returned_descriptions**: AI-generated descriptions with metadata
- **model_corrections**: Corrections made to improve the AI model
- **model_adjustments**: Model configuration and preferences

## API Endpoints

### Descriptions
- `POST /api/descriptions/generate` - Generate AI descriptions

### Saved Descriptions
- `POST /api/saved-descriptions/save` - Save a description
- `GET /api/saved-descriptions/list` - List user's saved descriptions
- `DELETE /api/saved-descriptions/<id>` - Delete a saved description

### Corrections
- `POST /api/corrections/submit` - Submit a correction
- `GET /api/corrections/list` - List user's corrections
- `POST /api/corrections/<id>/apply` - Mark correction as applied

### Learning Data
- `GET /api/learning-data/dashboard` - Get dashboard data
- `GET /api/learning-data/stats` - Get user statistics

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
   DATABASE_URL=sqlite:///guitar_ai.db
   ```

4. **Initialize the database**:
   ```bash
   python manage_db.py init
   ```

5. **Run the application**:
   ```bash
   python run.py
   ```
   or
   ```bash
   python app.py
   ```

6. **Access the application**:
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

1. **Saving Descriptions**:
   - After generating a description, click "Save Description"
   - Add a title, category, and tags
   - This helps the AI understand your preferred style

2. **Correcting Descriptions**:
   - Click "Correct Description" on any generated text
   - Edit the description in the modal
   - Submit the correction
   - The AI will consider this correction in future generations

3. **Viewing Learning Data**:
   - Go to the "Learning Data" tab
   - View recent corrections, saved descriptions, and generated descriptions
   - This shows how the AI is learning from your input

## Database Management

### Database Commands

```bash
# Initialize database
python manage_db.py init

# Show database statistics
python manage_db.py stats

# Create a new user
python manage_db.py user

# Reset database (WARNING: deletes all data)
python manage_db.py reset
```

### Database Location

The SQLite database is stored in:
- **Development**: `instance/guitar_ai.db`
- **Production**: Configure via `DATABASE_URL` environment variable

## File Structure

```
GuitarAIAPI/
├── app.py                 # Main Flask application (factory pattern)
├── run.py                 # Startup script with environment checks
├── manage_db.py           # Database management script
├── requirements.txt       # Python dependencies
├── env.example           # Environment variables template
├── instance/             # Instance-specific files (database)
├── config/
│   ├── __init__.py
│   └── settings.py       # Application configuration
├── models/
│   ├── __init__.py
│   ├── database.py       # Database configuration
│   ├── user.py           # User model and authentication
│   └── descriptions.py   # Description models
├── routes/
│   ├── __init__.py
│   ├── auth.py           # Authentication routes
│   ├── main.py           # Main page routes
│   └── api/              # API routes
│       ├── __init__.py
│       ├── index.py      # API routes index
│       ├── descriptions.py      # Description generation
│       ├── saved_descriptions.py # Saved descriptions management
│       ├── corrections.py       # Model corrections
│       └── learning_data.py     # Learning data retrieval
├── utils/
│   ├── __init__.py
│   └── ai_service.py     # OpenAI API service
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
- **Models**: SQLAlchemy database models and business logic
- **Routes**: HTTP route handlers organized by feature
  - **Auth**: Authentication and user management
  - **Main**: Page rendering
  - **API**: RESTful API endpoints organized by functionality
- **Utils**: Utility functions and services
- **Templates**: HTML templates
- **Static**: CSS, JavaScript, and other static assets

### Key Components

- **Database Models**: SQLAlchemy ORM for data persistence
- **AIService**: Handles all OpenAI API interactions
- **User Management**: Secure authentication and authorization
- **Learning System**: Database-driven AI improvement
- **API Routes**: Well-organized RESTful endpoints
- **Blueprints**: Organized route handling for different features

## Configuration

### Adding Users

Use the database management script:
```bash
python manage_db.py user
```

Or programmatically:
```python
from models.user import create_user
create_user('username', 'email@example.com', 'password', 'role')
```

### OpenAI Configuration

The app uses OpenAI's GPT-3.5-turbo model. You can modify the model or parameters in `config/settings.py`:

```python
OPENAI_MODEL = "gpt-3.5-turbo"
OPENAI_MAX_TOKENS = 500
OPENAI_TEMPERATURE = 0.7
```

### Database Configuration

Configure the database connection in `config/settings.py`:

```python
SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///guitar_ai.db')
```

## Security Notes

- Change the default admin password in production
- Use a strong SECRET_KEY
- The database file is automatically excluded from version control
- User passwords are hashed using Werkzeug's security functions
- The app is designed for limited access (2-3 users)

## Troubleshooting

### Common Issues

1. **OpenAI API Error**: Make sure your API key is correct and has sufficient credits
2. **Import Errors**: Ensure all dependencies are installed with `pip install -r requirements.txt`
3. **Database Errors**: Run `python manage_db.py init` to initialize the database
4. **Port Already in Use**: Change the port in `config/settings.py` or stop other services using port 5000

### Logs

The application will show error messages in the console. Check the browser's developer console for JavaScript errors.

## Future Enhancements

- PostgreSQL/MySQL support for production
- User management interface
- Export functionality for descriptions
- Image upload and analysis
- More detailed guitar specifications
- Historical data tracking
- API rate limiting
- Caching for better performance
- Database migrations
- Backup and restore functionality
- API documentation with Swagger/OpenAPI
- WebSocket support for real-time updates

## License

This project is for educational and personal use. Please respect OpenAI's terms of service when using their API.
