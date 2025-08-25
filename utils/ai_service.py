import openai
from config.settings import Config
from utils.learning_data import get_learning_context

class AIService:
    """Service class for AI operations"""
    
    def __init__(self):
        openai.api_key = Config.OPENAI_API_KEY
    
    def generate_guitar_description(self, input_text):
        """Generate guitar description using AI"""
        context = get_learning_context()
        
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
        context = get_learning_context()
        
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
                'description': response.choices[0].message.content.strip()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
