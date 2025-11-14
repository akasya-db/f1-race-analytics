
from flask import Blueprint, request, render_template, redirect, url_for, flash, session
import os
import bcrypt
from app.database import DatabaseConnection

auth_bp = Blueprint('auth', __name__)

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
                return redirect(url_for('auth.welcome'))
            else:
                flash('Invalid username or password.')
        finally:
            db.close()
    return render_template('login.html')

@auth_bp.route('/welcome')
def welcome():
    if 'username' not in session:
        return redirect(url_for('auth.login'))
    return render_template('welcome.html', 
                        username=session['username'],
                        email=session['email'])