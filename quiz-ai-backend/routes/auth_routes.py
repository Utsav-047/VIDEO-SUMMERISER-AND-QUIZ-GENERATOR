from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash

from models.db import insert_user, get_user_by_email, get_user_by_id

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")

    if not full_name or not email or not password:
        return jsonify({"error": "full_name, email and password are required"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    if get_user_by_email(email):
        return jsonify({"error": "An account with this email already exists"}), 409

    password_hash = generate_password_hash(password)
    user_id = insert_user(full_name, email, password_hash)

    # Log the user in immediately after registering
    session["user_id"] = user_id

    return jsonify({"id": user_id, "full_name": full_name, "email": email}), 201


@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = get_user_by_email(email)

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    session["user_id"] = user["id"]

    return jsonify({"id": user["id"], "full_name": user["full_name"], "email": user["email"]})


@auth_bp.route("/api/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    return jsonify({"status": "logged out"})


@auth_bp.route("/api/me", methods=["GET"])
def me():
    """Lets the frontend check 'am I logged in?' on page load."""
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    return jsonify(user)