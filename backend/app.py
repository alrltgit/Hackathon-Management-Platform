import os
import io
import csv
import json
import sqlite3
from datetime import datetime

from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename

# ----------------- Flask app -----------------

app = Flask(__name__)

# ----------------- Config -----------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "submissions.db")
UPLOAD_ROOT = os.path.join(BASE_DIR, "uploads")

ALLOWED_FILE_TYPES = {"csv", "json", "py", "pkl", "h5", "onnx", "joblib", "pt"}
MODEL_FILE_TYPES = {"py", "pkl", "h5", "onnx", "joblib", "pt"}
MAX_FILE_SIZE_MB = 5

# Hard-coded challenges for now – your "challenges API" can later replace this.
CHALLENGES = {
    "house_price": {
        "title": "House Price Prediction",
        "description": "Submit predicted prices for each id.",
        "expected_columns": ["id", "prediction"],
        "order_matters": True,
    },
    "churn_model": {
        "title": "Customer Churn Challenge",
        "description": "Submit churn probability for each customer.",
        "expected_columns": ["customer_id", "churn_prob"],
        "order_matters": True,
    },
}

# ----------------- DB helpers (SQLite) -----------------

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    os.makedirs(UPLOAD_ROOT, exist_ok=True)

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            challenge_id TEXT NOT NULL,
            file_path TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            status TEXT NOT NULL,
            error_message TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


def save_submission(user_id, challenge_id, file_path, original_filename, status="VALID", error_message=None):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO submissions (user_id, challenge_id, file_path, original_filename, status, error_message, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            challenge_id,
            file_path,
            original_filename,
            status,
            error_message,
            datetime.utcnow().isoformat(),
        ),
    )
    conn.commit()
    submission_id = cur.lastrowid
    conn.close()
    return submission_id


