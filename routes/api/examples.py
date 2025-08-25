from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models.database import db
from models.descriptions import SavedDescription
from datetime import datetime
import json

examples_bp = Blueprint('examples', __name__, url_prefix='/api/examples')

@examples_bp.route('/add', methods=['POST'])
@login_required
def add_example():
    """Add a new manual example description"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['type', 'content', 'title', 'category']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Pole {field} jest wymagane'
                }), 400
        
        # Validate type
        if data['type'] not in ['guitar', 'company']:
            return jsonify({
                'success': False,
                'error': 'Typ musi być "guitar" lub "company"'
            }), 400
        
        # Create the example using SavedDescription model
        example = SavedDescription(
            title=data['title'],
            content=data['content'],
            description_type=data['type'],
            category=data['category'],
            tags=data.get('tags', ''),
            user_id=current_user.id,
            is_public=True,  # Manual examples are always public for learning
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.session.add(example)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Przykład został dodany pomyślnie',
            'example_id': example.id
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Błąd podczas dodawania przykładu: {str(e)}'
        }), 500

@examples_bp.route('/list', methods=['GET'])
@login_required
def list_examples():
    """List all manual examples for the current user"""
    try:
        examples = SavedDescription.query.filter_by(
            user_id=current_user.id,
            is_public=True
        ).order_by(SavedDescription.created_at.desc()).all()
        
        examples_data = []
        for example in examples:
            examples_data.append({
                'id': example.id,
                'title': example.title,
                'content': example.content,
                'type': example.description_type,
                'category': example.category,
                'tags': example.tags,
                'created_at': example.created_at.isoformat() if example.created_at else None,
                'updated_at': example.updated_at.isoformat() if example.updated_at else None
            })
        
        return jsonify({
            'success': True,
            'examples': examples_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Błąd podczas pobierania przykładów: {str(e)}'
        }), 500

@examples_bp.route('/<int:example_id>', methods=['DELETE'])
@login_required
def delete_example(example_id):
    """Delete a manual example"""
    try:
        example = SavedDescription.query.filter_by(
            id=example_id,
            user_id=current_user.id,
            is_public=True
        ).first()
        
        if not example:
            return jsonify({
                'success': False,
                'error': 'Przykład nie został znaleziony'
            }), 404
        
        db.session.delete(example)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Przykład został usunięty pomyślnie'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Błąd podczas usuwania przykładu: {str(e)}'
        }), 500

@examples_bp.route('/<int:example_id>', methods=['PUT'])
@login_required
def update_example(example_id):
    """Update a manual example"""
    try:
        example = SavedDescription.query.filter_by(
            id=example_id,
            user_id=current_user.id,
            is_public=True
        ).first()
        
        if not example:
            return jsonify({
                'success': False,
                'error': 'Przykład nie został znaleziony'
            }), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'title' in data:
            example.title = data['title']
        if 'content' in data:
            example.content = data['content']
        if 'category' in data:
            example.category = data['category']
        if 'tags' in data:
            example.tags = data['tags']
        if 'type' in data and data['type'] in ['guitar', 'company']:
            example.description_type = data['type']
        
        example.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Przykład został zaktualizowany pomyślnie'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Błąd podczas aktualizacji przykładu: {str(e)}'
        }), 500

@examples_bp.route('/public', methods=['GET'])
@login_required
def list_public_examples():
    """List all public examples (for learning context)"""
    try:
        examples = SavedDescription.query.filter_by(
            is_public=True
        ).order_by(SavedDescription.created_at.desc()).limit(50).all()
        
        examples_data = []
        for example in examples:
            examples_data.append({
                'id': example.id,
                'title': example.title,
                'content': example.content,
                'type': example.description_type,
                'category': example.category,
                'tags': example.tags
            })
        
        return jsonify({
            'success': True,
            'examples': examples_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Błąd podczas pobierania publicznych przykładów: {str(e)}'
        }), 500 
