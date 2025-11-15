import os
from flask import Flask, request, jsonify, send_from_directory, g
from db import db
from models import User, Role
from functools import wraps
import jwt
import datetime

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///test.db"
app.config["SECRET_KEY"] = "secretkey"

db.init_app(app)

UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

UPLOAD_ROOT = "uploads/participants"

ALLOWED_TYPES = {
    "json": [".json"],
    "csv": [".csv"],
    "models": [".onx", ".h5", ".pt", ".sav", '.pkl'],
    "script": [".py", ".r", ".ipynb"]
}

def detect_file_category(filename):
    extension = os.path.splitext(filename)[1].lower()

    for category, ext_list in ALLOWED_TYPES.items():
        if extension in ext_list:
            return category

    return None

# ------------------ CREATING ROLES --------------------
# @app.before_first_request
# def create_default_roles():
#     existing = Role.query.all()
#     if not existing:
#         roles = ["participant", "admin", "judge"]
#         for r in roles:
#             db.session.add(Role(name=r))
#         db.session.commit()

# ---------------- ROLE PROTECTED ENDPOINT ----------------
def requires_role(role_name):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            token = request.headers.get("Authorization")

            if not token:
                return jsonify({"message": "missing token"}), 401

            try:
                payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
                # Set current user so endpoints can access g.current_user
                g.current_user = User.query.get(payload["user_id"])

                if not g.current_user:
                    return jsonify({"message": "user not found"}), 404
                # Check role
                if role_name not in payload["roles"]:
                    return jsonify({"message": "forbidden"}), 403
            except Exception:
                return jsonify({"message": "invalid token"}), 401

            return func(*args, **kwargs)
        wrapper.__name__ = func.__name__
        return wrapper
    return decorator

# ------------------- ADMIN ENDPOINTS -------------------
# --------------- LISTING USERS AND ROLES -------------
@app.route("/admin/users", methods=["GET"])
@requires_role("admin")
def list_users():
    users = User.query.all()
    result = []
    for user in users:
        result.append({
            "id": user.id,
            "email": user.email,
            "roles": [role.name for role in user.roles]
        })
    return jsonify(result)

# ----------- ASSIGN ROLE --------------------
@app.route("/admin/assign-role", methods=["POST"])
@requires_role("admin")
def assign_role():
    data = request.get_json()
    user_id = data.get("user_id")
    role_name = data.get("role")

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "user not found"}), 404

    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({"message": "role not found"}), 404

    if role in user.roles:
        return jsonify({"message": "user already has this role"})

    user.roles.append(role)
    db.session.commit()
    return jsonify({"message": f"role '{role_name}' added to user {user.email}"})

# ------------ REMOVE ROLE -------------------
@app.route("/admin/remove-role", methods=["POST"])
@requires_role("admin")
def remove_role():
    data = request.get_json()
    user_id = data.get("user_id")
    role_name = data.get("role")

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "user not found"}), 404

    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({"message": "role not found"}), 404

    if role not in user.roles:
        return jsonify({"message": "user does not have this role"})

    user.roles.remove(role)
    db.session.commit()
    return jsonify({"message": f"role '{role_name}' removed from user {user.email}"})

# ------------ DELETE USER -----------------
@app.route("/admin/delete-user", methods=["POST"])
@requires_role("admin")
def delete_user():
    data = request.get_json()
    user_id = data.get("user_id")

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "user not found"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": f"user {user.email} deleted"})

# ------------------- JUDGE ENDPOINTS -------------------
# These endpoints are protected by the 'judge' role
# Only users with the 'judge' role can access them

# GET /judge/review
# Returns a list of participants and their submissions for review
@app.route("/judge/review", methods=["GET"])
@requires_role("judge")
def get_reviews():
    # Get all users with role 'participant'
    participants = User.query.join(User.roles).filter(Role.name == "participant").all()
    
    result = []
    for participant in participants:
        result.append({
            "user_id": participant.id,
            "email": participant.email,
            # Example submissions (replace with your actual Submission model)
            "submissions": [
                {"submission_id": 1, "title": "Example Project"}
            ]
        })
    return jsonify(result)

# Endpoint to list all files available to judges
@app.route("/judge/files", methods=["GET"])
@requires_role("judge")
def judge_list_files():
    """
    Return list of all files available to judges in uploads folder.
    """

    file_list = []
    for root, dirs, files in os.walk(UPLOAD_FOLDER):
        for f in files:
            full_path = os.path.join(root, f)
            relative_path = os.path.relpath(full_path, UPLOAD_FOLDER)
            file_list.append(relative_path)

    return jsonify({"files": file_list})


