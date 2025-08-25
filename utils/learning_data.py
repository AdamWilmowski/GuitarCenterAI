import json
import os
from datetime import datetime
from config.settings import Config

def load_learning_data():
    """Load existing learning data from file"""
    if os.path.exists(Config.LEARNING_DATA_FILE):
        with open(Config.LEARNING_DATA_FILE, 'r') as f:
            return json.load(f)
    return {'corrections': [], 'examples': []}

def save_learning_data(data):
    """Save learning data to file"""
    with open(Config.LEARNING_DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def add_correction(original_text, corrected_text, description_type, user_id):
    """Add a correction to learning data"""
    learning_data = load_learning_data()
    
    correction = {
        'original': original_text,
        'corrected': corrected_text,
        'type': description_type,
        'timestamp': datetime.now().isoformat(),
        'user': user_id
    }
    
    learning_data['corrections'].append(correction)
    save_learning_data(learning_data)
    return True

def add_example(example_text, description_type, user_id):
    """Add an example to learning data"""
    learning_data = load_learning_data()
    
    example = {
        'text': example_text,
        'type': description_type,
        'timestamp': datetime.now().isoformat(),
        'user': user_id
    }
    
    learning_data['examples'].append(example)
    save_learning_data(learning_data)
    return True

def get_learning_context():
    """Get learning context for AI prompts"""
    learning_data = load_learning_data()
    context = ""
    
    if learning_data['corrections']:
        context += "\n\nPrevious corrections to consider:\n"
        for correction in learning_data['corrections'][-5:]:  # Last 5 corrections
            context += f"- {correction['original']} → {correction['corrected']}\n"
    
    if learning_data['examples']:
        context += "\n\nExample descriptions:\n"
        for example in learning_data['examples'][-3:]:  # Last 3 examples
            context += f"- {example['text']}\n"
    
    return context
