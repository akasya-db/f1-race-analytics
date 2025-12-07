from flask import Blueprint, render_template, session

drivers_bp = Blueprint("drivers", __name__)

@drivers_bp.route("/drivers")
def drivers_page():
    authenticated = 'username' in session
    return render_template(
        "drivers.html",
        authenticated=authenticated,
        username=session.get('username'),
        is_admin=session.get('is_admin', False)
    )
