"""
Database connection management using psycopg2
"""
import psycopg2
import psycopg2.extras
from psycopg2 import pool
from app.config import Config

# Global connection pool
db_pool = None

def init_db():
    """Initialize database connection pool"""
    global db_pool
    
    try:
        db_pool = psycopg2.pool.SimpleConnectionPool(
            Config.DB_MIN_CONNECTIONS,
            Config.DB_MAX_CONNECTIONS,
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            database=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD
        )
        print("✓ Database connection pool created successfully")
    except (Exception, psycopg2.Error) as error:
        print(f"✗ Error creating connection pool: {error}")
        raise

def get_db_connection():
    """Get a database connection from the pool"""
    connection = db_pool.getconn()
    return connection

class DatabaseConnection:
    """Database connection wrapper"""
    def __init__(self):
        self.conn = get_db_connection()
        self.cursor = self.conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    def execute(self, query, params=None):
        return self.cursor.execute(query, params)
    
    def fetchone(self):
        return self.cursor.fetchone()
    
    def fetchall(self):
        return self.cursor.fetchall()
        
    def commit(self):
        self.conn.commit()
    
    def close(self):
        """Close cursor and return connection to the pool"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            db_pool.putconn(self.conn)