# Endpoint to download a file associated with a submission
@app.route("/judge/files/<path:filename>", methods=["GET"])
@requires_role("judge")
def judge_download_file(filename):
    """
    Allow judge to download a file from the uploads folder.
    """

    # Full safe path
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    # Check if file exists
    if not os.path.isfile(file_path):
        return jsonify({"error": "File not found"}), 404

    # Determine directory & filename separately
    directory, file = os.path.split(file_path)

    return send_from_directory(
        directory,
        file,
        as_attachment=True
    )


# POST /judge/grade
# Allows a judge to submit a grade and optional comment for a participant's submission
@app.route("/judge/grade", methods=["POST"])
@requires_role("judge")
def grade_submission():
    data = request.get_json()
    user_id = data.get("user_id")
    submission_id = data.get("submission_id")
    grade = data.get("grade")
    comment = data.get("comment", "")

    # Example: save grade to database (replace with actual models)
    # submission = Submission.query.get(submission_id)
    # if not submission:
    #     return jsonify({"message": "submission not found"}), 404
    # new_grade = Grade(
    #     submission_id=submission.id,
    #     judge_id=current_user.id,
    #     grade=grade,
    #     comment=comment
    # )
    # db.session.add(new_grade)
    # db.session.commit()

    # For demonstration, return a confirmation message
    return jsonify({
        "message": f"Grade {grade} for user {user_id} on submission {submission_id} recorded",
        "comment": comment
    })

# ------------------- PARTICIPANT ENDPOINTS -------------------
# Only users with role 'participant' can access these

# GET /participant/panel
# Returns current participant's submissions
@app.route("/participant/panel", methods=["GET"])
@requires_role("participant")
def participant_panel():
    token = request.headers.get("Authorization")
    payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
    user_id = payload["user_id"]

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "user not found"}), 404

    # Example: returning submissions (replace with your actual Submission model)
    submissions = [{"submission_id": 1, "title": "Example Project"}]  # dummy data

    return jsonify({
        "user_id": user.id,
        "email": user.email,
        "submissions": submissions
    })

# ENDPOINT TO UPLOAD FILES
@app.route("/participant/upload", methods=["POST"])
@requires_role("participant")
def participant_upload_file():
    """
    Upload endpoint for participant.
    Creates folder structure:
    uploads/participants/<user_id>/(json|csv|models|scripts)
    """

    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Determine file category
    category = detect_file_category(file.filename)
    if not category:
        return jsonify({"error": "Unsupported file type"}), 400

    user_id = g.current_user.id

    # Build path: uploads/participants/<id>/<category>/
    user_root = os.path.join(UPLOAD_ROOT, str(user_id))
    target_folder = os.path.join(user_root, category)

    # Create folders if missing
    os.makedirs(target_folder, exist_ok=True)

    # Save file inside category folder
    save_path = os.path.join(target_folder, file.filename)
    file.save(save_path)

    return jsonify({
        "message": "File uploaded successfully",
        "file_category": category,
        "filename": file.filename,
        "saved_to": f"participants/{user_id}/{category}/{file.filename}"
    })


# POST /participant/submit
# Allows participant to create a new submission
@app.route("/participant/submit", methods=["POST"])
@requires_role("participant")
def create_submission():
    token = request.headers.get("Authorization")
    payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
    user_id = payload["user_id"]

    data = request.get_json()
    title = data.get("title")
    content = data.get("content", "")

    # Example: save submission (replace with actual Submission model)
    # new_submission = Submission(user_id=user_id, title=title, content=content)
    # db.session.add(new_submission)
    # db.session.commit()

    return jsonify({
        "message": f"Submission '{title}' created for user {user_id}"
    })

# ------------------- AUTHENTICATION ENDPOINTS -------------------
# ---------------- REGISTER ----------------
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    user = User(email=data["email"])
    user.set_password(data["password"])
 
    db.session.add(user)
    db.session.commit()

    # Assign participant role by default
    role = Role.query.filter_by(name="participant").first()
    if not role:
        role = Role(name="participant")
        db.session.add(role)
        db.session.commit()

    user.roles.append(role)
    db.session.commit()

    return jsonify({"message": "registered"}), 201

# ---------------- LOGIN ----------------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    user = User.query.filter_by(email=data["email"]).first()

    if user and user.check_password(data["password"]):
        token = jwt.encode(
            {
                "user_id": user.id,
                "roles": [r.name for r in user.roles],
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            },
            app.config["SECRET_KEY"],
            algorithm="HS256"
        )
        return jsonify({"token": token})
    else:
        return jsonify({"message": "wrong credentials"}), 401

# ---------------- RUN ----------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()

         # create default roles once
        existing = Role.query.all()
        if not existing:
            roles = ["participant", "admin", "judge"]
            for r in roles:
                db.session.add(Role(name=r))
            db.session.commit()
    app.run(debug=True)
