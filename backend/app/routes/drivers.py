import os
from flask import Blueprint, render_template, session, jsonify, request, current_app
from app.database import DatabaseConnection

drivers_bp = Blueprint("drivers", __name__)

def get_sql_query(filename):
    path = os.path.join(current_app.root_path, "..", "..", "database", "queries", filename)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

@drivers_bp.route("/drivers")
def drivers_page():
    return render_template(
        "drivers.html",
        authenticated=('username' in session),
        username=session.get("username"),
        is_admin=session.get("is_admin", False)
    )

@drivers_bp.route("/api/drivers")
def get_drivers_data():

    filters = {
        "name": request.args.get("name"),
        "nationality": request.args.get("nationality"),
        "place_of_birth": request.args.get("place_of_birth"),

        "wins_min": request.args.get("wins_min", type=int),
        "podiums_min": request.args.get("podiums_min", type=int),
        "points_min": request.args.get("points_min", type=float),
        "poles_min": request.args.get("poles_min", type=int),

        "birth_from": request.args.get("birth_from"),
        "birth_to": request.args.get("birth_to"),

        "is_real": True if request.args.get("is_real") == "true" else None,
        "limit": 12
    }

    page = request.args.get("page", 1, type=int)
    filters["offset"] = (page - 1) * 12

    db = DatabaseConnection()

    try:
        sql = get_sql_query("select_drivers.sql")
        db.execute(sql, filters)
        rows = db.fetchall()
        results = [dict(r) for r in rows]

        total = results[0]["full_count"] if results else 0
        total_pages = (total + 11) // 12

        return jsonify({
            "drivers": results,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_items": total
            }
        })

    except Exception as e:
        print("DRIVER API ERROR:", e)
        return jsonify({"error": "internal error"}), 500

    finally:
        db.close()
