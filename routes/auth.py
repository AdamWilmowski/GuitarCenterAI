from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from flask_login import login_user, logout_user, login_required
from models.user import get_user_by_username, verify_user

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Handle user login"""
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if verify_user(username, password):
            user = get_user_by_username(username)
            login_user(user)
            return redirect(url_for('main.index'))
        else:
            flash('Invalid username or password')
    
    return render_template('login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    """Handle user logout"""
    logout_user()
    # Clear session data
    session.clear()
    return redirect(url_for('auth.login'))

@auth_bp.route('/clear-session')
def clear_session():
    """Clear session data (for debugging)"""
    logout_user()
    session.clear()
    flash('Session cleared successfully')
    return redirect(url_for('auth.login'))
