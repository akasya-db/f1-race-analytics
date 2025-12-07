"""
Database connection management using psycopg2
"""
import psycopg2
import psycopg2.extras
from psycopg2 import pool
from psycopg2.pool import PoolError
from app.config import Config

# Global connection pool
db_pool = None

def init_db():
    """Initialize database connection pool"""
    global db_pool
    
    try:
        # Build connection string with SSL settings for cloud databases
        conn_params = {
            'host': Config.DB_HOST,
            'port': Config.DB_PORT,
            'database': Config.DB_NAME,
            'user': Config.DB_USER,
            'password': Config.DB_PASSWORD,
        }
        
        # Add SSL mode if it's a cloud database (Neon, etc.)
        if 'neon' in Config.DB_HOST.lower() or 'amazonaws' in Config.DB_HOST.lower() or 'azure' in Config.DB_HOST.lower():
            conn_params['sslmode'] = 'require'
        
        db_pool = psycopg2.pool.SimpleConnectionPool(
            Config.DB_MIN_CONNECTIONS,
            Config.DB_MAX_CONNECTIONS,
            **conn_params
        )
        print("✓ Database connection pool created successfully")
    except (Exception, psycopg2.Error) as error:
        print(f"✗ Error creating connection pool: {error}")
        raise

def get_db_connection():
    """Get a database connection from the pool, with retry logic"""
    global db_pool
    
    if db_pool is None:
        init_db()
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            connection = db_pool.getconn()
            # Test if connection is still alive
            if connection.closed:
                # Connection is closed, try to get a new one
                try:
                    db_pool.putconn(connection, close=True)
                except:
                    pass
                connection = db_pool.getconn()
            
            # Quick test query to verify connection
            test_cursor = connection.cursor()
            test_cursor.execute('SELECT 1')
            test_cursor.close()
            
            return connection
        except (PoolError, psycopg2.OperationalError, psycopg2.InterfaceError) as e:
            if attempt < max_retries - 1:
                # Try to recreate pool
                try:
                    if db_pool:
                        db_pool.closeall()
                except:
                    pass
                init_db()
            else:
                raise

class DatabaseConnection:
    """Database connection wrapper"""
    def __init__(self):
        self.conn = None
        self.cursor = None
        self._get_connection()
    
    def _get_connection(self):
        """Get a new connection, handling closed connections"""
        try:
            self.conn = get_db_connection()
            self.cursor = self.conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
            # Connection failed, try to reconnect
            global db_pool
            try:
                if db_pool:
                    db_pool.closeall()
            except:
                pass
            init_db()
            self.conn = get_db_connection()
            self.cursor = self.conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    def execute(self, query, params=None):
        try:
            return self.cursor.execute(query, params)
        except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
            # Connection lost, reconnect and retry
            if self.cursor:
                try:
                    self.cursor.close()
                except:
                    pass
            if self.conn:
                try:
                    db_pool.putconn(self.conn, close=True)
                except:
                    pass
            self._get_connection()
            return self.cursor.execute(query, params)
    
    def fetchone(self):
        return self.cursor.fetchone()
    
    def fetchall(self):
        return self.cursor.fetchall()
        
    def commit(self):
        try:
            self.conn.commit()
        except (psycopg2.OperationalError, psycopg2.InterfaceError):
            # Connection lost, reconnect
            if self.cursor:
                try:
                    self.cursor.close()
                except:
                    pass
            if self.conn:
                try:
                    db_pool.putconn(self.conn, close=True)
                except:
                    pass
            self._get_connection()
            self.conn.commit()
    
    def close(self):
        """Close cursor and return connection to the pool"""
        try:
            if self.cursor:
                self.cursor.close()
            if self.conn and not self.conn.closed:
                db_pool.putconn(self.conn)
        except Exception as e:
            # If there's an error, try to close the connection
            try:
                if self.conn:
                    db_pool.putconn(self.conn, close=True)
            except:
                pass