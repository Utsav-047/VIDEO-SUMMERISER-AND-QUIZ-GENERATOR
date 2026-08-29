from openai import OpenAI
from config import Config

# Groq's API is OpenAI-compatible — same SDK, just a different base_url.
# Increased timeout to 60s for robust transcription on larger videos and variable network speeds.
client = OpenAI(
    api_key=Config.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
    timeout=60.0,
)


def transcribe_audio(audio_path):
    """
    Sends the audio file to Groq's Whisper endpoint (free tier) and returns the transcript text.
    """
    with open(audio_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=audio_file,
        )
    return transcript.text