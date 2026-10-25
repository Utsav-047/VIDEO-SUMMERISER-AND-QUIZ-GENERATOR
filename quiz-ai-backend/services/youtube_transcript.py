import json
import urllib.request
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled
from models.db import extract_youtube_video_id


def _get_video_title(video_id: str) -> str:
    """Fetches the YouTube video title via the free oEmbed API (no API key needed)."""
    try:
        url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            return data.get("title") or "YouTube Video"
    except Exception:
        return "YouTube Video"


def get_youtube_transcript(youtube_url: str):
    """
    Fetches transcript directly from YouTube's caption/subtitle system.
    This is the primary method for YouTube videos on cloud deployments —
    it requires no video download, no ffmpeg, and bypasses all bot detection.

    Strategy:
      1. Try manual or auto-generated English captions
      2. Fall back to any available transcript language
      3. If all fail, raise an exception so the caller can fall back to yt-dlp + Whisper

    Returns:
        (transcript_text: str, title: str)
    Raises:
        Exception if no transcript is available at all
    """
    video_id = extract_youtube_video_id(youtube_url)
    if not video_id:
        raise ValueError(f"Could not extract a valid YouTube video ID from: {youtube_url}")

    title = _get_video_title(video_id)

    try:
        # Primary: prefer English (manual > auto-generated)
        entries = YouTubeTranscriptApi.get_transcript(
            video_id,
            languages=["en", "en-US", "en-GB", "en-IN"],
        )
    except NoTranscriptFound:
        try:
            # Fallback: use whatever language is available and hope for the best
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            transcript = transcript_list.find_generated_transcript(
                [t.language_code for t in transcript_list]
            )
            entries = transcript.fetch()
        except Exception:
            raise NoTranscriptFound(
                video_id,
                ["en"],
                f"No captions found for video {video_id}. Try uploading the video file instead.",
            )
    except TranscriptsDisabled:
        raise TranscriptsDisabled(video_id)

    # Join all caption segments into a clean paragraph
    transcript_text = " ".join(
        entry.get("text", "").strip()
        for entry in entries
        if entry.get("text", "").strip()
    )

    if not transcript_text:
        raise ValueError(f"Transcript for video {video_id} was empty after fetching.")

    return transcript_text, title
