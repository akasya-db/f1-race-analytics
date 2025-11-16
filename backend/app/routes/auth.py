
from flask import Blueprint, request, render_template, redirect, url_for, flash, session
import os
import bcrypt
from app.database import DatabaseConnection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/')
def index():
    """
    Index page that serves both authenticated and non-authenticated users
    If user is logged in, shows dashboard
    If user is not logged in, shows landing page with login/register options
    """
    if 'username' in session:
        # User is logged in, show dashboard
        return render_template('index.html', 
                             authenticated=True,
                             username=session['username'],
                             email=session['email'])
    else:
        # User is not logged in, show landing page
        return render_template('index.html', authenticated=False)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            flash('Username and password are required.')
            return render_template('register.html')
            
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        db = DatabaseConnection()
        try:
            # Generate a unique user ID
            import uuid
            user_id = str(uuid.uuid4())
            
            # Insert into the "user" table with required fields
            db.execute('INSERT INTO "user" (id, username, password_hash, email) VALUES (%s, %s, %s, %s)', 
                      (user_id, username, hashed_pw.decode('utf-8'), f"{username}@example.com"))
            db.commit()
            
            flash('Registration successful!')
            return redirect(url_for('auth.login'))
        except Exception as e:
            flash('Registration failed: ' + str(e))
            return render_template('register.html')
        finally:
            db.close()
    return render_template('register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        db = DatabaseConnection()
        try:
            db.execute('SELECT * FROM "user" WHERE username = %s', (username,))
            user = db.fetchone()
            if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                session['user_id'] = user['id']
                session['username'] = user['username']
                session['email'] = user['email']
                flash('Login successful!')
                return redirect(url_for('auth.index'))
            else:
                flash('Invalid username or password.')
        finally:
            db.close()
    return render_template('login.html')

@auth_bp.route('/logout')
def logout():
    """Logout user and clear session"""
    session.clear()
    flash('You have been logged out successfully.')
    return redirect(url_for('auth.index'))

@auth_bp.route('/profile', methods=['GET'])
def profile():
    """Profile page - show user profile data"""
    if 'user_id' not in session:
        flash('Please login to access your profile.')
        return redirect(url_for('auth.login'))
    
    db = DatabaseConnection()
    try:
        # Get user data
        db.execute('SELECT * FROM "user" WHERE id = %s', (session['user_id'],))
        user = db.fetchone()
        
        if not user:
            flash('User not found.')
            session.clear()
            return redirect(url_for('auth.login'))
        
        # Get all countries for dropdown
        db.execute('SELECT id, name, alpha3_code FROM country ORDER BY name')
        countries = db.fetchall()
        
        return render_template('profile.html',
                             user=user,
                             countries=countries,
                             username=session['username'],
                             email=session['email'])
    finally:
        db.close()

@auth_bp.route('/profile/update', methods=['POST'])
def update_profile():
    """Update user profile"""
    if 'user_id' not in session:
        flash('Please login to update your profile.')
        return redirect(url_for('auth.login'))
    
    username = request.form.get('username')
    email = request.form.get('email')
    country_id = request.form.get('country_id')
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    
    db = DatabaseConnection()
    try:
        # Get current user data
        db.execute('SELECT * FROM "user" WHERE id = %s', (session['user_id'],))
        user = db.fetchone()
        
        if not user:
            flash('User not found.')
            return redirect(url_for('auth.profile'))
        
        # Check if username is being changed and if it's already taken
        if username and username != user['username']:
            db.execute('SELECT id FROM "user" WHERE username = %s AND id != %s', (username, session['user_id']))
            if db.fetchone():
                flash('Username already taken.')
                return redirect(url_for('auth.profile'))
        
        # Check if email is being changed and if it's already taken
        if email and email != user['email']:
            db.execute('SELECT id FROM "user" WHERE email = %s AND id != %s', (email, session['user_id']))
            if db.fetchone():
                flash('Email already taken.')
                return redirect(url_for('auth.profile'))
        
        # If password change is requested, verify current password
        if new_password:
            if not current_password:
                flash('Current password is required to change password.')
                return redirect(url_for('auth.profile'))
            
            if not bcrypt.checkpw(current_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                flash('Current password is incorrect.')
                return redirect(url_for('auth.profile'))
            
            # Hash new password
            hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
            db.execute('UPDATE "user" SET username = %s, email = %s, password_hash = %s, country_id = %s WHERE id = %s',
                      (username or user['username'], 
                       email or user['email'], 
                       hashed_pw.decode('utf-8'),
                       country_id if country_id else user['country_id'],
                       session['user_id']))
        else:
            # Update without password change
            db.execute('UPDATE "user" SET username = %s, email = %s, country_id = %s WHERE id = %s',
                      (username or user['username'], 
                       email or user['email'],
                       country_id if country_id else user['country_id'],
                       session['user_id']))
        
        db.commit()
        
        # Update session
        session['username'] = username or user['username']
        session['email'] = email or user['email']
        
        flash('Profile updated successfully!')
        return redirect(url_for('auth.profile'))
    except Exception as e:
        flash('Update failed: ' + str(e))
        return redirect(url_for('auth.profile'))
    finally:
        db.close()

@auth_bp.route('/profile/delete', methods=['POST'])
def delete_account():
    """Delete user account"""
    if 'user_id' not in session:
        flash('Please login to delete your account.')
        return redirect(url_for('auth.login'))
    
    password = request.form.get('password')
    
    if not password:
        flash('Password is required to delete account.')
        return redirect(url_for('auth.profile'))
    
    db = DatabaseConnection()
    try:
        # Verify password
        db.execute('SELECT * FROM "user" WHERE id = %s', (session['user_id'],))
        user = db.fetchone()
        
        if not user:
            flash('User not found.')
            return redirect(url_for('auth.profile'))
        
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            flash('Password is incorrect.')
            return redirect(url_for('auth.profile'))
        
        # Delete user account
        db.execute('DELETE FROM "user" WHERE id = %s', (session['user_id'],))
        db.commit()
        
        # Clear session
        session.clear()
        
        flash('Your account has been deleted successfully.')
        return redirect(url_for('auth.index'))
    except Exception as e:
        flash('Account deletion failed: ' + str(e))
        return redirect(url_for('auth.profile'))
    finally:
        db.close()