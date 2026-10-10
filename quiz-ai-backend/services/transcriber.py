import os
import subprocess
import glob
from openai import OpenAI
from config import Config

# Groq's API is OpenAI-compatible.
# Increased timeout to 180s (3 minutes) to support 30 to 60-minute video transcription seamlessly.
client = OpenAI(
    api_key=Config.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
    timeout=180.0,
)


def _split_and_transcribe_chunks(audio_path):
    """
    Fallback for audio files larger than 24MB:
    Splits the audio into 15-minute chunks using ffmpeg, transcribes each chunk,
    and concatenates the results.
    """
    dir_name = os.path.dirname(audio_path)
    base_name = os.path.splitext(os.path.basename(audio_path))[0]
    chunk_pattern = os.path.join(dir_name, f"{base_name}_chunk_%03d.mp3")

    split_cmd = [
        "ffmpeg",
        "-y",
        "-i", audio_path,
        "-f", "segment",
        "-segment_time", "900",    # 15 minute chunks (~3.6MB each)
        "-c", "copy",
        chunk_pattern,
    ]
    subprocess.run(split_cmd, capture_output=True, check=True)

    chunk_files = sorted(glob.glob(os.path.join(dir_name, f"{base_name}_chunk_*.mp3")))
    transcripts = []

    try:
        for chunk_file in chunk_files:
            with open(chunk_file, "rb") as af:
                res = client.audio.transcriptions.create(
                    model="whisper-large-v3-turbo",
                    file=af,
                )
                if res.text:
                    transcripts.append(res.text.strip())
    finally:
        for chunk_file in chunk_files:
            if os.path.exists(chunk_file):
                try:
                    os.remove(chunk_file)
                except Exception:
                    pass

    return "\n\n".join(transcripts)


def transcribe_audio(audio_path):
    """
    Sends the audio file to Groq's Whisper endpoint and returns the transcript text.
    Uses whisper-large-v3-turbo for ultra-fast, accurate multilingual transcription.
    Automatically handles files over 24MB via chunked transcription.
    """
    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)

    # Groq's Whisper limit is 25 MB
    if file_size_mb > 24.0:
        return _split_and_transcribe_chunks(audio_path)

    with open(audio_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-large-v3-turbo",
            file=audio_file,
        )
    return transcript.text