import os
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import limiter
from routes.video_routes import video_bp
from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1)
app.secret_key = Config.SECRET_KEY

# Security & Session cookie hardening
# For cross-domain cookies between Vercel (frontend) and Render (backend),
# SameSite must be None and Secure must be True over HTTPS
app.config["SESSION_COOKIE_HTTPONLY"] = getattr(Config, "SESSION_COOKIE_HTTPONLY", True)
app.config["SESSION_COOKIE_SAMESITE"] = getattr(Config, "SESSION_COOKIE_SAMESITE", "Lax")
app.config["SESSION_COOKIE_SECURE"] = getattr(Config, "SESSION_COOKIE_SECURE", False)
app.config["MAX_CONTENT_LENGTH"] = getattr(Config, "MAX_CONTENT_LENGTH", 500 * 1024 * 1024)

# Initialize Rate Limiter
limiter.init_app(app)

# Allowed CORS origins
allowed_origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5174",
    "http://localhost:5174",
]

# Add Vercel production and preview URLs if configured in FRONTEND_URL
if Config.FRONTEND_URL:
    for raw_origin in Config.FRONTEND_URL.split(","):
        cleaned = raw_origin.strip().rstrip("/")
        if cleaned and cleaned not in allowed_origins:
            allowed_origins.append(cleaned)

# supports_credentials=True lets the browser send/receive the session cookie.
CORS(app, supports_credentials=True, origins=allowed_origins)

app.register_blueprint(video_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)


@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        "error": "Too many requests. Please slow down and wait a minute before trying again."
    }), 429


@app.errorhandler(413)
def request_entity_too_large(e):
    return jsonify({
        "error": "Uploaded file is too large. The maximum permitted size is 500 MB."
    }), 413


@app.route("/")
def health_check():
    return {"status": "AI Video Summarizer & Quiz Generator backend is running"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port, threaded=True)