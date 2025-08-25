from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models.database import db
from models.descriptions import ModelCorrection
import json

corrections_bp = Blueprint('corrections', __name__, url_prefix='/api/corrections')

@corrections_bp.route('/submit', methods=['POST'])
@login_required
def submit_correction():
    """Submit a correction to learning data"""
    try:
        data = request.get_json()
        original_text = data.get('original_text')
        corrected_text = data.get('corrected_text')
        description_type = data.get('type')
        description_id = data.get('description_id')
        correction_type = data.get('correction_type', 'general')
        notes = data.get('notes', '')
        
        if not original_text or not corrected_text or not description_type:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: original_text, corrected_text, and type'
            }), 400
        
        correction = ModelCorrection(
            original_text=original_text,
            corrected_text=corrected_text,
            description_type=description_type,
            correction_type=correction_type,
            user_id=current_user.id,
            returned_description_id=description_id,
            notes=notes
        )
        
        db.session.add(correction)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Correction saved successfully',
            'correction_id': correction.id
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@corrections_bp.route('/list', methods=['GET'])
@login_required
def list_corrections():
    """Get user's corrections"""
    try:
        corrections = ModelCorrection.query.filter_by(user_id=current_user.id)\
            .order_by(ModelCorrection.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'corrections': [
                {
                    'id': c.id,
                    'original': c.original_text,
                    'corrected': c.corrected_text,
                    'type': c.description_type,
                    'correction_type': c.correction_type,
                    'timestamp': c.created_at.isoformat(),
                    'notes': c.notes,
                    'is_applied': c.is_applied
                } for c in corrections
            ]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@corrections_bp.route('/<int:correction_id>/apply', methods=['POST'])
@login_required
def apply_correction(correction_id):
    """Mark a correction as applied"""
    try:
        correction = ModelCorrection.query.filter_by(
            id=correction_id, 
            user_id=current_user.id
        ).first()
        
        if not correction:
            return jsonify({
                'success': False,
                'error': 'Correction not found'
            }), 404
        
        correction.is_applied = True
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Correction marked as applied'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
