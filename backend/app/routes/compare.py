from flask import Blueprint, jsonify, render_template, request
from app.database import DatabaseConnection
import os

compare_bp = Blueprint('compare', __name__)

# Path to SQL queries
QUERIES_DIR = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'database', 'queries')


def load_sql_query(filename):
    """Load SQL query from file"""
    filepath = os.path.join(QUERIES_DIR, filename)
    with open(filepath, 'r') as f:
        return f.read()


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


@compare_bp.route('/api/compare-drivers', methods=['POST'])
def compare_drivers():
    """
    Compare two drivers' performances using a complex SQL query.
    
    Expected JSON body:
    {
        "driver_1_id": "max-verstappen",
        "race_1_id": 1234,
        "driver_2_id": "lewis-hamilton", 
        "race_2_id": 1234,
        "circuit_id": "silverstone"
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'error': 'No JSON data provided'}), 400
    
    required_fields = ['driver_1_id', 'race_1_id', 'driver_2_id', 'race_2_id', 'circuit_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
    
    db = DatabaseConnection()
    try:
        # Load the complex comparison query from SQL file
        query = load_sql_query('compare_driver_performance.sql')
        
        # Parameters in order of appearance in SQL:
        # CTE1: driver_1_id, race_1_id
        # CTE2: driver_2_id, race_2_id
        # CTE3: driver_1_id, circuit_id
        # CTE4: driver_2_id, circuit_id
        # CTE5: driver_1_id (subquery), driver_1_id, race_1_id
        # CTE6: driver_2_id (subquery), driver_2_id, race_2_id
        # CTE7: circuit_id
        # WHERE: driver_1_id, driver_2_id
        params = (
            data['driver_1_id'],          # CTE1
            int(data['race_1_id']),
            data['driver_2_id'],          # CTE2
            int(data['race_2_id']),
            data['driver_1_id'],          # CTE3
            data['circuit_id'],
            data['driver_2_id'],          # CTE4
            data['circuit_id'],
            data['driver_1_id'],          # CTE5 subquery
            data['driver_1_id'],          # CTE5 main
            int(data['race_1_id']),
            data['driver_2_id'],          # CTE6 subquery
            data['driver_2_id'],          # CTE6 main
            int(data['race_2_id']),
            data['circuit_id'],           # CTE7
            data['driver_1_id'],          # WHERE
            data['driver_2_id']
        )
        
        db.execute(query, params)
        
        result = db.fetchone()
        
        if not result:
            return jsonify({'success': False, 'error': 'No comparison data found'}), 404
        
        # Convert to dict and handle Decimal/date types for JSON serialization
        comparison = {}
        for key, value in dict(result).items():
            if value is None:
                comparison[key] = None
            elif hasattr(value, 'isoformat'):  # date/datetime
                comparison[key] = value.isoformat()
            elif hasattr(value, '__float__'):  # Decimal
                comparison[key] = float(value)
            else:
                comparison[key] = value
        
        # Structure the response for easier frontend consumption
        response = {
            'success': True,
            'comparison': {
                'circuit': {
                    'name': comparison.get('circuit_name'),
                    'location': comparison.get('circuit_location'),
                    'country': comparison.get('circuit_country'),
                    'length': comparison.get('circuit_length_km'),
                    'turns': comparison.get('circuit_turns'),
                    'type': comparison.get('circuit_type'),
                    'direction': comparison.get('circuit_direction'),
                    'total_races': comparison.get('circuit_total_races')
                },
                'driver_1': {
                    'info': {
                        'id': comparison.get('driver_1_id'),
                        'name': comparison.get('driver_1_name'),
                        'abbreviation': comparison.get('driver_1_abbr'),
                        'nationality': comparison.get('driver_1_nationality'),
                        'number': comparison.get('driver_1_number'),
                        'constructor': comparison.get('driver_1_constructor')
                    },
                    'race_performance': {
                        'year': comparison.get('driver_1_race_year'),
                        'race_name': comparison.get('driver_1_race_name'),
                        'finish_position': comparison.get('driver_1_finish_position'),
                        'qualifying_position': comparison.get('driver_1_quali_position'),
                        'grid_position': comparison.get('driver_1_grid_position'),
                        'points': comparison.get('driver_1_race_points'),
                        'pole': comparison.get('driver_1_had_pole'),
                        'positions_gained': comparison.get('driver_1_positions_gained')
                    },
                    'circuit_history': {
                        'total_races': comparison.get('driver_1_circuit_races'),
                        'avg_finish': comparison.get('driver_1_circuit_avg_finish'),
                        'best_finish': comparison.get('driver_1_circuit_best_finish'),
                        'worst_finish': comparison.get('driver_1_circuit_worst_finish'),
                        'total_points': comparison.get('driver_1_circuit_total_points'),
                        'avg_points': comparison.get('driver_1_circuit_avg_points'),
                        'wins': comparison.get('driver_1_circuit_wins'),
                        'podiums': comparison.get('driver_1_circuit_podiums'),
                        'poles': comparison.get('driver_1_circuit_poles'),
                        'avg_quali': comparison.get('driver_1_circuit_avg_quali'),
                        'best_quali': comparison.get('driver_1_circuit_best_quali'),
                        'avg_positions_delta': comparison.get('driver_1_circuit_avg_pos_delta')
                    },
                    'season_stats': {
                        'season_points': comparison.get('driver_1_season_points'),
                        'avg_finish': comparison.get('driver_1_season_avg_finish'),
                        'season_wins': comparison.get('driver_1_season_wins'),
                        'season_podiums': comparison.get('driver_1_season_podiums'),
                        'championship_position': comparison.get('driver_1_championship_pos')
                    }
                },
                'driver_2': {
                    'info': {
                        'id': comparison.get('driver_2_id'),
                        'name': comparison.get('driver_2_name'),
                        'abbreviation': comparison.get('driver_2_abbr'),
                        'nationality': comparison.get('driver_2_nationality'),
                        'number': comparison.get('driver_2_number'),
                        'constructor': comparison.get('driver_2_constructor')
                    },
                    'race_performance': {
                        'year': comparison.get('driver_2_race_year'),
                        'race_name': comparison.get('driver_2_race_name'),
                        'finish_position': comparison.get('driver_2_finish_position'),
                        'qualifying_position': comparison.get('driver_2_quali_position'),
                        'grid_position': comparison.get('driver_2_grid_position'),
                        'points': comparison.get('driver_2_race_points'),
                        'pole': comparison.get('driver_2_had_pole'),
                        'positions_gained': comparison.get('driver_2_positions_gained')
                    },
                    'circuit_history': {
                        'total_races': comparison.get('driver_2_circuit_races'),
                        'avg_finish': comparison.get('driver_2_circuit_avg_finish'),
                        'best_finish': comparison.get('driver_2_circuit_best_finish'),
                        'worst_finish': comparison.get('driver_2_circuit_worst_finish'),
                        'total_points': comparison.get('driver_2_circuit_total_points'),
                        'avg_points': comparison.get('driver_2_circuit_avg_points'),
                        'wins': comparison.get('driver_2_circuit_wins'),
                        'podiums': comparison.get('driver_2_circuit_podiums'),
                        'poles': comparison.get('driver_2_circuit_poles'),
                        'avg_quali': comparison.get('driver_2_circuit_avg_quali'),
                        'best_quali': comparison.get('driver_2_circuit_best_quali'),
                        'avg_positions_delta': comparison.get('driver_2_circuit_avg_pos_delta')
                    },
                    'season_stats': {
                        'season_points': comparison.get('driver_2_season_points'),
                        'avg_finish': comparison.get('driver_2_season_avg_finish'),
                        'season_wins': comparison.get('driver_2_season_wins'),
                        'season_podiums': comparison.get('driver_2_season_podiums'),
                        'championship_position': comparison.get('driver_2_championship_pos')
                    }
                }
            }
        }
        
        return jsonify(response)
        
    except FileNotFoundError:
        return jsonify({'success': False, 'error': 'Query file not found'}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        db.close()
