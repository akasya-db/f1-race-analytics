import os
from flask import (
    Blueprint,
    render_template,
    session,
    jsonify,
    request,
    current_app,
    redirect,
    url_for
)
from app.database import DatabaseConnection

drivers_bp = Blueprint("drivers", __name__)

# ---------------------------------------------------------
# Helper: SQL dosyasını okur
# ---------------------------------------------------------
def get_sql_query(filename):
    path = os.path.join(
        current_app.root_path,
        "..", "..", "database", "queries",
        filename
    )
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

# ---------------------------------------------------------
# PAGE → PUBLIC DRIVERS PAGE
# ---------------------------------------------------------
@drivers_bp.route("/drivers")
def drivers_page():
    return render_template(
        "drivers.html",
        authenticated=("username" in session),
        username=session.get("username"),
        is_admin=session.get("is_admin", False)
    )

# ---------------------------------------------------------
# API → DRIVER LIST (REAL + CUSTOM, FILTER + PAGINATION)
# ---------------------------------------------------------
@drivers_bp.route("/api/drivers")
def get_drivers_data():

    page = request.args.get("page", 1, type=int)
    per_page = 12
    offset = (page - 1) * per_page
    is_real_param = request.args.get("is_real")

    if is_real_param == "true":
            is_real = True
    elif is_real_param == "false":
            is_real = False
    else:
            is_real = None


    filters = {
        "name": request.args.get("name") or None,
        "nationality": request.args.get("nationality") or None,
        "place_of_birth": request.args.get("place_of_birth") or None,

        "wins_min": request.args.get("wins_min", type=int),
        "podiums_min": request.args.get("podiums_min", type=int),
        "points_min": request.args.get("points_min", type=float),
        "poles_min": request.args.get("poles_min", type=int),

        "birth_from": request.args.get("birth_from") or None,
        "birth_to": request.args.get("birth_to") or None,

        "is_real": is_real,
        "limit": per_page,
        "offset": offset
    }

    db = DatabaseConnection()
    try:
        sql = get_sql_query("select_drivers.sql")
        db.execute(sql, filters)

        rows = db.fetchall()
        results = [dict(r) for r in rows]

        total_items = results[0]["full_count"] if results else 0
        total_pages = (total_items + per_page - 1) // per_page

        return jsonify({
            "drivers": results,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_items": total_items
            }
        })

    except Exception as e:
        print("DRIVER API ERROR:", e)
        return jsonify({"error": "Internal Server Error"}), 500

    finally:
        db.close()

# ---------------------------------------------------------
# PAGE → ADD DRIVER FORM
# ---------------------------------------------------------
@drivers_bp.route("/drivers/new")
def add_driver_form_page():
    if "username" not in session:
        return redirect(url_for("auth.login"))

    db = DatabaseConnection()
    try:
        # Countries for FK selects
        db.execute("SELECT id, name FROM country ORDER BY name ASC")
        countries = db.fetchall()

        driver_schema = [
            {"name": "name", "type": "text", "nullable": False},

            {"name": "abbreviation", "type": "text", "nullable": True},
            {"name": "permanent_number", "type": "integer", "nullable": True},
            {"name": "gender", "type": "text", "nullable": True},

            {"name": "date_of_birth", "type": "date", "nullable": False},
            {"name": "place_of_birth", "type": "text", "nullable": True},

            {"name": "country_of_birth_country_id", "type": "fk", "nullable": False},
            {"name": "nationality_country_id", "type": "fk", "nullable": False},

            {"name": "best_championship_position", "type": "integer", "nullable": True},
            {"name": "best_race_result", "type": "integer", "nullable": True},

            {"name": "total_championship_wins", "type": "integer", "nullable": False},
            {"name": "total_race_starts", "type": "integer", "nullable": False},
            {"name": "total_race_wins", "type": "integer", "nullable": False},
            {"name": "total_race_laps", "type": "integer", "nullable": False},
            {"name": "total_podiums", "type": "integer", "nullable": False},
            {"name": "total_points", "type": "numeric", "nullable": False},
            {"name": "total_pole_positions", "type": "integer", "nullable": False},
        ]

        fk_options = {
            "country_of_birth_country_id": [
                {"id": c["id"], "display": c["name"]} for c in countries
            ],
            "nationality_country_id": [
                {"id": c["id"], "display": c["name"]} for c in countries
            ]
        }

        table_info = {
            "display_name": "Driver",
            "name": "driver"
        }

        return render_template(
            "add_driver_form.html",
            schema=driver_schema,
            fk_options=fk_options,
            table_info=table_info,
            record=None
        )

    finally:
        db.close()

