import openai
import random
from config.settings import Config
from models.database import db
from models.descriptions import SavedDescription, ModelCorrection, ModelAdjustment, AIPrompt
import json

class AIService:
    """Service class for AI operations"""
    
    def __init__(self):
        openai.api_key = Config.OPENAI_API_KEY
    
    def get_learning_context(self, description_type=None, input_text=None):
        """Get learning context from database with smart filtering"""
        context = ""
        
        # Get random corrections (up to 5)
        corrections_query = ModelCorrection.query.filter_by(is_applied=False)
        if description_type:
            corrections_query = corrections_query.filter_by(description_type=description_type)
        
        # Get all corrections and randomly select up to 5
        all_corrections = corrections_query.all()
        if all_corrections:
            # Randomly select up to 5 corrections
            selected_corrections = random.sample(all_corrections, min(5, len(all_corrections)))
            context += "\n\nPoprzednie poprawki do uwzględnienia:\n"
            for correction in selected_corrections:
                context += f"- {correction.original_text} → {correction.corrected_text}\n"
        
        # Get smart-filtered saved descriptions as examples
        saved_descriptions = self._get_smart_examples(description_type, input_text)
        if saved_descriptions:
            context += "\n\nPrzykładowe opisy:\n"
            for desc in saved_descriptions:
                # Include metadata in the context for better AI understanding
                metadata_info = f"[{desc.category}]"
                if desc.tags:
                    try:
                        tags_list = json.loads(desc.tags) if desc.tags.startswith('[') else desc.tags.split(',')
                        if tags_list:
                            metadata_info += f" (tagi: {', '.join(tags_list)})"
                    except:
                        if desc.tags.strip():
                            metadata_info += f" (tagi: {desc.tags})"
                
                context += f"- {metadata_info} {desc.content}\n"
        
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
    
    def _get_smart_examples(self, description_type, input_text=None):
        """Get smart-filtered examples based on input text and metadata"""
        saved_query = SavedDescription.query.filter_by(is_public=True)
        if description_type:
            saved_query = saved_query.filter_by(description_type=description_type)
        
        all_descriptions = saved_query.all()
        if not all_descriptions:
            return []
        
        # If we have input text, try to find relevant examples
        if input_text:
            relevant_examples = self._find_relevant_examples(all_descriptions, input_text)
            if relevant_examples:
                return relevant_examples[:3]  # Return up to 3 most relevant
        
        # Fallback to random selection
        return random.sample(all_descriptions, min(3, len(all_descriptions)))
    
    def _find_relevant_examples(self, descriptions, input_text):
        """Find most relevant examples based on input text and metadata"""
        scored_examples = []
        
        # Convert input text to lowercase for comparison
        input_lower = input_text.lower()
        
        for desc in descriptions:
            score = 0
            
            # Score based on category match
            if desc.category and desc.category.lower() in input_lower:
                score += 3
            
            # Score based on title match
            if desc.title and desc.title.lower() in input_lower:
                score += 2
            
            # Score based on tag matches
            if desc.tags:
                try:
                    tags_list = json.loads(desc.tags) if desc.tags.startswith('[') else desc.tags.split(',')
                    for tag in tags_list:
                        tag_clean = tag.strip().lower()
                        if tag_clean and tag_clean in input_lower:
                            score += 1
                except:
                    # Handle simple comma-separated tags
                    tags_list = desc.tags.split(',')
                    for tag in tags_list:
                        tag_clean = tag.strip().lower()
                        if tag_clean and tag_clean in input_lower:
                            score += 1
            
            # Score based on content keywords
            content_lower = desc.content.lower()
            input_words = input_lower.split()
            for word in input_words:
                if len(word) > 3 and word in content_lower:  # Only consider words longer than 3 chars
                    score += 0.5
            
            if score > 0:
                scored_examples.append((desc, score))
        
        # Sort by score (highest first) and return descriptions
        scored_examples.sort(key=lambda x: x[1], reverse=True)
        return [desc for desc, score in scored_examples]
        
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
        context = self.get_learning_context('guitar', input_text)
        
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

Uwaga: Przykłady zawierają metadane w nawiasach kwadratowych [kategoria] i (tagi: tag1, tag2). Użyj tych informacji, aby lepiej zrozumieć kontekst i styl opisu.

Proszę o kompleksowy opis w języku polskim, który zawiera:
- Specyfikacje techniczne
- Charakterystykę dźwięku
- Jakość wykonania i materiały
- Docelową grupę odbiorców
- Kontekst historyczny (jeśli istotny)

Opis powinien być informacyjny, ale dostępny zarówno dla początkujących, jak i doświadczonych graczy. Używaj polskiej terminologii muzycznej i technicznej. Dostosuj styl do kategorii i tagów z przykładów, jeśli są dostępne."""
        
        return self._call_openai(prompt)
    
    def generate_company_description(self, input_text, user_id=None):
        """Generate company description using AI in Polish"""
        context = self.get_learning_context('company', input_text)
        
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

Uwaga: Przykłady zawierają metadane w nawiasach kwadratowych [kategoria] i (tagi: tag1, tag2). Użyj tych informacji, aby lepiej zrozumieć kontekst i styl opisu.

Proszę o kompleksowy opis w języku polskim, który zawiera:
- Historię firmy i jej założenie
- Znaczące osiągnięcia i innowacje
- Charakterystyczne produkty i modele
- Filozofię i wartości firmy
- Pozycję rynkową i reputację
- Kluczowe osoby i kamienie milowe

Opis powinien być angażujący i informacyjny dla entuzjastów gitar. Używaj polskiej terminologii biznesowej i muzycznej. Dostosuj styl do kategorii i tagów z przykładów, jeśli są dostępne."""
        
        return self._call_openai(prompt)
    
    def suggest_metadata(self, content, description_type):
        """Suggest category and tags based on content"""
        try:
            prompt = f"""Analizując poniższy opis {description_type}, zaproponuj:
1. Kategorię (jedno słowo lub krótka fraza)
2. 3-5 tagów (słowa kluczowe oddzielone przecinkami)

Opis: {content[:500]}...

Odpowiedz w formacie JSON:
{{
    "category": "nazwa kategorii",
    "tags": "tag1, tag2, tag3, tag4"
}}"""

            response = openai.ChatCompletion.create(
                model=Config.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "Jesteś ekspertem w kategoryzacji opisów gitar i firm muzycznych. Odpowiadaj tylko w formacie JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            result = json.loads(response.choices[0].message.content.strip())
            return {
                'success': True,
                'category': result.get('category', ''),
                'tags': result.get('tags', '')
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'category': '',
                'tags': ''
            }
    
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
