import json
import urllib.request
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled
from models.db import extract_youtube_video_id


def _get_video_title(video_id: str) -> str:
    """Fetches the YouTube video title via the free oEmbed API (no API key needed)."""
    try:
        url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            return data.get("title") or "YouTube Video"
    except Exception:
        return "YouTube Video"


def _extract_text_from_entries(entries) -> str:
    """Extracts plain text from entries, supporting both dataclass objects and dicts."""
    if not entries:
        return ""
    text_parts = []
    for snippet in entries:
        txt = getattr(snippet, "text", None)
        if txt is None and isinstance(snippet, dict):
            txt = snippet.get("text")
        if txt and str(txt).strip():
            text_parts.append(str(txt).strip())
    return " ".join(text_parts)


def get_youtube_transcript(youtube_url: str):
    """
    Fetches transcript directly from YouTube's caption/subtitle system.
    This is the primary method for YouTube videos on cloud deployments —
    it requires no video download, no ffmpeg, and bypasses all bot detection.

    Compatible with both modern (v1.x) and legacy (v0.x) youtube-transcript-api.

    Returns:
        (transcript_text: str, title: str)
    Raises:
        Exception if no transcript is available at all
    """
    video_id = extract_youtube_video_id(youtube_url)
    if not video_id:
        raise ValueError(f"Could not extract a valid YouTube video ID from: {youtube_url}")

    title = _get_video_title(video_id)
    preferred_langs = ["en", "en-US", "en-GB", "en-IN"]
    entries = None

    from services.downloader import get_cookie_file_path
    cookie_file = get_cookie_file_path()
    http_session = None
    if cookie_file and os.path.exists(cookie_file):
        try:
            import http.cookiejar
            import requests
            cj = http.cookiejar.MozillaCookieJar(cookie_file)
            cj.load(ignore_discard=True, ignore_expires=True)
            http_session = requests.Session()
            http_session.cookies = cj
            print(f"[YT-TRANSCRIPT] 🍪 Injected cookies into requests session")
        except Exception as ce:
            print(f"[YT-TRANSCRIPT] ⚠️ Could not load cookie jar: {ce}")

    # Method 1: Modern v1.x API (instance methods: fetch, list)
    try:
        ytt = YouTubeTranscriptApi(http_client=http_session) if http_session else YouTubeTranscriptApi()
        if hasattr(ytt, "fetch"):
            try:
                entries = ytt.fetch(video_id, languages=preferred_langs)
            except Exception:
                pass

        if not entries and hasattr(ytt, "list"):
            try:
                t_list = ytt.list(video_id)
                # First try finding preferred languages
                try:
                    t = t_list.find_transcript(preferred_langs)
                    entries = t.fetch()
                except Exception:
                    # Try finding generated transcript
                    try:
                        t = t_list.find_generated_transcript(preferred_langs)
                        entries = t.fetch()
                    except Exception:
                        # Fallback: take the first available transcript and translate to English
                        for candidate in t_list:
                            try:
                                if hasattr(candidate, "translate"):
                                    entries = candidate.translate("en").fetch()
                                else:
                                    entries = candidate.fetch()
                                break
                            except Exception:
                                entries = candidate.fetch()
                                break
            except Exception:
                pass
    except Exception:
        pass

    # Method 2: Legacy v0.x API (static methods: get_transcript, list_transcripts)
    if not entries:
        try:
            if hasattr(YouTubeTranscriptApi, "get_transcript"):
                try:
                    entries = YouTubeTranscriptApi.get_transcript(
                        video_id, languages=preferred_langs
                    )
                except Exception:
                    if hasattr(YouTubeTranscriptApi, "list_transcripts"):
                        t_list = YouTubeTranscriptApi.list_transcripts(video_id)
                        try:
                            t = t_list.find_transcript(preferred_langs)
                            entries = t.fetch()
                        except Exception:
                            for candidate in t_list:
                                entries = candidate.fetch()
                                break
        except Exception:
            pass

    if not entries:
        raise NoTranscriptFound(
            video_id,
            preferred_langs,
            f"No captions found for video {video_id}. Try uploading the video file directly.",
        )

    transcript_text = _extract_text_from_entries(entries)
    if not transcript_text:
        raise ValueError(f"Transcript for video {video_id} was empty after fetching.")

    return transcript_text, title
