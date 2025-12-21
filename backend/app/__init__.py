"""
Flask Application Factory
"""
from flask import Flask, session, current_app
from datetime import datetime
from flask_cors import CORS
from app.config import Config

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__)
    app.config.from_object(Config)
    app.secret_key = Config.SECRET_KEY  # Explicitly set secret key
    
    # Enable CORS for all routes
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5000", "http://127.0.0.1:5000"],
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Initialize database connection
    from app.database import init_db
    init_db()
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'ok', 'message': 'F1 Analytics API is running'}
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.constructors import constructors_bp
    from app.routes.races import races_bp
    from app.routes.drivers import drivers_bp
    from app.routes.admin import admin_bp
    from app.routes.user import user_bp
    from app.routes.compare import compare_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(constructors_bp)
    app.register_blueprint(races_bp)
    app.register_blueprint(drivers_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(compare_bp)

    @app.before_request
    def enforce_session_timeout():
        """Expire user sessions after configured inactivity window."""
        if 'user_id' not in session:
            return
        timeout = getattr(Config, 'SESSION_TIMEOUT_MINUTES', 0)
        if timeout <= 0:
            return

        expires_at = session.get('session_expires_at')
        now_ts = datetime.utcnow().timestamp()
        if not expires_at or now_ts > expires_at:
            from flask import flash, redirect, url_for, request
            session.clear()
            exempt_endpoints = {'auth.login', 'auth.logout', 'auth.register', 'auth.verify_email', 'static'}
            if not request.endpoint or request.endpoint not in exempt_endpoints:
                flash('Session expired. Please login again.', 'warning')
            return redirect(url_for('auth.login'))
        session['session_expires_at'] = now_ts + (timeout * 60)

    @app.context_processor
    def inject_user_context():
        """Provide auth info to all templates by default"""
        from app.admin_utils import is_admin as check_admin
        current_is_admin = session.get('is_admin')
        if session.get('user_id'):
            refresh_needed = current_is_admin is None
            if not refresh_needed and not current_is_admin:
                refresh_needed = True
            if refresh_needed:
                refreshed = check_admin(session['user_id'])
                if refreshed:
                    session['is_admin'] = bool(refreshed)
                    current_is_admin = session['is_admin']
            current_app.logger.debug(
                "Context inject: user=%s, session_admin=%s, refresh_needed=%s",
                session.get('username'),
                current_is_admin,
                refresh_needed
            )
        return {
            'authenticated': 'username' in session,
            'current_username': session.get('username'),
            'current_email': session.get('email'),
            'is_admin': current_is_admin or False
        }

    return app
