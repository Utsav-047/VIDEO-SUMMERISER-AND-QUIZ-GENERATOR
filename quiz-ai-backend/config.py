import os
from dotenv import load_dotenv

load_dotenv()

IS_PRODUCTION = os.getenv("RENDER") is not None or os.getenv("FLASK_ENV") == "production"

class Config:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    SECRET_KEY = os.environ["SECRET_KEY"]  # app refuses to start if missing

    # MySQL Database Configuration
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", 3306))
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "quiz_ai_db")
    DB_SSL = os.getenv("DB_SSL", "False").lower() in ("true", "1")

    # Allowed Frontend URLs for CORS
    FRONTEND_URL = os.getenv("FRONTEND_URL", "")

    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_VIDEO_MINUTES = int(os.getenv("MAX_VIDEO_MINUTES", 65))
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 500 * 1024 * 1024))  # 500 MB max request size
    ALLOWED_EXTENSIONS = {".mp4", ".mkv", ".mov", ".webm", ".avi", ".flv", ".wmv", ".m4v", ".mp3", ".wav", ".m4a"}

    # Cookie & Session Security Settings
    # For cross-origin cookies (Vercel frontend + Render backend), SameSite must be None and Secure must be True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "None" if IS_PRODUCTION else "Lax")
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "True" if IS_PRODUCTION else "False").lower() in ("true", "1")

    # SMTP Email Configuration
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Synapse Video Intelligence")