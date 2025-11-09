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
    
    # Enable CORS for frontend communication
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:8080", "http://127.0.0.1:8080"],
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
    
    return app