def list_submissions():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, user_id, challenge_id, original_filename, status, created_at
        FROM submissions
        ORDER BY created_at DESC
        """
    )
    rows = cur.fetchall()
    conn.close()
    return rows


def get_submission(submission_id: int):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM submissions WHERE id = ?",
        (submission_id,),
    )
    row = cur.fetchone()
    conn.close()
    return row


# ----------------- Validation helpers -----------------

def error_response(error_code, message, hint=None, status_code=400):
    payload = {
        "status": "error",
        "error_code": error_code,
        "message": message,
    }
    if hint:
        payload["hint"] = hint
    return jsonify(payload), status_code


def get_extension(filename: str) -> str:
    parts = filename.lower().rsplit(".", 1)
    if len(parts) != 2:
        return ""
    return parts[1]


def read_file_content(file_storage):
    content = file_storage.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        return None, f"File is {size_mb:.2f} MB, maximum allowed is {MAX_FILE_SIZE_MB} MB."
    return content, None


def parse_csv(content: bytes):
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        return None, None, "Could not decode CSV as UTF-8."

    buf = io.StringIO(text)
    reader = csv.DictReader(buf)
    if reader.fieldnames is None:
        return None, None, "CSV file is missing a header row."

    columns = reader.fieldnames
    rows = list(reader)
    if not rows:
        return None, None, "CSV file contains header but no data rows."
    return columns, rows, None


def parse_json(content: bytes):
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        return None, None, f"JSON parsing failed: {str(e)}"

    if not isinstance(data, list) or not data:
        return None, None, "Expected a JSON array of objects, e.g. [{\"id\": 1, \"prediction\": 0.5}, ...]"

    first = data[0]
    if not isinstance(first, dict):
        return None, None, "Each JSON entry must be an object with named fields, e.g. {\"id\": 1, \"prediction\": 0.5}."

    columns = list(first.keys())
    rows = data
    return columns, rows, None


def parse_and_validate_file(file_storage, expected_columns, order_matters=True):
    # No file at all
    if not file_storage or file_storage.filename == "":
        return None, None, None, ("MISSING_FILE", "No file uploaded.")

    filename = file_storage.filename
    ext = get_extension(filename)
    if ext not in ALLOWED_FILE_TYPES:
        return None, None, None, (
            "UNSUPPORTED_FILE_TYPE",
            f"File type '.{ext}' is not supported. "
            f"Use one of: {sorted(ALLOWED_FILE_TYPES)}."
        )

    # Read the whole file into memory
    content, size_error = read_file_content(file_storage)
    if size_error:
        return None, None, None, ("FILE_TOO_LARGE", size_error)

    # ---------- CASE 1: CSV / JSON (tabular predictions) ----------
    if ext in {"csv", "json"}:
        if ext == "csv":
            columns, rows, parse_error = parse_csv(content)
            if parse_error:
                return None, None, None, ("INVALID_CSV", parse_error)
        else:  # json
            columns, rows, parse_error = parse_json(content)
            if parse_error:
                return None, None, None, ("INVALID_JSON", parse_error)

        # Validate schema
        if order_matters:
            if list(columns) != list(expected_columns):
                return None, None, None, (
                    "SCHEMA_MISMATCH",
                    f"Expected columns {expected_columns}, got {columns}."
                )
        else:
            missing = [c for c in expected_columns if c not in columns]
            if missing:
                return None, None, None, (
                    "MISSING_COLUMNS",
                    f"Missing required columns: {missing}"
                )

        if not rows:
            return None, None, None, (
                "NO_ROWS",
                "File contains a header but no data rows."
            )

        # SUCCESS for tabular file
        return columns, rows, content, None

    # ---------- CASE 2: .py / model files (no schema validation) ----------
    # For these file types we just accept the bytes and skip parsing/validation.
    # Judges will open/run/inspect them manually.
    if ext in MODEL_FILE_TYPES:
        # No columns/rows concept here
        return None, None, content, None

    # Fallback (should never hit if ALLOWED_FILE_TYPES and logic are consistent)
    return None, None, None, (
        "UNSUPPORTED_FILE_TYPE",
        f"Unsupported file type '.{ext}'."
    )


# ----------------- Routes -----------------

@app.route("/api/challenges", methods=["GET"])
def list_challenges():
    return jsonify({
        "status": "ok",
        "challenges": [
            {
                "id": cid,
                "title": c["title"],
                "description": c["description"],
                "expected_columns": c["expected_columns"],
                "order_matters": c["order_matters"],
            }
            for cid, c in CHALLENGES.items()
        ]
    })


@app.route("/api/submit", methods=["POST"])
def submit_solution():
    challenge_id = request.form.get("challenge_id")
    if not challenge_id:
        return error_response(
            "MISSING_CHALLENGE_ID",
            "Field 'challenge_id' is required in form data.",
            hint="Add challenge_id to your form data and try again.",
        )

    challenge = CHALLENGES.get(challenge_id)
    if not challenge:
        return error_response(
            "UNKNOWN_CHALLENGE",
            f"Unknown challenge_id '{challenge_id}'.",
            hint=f"Use one of: {list(CHALLENGES.keys())}.",
        )

    user_id = request.form.get("user_id", "demo-user")
    file_storage = request.files.get("file")

    expected_columns = challenge["expected_columns"]
    order_matters = challenge.get("order_matters", True)

    # parse_and_validate_file now handles:
    # - CSV/JSON → returns columns, rows, content, None
    # - .py / model files → returns None, None, content, None
    columns, rows, content, err = parse_and_validate_file(
        file_storage, expected_columns, order_matters
    )

    if err:
        if isinstance(err, tuple):
            code, msg = err
        else:
            code, msg = "VALIDATION_ERROR", err

        original_filename = file_storage.filename if file_storage else "unknown"

        # store invalid submission (optional but nice for judges)
        save_submission(
            user_id=user_id,
            challenge_id=challenge_id,
            file_path="",
            original_filename=original_filename,
            status="INVALID",
            error_message=msg,
        )

        return error_response(
            code,
            msg,
            hint="Check your file format, column names and order, then try again.",
        )

    # ---------- if we reach here, the file is ACCEPTED ----------

    # Save file to disk (works the same for CSV/JSON and .py/model files)
    safe_name = secure_filename(file_storage.filename)
    challenge_folder = os.path.join(UPLOAD_ROOT, challenge_id)
    os.makedirs(challenge_folder, exist_ok=True)

    file_path = os.path.join(challenge_folder, safe_name)
    with open(file_path, "wb") as f:
        f.write(content)

    abs_path = os.path.abspath(file_path)

    # Save submission metadata to DB
    submission_id = save_submission(
        user_id=user_id,
        challenge_id=challenge_id,
        file_path=abs_path,
        original_filename=file_storage.filename,
        status="VALID",
        error_message=None,
    )

    return jsonify({
        "status": "ok",
        "submission_id": submission_id,
        "message": "File accepted and stored.",
        "meta": {
            "challenge_id": challenge_id,
            # CSV/JSON: rows is a list; .py/model: rows is None
            "rows": len(rows) if rows is not None else None,
            "columns": columns,  # will be None for .py/model uploads
        },
    }), 200



@app.route("/api/submissions", methods=["GET"])
def api_list_submissions():
    rows = list_submissions()
    submissions = [
        {
            "id": r["id"],
            "user_id": r["user_id"],
            "challenge_id": r["challenge_id"],
            "original_filename": r["original_filename"],
            "status": r["status"],
            "created_at": r["created_at"],
        }
        for r in rows
    ]
    return jsonify({"status": "ok", "submissions": submissions}), 200


@app.route("/api/submissions/<int:submission_id>/download", methods=["GET"])
def download_submission(submission_id):
    row = get_submission(submission_id)
    if row is None:
        return error_response(
            "SUBMISSION_NOT_FOUND",
            f"No submission with id {submission_id}.",
            status_code=404,
        )

    file_path = row["file_path"]
    original_filename = row["original_filename"]

    if not file_path or not os.path.exists(file_path):
        return error_response(
            "FILE_MISSING",
            "File for this submission is missing on the server.",
            status_code=500,
        )

    return send_file(
        file_path,
        as_attachment=True,
        download_name=original_filename,
    )


# ----------------- Main -----------------

if __name__ == "__main__":
    init_db()
    app.run(host="127.0.0.1", port=5000, debug=True)
