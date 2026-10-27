import re
import secrets
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import limiter
from models.db import (
    insert_user,
    get_user_by_email,
    get_user_by_id,
    create_password_reset_otp,
    verify_and_consume_otp,
    update_user_password,
    delete_password_resets,
)
from services.email_service import send_otp_email

auth_bp = Blueprint("auth_bp", __name__)


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Enforces strong password rules:
    - At least 8 characters long
    - At least one letter (a-z, A-Z)
    - At least one number (0-9)
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if len(password) > 128:
        return False, "Password cannot exceed 128 characters."
    if not re.search(r"[A-Za-z]", password):
        return False, "Password must contain at least one letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number."
    return True, ""


@auth_bp.route("/api/register", methods=["POST"])
@limiter.limit("5 per minute")
def register():
    data = request.get_json(silent=True) or {}
    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")

    if not full_name or not email or not password:
        return jsonify({"error": "full_name, email and password are required"}), 400

    is_valid, err_msg = validate_password_strength(password)
    if not is_valid:
        return jsonify({"error": err_msg}), 400

    if get_user_by_email(email):
        return jsonify({"error": "An account with this email already exists"}), 409

    password_hash = generate_password_hash(password)
    user_id = insert_user(full_name, email, password_hash)

    # Log the user in immediately after registering
    session["user_id"] = user_id

    return jsonify({"id": user_id, "full_name": full_name, "email": email, "role": "user"}), 201


@auth_bp.route("/api/login", methods=["POST"])
@limiter.limit("5 per minute")
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

    return jsonify({
        "id": user["id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "role": user.get("role", "user")
    })


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


@auth_bp.route("/api/forgot-password", methods=["POST"])
@limiter.limit("3 per minute")
def forgot_password():
    """
    Generates a 6-digit OTP valid for 10 minutes to reset password.
    Returns the same success message whether or not the email exists to prevent account enumeration.
    """
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = get_user_by_email(email)
    if user:
        # Generate secure 6-digit OTP code
        otp_code = f"{secrets.randbelow(900000) + 100000:06d}"
        expires_at = datetime.now() + timedelta(minutes=10)
        create_password_reset_otp(user["id"], otp_code, expires_at)
        send_otp_email(email, otp_code)

    return jsonify({
        "status": "success",
        "message": f"If an account is associated with {email}, a 6-digit verification code has been sent.",
        "email": email,
    }), 200



@auth_bp.route("/api/reset-password", methods=["POST"])
@limiter.limit("5 per minute")
def reset_password():
    """Validates 6-digit OTP (up to 5 attempts) and updates user's password."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    otp_code = str(data.get("otp") or "").strip()
    new_password = (data.get("new_password") or "")

    if not email or not otp_code or not new_password:
        return jsonify({"error": "Email, verification code, and new password are required"}), 400

    is_valid, err_msg = validate_password_strength(new_password)
    if not is_valid:
        return jsonify({"error": err_msg}), 400

    reset_entry, error_msg = verify_and_consume_otp(email, otp_code)
    if error_msg:
        return jsonify({"error": error_msg}), 400

    new_hash = generate_password_hash(new_password)
    update_user_password(reset_entry["user_id"], new_hash)
    delete_password_resets(reset_entry["user_id"])

    return jsonify({
        "status": "success",
        "message": "Your password has been successfully reset. You can now log in.",
    })

