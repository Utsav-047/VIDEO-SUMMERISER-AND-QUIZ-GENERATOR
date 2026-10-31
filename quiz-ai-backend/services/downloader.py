import os
import uuid
import json
import base64
from werkzeug.utils import secure_filename
import yt_dlp
from config import Config


def normalize_cookies(raw: str) -> str:
    """
    Normalizes cookies from any common format:
    - Netscape format text
    - JSON array (exported from browser extensions like Cookie-Editor)
    - Base64-encoded Netscape or JSON
    - Strings with literal \\n instead of real newlines
    Returns valid Netscape HTTP Cookie File content.
    """
    raw = (raw or "").strip()
    if not raw:
        return ""

    if "\\n" in raw and "\n" not in raw:
        raw = raw.replace("\\n", "\n")

    try:
        decoded = base64.b64decode(raw).decode("utf-8")
        if "youtube" in decoded or "Netscape" in decoded or "[" in decoded:
            raw = decoded
    except Exception:
        pass

    if raw.startswith("[") and raw.endswith("]"):
        try:
            items = json.loads(raw)
            lines = ["# Netscape HTTP Cookie File"]
            for c in items:
                domain = c.get("domain", ".youtube.com")
                flag = "TRUE" if domain.startswith(".") else "FALSE"
                path = c.get("path", "/")
                secure = "TRUE" if c.get("secure", False) else "FALSE"
                exp = str(int(c.get("expirationDate", 0) or c.get("expires", 0) or 2147483647))
                name = c.get("name", "")
                value = c.get("value", "")
                if name:
                    lines.append(f"{domain}\t{flag}\t{path}\t{secure}\t{exp}\t{name}\t{value}")
            return "\n".join(lines) + "\n"
        except Exception:
            pass

    if not raw.startswith("# Netscape"):
        raw = "# Netscape HTTP Cookie File\n" + raw
    if not raw.endswith("\n"):
        raw += "\n"
    return raw


def get_cookie_file_path():
    """
    Resolves YouTube cookies from:
    1. YOUTUBE_COOKIES environment variable (raw Netscape, JSON, or base64)
    2. Local cookies.txt in the backend directory
    Writes normalized cookies to uploads/cookies.txt and returns the absolute path.
    """
    raw_cookies = os.getenv("YOUTUBE_COOKIES", "").strip()
    if raw_cookies:
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        cookie_dest = os.path.join(Config.UPLOAD_FOLDER, "cookies.txt")
        normalized = normalize_cookies(raw_cookies)
        try:
            with open(cookie_dest, "w", encoding="utf-8") as f:
                f.write(normalized)
            return cookie_dest
        except Exception as e:
            print(f"[COOKIES] Failed to write cookie file: {e}")

    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    local_path = os.path.join(backend_dir, "cookies.txt")
    if os.path.exists(local_path):
        return local_path

    return None


def download_youtube_video(youtube_url):
    """
    Downloads audio from a YouTube video and returns (local_file_path, video_title).
    Checks duration before downloading to avoid wasting bandwidth and disk space.
    Uses resilient mobile and web player clients, plus YouTube cookies if provided.
    """
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    file_id = str(uuid.uuid4())
    output_path = os.path.join(Config.UPLOAD_FOLDER, f"{file_id}.%(ext)s")

    ydl_opts = {
        "format": "ba/ba*/bestaudio/best",
        "outtmpl": output_path,
        "quiet": True,
        "noplaylist": True,
        "socket_timeout": 60,
        "retries": 5,
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "web"]
            }
        }
    }

    cookie_file = get_cookie_file_path()
    if cookie_file and os.path.exists(cookie_file):
        ydl_opts["cookiefile"] = cookie_file
        print(f"[DOWNLOADER] Using YouTube cookies from {cookie_file}")

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        # Check duration BEFORE downloading
        info = ydl.extract_info(youtube_url, download=False)
        duration_minutes = (info.get("duration") or 0) / 60
        if duration_minutes > Config.MAX_VIDEO_MINUTES:
            raise ValueError(
                f"Video is {duration_minutes:.1f} min long. "
                f"Max allowed is {Config.MAX_VIDEO_MINUTES} min."
            )

        download_info = ydl.extract_info(youtube_url, download=True)
        downloaded_path = ydl.prepare_filename(download_info)
        title = download_info.get("title", "Untitled video")

    return downloaded_path, title


def save_uploaded_file(file_storage):
    """
    Validates and saves an uploaded video file to the uploads folder.
    Enforces safe filenames, allowed file extensions, and file size restrictions.
    Returns (local_file_path, original_filename).
    """
    if not file_storage or not file_storage.filename:
        raise ValueError("No video file selected or file is missing.")

    # Sanitize original filename
    raw_filename = file_storage.filename.strip()
    safe_name = secure_filename(raw_filename)

    # Validate file extension
    ext = os.path.splitext(raw_filename)[1].lower()
    allowed_exts = getattr(Config, "ALLOWED_EXTENSIONS", {".mp4", ".mkv", ".mov", ".webm", ".avi", ".mp3", ".wav"})
    if ext not in allowed_exts:
        raise ValueError(
            f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(allowed_exts))}"
        )

    # Check file size before saving to disk
    file_storage.seek(0, os.SEEK_END)
    size_bytes = file_storage.tell()
    file_storage.seek(0)

    max_size = getattr(Config, "MAX_CONTENT_LENGTH", 500 * 1024 * 1024)
    if size_bytes == 0:
        raise ValueError("Uploaded file is empty (0 bytes).")
    if size_bytes > max_size:
        raise ValueError(
            f"File exceeds maximum allowed upload size of {max_size // (1024 * 1024)} MB."
        )

    if not safe_name:
        safe_name = f"video_{uuid.uuid4().hex[:8]}{ext}"

    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    file_id = str(uuid.uuid4())
    local_path = os.path.join(Config.UPLOAD_FOLDER, f"{file_id}{ext}")
    file_storage.save(local_path)
    return local_path, safe_name