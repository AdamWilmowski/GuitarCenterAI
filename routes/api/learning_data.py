from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from models.descriptions import SavedDescription, ReturnedDescription, ModelCorrection
import json

learning_data_bp = Blueprint('learning_data', __name__, url_prefix='/api/learning-data')

@learning_data_bp.route('/dashboard', methods=['GET'])
@login_required
def get_learning_data():
    """Get learning data for dashboard display"""
    try:
        # Get recent corrections
        corrections = ModelCorrection.query.filter_by(user_id=current_user.id)\
            .order_by(ModelCorrection.created_at.desc())\
            .limit(10).all()
        
        # Get saved descriptions
        saved_descriptions = SavedDescription.query.filter_by(user_id=current_user.id)\
            .order_by(SavedDescription.created_at.desc())\
            .limit(10).all()
        
        # Get recent returned descriptions
        returned_descriptions = ReturnedDescription.query.filter_by(user_id=current_user.id)\
            .order_by(ReturnedDescription.created_at.desc())\
            .limit(10).all()
        
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
                    'notes': c.notes
                } for c in corrections
            ],
            'saved_descriptions': [
                {
                    'id': s.id,
                    'title': s.title,
                    'content': s.content,
                    'type': s.description_type,
                    'category': s.category,
                    'tags': s.tags if s.tags else '',
                    'timestamp': s.created_at.isoformat(),
                    'is_public': s.is_public
                } for s in saved_descriptions
            ],
            'returned_descriptions': [
                {
                    'id': r.id,
                    'input_text': r.input_text,
                    'generated_description': r.generated_description,
                    'type': r.description_type,
                    'timestamp': r.created_at.isoformat(),
                    'tokens_used': r.tokens_used,
                    'processing_time': r.processing_time
                } for r in returned_descriptions
            ]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@learning_data_bp.route('/stats', methods=['GET'])
@login_required
def get_user_stats():
    """Get user statistics"""
    try:
        total_corrections = ModelCorrection.query.filter_by(user_id=current_user.id).count()
        total_saved = SavedDescription.query.filter_by(user_id=current_user.id).count()
        total_generated = ReturnedDescription.query.filter_by(user_id=current_user.id).count()
        
        # Get recent activity count (last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        recent_corrections = ModelCorrection.query.filter(
            ModelCorrection.user_id == current_user.id,
            ModelCorrection.created_at >= week_ago
        ).count()
        
        recent_generated = ReturnedDescription.query.filter(
            ReturnedDescription.user_id == current_user.id,
            ReturnedDescription.created_at >= week_ago
        ).count()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_corrections': total_corrections,
                'total_saved_descriptions': total_saved,
                'total_generated_descriptions': total_generated,
                'recent_corrections': recent_corrections,
                'recent_generated': recent_generated
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
