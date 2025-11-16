from flask import Blueprint, render_template

drivers_bp = Blueprint("drivers", __name__)

@drivers_bp.route("/drivers")
def drivers_page():
    return render_template("drivers.html")
