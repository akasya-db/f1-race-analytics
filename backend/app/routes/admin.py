"""
Admin panel routes for CRUD operations
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from app.database import DatabaseConnection
from app.admin_utils import require_admin, get_table_schema, get_foreign_keys, get_table_data, get_referenced_table_options

admin_bp = Blueprint('admin', __name__)

# Available tables for admin panel
AVAILABLE_TABLES = {
    'circuit': {
        'name': 'Circuits',
        'display_name': 'Circuit',
        'id_column': 'id'
    },
    'driver': {
        'name': 'Drivers',
        'display_name': 'Driver',
        'id_column': 'id'
    },
    'constructor': {
        'name': 'Constructors',
        'display_name': 'Constructor',
        'id_column': 'id'
    },
    'race': {
        'name': 'Races',
        'display_name': 'Race',
        'id_column': 'id'
    },
    'race_data': {
        'name': 'Race Data',
        'display_name': 'Race Data',
        'id_column': 'id'
    },
    'country': {
        'name': 'Countries',
        'display_name': 'Country',
        'id_column': 'id'
    },
    'user': {
        'name': 'Users',
        'display_name': 'User',
        'id_column': 'id'
    }
}

@admin_bp.route('/admin')
@require_admin
def admin_panel():
    """Admin panel main page - table selection"""
    return render_template('admin.html', tables=AVAILABLE_TABLES)

@admin_bp.route('/admin/<table_name>')
@require_admin
def admin_table_list(table_name):
    """List all records in a table"""
    if table_name not in AVAILABLE_TABLES:
        flash('Invalid table name.')
        return redirect(url_for('admin.admin_panel'))
    
    # Get pagination parameters
    page = request.args.get('page', 1, type=int)
    per_page = 50
    offset = (page - 1) * per_page
    
    # Get table data
    id_column = AVAILABLE_TABLES[table_name]['id_column']
    records, total_count = get_table_data(table_name, limit=per_page, offset=offset, id_column=id_column)
    
    # Get table schema for display
    schema = get_table_schema(table_name)
    
    # Calculate pagination
    total_pages = (total_count + per_page - 1) // per_page if total_count > 0 else 1
    
    return render_template(
        'admin_table.html',
        table_name=table_name,
        table_info=AVAILABLE_TABLES[table_name],
        records=records,
        schema=schema,
        page=page,
        total_pages=total_pages,
        total_count=total_count,
        per_page=per_page
    )

@admin_bp.route('/admin/<table_name>/create', methods=['GET', 'POST'])
@require_admin
def admin_table_create(table_name):
    """Create a new record in a table"""
    if table_name not in AVAILABLE_TABLES:
        flash('Invalid table name.')
        return redirect(url_for('admin.admin_panel'))
    
    db = DatabaseConnection()
    try:
        schema = get_table_schema(table_name)
        foreign_keys = get_foreign_keys(table_name)
        
        # Get options for foreign key dropdowns
        fk_options = {}
        for col_name, fk_info in foreign_keys.items():
            # Determine display column
            display_col = 'name' if 'name' in [c['name'] for c in get_table_schema(fk_info['table'])] else 'id'
            fk_options[col_name] = get_referenced_table_options(fk_info['table'], display_col)
        
        if request.method == 'POST':
            # Build INSERT query
            columns = []
            values = []
            params = []
            
            for col in schema:
                col_name = col['name']
                
                # Skip auto-generated columns
                if col_name in ['id', 'created_at'] and col.get('default') and 'nextval' in str(col.get('default', '')):
                    continue
                
                # Skip if not in form
                if col_name not in request.form:
                    continue
                
                value = request.form.get(col_name)
                
                # Handle empty values
                if value == '' or value is None:
                    if col['nullable']:
                        columns.append(col_name)
                        values.append('NULL')
                    continue
                else:
                    columns.append(col_name)
                    values.append('%s')
                    params.append(value)
            
            if not columns:
                flash('No data provided.')
                return render_template('admin_form.html',
                                     table_name=table_name,
                                     table_info=AVAILABLE_TABLES[table_name],
                                     schema=schema,
                                     foreign_keys=foreign_keys,
                                     fk_options=fk_options,
                                     record=None)
            
            # Handle special case for user table password
            if table_name == 'user' and 'password' in request.form:
                import bcrypt
                password = request.form.get('password')
                if password:
                    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
                    # Replace password with password_hash
                    if 'password' in columns:
                        idx = columns.index('password')
                        columns[idx] = 'password_hash'
                        params[idx] = hashed_pw.decode('utf-8')
            
            # Generate ID if needed
            if 'id' not in [c['name'] for c in schema if c['name'] in columns]:
                import uuid
                columns.insert(0, 'id')
                values.insert(0, '%s')
                params.insert(0, str(uuid.uuid4()))
            
            query = f'INSERT INTO "{table_name}" ({", ".join(columns)}) VALUES ({", ".join(values)})'
            
            try:
                db.execute(query, tuple(params))
                db.commit()
                flash(f'{AVAILABLE_TABLES[table_name]["display_name"]} created successfully!')
                return redirect(url_for('admin.admin_table_list', table_name=table_name))
            except Exception as e:
                db.conn.rollback()
                flash(f'Error creating record: {str(e)}', 'error')
        
        return render_template('admin_form.html',
                             table_name=table_name,
                             table_info=AVAILABLE_TABLES[table_name],
                             schema=schema,
                             foreign_keys=foreign_keys,
                             fk_options=fk_options,
                             record=None)
    finally:
        db.close()

@admin_bp.route('/admin/<table_name>/<record_id>/edit', methods=['GET', 'POST'])
@require_admin
def admin_table_edit(table_name, record_id):
    """Edit an existing record"""
    if table_name not in AVAILABLE_TABLES:
        flash('Invalid table name.')
        return redirect(url_for('admin.admin_panel'))
    
    db = DatabaseConnection()
    try:
        schema = get_table_schema(table_name)
        foreign_keys = get_foreign_keys(table_name)
        id_column = AVAILABLE_TABLES[table_name]['id_column']
        
        # Get options for foreign key dropdowns
        fk_options = {}
        for col_name, fk_info in foreign_keys.items():
            display_col = 'name' if 'name' in [c['name'] for c in get_table_schema(fk_info['table'])] else 'id'
            fk_options[col_name] = get_referenced_table_options(fk_info['table'], display_col)
        
        # Get existing record
        query = f'SELECT * FROM "{table_name}" WHERE {id_column} = %s'
        db.execute(query, (record_id,))
        record = db.fetchone()
        
        if not record:
            flash('Record not found.')
            return redirect(url_for('admin.admin_table_list', table_name=table_name))
        
        if request.method == 'POST':
            # Build UPDATE query
            updates = []
            params = []
            
            for col in schema:
                col_name = col['name']
                
                # Skip id and auto-generated columns
                if col_name == id_column:
                    continue
                if col_name == 'created_at' or (col_name == 'id' and 'nextval' in str(col.get('default', ''))):
                    continue
                
                # Skip if not in form
                if col_name not in request.form:
                    continue
                
                value = request.form.get(col_name)
                
                # Handle empty values
                if value == '' or value is None:
                    if col['nullable']:
                        updates.append(f'{col_name} = NULL')
                    continue
                else:
                    updates.append(f'{col_name} = %s')
                    params.append(value)
            
            # Handle password update for user table
            if table_name == 'user' and 'password' in request.form:
                password = request.form.get('password')
                if password:
                    import bcrypt
                    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
                    updates.append('password_hash = %s')
                    params.append(hashed_pw.decode('utf-8'))
            
            if not updates:
                flash('No changes provided.')
                return render_template('admin_form.html',
                                     table_name=table_name,
                                     table_info=AVAILABLE_TABLES[table_name],
                                     schema=schema,
                                     foreign_keys=foreign_keys,
                                     fk_options=fk_options,
                                     record=record)
            
            params.append(record_id)
            query = f'UPDATE "{table_name}" SET {", ".join(updates)} WHERE {id_column} = %s'
            
            try:
                db.execute(query, tuple(params))
                db.commit()
                flash(f'{AVAILABLE_TABLES[table_name]["display_name"]} updated successfully!')
                return redirect(url_for('admin.admin_table_list', table_name=table_name))
            except Exception as e:
                db.conn.rollback()
                flash(f'Error updating record: {str(e)}', 'error')
        
        return render_template('admin_form.html',
                             table_name=table_name,
                             table_info=AVAILABLE_TABLES[table_name],
                             schema=schema,
                             foreign_keys=foreign_keys,
                             fk_options=fk_options,
                             record=record)
    finally:
        db.close()

@admin_bp.route('/admin/<table_name>/<record_id>/delete', methods=['POST'])
@require_admin
def admin_table_delete(table_name, record_id):
    """Delete a record"""
    if table_name not in AVAILABLE_TABLES:
        flash('Invalid table name.')
        return redirect(url_for('admin.admin_panel'))
    
    db = DatabaseConnection()
    try:
        id_column = AVAILABLE_TABLES[table_name]['id_column']
        
        # Check if record exists
        query = f'SELECT * FROM "{table_name}" WHERE {id_column} = %s'
        db.execute(query, (record_id,))
        record = db.fetchone()
        
        if not record:
            flash('Record not found.')
            return redirect(url_for('admin.admin_table_list', table_name=table_name))
        
        # Delete record
        delete_query = f'DELETE FROM "{table_name}" WHERE {id_column} = %s'
        try:
            db.execute(delete_query, (record_id,))
            db.commit()
            flash(f'{AVAILABLE_TABLES[table_name]["display_name"]} deleted successfully!')
        except Exception as e:
            db.conn.rollback()
            flash(f'Error deleting record: {str(e)}', 'error')
        
        return redirect(url_for('admin.admin_table_list', table_name=table_name))
    finally:
        db.close()

