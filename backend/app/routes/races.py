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


@races_bp.route("/races/stats")
def race_stats_page():
    """Render dedicated race statistics page."""
    authenticated = 'username' in session
    return render_template(
        "race_stats.html",
        authenticated=authenticated,
        username=session.get('username'),
        is_admin=session.get('is_admin', False)
    )


@races_bp.route("/races/<int:race_id>")
def race_detail_page(race_id):
    """Render dedicated race detail page. The page will fetch race data via AJAX."""
    authenticated = 'username' in session
    return render_template(
        "race_detail.html",
        authenticated=authenticated,
        username=session.get('username'),
        is_admin=session.get('is_admin', False),
        race_id=race_id
    )

@races_bp.route("/circuits/<circuit_id>")
def circuit_detail_page(circuit_id):
    """Render dedicated circuit detail page."""
    authenticated = 'username' in session
    return render_template(
        "circuit_detail.html",
        authenticated=authenticated,
        username=session.get('username'),
        is_admin=session.get('is_admin', False),
        circuit_id=circuit_id
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
    raw_circuit_id = request.args.get('circuit_id')
    raw_laps_min = request.args.get('laps_min')
    raw_laps_max = request.args.get('laps_max')
    raw_is_real = request.args.get('is_real')
    page = request.args.get('page', 1, type=int)
    per_page = 12
    offset = (page - 1) * per_page

    # Handle is_real filter: 'true' = real only, 'false' = user-generated only, None = all
    if raw_is_real == 'true':
        is_real_value = True
    elif raw_is_real == 'false':
        is_real_value = False
    else:
        is_real_value = None

    # convert empty strings to None
    filters = {
        'year': int(raw_year) if raw_year else None,
        'round': int(raw_round) if raw_round else None,
        'circuit_id': raw_circuit_id if raw_circuit_id else None,
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


@races_bp.route("/api/circuits")
def get_circuits_list():
    """API endpoint to get all circuits for dropdown filter"""
    db = DatabaseConnection()
    try:
        db.execute("""
            SELECT c.id, c.full_name, c.place_name, co.name as country_name
            FROM circuit c
            LEFT JOIN country co ON c.country_id = co.id
            ORDER BY c.full_name ASC
        """)
        results = db.fetchall()
        circuits = [dict(row) for row in results]
        return jsonify({'circuits': circuits})
    except Exception as e:
        print(f"Error fetching circuits: {e}")
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


@races_bp.route("/api/race_results_full/<int:race_id>")
def get_race_results_full(race_id):
    """Return full race results with complex 6-table join.
    Includes: race, circuit, country, race_data, driver, constructor, driver nationality.
    Query params: page (int)
    """
    raw_page = request.args.get('page', 1, type=int)
    per_page = 50
    offset = (raw_page - 1) * per_page

    params = {
        'race_id': race_id,
        'limit': per_page,
        'offset': offset
    }

    db = DatabaseConnection()
    try:
        sql_query = get_sql_query('select_race_results_full.sql')
        db.execute(sql_query, params)
        rows = db.fetchall()
        data = [dict(row) for row in rows]
        total_items = data[0]['full_count'] if data else 0
        total_pages = (total_items + per_page - 1) // per_page

        return jsonify({
            'race_results': data,
            'pagination': {
                'current_page': raw_page,
                'total_pages': total_pages,
                'total_items': total_items
            }
        })
    except Exception as e:
        print(f"Error fetching full race results: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500
    finally:
        db.close()


@races_bp.route('/race-data/new')
def add_race_data_form_page():
    """Render form to create a new race_data row"""
    if 'username' not in session:
        return render_template('login.html')

    db = DatabaseConnection()
    try:
        user_id = session.get('user_id')
        # fetch only user-created races (is_real = FALSE) for dropdown
        db.execute("""SELECT id, official_name, year FROM race 
                      WHERE is_real = FALSE AND user_id = %s 
                      ORDER BY year DESC, official_name ASC""", (user_id,))
        races = db.fetchall()

        db.execute("SELECT id, full_name FROM driver ORDER BY full_name ASC")
        drivers = db.fetchall()

        db.execute("SELECT id, full_name FROM constructor ORDER BY full_name ASC")
        constructors = db.fetchall()

        return render_template('add_race_data_form.html', races=races, drivers=drivers, constructors=constructors, record=None)
    finally:
        db.close()


@races_bp.route('/race-data/edit/<int:race_data_id>')
def edit_race_data_form_page(race_data_id):
    """Render edit form for an existing race_data row (must be user-owned)"""
    if 'user_id' not in session:
        return render_template('login.html')

    db = DatabaseConnection()
    try:
        db.execute("SELECT * FROM race_data WHERE id = %s", (race_data_id,))
        record = db.fetchone()
        if not record:
            return "Race data not found", 404

        # permission check: must belong to user
        if record.get('user_id') != session.get('user_id'):
            return "Permission denied", 403

        user_id = session.get('user_id')
        # fetch only user-created races (is_real = FALSE) for dropdown
        db.execute("""SELECT id, official_name, year FROM race 
                      WHERE is_real = FALSE AND user_id = %s 
                      ORDER BY year DESC, official_name ASC""", (user_id,))
        races = db.fetchall()
        db.execute("SELECT id, full_name FROM driver ORDER BY full_name ASC")
        drivers = db.fetchall()
        db.execute("SELECT id, full_name FROM constructor ORDER BY full_name ASC")
        constructors = db.fetchall()

        return render_template('add_race_data_form.html', races=races, drivers=drivers, constructors=constructors, record=record)
    finally:
        db.close()


@races_bp.route('/api/add-race-data', methods=['POST'])
def add_race_data():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401

    try:
        data = request.get_json()
        user_id = session.get('user_id')

        db = DatabaseConnection()

        insert_query = """
            INSERT INTO race_data (
                race_id, driver_id, constructor_id, user_id,
                position_display_order, driver_number, race_points,
                race_pole_position, race_qualification_position_number, race_grid_position_number, is_real
            ) VALUES (
                %(race_id)s, %(driver_id)s, %(constructor_id)s, %(user_id)s,
                %(position_display_order)s, %(driver_number)s, %(race_points)s,
                %(race_pole_position)s, %(race_qualification_position_number)s, %(race_grid_position_number)s, FALSE
            ) RETURNING id
        """

        params = {
            'race_id': data.get('race_id'),
            'driver_id': data.get('driver_id'),
            'constructor_id': data.get('constructor_id'),
            'user_id': user_id,
            'position_display_order': data.get('position_display_order'),
            'driver_number': data.get('driver_number'),
            'race_points': data.get('race_points'),
            'race_pole_position': data.get('race_pole_position'),
            'race_qualification_position_number': data.get('race_qualification_position_number'),
            'race_grid_position_number': data.get('race_grid_position_number')
        }

        db.execute(insert_query, params)
        new_id = db.fetchone()[0]
        db.commit()

        return jsonify({'success': True, 'race_data_id': new_id})
    except Exception as e:
        print(f"Error adding race_data: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        db.close()


@races_bp.route('/api/update-race-data/<int:race_data_id>', methods=['POST'])
def update_race_data(race_data_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401

    try:
        data = request.get_json()
        user_id = session.get('user_id')
        db = DatabaseConnection()

        update_query = """
            UPDATE race_data SET
                race_id = %(race_id)s,
                driver_id = %(driver_id)s,
                constructor_id = %(constructor_id)s,
                position_display_order = %(position_display_order)s,
                driver_number = %(driver_number)s,
                race_points = %(race_points)s,
                race_pole_position = %(race_pole_position)s,
                race_qualification_position_number = %(race_qualification_position_number)s,
                race_grid_position_number = %(race_grid_position_number)s
            WHERE id = %(id)s AND user_id = %(user_id)s
        """

        params = dict(data)
        params['id'] = race_data_id
        params['user_id'] = user_id

        db.execute(update_query, params)
        if db.cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Permission denied or record not found'}), 403

        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error updating race_data: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        db.close()


@races_bp.route('/api/delete-race-data/<int:race_data_id>', methods=['POST'])
def delete_race_data(race_data_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401

    db = DatabaseConnection()
    try:
        user_id = session.get('user_id')
        query = "DELETE FROM race_data WHERE id = %s AND user_id = %s"
        db.execute(query, (race_data_id, user_id))
        if db.cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Permission denied or record not found'}), 403

        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error deleting race_data: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        db.close()

@races_bp.route("/add-race")
def add_race_page():
    authenticated = 'username' in session

    db = DatabaseConnection()
    try:
        # Get all countries for the dropdown
        # country selection form database to show in add-race page - will be added
        countries = db.fetchall()

        return render_template(
            "add_race.html",
            authenticated=authenticated,
            username=session.get('username'),
            is_admin=session.get('is_admin', False),
            countries=countries
        )
    finally:
        db.close()


@races_bp.route("/races/new")
def add_race_form_page():
    """Display the add race form page"""
    authenticated = 'username' in session
    
    db = DatabaseConnection()
    try:
        # Fetch circuits for the dropdown
        db.execute("SELECT id, full_name, place_name FROM circuit ORDER BY full_name ASC")
        circuits = db.fetchall()
        
        # Define the schema for the race form
        race_schema = [
            {'name': 'circuit_id', 'type': 'fk', 'nullable': False},
            {'name': 'year', 'type': 'integer', 'nullable': False},
            {'name': 'round', 'type': 'integer', 'nullable': False},
            {'name': 'date', 'type': 'date', 'nullable': False},
            {'name': 'official_name', 'type': 'text', 'nullable': False},
            {'name': 'qualifying_format', 'type': 'text', 'nullable': False},
            {'name': 'laps', 'type': 'integer', 'nullable': False},
            {'name': 'qualifying_date', 'type': 'date', 'nullable': True},
        ]

        # Format foreign key options for the template
        fk_options = {
            'circuit_id': [{'id': c['id'], 'display': f"{c['full_name']} ({c['place_name']})"} for c in circuits],
            'qualifying_format': [
                {'id': 'TWO_SESSION', 'display': 'Two-session'},
                {'id': 'ONE_SESSION', 'display': 'One-session'},
                {'id': 'FOUR_LAPS', 'display': 'Four laps'},
                {'id': 'SPRINT_RACE', 'display': 'Sprint Race'},
                {'id': 'KNOCKOUT', 'display': 'Knockout'},
                {'id': 'AGGREGATE', 'display': 'Aggregate'},
            ]
        }

        table_info = {
            'display_name': 'Race',
            'name': 'race'
        }

        return render_template(
            "add_race_form.html",
            schema=race_schema,
            fk_options=fk_options,
            table_info=table_info,
            foreign_keys={'circuit_id': {'table': 'circuit'}},
            record=None,
            table_name='race',
            authenticated=authenticated
        )
    finally:
        db.close()


@races_bp.route("/races/edit/<int:race_id>")
def edit_race_form_page(race_id):
    """Display the edit race form page"""
    authenticated = 'username' in session
    
    db = DatabaseConnection()
    try:
        # Fetch the existing record
        db.execute("SELECT * FROM race WHERE id = %s", (race_id,))
        record = db.fetchone()
        
        if not record:
            return "Race not found", 404

        # Fetch circuits for the dropdown
        db.execute("SELECT id, full_name, place_name FROM circuit ORDER BY full_name ASC")
        circuits = db.fetchall()
        
        # Define the same schema used in the create route
        race_schema = [
            {'name': 'circuit_id', 'type': 'fk', 'nullable': False},
            {'name': 'year', 'type': 'integer', 'nullable': False},
            {'name': 'round', 'type': 'integer', 'nullable': False},
            {'name': 'date', 'type': 'date', 'nullable': False},
            {'name': 'official_name', 'type': 'text', 'nullable': False},
            {'name': 'qualifying_format', 'type': 'text', 'nullable': False},
            {'name': 'laps', 'type': 'integer', 'nullable': False},
            {'name': 'qualifying_date', 'type': 'date', 'nullable': True},
        ]

        fk_options = {
            'circuit_id': [{'id': c['id'], 'display': f"{c['full_name']} ({c['place_name']})"} for c in circuits],
            'qualifying_format': [
                {'id': 'TWO_SESSION', 'display': 'Two-session'},
                {'id': 'ONE_SESSION', 'display': 'One-session'},
                {'id': 'FOUR_LAPS', 'display': 'Four laps'},
                {'id': 'SPRINT_RACE', 'display': 'Sprint Race'},
                {'id': 'KNOCKOUT', 'display': 'Knockout'},
                {'id': 'AGGREGATE', 'display': 'Aggregate'},
            ]
        }

        table_info = {
            'display_name': 'Race',
            'name': 'race'
        }

        return render_template(
            "add_race_form.html",
            schema=race_schema,
            fk_options=fk_options,
            table_info=table_info,
            record=record,
            race_id=race_id,
            authenticated=authenticated
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


@races_bp.route("/api/update-race/<int:race_id>", methods=["POST"])
def update_race(race_id):
    """Update an existing race"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        db = DatabaseConnection()
        
        update_query = """
            UPDATE race SET 
                circuit_id = %(circuit_id)s,
                year = %(year)s,
                round = %(round)s,
                date = %(date)s,
                official_name = %(official_name)s,
                qualifying_format = %(qualifying_format)s,
                laps = %(laps)s,
                qualifying_date = %(qualifying_date)s
            WHERE id = %(id)s AND user_id = %(user_id)s AND is_real = FALSE
        """
        
        data['id'] = race_id
        data['user_id'] = session.get('user_id')
        
        db.execute(update_query, data)
        
        if db.cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Permission denied or record not found'}), 403
        
        db.commit()
        
        return jsonify({'success': True, 'message': 'Race updated successfully'})
    except Exception as e:
        print(f"Error updating race: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        db.close()


@races_bp.route("/api/delete-race/<int:race_id>", methods=["POST"])
def delete_race(race_id):
    """Delete a user-created race"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    db = DatabaseConnection()
    try:
        user_id = session.get('user_id')
        
        # Only allow deletion of user-created races (is_real = FALSE)
        query = "DELETE FROM race WHERE id = %s AND user_id = %s AND is_real = FALSE"
        db.execute(query, (race_id, user_id))
        
        if db.cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Permission denied or record not found'}), 403
            
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error deleting race: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        db.close()


@races_bp.route("/api/races/<int:race_id>")
def get_race_by_id(race_id):
    """Get a single race by ID"""
    db = DatabaseConnection()
    try:
        db.execute("""
            SELECT 
                r.id, r.circuit_id, r.year, r.round, r.date, r.official_name,
                r.qualifying_format, r.laps, r.qualifying_date,
                c.full_name AS circuit_name,
                c.place_name AS circuit_place_name,
                c.length AS circuit_length,
                c.turns AS circuit_turns,
                c.type AS circuit_type,
                c.direction AS circuit_direction,
                c.total_races_held AS circuit_total_races,
                c.latitude AS circuit_latitude,
                c.longitude AS circuit_longitude,
                co.name AS circuit_country
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

@races_bp.route("/api/circuits/<circuit_id>")
def get_circuit_by_id(circuit_id):
    """Get circuit details by ID."""
    db = DatabaseConnection()
    try:
        sql_query = get_sql_query('get_circuit_detail.sql')
        db.execute(sql_query, {'circuit_id': circuit_id})
        row = db.fetchone()
        if not row:
            return jsonify({'error': 'Circuit not found'}), 404

        payload = dict(row)
        circuit = {
            'id': payload.get('id'),
            'name': payload.get('name'),
            'full_name': payload.get('full_name'),
            'place_name': payload.get('place_name'),
            'type': payload.get('type'),
            'direction': payload.get('direction'),
            'length': payload.get('length'),
            'turns': payload.get('turns'),
            'total_races_held': payload.get('total_races_held'),
            'latitude': payload.get('latitude'),
            'longitude': payload.get('longitude'),
            'country_name': payload.get('country_name')
        }
        stats = {
            'total_races': payload.get('total_races') or 0,
            'official_races': payload.get('official_races') or 0,
            'simulated_races': payload.get('simulated_races') or 0,
            'first_year': payload.get('first_year'),
            'last_year': payload.get('last_year'),
            'avg_laps': float(payload['avg_laps']) if payload.get('avg_laps') is not None else None,
            'unique_winners': payload.get('unique_winners') or 0,
            'home_drivers': payload.get('home_drivers') or 0,
            'home_constructors': payload.get('home_constructors') or 0
        }

        response = {
            'circuit': circuit,
            'stats': stats,
            'races': payload.get('races') or []
        }

        return jsonify(response)
    except Exception as e:
        print(f"Error fetching circuit: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@races_bp.route("/api/circuits/<circuit_id>/races")
def get_races_for_circuit(circuit_id):
    """List races hosted at a given circuit."""
    db = DatabaseConnection()
    try:
        query = get_sql_query('get_circuit_races.sql')
        db.execute(query, {'circuit_id': circuit_id})
        rows = db.fetchall()
        data = [dict(row) for row in rows]
        return jsonify({'races': data})
    except Exception as e:
        print(f"Error fetching circuit races: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@races_bp.route("/api/races/<int:race_id>/constructor-standings")
def get_race_constructor_standings(race_id):
    """Get constructor championship standings after a specific race."""
    db = DatabaseConnection()
    try:
        db.execute("""
            SELECT 
                rcs.position_number,
                rcs.points,
                c.id AS constructor_id,
                c.full_name AS constructor_name,
                co.name AS country_name
            FROM race_constructor_standing rcs
            JOIN constructor c ON rcs.constructor_id = c.id
            LEFT JOIN country co ON c.country_id = co.id
            WHERE rcs.race_id = %s
            ORDER BY rcs.position_number ASC
        """, (race_id,))
        rows = db.fetchall()
        return jsonify({'standings': [dict(r) for r in rows]})
    except Exception as e:
        print(f"Error fetching constructor standings: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@races_bp.route("/api/races/<int:race_id>/driver-standings")
def get_race_driver_standings(race_id):
    """Get driver championship standings after a specific race."""
    db = DatabaseConnection()
    try:
        db.execute("""
            SELECT 
                rds.position_number,
                rds.points,
                d.id AS driver_id,
                d.full_name AS driver_name,
                d.abbreviation,
                co.name AS nationality
            FROM race_driver_standing rds
            JOIN driver d ON rds.driver_id = d.id
            LEFT JOIN country co ON d.nationality_country_id = co.id
            WHERE rds.race_id = %s
            ORDER BY rds.position_number ASC
        """, (race_id,))
        rows = db.fetchall()
        return jsonify({'standings': [dict(r) for r in rows]})
    except Exception as e:
        print(f"Error fetching driver standings: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@races_bp.route("/api/stats/races-by-year")
def races_by_year():
    """Return aggregated race statistics grouped by year with pagination and filtering."""
    # Get filter parameters
    raw_year = request.args.get('year')
    raw_year_from = request.args.get('year_from')
    raw_year_to = request.args.get('year_to')
    raw_race_count_min = request.args.get('race_count_min')
    raw_race_count_max = request.args.get('race_count_max')
    raw_avg_laps_min = request.args.get('avg_laps_min')
    raw_avg_laps_max = request.args.get('avg_laps_max')
    raw_sort_by = request.args.get('sort_by', 'year')
    raw_sort_dir = request.args.get('sort_dir', 'DESC')
    
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = 10
    offset = (page - 1) * per_page

    # Convert and validate parameters
    params = {
        'year': int(raw_year) if raw_year else None,
        'year_from': int(raw_year_from) if raw_year_from else None,
        'year_to': int(raw_year_to) if raw_year_to else None,
        'race_count_min': int(raw_race_count_min) if raw_race_count_min else None,
        'race_count_max': int(raw_race_count_max) if raw_race_count_max else None,
        'avg_laps_min': float(raw_avg_laps_min) if raw_avg_laps_min else None,
        'avg_laps_max': float(raw_avg_laps_max) if raw_avg_laps_max else None,
        'sort_by': raw_sort_by if raw_sort_by in ['year', 'race_count', 'avg_laps'] else 'year',
        'sort_dir': raw_sort_dir if raw_sort_dir in ['ASC', 'DESC'] else 'DESC',
        'limit': per_page,
        'offset': offset
    }

    db = DatabaseConnection()
    try:
        sql = get_sql_query('race_stats_by_year.sql')
        db.execute(sql, params)
        rows = db.fetchall()
        data = [dict(r) for r in rows]
        
        total_items = data[0]['full_count'] if data else 0
        total_pages = (total_items + per_page - 1) // per_page
        
        return jsonify({
            'data': data,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'total_items': total_items
            }
        })
    except Exception as e:
        print(f"Error fetching race stats: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()
