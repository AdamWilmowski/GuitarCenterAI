# API routes index
from .descriptions import descriptions_bp
from .saved_descriptions import saved_descriptions_bp
from .corrections import corrections_bp
from .learning_data import learning_data_bp

__all__ = [
    'descriptions_bp',
    'saved_descriptions_bp', 
    'corrections_bp',
    'learning_data_bp'
]
