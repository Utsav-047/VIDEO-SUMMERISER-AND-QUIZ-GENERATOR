import os
import uuid
from werkzeug.utils import secure_filename
import yt_dlp
from config import Config


def download_youtube_video(youtube_url):
    """
    Downloads audio from a YouTube video and returns (local_file_path, video_title).
    Uses the smallest available audio stream — we only need clear speech for
    transcription, not high-fidelity audio, so this keeps downloads fast.
    """
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    file_id = str(uuid.uuid4())
    output_path = os.path.join(Config.UPLOAD_FOLDER, f"{file_id}.%(ext)s")

    ydl_opts = {
        "format": "worstaudio/worst",
        "outtmpl": output_path,
        "quiet": True,
        "noplaylist": True,
        "extractor_args": {"youtube": {"player_client": ["android"]}},
        "socket_timeout": 60,     # Increased to 60s for 30-60 min long video streams
        "retries": 5,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url, download=True)

        duration_minutes = info.get("duration", 0) / 60
        if duration_minutes > Config.MAX_VIDEO_MINUTES:
            raise ValueError(
                f"Video is {duration_minutes:.1f} min long. "
                f"Max allowed is {Config.MAX_VIDEO_MINUTES} min."
            )

        downloaded_path = ydl.prepare_filename(info)
        title = info.get("title", "Untitled video")

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