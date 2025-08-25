import openai
from config.settings import Config
from models.database import db
from models.descriptions import SavedDescription, ModelCorrection, ModelAdjustment, AIPrompt
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
            context += "\n\nPoprzednie poprawki do uwzględnienia:\n"
            for correction in corrections:
                context += f"- {correction.original_text} → {correction.corrected_text}\n"
        
        # Get saved descriptions as examples
        saved_query = SavedDescription.query.filter_by(is_public=True)
        if description_type:
            saved_query = saved_query.filter_by(description_type=description_type)
        
        saved_descriptions = saved_query.order_by(SavedDescription.created_at.desc()).limit(3).all()
        
        if saved_descriptions:
            context += "\n\nPrzykładowe opisy:\n"
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
            context += "\n\nDostosowania modelu:\n"
            for adj in adjustments:
                context += f"- {adj.adjustment_type}: {adj.adjustment_value}\n"
        
        return context
    
    def get_custom_prompt(self, description_type, user_id=None):
        """Get custom prompt for a specific description type"""
        try:
            # Try to get user-specific prompt first
            if user_id:
                prompt = AIPrompt.query.filter_by(
                    user_id=user_id,
                    prompt_type=description_type,
                    is_active=True
                ).first()
                if prompt:
                    return prompt.content
            
            # Fallback to default prompts
            return None
        except Exception:
            return None
    
    def generate_guitar_description(self, input_text, user_id=None):
        """Generate guitar description using AI in Polish"""
        context = self.get_learning_context('guitar')
        
        # Try to get custom prompt first
        custom_prompt = self.get_custom_prompt('guitar', user_id)
        
        if custom_prompt:
            # Use custom prompt with context
            prompt = f"""{custom_prompt}

{context}

Informacje wejściowe: {input_text}"""
        else:
            # Use default prompt
            # Add Polish examples if no saved descriptions and examples exist
            if not context:
                try:
                    # Try to get Polish examples from config
                    if hasattr(Config, 'POLISH_GUITAR_EXAMPLES') and Config.POLISH_GUITAR_EXAMPLES:
                        context = "\n\nPrzykładowe opisy gitar:\n"
                        for example in Config.POLISH_GUITAR_EXAMPLES:
                            context += f"- {example}\n"
                    else:
                        # Fallback examples if config examples don't exist
                        context = "\n\nPrzykładowe opisy gitar:\n"
                        fallback_examples = [
                            "Fender Stratocaster to ikoniczna gitara elektryczna z charakterystycznym dźwiękiem idealnym do bluesa i rocka.",
                            "Gibson Les Paul to legenda wśród gitar elektrycznych znana z ciepłego, pełnego brzmienia."
                        ]
                        for example in fallback_examples:
                            context += f"- {example}\n"
                except Exception:
                    # If all else fails, use minimal context
                    context = "\n\nUżywaj polskiej terminologii muzycznej i technicznej."
            
            prompt = f"""Jesteś ekspertem w dziedzinie gitar z głęboką znajomością instrumentów muzycznych. Stwórz szczegółowy, angażujący opis gitary w języku polskim na podstawie poniższych informacji.

{context}

Informacje wejściowe: {input_text}

Proszę o kompleksowy opis w języku polskim, który zawiera:
- Specyfikacje techniczne
- Charakterystykę dźwięku
- Jakość wykonania i materiały
- Docelową grupę odbiorców
- Kontekst historyczny (jeśli istotny)

Opis powinien być informacyjny, ale dostępny zarówno dla początkujących, jak i doświadczonych graczy. Używaj polskiej terminologii muzycznej i technicznej."""
        
        return self._call_openai(prompt)
    
    def generate_company_description(self, input_text, user_id=None):
        """Generate company description using AI in Polish"""
        context = self.get_learning_context('company')
        
        # Try to get custom prompt first
        custom_prompt = self.get_custom_prompt('company', user_id)
        
        if custom_prompt:
            # Use custom prompt with context
            prompt = f"""{custom_prompt}

{context}

Informacje wejściowe: {input_text}"""
        else:
            # Use default prompt
            # Add Polish examples if no saved descriptions and examples exist
            if not context:
                try:
                    # Try to get Polish examples from config
                    if hasattr(Config, 'POLISH_COMPANY_EXAMPLES') and Config.POLISH_COMPANY_EXAMPLES:
                        context = "\n\nPrzykładowe opisy firm:\n"
                        for example in Config.POLISH_COMPANY_EXAMPLES:
                            context += f"- {example}\n"
                    else:
                        # Fallback examples if config examples don't exist
                        context = "\n\nPrzykładowe opisy firm:\n"
                        fallback_examples = [
                            "Fender to amerykański producent gitar elektrycznych znany z innowacyjnych rozwiązań.",
                            "Gibson to legenda wśród producentów gitar premium z długą tradycją."
                        ]
                        for example in fallback_examples:
                            context += f"- {example}\n"
                except Exception:
                    # If all else fails, use minimal context
                    context = "\n\nUżywaj polskiej terminologii biznesowej i muzycznej."
            
            prompt = f"""Jesteś ekspertem w dziedzinie produkcji gitar i historii firm muzycznych. Stwórz szczegółowy opis firmy produkującej gitary w języku polskim na podstawie poniższych informacji.

{context}

Informacje wejściowe: {input_text}

Proszę o kompleksowy opis w języku polskim, który zawiera:
- Historię firmy i jej założenie
- Znaczące osiągnięcia i innowacje
- Charakterystyczne produkty i modele
- Filozofię i wartości firmy
- Pozycję rynkową i reputację
- Kluczowe osoby i kamienie milowe

Opis powinien być angażujący i informacyjny dla entuzjastów gitar. Używaj polskiej terminologii biznesowej i muzycznej."""
        
        return self._call_openai(prompt)
    
    def _call_openai(self, prompt):
        """Make API call to OpenAI"""
        try:
            response = openai.ChatCompletion.create(
                model=Config.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "Jesteś ekspertem w dziedzinie gitar z głęboką znajomością instrumentów muzycznych, firm produkujących gitary i branży muzycznej. Zawsze odpowiadaj w języku polskim z poprawną gramatyką i terminologią muzyczną."},
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
