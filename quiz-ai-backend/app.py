from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import limiter
from routes.video_routes import video_bp
from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp

app = Flask(__name__)
app.secret_key = Config.SECRET_KEY

# Security & Session cookie hardening
app.config["SESSION_COOKIE_HTTPONLY"] = getattr(Config, "SESSION_COOKIE_HTTPONLY", True)
app.config["SESSION_COOKIE_SAMESITE"] = getattr(Config, "SESSION_COOKIE_SAMESITE", "Lax")
app.config["SESSION_COOKIE_SECURE"] = getattr(Config, "SESSION_COOKIE_SECURE", False)
app.config["MAX_CONTENT_LENGTH"] = getattr(Config, "MAX_CONTENT_LENGTH", 500 * 1024 * 1024)

# Initialize Rate Limiter
limiter.init_app(app)

# supports_credentials=True lets the browser send/receive the session cookie.
CORS(app, supports_credentials=True, origins=[
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5174",
    "http://localhost:5174",
])

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
    app.run(debug=True, port=5000, threaded=True)