"""
Admin utility functions and decorators
"""
from functools import wraps
from flask import session, redirect, url_for, flash
from app.database import DatabaseConnection

def is_admin(user_id):
    """
    Check if a user is an admin
    
    Args:
        user_id: User ID to check
        
    Returns:
        bool: True if user is admin, False otherwise
    """
    db = DatabaseConnection()
    try:
        db.execute('SELECT is_admin FROM "user" WHERE id = %s', (user_id,))
        user = db.fetchone()
        if user:
            return user.get('is_admin', False) if isinstance(user, dict) else user[0] if user else False
        return False
    except Exception:
        return False
    finally:
        db.close()

def require_admin(f):
    """
    Decorator to require admin access for a route
    
    Usage:
        @admin_bp.route('/admin')
        @require_admin
        def admin_panel():
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please login to access this page.')
            return redirect(url_for('auth.login'))
        
        if not session.get('is_admin', False):
            flash('Access denied. Admin privileges required.')
            return redirect(url_for('auth.index'))
        
        return f(*args, **kwargs)
    return decorated_function

def get_table_schema(table_name):
    """
    Get schema information for a table
    
    Args:
        table_name: Name of the table
        
    Returns:
        list: List of column information dictionaries
    """
    db = DatabaseConnection()
    try:
        # Get column information
        query = """
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = %s
            ORDER BY ordinal_position
        """
        db.execute(query, (table_name,))
        columns = db.fetchall()
        
        # Convert to list of dicts
        result = []
        for col in columns:
            result.append({
                'name': col['column_name'],
                'type': col['data_type'],
                'nullable': col['is_nullable'] == 'YES',
                'default': col['column_default']
            })
        return result
    except Exception as e:
        print(f"Error getting table schema: {e}")
        return []
    finally:
        db.close()

def get_foreign_keys(table_name):
    """
    Get foreign key relationships for a table
    
    Args:
        table_name: Name of the table
        
    Returns:
        dict: Dictionary mapping column names to referenced tables
    """
    db = DatabaseConnection()
    try:
        query = """
            SELECT
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name = %s
        """
        db.execute(query, (table_name,))
        fks = db.fetchall()
        
        result = {}
        for fk in fks:
            result[fk['column_name']] = {
                'table': fk['foreign_table_name'],
                'column': fk['foreign_column_name']
            }
        return result
    except Exception as e:
        print(f"Error getting foreign keys: {e}")
        return {}
    finally:
        db.close()

def get_table_data(table_name, limit=100, offset=0, id_column='id'):
    """
    Get data from a table with pagination
    
    Args:
        table_name: Name of the table
        limit: Maximum number of records to return
        offset: Number of records to skip
        id_column: Column to use for ordering (default: 'id')
        
    Returns:
        tuple: (records, total_count)
    """
    db = DatabaseConnection()
    try:
        # Get total count
        count_query = f'SELECT COUNT(*) FROM "{table_name}"'
        db.execute(count_query)
        count_result = db.fetchone()
        total_count = count_result[0] if count_result else 0
        
        # Get records - try to order by id_column, fallback to first column if it doesn't exist
        try:
            query = f'SELECT * FROM "{table_name}" ORDER BY "{id_column}" LIMIT %s OFFSET %s'
            db.execute(query, (limit, offset))
        except:
            # Fallback: order by first column
            query = f'SELECT * FROM "{table_name}" LIMIT %s OFFSET %s'
            db.execute(query, (limit, offset))
        
        records = db.fetchall()
        
        return records, total_count
    except Exception as e:
        print(f"Error getting table data: {e}")
        return [], 0
    finally:
        db.close()

def get_referenced_table_options(table_name, display_column='name'):
    """
    Get options for a foreign key dropdown
    
    Args:
        table_name: Name of the referenced table
        display_column: Column to display in dropdown (default: 'name')
        
    Returns:
        list: List of (id, display_value) tuples
    """
    db = DatabaseConnection()
    try:
        # Try to get id and display column
        query = f'SELECT id, {display_column} FROM "{table_name}" ORDER BY {display_column}'
        db.execute(query)
        options = db.fetchall()
        
        result = []
        for opt in options:
            result.append({
                'id': opt['id'],
                'display': opt.get(display_column, opt['id'])
            })
        return result
    except Exception:
        # Fallback to just id
        try:
            query = f'SELECT id FROM "{table_name}" ORDER BY id'
            db.execute(query)
            options = db.fetchall()
            return [{'id': opt['id'], 'display': opt['id']} for opt in options]
        except Exception:
            return []
    finally:
        db.close()

