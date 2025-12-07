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
