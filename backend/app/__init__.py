"""
Flask Application Factory
"""
from flask import Flask, session, current_app
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

    app.register_blueprint(auth_bp)
    app.register_blueprint(constructors_bp)
    app.register_blueprint(races_bp)
    app.register_blueprint(drivers_bp)
    app.register_blueprint(admin_bp)

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