# ---------------------------------------------------------
# API → ADD DRIVER (USER DATA)
# ---------------------------------------------------------
@drivers_bp.route("/api/add-driver", methods=["POST"])
def add_driver():
    if "user_id" not in session:
        return jsonify({"success": False, "error": "Not authenticated"}), 401

    db = DatabaseConnection()
    try:
        data = request.get_json() or {}

        raw_name = (data.get("name") or "").strip()
        if not raw_name:
            return jsonify({"success": False, "error": "Name is required"}), 400

        name_parts = raw_name.split()
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else None

        user_id = session.get("user_id")

        db.execute("""
            SELECT MAX(CAST(SUBSTRING(id FROM '[0-9]+') AS INTEGER)) AS max_id
            FROM driver
            WHERE id ~ '^ud-[0-9]+$'
        """)
        result = db.fetchone()
        next_num = (result["max_id"] or 0) + 1
        driver_id = f"ud-{next_num}"

        insert_query = """
            INSERT INTO driver (
                id, user_id,
                name, first_name, last_name, full_name,
                abbreviation, permanent_number, gender,
                date_of_birth, date_of_death, place_of_birth,
                country_of_birth_country_id, nationality_country_id,
                best_championship_position, best_race_result,
                total_championship_wins, total_race_starts,
                total_race_wins, total_race_laps,
                total_podiums, total_points, total_pole_positions,
                is_real
            ) VALUES (
                %(id)s, %(user_id)s,
                %(name)s, %(first_name)s, %(last_name)s, %(full_name)s,
                %(abbreviation)s, %(permanent_number)s, %(gender)s,
                %(date_of_birth)s, NULL, %(place_of_birth)s,
                %(country_of_birth_country_id)s, %(nationality_country_id)s,
                %(best_championship_position)s, %(best_race_result)s,
                %(total_championship_wins)s, %(total_race_starts)s,
                %(total_race_wins)s, %(total_race_laps)s,
                %(total_podiums)s, %(total_points)s, %(total_pole_positions)s,
                FALSE
            )
        """

        params = {
            "id": driver_id,
            "user_id": user_id,
            "name": raw_name,
            "first_name": first_name,
            "last_name": last_name,
            "full_name": raw_name,

            "abbreviation": data.get("abbreviation"),
            "permanent_number": data.get("permanent_number"),
            "gender": data.get("gender"),

            "date_of_birth": data.get("date_of_birth"),
            "place_of_birth": data.get("place_of_birth"),

            "country_of_birth_country_id": data.get("country_of_birth_country_id"),
            "nationality_country_id": data.get("nationality_country_id"),

            "best_championship_position": data.get("best_championship_position"),
            "best_race_result": data.get("best_race_result"),

            "total_championship_wins": data.get("total_championship_wins"),
            "total_race_starts": data.get("total_race_starts"),
            "total_race_wins": data.get("total_race_wins"),
            "total_race_laps": data.get("total_race_laps"),
            "total_podiums": data.get("total_podiums"),
            "total_points": data.get("total_points"),
            "total_pole_positions": data.get("total_pole_positions"),
        }

        db.execute(insert_query, params)
        db.commit()

        return jsonify({"success": True, "driver_id": driver_id})

    except Exception as e:
        print("ADD DRIVER ERROR:", e)
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        db.close()

# ---------------------------------------------------------
# API → DELETE DRIVER (USER ONLY)
# ---------------------------------------------------------
@drivers_bp.route("/api/delete-driver/<driver_id>", methods=["POST"])
def delete_driver(driver_id):
    if "user_id" not in session:
        return jsonify({"success": False, "error": "Not authenticated"}), 401

    user_id = session.get("user_id")
    db = DatabaseConnection()

    try:
        db.execute("""
            DELETE FROM driver
            WHERE id = %s
              AND user_id = %s
              AND is_real = FALSE
        """, (driver_id, user_id))

        if db.cursor.rowcount == 0:
            return jsonify({"success": False, "error": "Not found or permission denied"}), 403

        db.commit()
        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        db.close()

@drivers_bp.route("/drivers/edit/<driver_id>")
def edit_driver_form_page(driver_id):
    if "username" not in session:
        return redirect(url_for("auth.login"))

    db = DatabaseConnection()
    try:
        # 1. Mevcut driver kaydı (SADECE user + custom)
        db.execute(
            """
            SELECT *
            FROM driver
            WHERE id = %s
              AND user_id = %s
              AND is_real = FALSE
            """,
            (driver_id, session.get("user_id"))
        )
        record = db.fetchone()

        if not record:
            return "Driver not found", 404

        # 2. Countries (FK dropdown)
        db.execute("SELECT id, name FROM country ORDER BY name ASC")
        countries = db.fetchall()

        # 3. Form şeması (ADD DRIVER İLE AYNI)
        driver_schema = [
            {"name": "name", "type": "text", "nullable": False},

            {"name": "abbreviation", "type": "text", "nullable": True},
            {"name": "permanent_number", "type": "integer", "nullable": True},
            {"name": "gender", "type": "text", "nullable": True},

            {"name": "date_of_birth", "type": "date", "nullable": False},
            {"name": "place_of_birth", "type": "text", "nullable": True},

            {"name": "country_of_birth_country_id", "type": "fk", "nullable": False},
            {"name": "nationality_country_id", "type": "fk", "nullable": False},

            {"name": "best_championship_position", "type": "integer", "nullable": True},
            {"name": "best_race_result", "type": "integer", "nullable": True},

            {"name": "total_championship_wins", "type": "integer", "nullable": False},
            {"name": "total_race_starts", "type": "integer", "nullable": False},
            {"name": "total_race_wins", "type": "integer", "nullable": False},
            {"name": "total_race_laps", "type": "integer", "nullable": False},
            {"name": "total_podiums", "type": "integer", "nullable": False},
            {"name": "total_points", "type": "numeric", "nullable": False},
            {"name": "total_pole_positions", "type": "integer", "nullable": False},
        ]

        fk_options = {
            "country_of_birth_country_id": [
                {"id": c["id"], "display": c["name"]} for c in countries
            ],
            "nationality_country_id": [
                {"id": c["id"], "display": c["name"]} for c in countries
            ]
        }

        table_info = {
            "display_name": "Driver",
            "name": "driver"
        }

        return render_template(
            "add_driver_form.html",
            schema=driver_schema,
            fk_options=fk_options,
            table_info=table_info,
            record=record
        )

    finally:
        db.close()

