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

@saved_descriptions_bp.route('/<int:description_id>', methods=['GET'])
@login_required
def get_saved_description(description_id):
    """Get a single saved description"""
    try:
        print(f"Fetching description ID: {description_id} for user: {current_user.id}")
        
        description = SavedDescription.query.filter_by(
            id=description_id, 
            user_id=current_user.id
        ).first()
        
        if not description:
            print(f"Description not found for ID: {description_id}")
            return jsonify({
                'success': False,
                'error': 'Description not found'
            }), 404
        
        print(f"Found description: {description.title}")
        
        # Handle tags safely
        tags = []
        if description.tags:
            try:
                tags = json.loads(description.tags)
            except json.JSONDecodeError:
                # If tags is not valid JSON, treat it as a simple string
                tags = [description.tags] if description.tags.strip() else []
        
        response_data = {
            'success': True,
            'description': {
                'id': description.id,
                'title': description.title,
                'content': description.content,
                'type': description.description_type,
                'category': description.category,
                'tags': tags,
                'created_at': description.created_at.isoformat(),
                'is_public': description.is_public
            }
        }
        
        print(f"Returning response: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error in get_saved_description: {str(e)}")
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

@saved_descriptions_bp.route('/<int:description_id>/toggle-active', methods=['POST'])
@login_required
def toggle_description_active(description_id):
    """Toggle active status of a saved description"""
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
        
        description.is_public = not description.is_public
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Description status updated successfully',
            'is_public': description.is_public
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@saved_descriptions_bp.route('/debug/<int:description_id>', methods=['GET'])
@login_required
def debug_description(description_id):
    """Debug endpoint to test description retrieval"""
    try:
        print(f"Debug: Fetching description ID: {description_id}")
        
        # Get all descriptions for the user
        all_descriptions = SavedDescription.query.filter_by(user_id=current_user.id).all()
        print(f"Debug: User has {len(all_descriptions)} descriptions")
        
        for desc in all_descriptions:
            print(f"Debug: Description ID {desc.id}: {desc.title}")
        
        # Try to get the specific description
        description = SavedDescription.query.filter_by(
            id=description_id, 
            user_id=current_user.id
        ).first()
        
        if description:
            return jsonify({
                'success': True,
                'debug': {
                    'description_id': description_id,
                    'found': True,
                    'title': description.title,
                    'user_id': description.user_id,
                    'current_user_id': current_user.id
                }
            })
        else:
            return jsonify({
                'success': False,
                'debug': {
                    'description_id': description_id,
                    'found': False,
                    'user_id': current_user.id,
                    'available_ids': [desc.id for desc in all_descriptions]
                }
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
