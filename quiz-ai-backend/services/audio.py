import subprocess
import os


def extract_audio(video_path):
    """
    Extracts an ultra-compact mono MP3 audio track (16kHz, 32kbps) from the given video file using ffmpeg.
    At 32kbps mono 16kHz, a 60-minute video audio track is only ~14.4 MB (well within Groq's 25MB limit),
    matching Whisper's native 16kHz mono acoustic processing with zero speech recognition degradation.
    Returns the path to the extracted audio file.
    """
    audio_path = os.path.splitext(video_path)[0] + ".mp3"

    command = [
        "ffmpeg",
        "-y",                 # overwrite if exists
        "-i", video_path,
        "-vn",                # no video
        "-acodec", "libmp3lame",
        "-ac", "1",           # mono
        "-ar", "16000",       # 16kHz sample rate (native to Whisper)
        "-b:a", "32k",        # 32kbps bitrate -> ~14.4MB per 60 minutes (safely under 25MB API limit)
        audio_path,
    ]

    result = subprocess.run(command, capture_output=True, text=True)

    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr}")

    return audio_path