@drivers_bp.route("/api/update-driver/<driver_id>", methods=["POST"])
def update_driver(driver_id):
    if "user_id" not in session:
        return jsonify({"success": False, "error": "Not authenticated"}), 401

    db = DatabaseConnection()
    try:
        data = request.get_json() or {}

        raw_name = (data.get("name") or "").strip()
        if not raw_name:
            return jsonify({"success": False, "error": "Name is required"}), 400

        name_parts = raw_name.split()
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else None

        params = {
            "id": driver_id,
            "user_id": session.get("user_id"),

            "name": raw_name,
            "first_name": first_name,
            "last_name": last_name,
            "full_name": raw_name,

            "abbreviation": data.get("abbreviation"),
            "permanent_number": data.get("permanent_number"),
            "gender": data.get("gender"),

            "date_of_birth": data.get("date_of_birth"),
            "place_of_birth": data.get("place_of_birth"),

            "country_of_birth_country_id": data.get("country_of_birth_country_id"),
            "nationality_country_id": data.get("nationality_country_id"),

            "best_championship_position": data.get("best_championship_position"),
            "best_race_result": data.get("best_race_result"),

            "total_championship_wins": data.get("total_championship_wins"),
            "total_race_starts": data.get("total_race_starts"),
            "total_race_wins": data.get("total_race_wins"),
            "total_race_laps": data.get("total_race_laps"),
            "total_podiums": data.get("total_podiums"),
            "total_points": data.get("total_points"),
            "total_pole_positions": data.get("total_pole_positions"),
        }

        update_query = """
            UPDATE driver SET
                name = %(name)s,
                first_name = %(first_name)s,
                last_name = %(last_name)s,
                full_name = %(full_name)s,

                abbreviation = %(abbreviation)s,
                permanent_number = %(permanent_number)s,
                gender = %(gender)s,

                date_of_birth = %(date_of_birth)s,
                place_of_birth = %(place_of_birth)s,

                country_of_birth_country_id = %(country_of_birth_country_id)s,
                nationality_country_id = %(nationality_country_id)s,

                best_championship_position = %(best_championship_position)s,
                best_race_result = %(best_race_result)s,

                total_championship_wins = %(total_championship_wins)s,
                total_race_starts = %(total_race_starts)s,
                total_race_wins = %(total_race_wins)s,
                total_race_laps = %(total_race_laps)s,
                total_podiums = %(total_podiums)s,
                total_points = %(total_points)s,
                total_pole_positions = %(total_pole_positions)s
            WHERE id = %(id)s
              AND user_id = %(user_id)s
              AND is_real = FALSE
        """

        db.execute(update_query, params)
        db.commit()

        return jsonify({"success": True})

    except Exception as e:
        print("UPDATE DRIVER ERROR:", e)
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        db.close()


@drivers_bp.route("/api/driver-leaderboard", methods=["GET"])
def driver_leaderboard():
    db = DatabaseConnection()
    try:
        year_from = request.args.get("year_from", type=int)
        year_to   = request.args.get("year_to", type=int)
        limit     = request.args.get("limit", default=10, type=int)

        # limit whitelist
        if limit not in (10, 25, 50):
            limit = 10

        # year_from/year_to boşsa: DB'den min-max al
        if year_from is None or year_to is None:
            db.execute("SELECT MIN(year) AS min_year, MAX(year) AS max_year FROM race;")
            r = db.fetchone()

            # race tablosu boşsa güvenli fallback
            min_year = r["min_year"] if r and r["min_year"] is not None else 1950
            max_year = r["max_year"] if r and r["max_year"] is not None else 2100

            if year_from is None:
                year_from = min_year
            if year_to is None:
                year_to = max_year

        if year_from > year_to:
            return jsonify({"error": "year_from must be <= year_to"}), 400

        sql = get_sql_query("driver_leaderboard.sql")

        db.execute(sql, {
            "year_from": year_from,
            "year_to": year_to,
            "limit": limit
        })

        rows = db.fetchall()
        return jsonify([dict(r) for r in rows])

    except Exception as e:
        print("LEADERBOARD ERROR:", e)
        return jsonify({"error": "Leaderboard error"}), 500

    finally:
        db.close()
