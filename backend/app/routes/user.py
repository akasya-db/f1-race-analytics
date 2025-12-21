from flask import Blueprint, jsonify, render_template, request, session
from app.database import DatabaseConnection  # Import your wrapper

user_bp = Blueprint('user', __name__)

@user_bp.route('/data-panel')
def data_panel():
    """Main hub for user data management"""
    user_modules = {
        'constructors': {
            'name': 'Constructors',
            'route': 'user.user_constructors_list', 
            'description': 'Manage your custom racing teams and performance stats.',
            'svg_path': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>'
        },
        'drivers': {
            'name': 'Drivers',
            'route': 'user.user_drivers_list',
            'description': 'Create and manage your custom drivers.',
            'svg_path': '<circle cx="12" cy="7" r="4"></circle><path d="M5.5 21a6.5 6.5 0 0 1 13 0"></path>'
        },
        'races': {
            'name': 'Races',
            'route': 'user.user_races_list', 
            'description': 'Manage your custom race events and configurations.',
            'svg_path': '<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>'
        },
        'race_data': {
            'name': 'Race Data',
            'route': 'user.user_race_data_list',
            'description': "Manage individual race data rows you've added.",
            'svg_path': '<path d="M3 3h18v4H3V3zm0 7h18v11H3V10z"></path>'
        }
    }
    return render_template('add_data.html', user_modules=user_modules)


@user_bp.route('/compare-data')
def compare_data():
    """Compare data page - placeholder for future implementation"""
    return render_template('compare_data.html')


# ============================================
# Compare Data API Endpoints
# ============================================

@user_bp.route('/api/circuits')
def get_circuits():
    """Get all circuits for the compare data page"""
    db = DatabaseConnection()
    try:
        query = """
            SELECT c.id, c.full_name, co.name as country_name
            FROM circuit c
            JOIN country co ON c.country_id = co.id
            ORDER BY c.full_name ASC
        """
        db.execute(query)
        rows = db.fetchall()
        circuits = []
        for row in rows:
            circuits.append({
                'id': row['id'],
                'full_name': row['full_name'],
                'country_name': row['country_name']
            })
        return jsonify({'success': True, 'circuits': circuits})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        db.close()


