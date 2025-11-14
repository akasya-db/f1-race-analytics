from flask import Blueprint, render_template

constructors_bp = Blueprint("constructors", __name__)

@constructors_bp.route("/constructors")
def constructors_page():
    return render_template("constructors.html")
