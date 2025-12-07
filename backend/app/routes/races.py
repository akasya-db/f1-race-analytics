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
