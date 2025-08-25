from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

def init_db(app):
    """Initialize the database with the Flask app"""
    db.init_app(app)
    
    with app.app_context():
        # Create all tables with UTF-8 encoding
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
            print("✅ Domyślny użytkownik admin został utworzony")
        
        # Add some Polish example descriptions if none exist
        from models.descriptions import SavedDescription
        if SavedDescription.query.count() == 0:
            # Fallback examples if config examples don't exist
            fallback_guitar_examples = [
                "Fender Stratocaster to ikoniczna gitara elektryczna z charakterystycznym dźwiękiem idealnym do bluesa i rocka.",
                "Gibson Les Paul to legenda wśród gitar elektrycznych znana z ciepłego, pełnego brzmienia."
            ]
            
            fallback_company_examples = [
                "Fender to amerykański producent gitar elektrycznych znany z innowacyjnych rozwiązań.",
                "Gibson to legenda wśród producentów gitar premium z długą tradycją."
            ]
            
            try:
                # Try to get Polish examples from config
                from config.settings import Config
                guitar_examples = getattr(Config, 'POLISH_GUITAR_EXAMPLES', fallback_guitar_examples)
                company_examples = getattr(Config, 'POLISH_COMPANY_EXAMPLES', fallback_company_examples)
            except Exception:
                # Use fallback examples if config fails
                guitar_examples = fallback_guitar_examples
                company_examples = fallback_company_examples
            
            # Add Polish guitar examples
            for i, example in enumerate(guitar_examples):
                saved_desc = SavedDescription(
                    title=f"Przykład gitary {i+1}",
                    content=example,
                    description_type='guitar',
                    category='Elektryczna',
                    tags='przykład,polski,gitara',
                    user_id=admin_user.id,
                    is_public=True
                )
                db.session.add(saved_desc)
            
            # Add Polish company examples
            for i, example in enumerate(company_examples):
                saved_desc = SavedDescription(
                    title=f"Przykład firmy {i+1}",
                    content=example,
                    description_type='company',
                    category='Producent',
                    tags='przykład,polski,firma',
                    user_id=admin_user.id,
                    is_public=True
                )
                db.session.add(saved_desc)
            
            db.session.commit()
            print("✅ Dodano polskie przykłady opisów")

