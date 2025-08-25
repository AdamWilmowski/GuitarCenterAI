from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models.database import db
from models.descriptions import ReturnedDescription
from utils.ai_service import AIService
import time

descriptions_bp = Blueprint('descriptions', __name__, url_prefix='/api/descriptions')
ai_service = AIService()

@descriptions_bp.route('/generate', methods=['POST'])
@login_required
def generate_description():
    """Generate AI description"""
    try:
        data = request.get_json()
        description_type = data.get('type')  # 'guitar' or 'company'
        input_text = data.get('input_text')
        
        if not input_text or not description_type:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: input_text and type'
            }), 400
        
        start_time = time.time()
        
        if description_type == 'guitar':
            result = ai_service.generate_guitar_description(input_text, current_user.id)
        else:
            result = ai_service.generate_company_description(input_text, current_user.id)
        
        processing_time = time.time() - start_time
        
        if result['success']:
            # Save the returned description to database
            returned_desc = ReturnedDescription(
                input_text=input_text,
                generated_description=result['description'],
                description_type=description_type,
                user_id=current_user.id,
                tokens_used=result.get('tokens_used'),
                model_version=result.get('model_version'),
                processing_time=processing_time
            )
            db.session.add(returned_desc)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'description': result['description'],
                'type': description_type,
                'description_id': returned_desc.id,
                'processing_time': processing_time
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

@descriptions_bp.route('/<int:description_id>', methods=['GET'])
@login_required
def get_generated_description(description_id):
    """Get a single generated description"""
    try:
        description = ReturnedDescription.query.filter_by(
            id=description_id, 
            user_id=current_user.id
        ).first()
        
        if not description:
            return jsonify({
                'success': False,
                'error': 'Description not found'
            }), 404
        
        return jsonify({
            'success': True,
            'description': {
                'id': description.id,
                'input_text': description.input_text,
                'generated_description': description.generated_description,
                'type': description.description_type,
                'created_at': description.created_at.isoformat(),
                'tokens_used': description.tokens_used,
                'model_version': description.model_version,
                'processing_time': description.processing_time
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
