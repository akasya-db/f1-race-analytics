from flask import Blueprint, render_template

races_bp = Blueprint("races", __name__)

@races_bp.route("/races")
def races_page():
    return render_template("races.html")
