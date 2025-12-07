from flask import Blueprint, render_template, session

races_bp = Blueprint("races", __name__)

@races_bp.route("/races")
def races_page():
    authenticated = 'username' in session
    return render_template(
        "races.html",
        authenticated=authenticated,
        username=session.get('username'),
        is_admin=session.get('is_admin', False)
    )
