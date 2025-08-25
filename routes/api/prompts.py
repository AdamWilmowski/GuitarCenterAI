from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models.database import db
from models.descriptions import AIPrompt
from datetime import datetime

prompts_bp = Blueprint('prompts', __name__, url_prefix='/api/prompts')

@prompts_bp.route('/list', methods=['GET'])
@login_required
def list_prompts():
    """List all prompts for the current user"""
    try:
        prompts = AIPrompt.query.filter_by(user_id=current_user.id).order_by(AIPrompt.created_at.desc()).all()
        
        prompts_data = []
        for prompt in prompts:
            prompts_data.append({
                'id': prompt.id,
                'prompt_type': prompt.prompt_type,
                'title': prompt.title,
                'content': prompt.content,
                'is_active': prompt.is_active,
                'version': prompt.version,
                'created_at': prompt.created_at.isoformat() if prompt.created_at else None,
                'updated_at': prompt.updated_at.isoformat() if prompt.updated_at else None
            })
        
        return jsonify({
            'success': True,
            'prompts': prompts_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Błąd podczas pobierania promptów: {str(e)}'
        }), 500

@prompts_bp.route('/add', methods=['POST'])
@login_required
def add_prompt():
    """Add a new AI prompt"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['prompt_type', 'title', 'content']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Pole {field} jest wymagane'
                }), 400
        
        # Validate prompt type
        if data['prompt_type'] not in ['guitar', 'company']:
            return jsonify({
                'success': False,
                'error': 'Typ promptu musi być "guitar" lub "company"'
            }), 400
        
        # Deactivate other prompts of the same type
        if data.get('is_active', True):
            AIPrompt.query.filter_by(
                user_id=current_user.id,
                prompt_type=data['prompt_type'],
                is_active=True
            ).update({'is_active': False})
        
        # Create the prompt
        prompt = AIPrompt(
            prompt_type=data['prompt_type'],
            title=data['title'],
            content=data['content'],
            is_active=data.get('is_active', True),
            user_id=current_user.id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.session.add(prompt)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Prompt został dodany pomyślnie',
            'prompt_id': prompt.id
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Błąd podczas dodawania promptu: {str(e)}'
        }), 500

@prompts_bp.route('/<int:prompt_id>', methods=['PUT'])
@login_required
def update_prompt(prompt_id):
    """Update an existing AI prompt"""
    try:
        prompt = AIPrompt.query.filter_by(
            id=prompt_id,
            user_id=current_user.id
        ).first()
        
        if not prompt:
            return jsonify({
                'success': False,
                'error': 'Prompt nie został znaleziony'
            }), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'title' in data:
            prompt.title = data['title']
        if 'content' in data:
            prompt.content = data['content']
        if 'is_active' in data:
            # If activating this prompt, deactivate others of the same type
            if data['is_active']:
                AIPrompt.query.filter_by(
                    user_id=current_user.id,
                    prompt_type=prompt.prompt_type,
                    is_active=True
                ).filter(AIPrompt.id != prompt_id).update({'is_active': False})
            prompt.is_active = data['is_active']
        
        prompt.updated_at = datetime.utcnow()
        prompt.version += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Prompt został zaktualizowany pomyślnie'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Błąd podczas aktualizacji promptu: {str(e)}'
        }), 500

@prompts_bp.route('/<int:prompt_id>', methods=['DELETE'])
@login_required
def delete_prompt(prompt_id):
    """Delete an AI prompt"""
    try:
        prompt = AIPrompt.query.filter_by(
            id=prompt_id,
            user_id=current_user.id
        ).first()
        
        if not prompt:
            return jsonify({
                'success': False,
                'error': 'Prompt nie został znaleziony'
            }), 404
        
        db.session.delete(prompt)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Prompt został usunięty pomyślnie'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Błąd podczas usuwania promptu: {str(e)}'
        }), 500

@prompts_bp.route('/active/<prompt_type>', methods=['GET'])
@login_required
def get_active_prompt(prompt_type):
    """Get the active prompt for a specific type"""
    try:
        if prompt_type not in ['guitar', 'company']:
            return jsonify({
                'success': False,
                'error': 'Typ promptu musi być "guitar" lub "company"'
            }), 400
        
        prompt = AIPrompt.query.filter_by(
            user_id=current_user.id,
            prompt_type=prompt_type,
            is_active=True
        ).first()
        
        if not prompt:
            return jsonify({
                'success': False,
                'error': 'Brak aktywnego promptu dla tego typu'
            }), 404
        
        return jsonify({
            'success': True,
            'prompt': {
                'id': prompt.id,
                'prompt_type': prompt.prompt_type,
                'title': prompt.title,
                'content': prompt.content,
                'version': prompt.version
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Błąd podczas pobierania aktywnego promptu: {str(e)}'
        }), 500

@prompts_bp.route('/activate/<int:prompt_id>', methods=['POST'])
@login_required
def activate_prompt(prompt_id):
    """Activate a specific prompt and deactivate others of the same type"""
    try:
        prompt = AIPrompt.query.filter_by(
            id=prompt_id,
            user_id=current_user.id
        ).first()
        
        if not prompt:
            return jsonify({
                'success': False,
                'error': 'Prompt nie został znaleziony'
            }), 404
        
        # Deactivate other prompts of the same type
        AIPrompt.query.filter_by(
            user_id=current_user.id,
            prompt_type=prompt.prompt_type,
            is_active=True
        ).update({'is_active': False})
        
        # Activate this prompt
        prompt.is_active = True
        prompt.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Prompt został aktywowany pomyślnie'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Błąd podczas aktywacji promptu: {str(e)}'
        }), 500
