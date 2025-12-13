import os
from flask import Blueprint, render_template, session, jsonify, request, current_app
from app.database import DatabaseConnection

races_bp = Blueprint("races", __name__)

# helper function to read SQL files
def get_sql_query(filename):
    query_path = os.path.join(current_app.root_path, '..' , '..','database', 'queries', filename)
    print(query_path)
    with open(query_path, 'r') as file:
        return file.read()

@races_bp.route("/races")
def races_page():
    authenticated = 'username' in session
    return render_template(
        "races.html",
        authenticated=authenticated,
        username=session.get('username'),
        is_admin=session.get('is_admin', False)
    )

# API route fetches the data
@races_bp.route("/api/races")
def get_races_data():
    raw_year = request.args.get('year')
    raw_round = request.args.get('round')
    raw_date_from = request.args.get('date_from')
    raw_date_to = request.args.get('date_to')
    raw_official_name = request.args.get('official_name')
    raw_qualifying_format = request.args.get('qualifying_format')
    raw_laps_min = request.args.get('laps_min')
    raw_laps_max = request.args.get('laps_max')
    raw_is_real = request.args.get('is_real')
    page = request.args.get('page', 1, type=int)
    per_page = 12
    offset = (page - 1) * per_page

    is_real_value = True if raw_is_real == 'true' else None

    # convert empty strings to None
    filters = {
        'year': int(raw_year) if raw_year else None,
        'round': int(raw_round) if raw_round else None,
        'date_from': raw_date_from if raw_date_from else None,
        'date_to': raw_date_to if raw_date_to else None,
        'official_name': raw_official_name if raw_official_name else None,
        'qualifying_format': raw_qualifying_format if raw_qualifying_format else None,
        'laps_min': int(raw_laps_min) if raw_laps_min else None,
        'laps_max': int(raw_laps_max) if raw_laps_max else None,
        'is_real': is_real_value,
        'limit': per_page,
        'offset': offset
    }

    db = DatabaseConnection()
    try:
        # load the sql from the file
        sql_query = get_sql_query('select_races.sql')
        db.execute(sql_query, filters)
        results = db.fetchall()

        data = [dict(row) for row in results]
        
        total_items = data[0]['full_count'] if data else 0
        total_pages = (total_items + per_page - 1) // per_page

        return jsonify({
            'races': data,
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


@races_bp.route("/api/race_data")
def get_race_data():
    """Return race_data rows for a specific race id (or all if not provided).
    Query params: race_id (int), page (int), is_real (true|false)
    """
    raw_race_id = request.args.get('race_id')
    raw_page = request.args.get('page', 1, type=int)
    raw_is_real = request.args.get('is_real')

    per_page = 50
    offset = (raw_page - 1) * per_page

    race_id = int(raw_race_id) if raw_race_id else None
    is_real_value = True if raw_is_real == 'true' else None

    params = {
        'race_id': race_id,
        'is_real': is_real_value,
        'limit': per_page,
        'offset': offset
    }

    db = DatabaseConnection()
    try:
        sql_query = get_sql_query('select_race_data.sql')
        db.execute(sql_query, params)
        rows = db.fetchall()
        data = [dict(row) for row in rows]
        total_items = data[0]['full_count'] if data else 0
        total_pages = (total_items + per_page - 1) // per_page

        return jsonify({
            'race_data': data,
            'pagination': {
                'current_page': raw_page,
                'total_pages': total_pages,
                'total_items': total_items
            }
        })
    except Exception as e:
        print(f"Error fetching race_data: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500
    finally:
        db.close()

@races_bp.route("/add-race")
def add_race_page():
    authenticated = 'username' in session

    db = DatabaseConnection()
    try:
        # Get all countries for the dropdown
        db.execute("SELECT id, name FROM country ORDER BY name")
        countries = db.fetchall()

        # Get all circuits for the dropdown
        db.execute("SELECT id, name, full_name FROM circuit ORDER BY name")
        circuits = db.fetchall()

        return render_template(
            "add_race.html",
            authenticated=authenticated,
            username=session.get('username'),
            is_admin=session.get('is_admin', False),
            countries=countries,
            circuits=circuits
        )
    finally:
        db.close()


@races_bp.route("/api/add-race", methods=["POST"])
def add_race():
    if 'username' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        user_id = session.get('user_id')
        
        db = DatabaseConnection()
        
        # Get the next race ID
        db.execute("SELECT MAX(id) as max_id FROM race")
        result = db.fetchone()
        next_id = (result['max_id'] or 0) + 1 if result else 1
        
        # Insert race
        insert_query = """
            INSERT INTO race (
                id, circuit_id, year, round, date, official_name,
                qualifying_format, laps, qualifying_date, is_real, user_id
            ) VALUES (
                %(id)s, %(circuit_id)s, %(year)s, %(round)s, %(date)s, %(official_name)s,
                %(qualifying_format)s, %(laps)s, %(qualifying_date)s, FALSE, %(user_id)s
            )
        """
        
        params = {
            'id': next_id,
            'circuit_id': data['circuit_id'],
            'year': data['year'],
            'round': data['round'],
            'date': data['date'],
            'official_name': data['official_name'],
            'qualifying_format': data['qualifying_format'],
            'laps': data['laps'],
            'qualifying_date': data.get('qualifying_date') or None,
            'user_id': user_id
        }
        
        db.execute(insert_query, params)
        db.commit()
        
        return jsonify({
            'success': True,
            'race_id': next_id,
            'message': 'Race added successfully'
        })
        
    except Exception as e:
        print(f"Error adding race: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@races_bp.route("/api/races/<int:race_id>")
def get_race_by_id(race_id):
    """Get a single race by ID"""
    db = DatabaseConnection()
    try:
        db.execute("""
            SELECT r.id, r.year, r.round, r.date, r.official_name,
                   r.qualifying_format, r.laps, r.qualifying_date,
                   c.name as circuit_name, co.name as country_name
            FROM race r
            LEFT JOIN circuit c ON r.circuit_id = c.id
            LEFT JOIN country co ON c.country_id = co.id
            WHERE r.id = %(race_id)s
        """, {'race_id': race_id})
        result = db.fetchone()
        
        if not result:
            return jsonify({'error': 'Race not found'}), 404
            
        return jsonify(dict(result))
    except Exception as e:
        print(f"Error fetching race: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@races_bp.route("/api/add-constructor", methods=["POST"])
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