@user_bp.route('/api/validate-race')
def validate_race():
    """Check if a race exists for given circuit and year, return race_id if found"""
    circuit_id = request.args.get('circuit_id')
    year = request.args.get('year')
    
    if not circuit_id or not year:
        return jsonify({'success': False, 'error': 'Missing circuit_id or year'}), 400
    
    db = DatabaseConnection()
    try:
        query = """
            SELECT id, official_name, date, laps
            FROM race
            WHERE circuit_id = %s AND year = %s
        """
        db.execute(query, (circuit_id, int(year)))
        race = db.fetchone()
        
        if race:
            return jsonify({'success': True, 'race': dict(race)})
        else:
            return jsonify({'success': False, 'error': 'No race found for this circuit and year'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        db.close()


@user_bp.route('/api/constructors-by-race')
def get_constructors_by_race():
    """Get constructors that participated in a specific race"""
    race_id = request.args.get('race_id')
    
    if not race_id:
        return jsonify({'success': False, 'error': 'Missing race_id'}), 400
    
    db = DatabaseConnection()
    try:
        query = """
            SELECT DISTINCT c.id, c.name, c.full_name
            FROM race_data rd
            JOIN constructor c ON rd.constructor_id = c.id
            WHERE rd.race_id = %s
            ORDER BY c.name ASC
        """
        db.execute(query, (int(race_id),))
        constructors = [dict(row) for row in db.fetchall()]
        return jsonify({'success': True, 'constructors': constructors})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        db.close()


@user_bp.route('/api/drivers-by-race-constructor')
def get_drivers_by_race_constructor():
    """Get drivers that drove for a constructor in a specific race"""
    race_id = request.args.get('race_id')
    constructor_id = request.args.get('constructor_id')
    
    if not race_id or not constructor_id:
        return jsonify({'success': False, 'error': 'Missing race_id or constructor_id'}), 400
    
    db = DatabaseConnection()
    try:
        query = """
            SELECT DISTINCT d.id, d.name, d.full_name, d.abbreviation
            FROM race_data rd
            JOIN driver d ON rd.driver_id = d.id
            WHERE rd.race_id = %s AND rd.constructor_id = %s
            ORDER BY d.name ASC
        """
        db.execute(query, (int(race_id), constructor_id))
        drivers = [dict(row) for row in db.fetchall()]
        return jsonify({'success': True, 'drivers': drivers})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        db.close()


# app/routes/user.py
# app/routes/user.py

@user_bp.route('/my-constructors')
def user_constructors_list():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        
    db = DatabaseConnection()
    records = []
    schema = []
    
    try:
        user_id = session.get('user_id')
        query = "SELECT * FROM constructor WHERE id LIKE 'uc-%%' AND user_id = %s ORDER BY name ASC"
        db.execute(query, (user_id,))
        records = db.fetchall()
        
        if db.cursor.description:
            schema = [desc[0] for desc in db.cursor.description]
    except Exception as e:
        # If this prints in your terminal, the query failed (e.g., missing column)
        print(f"DEBUG ERROR: {e}") 
    finally:
        db.close()

    # MUST BE OUTSIDE THE TRY/EXCEPT/FINALLY BLOCKS
    return render_template('user_table_list.html', 
                           records=records, 
                           schema=schema, 
                           title="My Constructors")


@user_bp.route('/my-drivers')
def user_drivers_list():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401

    db = DatabaseConnection()
    records = []
    schema = []

    try:
        user_id = session.get('user_id')
        query = """
            SELECT *
            FROM driver
            WHERE id LIKE 'ud-%%'
              AND user_id = %s
            ORDER BY full_name ASC
        """
        db.execute(query, (user_id,))
        records = db.fetchall()

        if db.cursor.description:
            schema = [desc[0] for desc in db.cursor.description]

    except Exception as e:
        print(f"DEBUG ERROR (drivers): {e}")
    finally:
        db.close()

    return render_template(
        'user_table_list.html',
        records=records,
        schema=schema,
        title="My Drivers"
    )


@user_bp.route('/my-races')
def user_races_list():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        
    db = DatabaseConnection()
    records = []
    schema = []
    
    try:
        user_id = session.get('user_id')
        query = """SELECT r.*, c.full_name as circuit_name 
                   FROM race r 
                   LEFT JOIN circuit c ON r.circuit_id = c.id 
                   WHERE r.is_real = FALSE AND r.user_id = %s 
                   ORDER BY r.year DESC, r.round DESC"""
        db.execute(query, (user_id,))
        records = db.fetchall()
        
        if db.cursor.description:
            schema = [desc[0] for desc in db.cursor.description]
    except Exception as e:
        print(f"DEBUG ERROR: {e}") 
    finally:
        db.close()

    return render_template('user_table_list.html', 
                           records=records, 
                           schema=schema, 
                           title="My Races")


@user_bp.route('/my-race-data')
def user_race_data_list():
    """List race_data rows added by the user"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        
    db = DatabaseConnection()
    records = []
    schema = []
    try:
        user_id = session.get('user_id')
        query = """SELECT
                       r.official_name AS race_name,
                       d.full_name AS driver_name,
                       c.full_name AS constructor_name,
                       rd.position_display_order,
                       rd.driver_number,
                       rd.race_points,
                       rd.race_pole_position,
                       rd.race_qualification_position_number,
                       rd.race_grid_position_number,
                       rd.is_real,
                       rd.created_at,
                       rd.id
                   FROM race_data rd
                   LEFT JOIN race r ON rd.race_id = r.id
                   LEFT JOIN driver d ON rd.driver_id = d.id
                   LEFT JOIN constructor c ON rd.constructor_id = c.id
                   WHERE rd.user_id = %s
                   ORDER BY rd.created_at DESC NULLS LAST"""
        db.execute(query, (user_id,))
        records = db.fetchall()
        if db.cursor.description:
            schema = [desc[0] for desc in db.cursor.description]
    except Exception as e:
        print(f"DEBUG ERROR: {e}")
    finally:
        db.close()

    return render_template('user_table_list.html',
                           records=records,
                           schema=schema,
                           title="My Race Data")