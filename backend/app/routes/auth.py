
from flask import Blueprint, request, render_template, redirect, url_for, flash, session, current_app
import bcrypt
import secrets
from datetime import datetime, timedelta
from app.database import DatabaseConnection
from collections.abc import Mapping
from app.email_utils import send_verification_email
from app.config import Config

auth_bp = Blueprint('auth', __name__)

def _next_session_expiry_timestamp() -> float:
    timeout = max(1, Config.SESSION_TIMEOUT_MINUTES)
    return (datetime.utcnow() + timedelta(minutes=timeout)).timestamp()


def _send_or_refresh_verification(db: DatabaseConnection, user_row) -> None:
    """Ensure the user has an active verification token and send the email."""
    token = secrets.token_urlsafe(48)
    db.execute(
        '''UPDATE "user"
           SET email_verification_token = %s,
               verification_sent_at = NOW()
           WHERE id = %s''',
        (token, user_row['id'])
    )
    db.commit()
    verify_url = url_for('auth.verify_email', token=token, _external=True)
    send_verification_email(user_row['username'], user_row['email'], verify_url)

@auth_bp.route('/')
def index():
    """
    Index page that serves both authenticated and non-authenticated users
    If user is logged in, shows dashboard
    If user is not logged in, shows landing page with login/register options
    """
    is_admin = session.get('is_admin', False)
    current_app.logger.debug("Index view: user=%s, is_admin=%s", session.get('username'), is_admin)
    if 'username' in session:
        # User is logged in, show dashboard
        return render_template('index.html', 
                             authenticated=True,
                             username=session['username'],
                             email=session['email'],
                             is_admin=is_admin)
    else:
        # User is not logged in, show landing page
        return render_template('index.html', authenticated=False, is_admin=is_admin)

@auth_bp.route('/learn-more')
def learn_more_page():
    """Public marketing/overview page linked from the landing CTA."""
    authenticated = 'username' in session
    return render_template(
        'learn_more.html',
        authenticated=authenticated,
        username=session.get('username'),
        is_admin=session.get('is_admin', False)
    )

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    db = DatabaseConnection()
    try:
        def fetch_countries():
            db.execute('SELECT id, name, alpha3_code FROM country ORDER BY name')
            return db.fetchall()
        
        form_data = {'username': '', 'email': '', 'country_id': ''}
        
        if request.method == 'POST':
            username = (request.form.get('username') or '').strip()
            email = (request.form.get('email') or '').strip()
            password = request.form.get('password')
            country_id = request.form.get('country_id') or ''
            
            form_data = {'username': username, 'email': email, 'country_id': country_id}
            
            if not username or not email or not password:
                flash('Username, email, and password are required.', 'error')
                return render_template('register.html', countries=fetch_countries(), form_data=form_data)
            
            if '@' not in email or '.' not in email:
                flash('Please enter a valid email address.', 'error')
                return render_template('register.html', countries=fetch_countries(), form_data=form_data)
            
            hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            
            try:
                import uuid
                user_id = str(uuid.uuid4())
                
                # Ensure username is unique
                db.execute('SELECT id FROM "user" WHERE username = %s', (username,))
                if db.fetchone():
                    flash('Username already exists.', 'error')
                    return render_template('register.html', countries=fetch_countries(), form_data=form_data)
                
                # Ensure email is unique
                db.execute('SELECT id FROM "user" WHERE email = %s', (email,))
                if db.fetchone():
                    flash('Email already registered.', 'error')
                    return render_template('register.html', countries=fetch_countries(), form_data=form_data)
                
                verification_token = secrets.token_urlsafe(48)
                db.execute(
                    '''INSERT INTO "user"
                       (id, country_id, username, password_hash, email,
                        email_verified, email_verification_token, verification_sent_at)
                       VALUES (%s, %s, %s, %s, %s, FALSE, %s, NOW())''',
                    (user_id,
                     country_id if country_id else None,
                     username,
                     hashed_pw.decode('utf-8'),
                     email,
                     verification_token)
                )
                db.commit()

                verify_url = url_for('auth.verify_email', token=verification_token, _external=True)
                if send_verification_email(username, email, verify_url):
                    flash('Registration successful! Check your inbox to verify your email before logging in.', 'success')
                else:
                    flash('Registration created but email could not be sent. Contact support to verify your account.', 'warning')
                return redirect(url_for('auth.login'))
            except Exception as e:
                flash('Registration failed: ' + str(e), 'error')
                return render_template('register.html', countries=fetch_countries(), form_data=form_data)
        
        countries = fetch_countries()
        return render_template('register.html', countries=countries, form_data=form_data)
    finally:
        db.close()

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username_or_email = (request.form.get('username') or '').strip()
        password = request.form.get('password')
        db = DatabaseConnection()
        try:
            user = None
            if username_or_email:
                db.execute('SELECT * FROM "user" WHERE username = %s', (username_or_email,))
                user = db.fetchone()
                if not user:
                    db.execute('SELECT * FROM "user" WHERE email = %s', (username_or_email,))
                    user = db.fetchone()
            if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                if not user.get('email_verified'):
                    _send_or_refresh_verification(db, user)
                    flash('Please verify your email address. A fresh link has been emailed to you.', 'warning')
                    return render_template('login.html')
                # Normalize row to mapping for consistent access
                session['user_id'] = user['id']
                session['username'] = user['username']
                session['email'] = user['email']
                session['email_verified'] = True
                session['session_expires_at'] = _next_session_expiry_timestamp()
                # Get is_admin - handle mapping and other row types
                if isinstance(user, Mapping):
                    is_admin = user.get('is_admin', False)
                else:
                    try:
                        is_admin = user['is_admin']
                    except (TypeError, KeyError):
                        try:
                            is_admin = user.is_admin if hasattr(user, 'is_admin') else False
                        except:
                            is_admin = False
                session['is_admin'] = bool(is_admin)
                current_app.logger.info("Login success: user=%s is_admin=%s", session['username'], session['is_admin'])
                flash('Login successful!')
                if session['is_admin']:
                    flash('Admin olarak giriş yaptın. Sağ üst köşedeki menüden admin paneline ulaşabilirsin.', 'info')
                return redirect(url_for('auth.index'))
            else:
                flash('Invalid username or password.')
        finally:
            db.close()
    return render_template('login.html')

