import os
import uuid
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
        "socket_timeout": 30,     # fail loudly instead of hanging forever on a stalled connection
        "retries": 3,
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
    Saves a file uploaded via Flask's request.files into the uploads folder.
    Returns (local_file_path, original_filename).
    """
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file_storage.filename)[1] or ".mp4"
    local_path = os.path.join(Config.UPLOAD_FOLDER, f"{file_id}{ext}")
    file_storage.save(local_path)
    return local_path, file_storage.filename