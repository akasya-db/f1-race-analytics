from flask import Blueprint, jsonify, render_template, request
from app.database import DatabaseConnection

compare_bp = Blueprint('compare', __name__)


@compare_bp.route('/compare-data')
def compare_data():
    """Compare data page"""
    return render_template('compare_data.html')


# ============================================
# Compare Data API Endpoints
# ============================================

@compare_bp.route('/api/circuits')
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


@compare_bp.route('/api/validate-race')
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


@compare_bp.route('/api/constructors-by-race')
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


@compare_bp.route('/api/drivers-by-race-constructor')
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
