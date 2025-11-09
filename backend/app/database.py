"""
Database connection management using psycopg2
"""
import psycopg2
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
    """
    Get a connection from the pool
    Remember to call release_db_connection() when done!
    """
    if db_pool:
        return db_pool.getconn()
    raise Exception("Database pool not initialized")

def release_db_connection(connection):
    """Return a connection to the pool"""
    if db_pool and connection:
        db_pool.putconn(connection)

def execute_query(query, params=None, fetch=True):
    """
    Execute a SQL query with automatic connection management
    
    Args:
        query: SQL query string
        params: Query parameters (tuple or dict)
        fetch: If True, return results; if False, commit changes
    
    Returns:
        Query results if fetch=True, else None
    """
    connection = None
    cursor = None
    
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.execute(query, params)
        
        if fetch:
            results = cursor.fetchall()
            return results
        else:
            connection.commit()
            return cursor.rowcount
            
    except (Exception, psycopg2.Error) as error:
        if connection:
            connection.rollback()
        print(f"Database error: {error}")
        raise
        
    finally:
        if cursor:
            cursor.close()
        if connection:
            release_db_connection(connection)