@auth_bp.route('/verify-email/<token>')
def verify_email(token):
    if not token:
        flash('Invalid verification link.', 'error')
        return redirect(url_for('auth.login'))

    db = DatabaseConnection()
    try:
        db.execute(
            '''SELECT id, username, email, email_verified,
                      verification_sent_at
               FROM "user"
               WHERE email_verification_token = %s''',
            (token,)
        )
        user = db.fetchone()
        if not user:
            flash('Verification link is invalid or already used.', 'error')
            return redirect(url_for('auth.login'))

        if user['email_verified']:
            flash('Your email is already verified. Please login.', 'info')
            return redirect(url_for('auth.login'))

        sent_at = user.get('verification_sent_at')
        if sent_at and datetime.utcnow() - sent_at > timedelta(hours=Config.EMAIL_VERIFICATION_VALID_HOURS):
            _send_or_refresh_verification(db, user)
            flash('Verification link expired. We have sent a new one.', 'warning')
            return redirect(url_for('auth.login'))

        db.execute(
            '''UPDATE "user"
               SET email_verified = TRUE,
                   email_verified_at = NOW(),
                   email_verification_token = NULL,
                   verification_sent_at = NULL
               WHERE id = %s''',
            (user['id'],)
        )
        db.commit()
        flash('Email verified successfully! You can now login.', 'success')
        return redirect(url_for('auth.login'))
    finally:
        db.close()

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
        
        # Check if user is admin - handle both dict and tuple responses
        if isinstance(user, Mapping):
            is_admin = user.get('is_admin', False)
        else:
            try:
                is_admin = user['is_admin']
            except (TypeError, KeyError):
                try:
                    is_admin = user.is_admin if hasattr(user, 'is_admin') else False
                except:
                    is_admin = False
        
        # Also update session with current is_admin status
        session['is_admin'] = bool(is_admin)
        
        return render_template('profile.html',
                             user=user,
                             countries=countries,
                             username=session['username'],
                             email=session['email'],
                             is_admin=bool(is_admin))
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
