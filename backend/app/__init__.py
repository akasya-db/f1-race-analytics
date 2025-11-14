"""
Flask Application Factory
"""
from flask import Flask
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

    app.register_blueprint(auth_bp)
    app.register_blueprint(constructors_bp)
    app.register_blueprint(races_bp)

    return app