import os
from flask import Blueprint, render_template, session, jsonify, request, current_app
from app.database import DatabaseConnection

constructors_bp = Blueprint("constructors", __name__)

# helper function to read SQL files
def get_sql_query(filename):
    query_path = os.path.join(current_app.root_path, '..' , '..','database', 'queries', filename)
    print(query_path)
    with open(query_path, 'r') as file:
        return file.read()
    
# page route renders the HTML
@constructors_bp.route("/constructors")
def constructors_page():
    authenticated = 'username' in session
    return render_template(
        "constructors.html",
        authenticated=authenticated,
        username=session.get('username'),
        is_admin=session.get('is_admin', False)
    )       

# API route fetches the data
@constructors_bp.route("/api/constructors")
def get_constructors_data():
    raw_name = request.args.get('name')
    raw_nat = request.args.get('nationality')
    raw_champs = request.args.get('champs_min')
    raw_total_points_min = request.args.get('total_points_min')
    raw_total_points_max = request.args.get('total_points_max')
    page = request.args.get('page', 1, type=int)
    per_page = 12
    offset = (page - 1) * per_page

    # convert empty strings to None
    filters = {
        'name': raw_name if raw_name else None,
        'nationality': raw_nat if raw_nat else None,
        'champs_min': int(raw_champs) if raw_champs else None,
        'total_points_min': int(raw_total_points_min) if raw_total_points_min else None,
        'total_points_max': int(raw_total_points_max) if raw_total_points_max else None,
        'limit': per_page,
        'offset': offset
    }

    if filters['champs_min']:
        try: filters['champs_min'] = int(filters['champs_min'])
        except ValueError: filters['champs_min'] = 0

    db = DatabaseConnection()
    try:
        # load the sql from the file
        sql_query = get_sql_query('select_constructors.sql')
        db.execute(sql_query, filters)
        results = db.fetchall()

        data = [dict(row) for row in results]
        
        total_items = data[0]['full_count'] if data else 0
        total_pages = (total_items + per_page - 1) // per_page

        return jsonify({
            'constructors': data,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'total_items': total_items
            }
        })
    
    except Exception as e:
        print(f"Error fetching constructors: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500

    finally:
        db.close()

@constructors_bp.route("/api/add-constructor", methods=["POST"])
def add_constructor():
    if 'username' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        user_id = session.get('user_id')
        
        db = DatabaseConnection()
        
        # Get the next constructor ID
        db.execute("SELECT MAX(CAST(SUBSTRING(id FROM '[0-9]+') AS INTEGER)) as max_id FROM constructor WHERE id ~ '^uc-[0-9]+$'")
        result = db.fetchone()
        next_num = (result['max_id'] or 0) + 1 if result else 1
        constructor_id = f"uc-{next_num}"
        
        # Insert constructor
        insert_query = """
            INSERT INTO constructor (
                id, user_id, country_id, name, full_name,
                best_championship_position, total_championship_wins,
                total_race_starts, total_podiums, total_points,
                total_pole_positions, is_real
            ) VALUES (
                %(id)s, %(user_id)s, %(country_id)s, %(name)s, %(full_name)s,
                %(best_championship_position)s, %(total_championship_wins)s,
                %(total_race_starts)s, %(total_podiums)s, %(total_points)s,
                %(total_pole_positions)s, FALSE
            )
        """
        
        params = {
            'id': constructor_id,
            'user_id': user_id,
            'country_id': data['country_id'],
            'name': data['name'],
            'full_name': data['name'],  # Same as name
            'best_championship_position': data.get('best_championship_position') or None,
            'total_championship_wins': data['total_championship_wins'],
            'total_race_starts': data['total_race_starts'],
            'total_podiums': data['total_podiums'],
            'total_points': data['total_points'],
            'total_pole_positions': data['total_pole_positions']
        }
        
        db.execute(insert_query, params)
        db.commit()
        
        return jsonify({
            'success': True,
            'constructor_id': constructor_id,
            'message': 'Constructor added successfully'
        })
        
    except Exception as e:
        print(f"Error adding constructor: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@constructors_bp.route("/api/constructors/<constructor_id>")
def get_constructor_by_id(constructor_id):
    db = DatabaseConnection()
    try:
        query = """
            SELECT 
                c.id,
                c.name,
                c.full_name,
                c.best_championship_position,
                c.total_championship_wins,
                c.total_race_starts,
                c.total_podiums,
                c.total_points,
                c.total_pole_positions,
                c.country_id,
                co.name as nationality
            FROM constructor c
            LEFT JOIN country co ON c.country_id = co.id
            WHERE c.id = %s
        """
        db.execute(query, (constructor_id,))
        constructor = db.fetchone()
        
        if not constructor:
            return jsonify({'error': 'Constructor not found'}), 404
        
        # Convert to dict and handle Decimal types
        result = dict(constructor)
        if 'total_points' in result and result['total_points'] is not None:
            result['total_points'] = float(result['total_points'])
            
        print(f"Returning constructor data: {result}")  # Debug log
        return jsonify(result)
    except Exception as e:
        print(f"Error fetching constructor: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@constructors_bp.route("/constructors/new")
def add_constructor_page():
    authenticated = 'username' in session
    
    db = DatabaseConnection()
    try:
        # 1. Fetch Countries for the dropdown
        db.execute("SELECT id, name FROM country ORDER BY name ASC")
        countries = db.fetchall()
        
        # 2. Define the schema manually to match your admin_form structure
        # This mimics the 'schema' object the admin panel uses
        constructor_schema = [
            {'name': 'country_id', 'type': 'fk', 'nullable': False},
            {'name': 'name', 'type': 'text', 'nullable': False},
            {'name': 'best_championship_position', 'type': 'integer', 'nullable': True},
            {'name': 'total_championship_wins', 'type': 'integer', 'nullable': False},
            {'name': 'total_race_starts', 'type': 'integer', 'nullable': False},
            {'name': 'total_podiums', 'type': 'integer', 'nullable': False},
            {'name': 'total_points', 'type': 'numeric', 'nullable': False},
            {'name': 'total_pole_positions', 'type': 'integer', 'nullable': False},
        ]

        # 3. Format foreign key options for the template
        fk_options = {
            'country_id': [{'id': c['id'], 'display': c['name']} for c in countries]
        }

        # table_info mock for the template headers
        table_info = {
            'display_name': 'Constructor',
            'name': 'constructor'
        }

        return render_template(
            "add_constructor_form.html",
            schema=constructor_schema,
            fk_options=fk_options,
            table_info=table_info,
            foreign_keys={'country_id': {'table': 'country'}},
            record=None, # None because we are creating
            table_name='constructor',
            authenticated=authenticated
        )
    finally:
        db.close()

# app/routes/constructors.py

@constructors_bp.route("/constructors/edit/<constructor_id>")
def edit_constructor_page(constructor_id):
    authenticated = 'username' in session
    
    db = DatabaseConnection()
    try:
        # 1. Fetch the existing record
        db.execute("SELECT * FROM constructor WHERE id = %s", (constructor_id,))
        record = db.fetchone()
        
        if not record:
            return "Constructor not found", 404

        # 2. Fetch Countries for the dropdown
        db.execute("SELECT id, name FROM country ORDER BY name ASC")
        countries = db.fetchall()
        
        # 3. Define the same schema used in the create route
        constructor_schema = [
            {'name': 'country_id', 'type': 'fk', 'nullable': False},
            {'name': 'name', 'type': 'text', 'nullable': False},
            {'name': 'best_championship_position', 'type': 'integer', 'nullable': True},
            {'name': 'total_championship_wins', 'type': 'integer', 'nullable': False},
            {'name': 'total_race_starts', 'type': 'integer', 'nullable': False},
            {'name': 'total_podiums', 'type': 'integer', 'nullable': False},
            {'name': 'total_points', 'type': 'numeric', 'nullable': False},
            {'name': 'total_pole_positions', 'type': 'integer', 'nullable': False},
        ]

        fk_options = {
            'country_id': [{'id': c['id'], 'display': c['name']} for c in countries]
        }

        table_info = {
            'display_name': 'Constructor',
            'name': 'constructor'
        }

        # Reuse the same template!
        return render_template(
            "add_constructor_form.html",
            schema=constructor_schema,
            fk_options=fk_options,
            table_info=table_info,
            record=record,  # Now passing the existing data
            constructor_id=constructor_id,
            authenticated=authenticated
        )
    finally:
        db.close()


@constructors_bp.route("/api/update-constructor/<constructor_id>", methods=["POST"])
def update_constructor(constructor_id):
    
    try:
        data = request.get_json()
        db = DatabaseConnection()
        
        update_query = """
            UPDATE constructor SET 
                country_id = %(country_id)s,
                name = %(name)s,
                full_name = %(name)s,
                best_championship_position = %(best_championship_position)s,
                total_championship_wins = %(total_championship_wins)s,
                total_race_starts = %(total_race_starts)s,
                total_podiums = %(total_podiums)s,
                total_points = %(total_points)s,
                total_pole_positions = %(total_pole_positions)s
            WHERE id = %(id)s AND user_id = %(user_id)s
        """
        
        data['id'] = constructor_id
        data['user_id'] = session.get('user_id')
        
        db.execute(update_query, data)
        db.commit()
        
        return jsonify({'success': True, 'message': 'Constructor updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# app/routes/constructors.py
@constructors_bp.route("/api/delete-constructor/<constructor_id>", methods=["POST"])
def delete_constructor(constructor_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    db = DatabaseConnection()
    try:
        user_id = session.get('user_id')
        
        # WHERE clause içinde hem ID hem de user_id zorunlu
        query = "DELETE FROM constructor WHERE id = %s AND user_id = %s AND id LIKE 'uc-%%'"
        db.execute(query, (constructor_id, user_id))
        
        if db.cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Permission denied or record not found'}), 403
            
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        db.close()