from flask import Blueprint, render_template, session

constructors_bp = Blueprint("constructors", __name__)

@constructors_bp.route("/constructors")
def constructors_page():
    authenticated = 'username' in session
    return render_template(
        "constructors.html",
        authenticated=authenticated,
        username=session.get('username')
    )       