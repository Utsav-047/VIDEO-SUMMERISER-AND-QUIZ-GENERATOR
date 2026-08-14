import subprocess
import os


def extract_audio(video_path):
    """
    Extracts a mono, 16kHz WAV audio track from the given video file using ffmpeg.
    Whisper API works well with this format and it keeps file size small.
    Returns the path to the extracted audio file.
    """
    audio_path = os.path.splitext(video_path)[0] + ".wav"

    command = [
        "ffmpeg",
        "-y",                # overwrite if exists
        "-i", video_path,
        "-ac", "1",           # mono
        "-ar", "16000",       # 16kHz sample rate
        "-vn",                # no video
        audio_path,
    ]

    result = subprocess.run(command, capture_output=True, text=True)

    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr}")

    return audio_path