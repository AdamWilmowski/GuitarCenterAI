import openai
from config.settings import Config
from models.database import db
from models.descriptions import SavedDescription, ModelCorrection, ModelAdjustment
import json

class AIService:
    """Service class for AI operations"""
    
    def __init__(self):
        openai.api_key = Config.OPENAI_API_KEY
    
    def get_learning_context(self, description_type=None):
        """Get learning context from database"""
        context = ""
        
        # Get recent corrections
        corrections_query = ModelCorrection.query.filter_by(is_applied=False)
        if description_type:
            corrections_query = corrections_query.filter_by(description_type=description_type)
        
        corrections = corrections_query.order_by(ModelCorrection.created_at.desc()).limit(5).all()
        
        if corrections:
            context += "\n\nPrevious corrections to consider:\n"
            for correction in corrections:
                context += f"- {correction.original_text} → {correction.corrected_text}\n"
        
        # Get saved descriptions as examples
        saved_query = SavedDescription.query.filter_by(is_public=True)
        if description_type:
            saved_query = saved_query.filter_by(description_type=description_type)
        
        saved_descriptions = saved_query.order_by(SavedDescription.created_at.desc()).limit(3).all()
        
        if saved_descriptions:
            context += "\n\nExample descriptions:\n"
            for desc in saved_descriptions:
                context += f"- {desc.content}\n"
        
        # Get model adjustments
        adjustments_query = ModelAdjustment.query.filter_by(is_active=True)
        if description_type:
            adjustments_query = adjustments_query.filter(
                (ModelAdjustment.description_type == description_type) | 
                (ModelAdjustment.description_type.is_(None))
            )
        
        adjustments = adjustments_query.order_by(ModelAdjustment.priority.desc()).all()
        
        if adjustments:
            context += "\n\nModel adjustments:\n"
            for adj in adjustments:
                context += f"- {adj.adjustment_type}: {adj.adjustment_value}\n"
        
        return context
    
    def generate_guitar_description(self, input_text):
        """Generate guitar description using AI"""
        context = self.get_learning_context('guitar')
        
        prompt = f"""You are an expert guitar enthusiast. Create a detailed, engaging description of a guitar based on the following information.

{context}

Input information: {input_text}

Please provide a comprehensive description that includes:
- Technical specifications
- Sound characteristics
- Build quality and materials
- Target audience
- Historical context if relevant

Make the description informative yet accessible to both beginners and experienced players."""
        
        return self._call_openai(prompt)
    
    def generate_company_description(self, input_text):
        """Generate company description using AI"""
        context = self.get_learning_context('company')
        
        prompt = f"""You are an expert in guitar manufacturing and company history. Create a detailed description of a guitar company based on the following information.

{context}

Input information: {input_text}

Please provide a comprehensive description that includes:
- Company history and founding
- Notable achievements and innovations
- Signature products and models
- Company philosophy and values
- Market position and reputation
- Key people and milestones

Make the description engaging and informative for guitar enthusiasts."""
        
        return self._call_openai(prompt)
    
    def _call_openai(self, prompt):
        """Make API call to OpenAI"""
        try:
            response = openai.ChatCompletion.create(
                model=Config.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a knowledgeable guitar expert with deep understanding of guitars, guitar companies, and the music industry."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=Config.OPENAI_MAX_TOKENS,
                temperature=Config.OPENAI_TEMPERATURE
            )
            
            return {
                'success': True,
                'description': response.choices[0].message.content.strip(),
                'tokens_used': response.usage.total_tokens if hasattr(response, 'usage') else None,
                'model_version': Config.OPENAI_MODEL
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
