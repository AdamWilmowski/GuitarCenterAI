from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models.database import db
from models.descriptions import SavedDescription
from utils.ai_service import AIService
import json

saved_descriptions_bp = Blueprint('saved_descriptions', __name__, url_prefix='/api/saved-descriptions')

@saved_descriptions_bp.route('/save', methods=['POST'])
@login_required
def save_description():
    """Save a description as reference"""
    try:
        data = request.get_json()
        title = data.get('title')
        content = data.get('content')
        description_type = data.get('type')
        category = data.get('category', '')
        tags = data.get('tags', [])
        is_public = data.get('is_public', False)
        
        if not title or not content or not description_type:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: title, content, and type'
            }), 400
        
        saved_desc = SavedDescription(
            title=title,
            content=content,
            description_type=description_type,
            category=category,
            tags=json.dumps(tags),
            user_id=current_user.id,
            is_public=is_public
        )
        
        db.session.add(saved_desc)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Description saved successfully',
            'description_id': saved_desc.id
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@saved_descriptions_bp.route('/list', methods=['GET'])
@login_required
def list_saved_descriptions():
    """Get user's saved descriptions"""
    try:
        descriptions = SavedDescription.query.filter_by(user_id=current_user.id)\
            .order_by(SavedDescription.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'descriptions': [
                {
                    'id': desc.id,
                    'title': desc.title,
                    'content': desc.content,
                    'type': desc.description_type,
                    'category': desc.category,
                    'tags': json.loads(desc.tags) if desc.tags else [],
                    'created_at': desc.created_at.isoformat(),
                    'is_public': desc.is_public
                } for desc in descriptions
            ]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@saved_descriptions_bp.route('/<int:description_id>', methods=['DELETE'])
@login_required
def delete_saved_description(description_id):
    """Delete a saved description"""
    try:
        description = SavedDescription.query.filter_by(
            id=description_id, 
            user_id=current_user.id
        ).first()
        
        if not description:
            return jsonify({
                'success': False,
                'error': 'Description not found'
            }), 404
        
        db.session.delete(description)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Description deleted successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@saved_descriptions_bp.route('/suggest-metadata', methods=['POST'])
@login_required
def suggest_metadata():
    """Suggest category and tags for a description"""
    try:
        data = request.get_json()
        content = data.get('content')
        description_type = data.get('type')
        
        if not content or not description_type:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: content and type'
            }), 400
        
        ai_service = AIService()
        result = ai_service.suggest_metadata(content, description_type)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
