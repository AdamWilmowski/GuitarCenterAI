from models.database import db
from datetime import datetime

class SavedDescription(db.Model):
    """Model for saved reference descriptions"""
    
    __tablename__ = 'saved_descriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    description_type = db.Column(db.String(20), nullable=False)  # 'guitar' or 'company'
    category = db.Column(db.String(100))  # e.g., 'electric', 'acoustic', 'vintage', etc.
    tags = db.Column(db.Text)  # JSON string of tags
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_public = db.Column(db.Boolean, default=False)
    
    def __repr__(self):
        return f'<SavedDescription {self.title}>'

class ReturnedDescription(db.Model):
    """Model for AI-generated descriptions"""
    
    __tablename__ = 'returned_descriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    input_text = db.Column(db.Text, nullable=False)
    generated_description = db.Column(db.Text, nullable=False)
    description_type = db.Column(db.String(20), nullable=False)  # 'guitar' or 'company'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tokens_used = db.Column(db.Integer)
    model_version = db.Column(db.String(50))
    processing_time = db.Column(db.Float)  # in seconds
    was_saved = db.Column(db.Boolean, default=False)
    
    def __repr__(self):
        return f'<ReturnedDescription {self.id}>'

class ModelCorrection(db.Model):
    """Model for storing corrections to improve AI model"""
    
    __tablename__ = 'model_corrections'
    
    id = db.Column(db.Integer, primary_key=True)
    original_text = db.Column(db.Text, nullable=False)
    corrected_text = db.Column(db.Text, nullable=False)
    description_type = db.Column(db.String(20), nullable=False)  # 'guitar' or 'company'
    correction_type = db.Column(db.String(50))  # 'grammar', 'factual', 'style', etc.
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    returned_description_id = db.Column(db.Integer, db.ForeignKey('returned_descriptions.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_applied = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    
    # Relationship
    returned_description = db.relationship('ReturnedDescription', backref='corrections')
    
    def __repr__(self):
        return f'<ModelCorrection {self.id}>'

class ModelAdjustment(db.Model):
    """Model for storing model adjustments and preferences"""
    
    __tablename__ = 'model_adjustments'
    
    id = db.Column(db.Integer, primary_key=True)
    adjustment_type = db.Column(db.String(50), nullable=False)  # 'prompt', 'temperature', 'max_tokens', etc.
    adjustment_key = db.Column(db.String(100), nullable=False)
    adjustment_value = db.Column(db.Text, nullable=False)
    description_type = db.Column(db.String(20))  # 'guitar', 'company', or None for global
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    priority = db.Column(db.Integer, default=1)  # Higher number = higher priority
    
    def __repr__(self):
        return f'<ModelAdjustment {self.adjustment_type}:{self.adjustment_key}>'

class AIPrompt(db.Model):
    """Model for storing AI prompts"""
    
    __tablename__ = 'ai_prompts'
    
    id = db.Column(db.Integer, primary_key=True)
    prompt_type = db.Column(db.String(20), nullable=False)  # 'guitar' or 'company'
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    version = db.Column(db.Integer, default=1)
    
    def __repr__(self):
        return f'<AIPrompt {self.prompt_type}:{self.title}>'

