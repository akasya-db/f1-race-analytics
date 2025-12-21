"""
Configuration settings for Flask application
"""
import os
from dotenv import load_dotenv
from pathlib import Path

# Try loading repo/database/.env first, fallback to default behavior
dotenv_path = Path(__file__).resolve().parents[2] / 'database' / '.env'
if dotenv_path.exists():
    load_dotenv(dotenv_path)
else:
    load_dotenv()

class Config:
    """Application configuration"""
    
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'
    
    # Database settings
    DB_HOST = os.getenv('DB_HOST')
    DB_PORT = os.getenv('DB_PORT')
    DB_NAME = os.getenv('DB_NAME')
    DB_USER = os.getenv('DB_USER')
    DB_PASSWORD = os.getenv('DB_PASSWORD')
    
    # Connection pool settings
    DB_MIN_CONNECTIONS = int(os.getenv('DB_MIN_CONNECTIONS', '1'))
    DB_MAX_CONNECTIONS = int(os.getenv('DB_MAX_CONNECTIONS', '20'))

    # Session + security
    SESSION_TIMEOUT_MINUTES = int(os.getenv('SESSION_TIMEOUT_MINUTES', '30'))

    # Email / SMTP (Mailtrap or similar free provider)
    MAIL_ENABLED = os.getenv('MAIL_ENABLED', 'True') == 'True'
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'F1 Analytics <no-reply@example.com>')
    MAIL_HOST = os.getenv('MAIL_HOST', 'sandbox.smtp.mailtrap.io')
    MAIL_PORT = int(os.getenv('MAIL_PORT', '587'))
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    EMAIL_VERIFICATION_VALID_HOURS = int(os.getenv('EMAIL_VERIFICATION_VALID_HOURS', '48'))
