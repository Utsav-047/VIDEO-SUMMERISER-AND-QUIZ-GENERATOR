from functools import wraps
from flask import Blueprint, jsonify, session, request
from models.db import (
    get_user_by_id,
    get_all_users_rankings,
    get_admin_overview_stats,
    get_admin_user_detail,
    update_user_role,
)

admin_bp = Blueprint("admin_bp", __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "Authentication required. Please sign in."}), 401
        
        current_user = get_user_by_id(user_id)
        if not current_user or current_user.get("role") != "admin":
            return jsonify({"error": "Admin privileges required to access this resource."}), 403

        return f(*args, **kwargs)
    return decorated_function


@admin_bp.route("/api/admin/overview", methods=["GET"])
@admin_required
def admin_overview():
    try:
        stats = get_admin_overview_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve admin overview: {str(e)}"}), 500


@admin_bp.route("/api/admin/rankings", methods=["GET"])
@admin_required
def admin_rankings():
    try:
        rankings = get_all_users_rankings()
        return jsonify(rankings)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch user rankings: {str(e)}"}), 500


@admin_bp.route("/api/admin/user/<int:user_id>", methods=["GET"])
@admin_required
def admin_user_detail(user_id):
    try:
        details = get_admin_user_detail(user_id)
        if not details:
            return jsonify({"error": "User not found"}), 404
        return jsonify(details)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch user details: {str(e)}"}), 500


@admin_bp.route("/api/admin/user/<int:user_id>/role", methods=["POST"])
@admin_required
def change_user_role(user_id):
    current_admin_id = session.get("user_id")
    data = request.get_json(silent=True) or {}
    new_role = data.get("role")

    if new_role not in ("admin", "user"):
        return jsonify({"error": "Invalid role. Allowed values: 'admin', 'user'"}), 400

    if current_admin_id == user_id and new_role != "admin":
        return jsonify({"error": "You cannot remove your own admin privileges."}), 400

    try:
        rows_affected = update_user_role(user_id, new_role)
        if rows_affected == 0:
            return jsonify({"error": "User not found or role already set."}), 404
        return jsonify({"message": f"User role successfully updated to {new_role}", "role": new_role})
    except Exception as e:
        return jsonify({"error": f"Failed to update user role: {str(e)}"}), 500
