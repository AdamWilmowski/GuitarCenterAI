from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
from utils.ai_service import AIService
from utils.learning_data import load_learning_data, add_correction, add_example

main_bp = Blueprint('main', __name__)
ai_service = AIService()

@main_bp.route('/')
@login_required
def index():
    """Main application page"""
    return render_template('index.html')

@main_bp.route('/generate_description', methods=['POST'])
@login_required
def generate_description():
    """Generate AI description"""
    try:
        data = request.get_json()
        description_type = data.get('type')  # 'guitar' or 'company'
        input_text = data.get('input_text')
        
        if description_type == 'guitar':
            result = ai_service.generate_guitar_description(input_text)
        else:
            result = ai_service.generate_company_description(input_text)
        
        if result['success']:
            return jsonify({
                'success': True,
                'description': result['description'],
                'type': description_type
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@main_bp.route('/submit_correction', methods=['POST'])
@login_required
def submit_correction():
    """Submit a correction to learning data"""
    try:
        data = request.get_json()
        original_text = data.get('original_text')
        corrected_text = data.get('corrected_text')
        description_type = data.get('type')
        
        add_correction(original_text, corrected_text, description_type, current_user.id)
        
        return jsonify({
            'success': True,
            'message': 'Correction saved successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@main_bp.route('/add_example', methods=['POST'])
@login_required
def add_example_route():
    """Add an example to learning data"""
    try:
        data = request.get_json()
        example_text = data.get('example_text')
        description_type = data.get('type')
        
        add_example(example_text, description_type, current_user.id)
        
        return jsonify({
            'success': True,
            'message': 'Example saved successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@main_bp.route('/learning_data')
@login_required
def get_learning_data():
    """Get learning data for display"""
    learning_data = load_learning_data()
    return jsonify(learning_data)
