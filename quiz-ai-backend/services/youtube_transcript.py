import os
import json
import urllib.request
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled, NoTranscriptFound, RequestBlocked, IpBlocked
)
from youtube_transcript_api.proxies import GenericProxyConfig
from models.db import extract_youtube_video_id


class YouTubeBlocked(Exception):
    pass


class NoCaptions(Exception):
    pass


def _client():
    p = os.getenv("YT_PROXY_URL")
    if p:
        return YouTubeTranscriptApi(
            proxy_config=GenericProxyConfig(http_url=p, https_url=p)
        )
    return YouTubeTranscriptApi()


def _get_video_title(video_id: str) -> str:
    """Fetches YouTube video title via the free oEmbed API."""
    try:
        url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            return data.get("title") or "YouTube Video"
    except Exception:
        return "YouTube Video"


def get_youtube_transcript(url: str):
    vid = extract_youtube_video_id(url)
    if not vid:
        raise ValueError("Invalid YouTube link")

    try:
        entries = _client().fetch(vid, languages=["en", "en-US", "en-GB", "en-IN"])
    except (RequestBlocked, IpBlocked) as e:
        print("[YT] blocked:", type(e).__name__)  # log, don't return to user
        raise YouTubeBlocked() from e
    except (TranscriptsDisabled, NoTranscriptFound) as e:
        raise NoCaptions() from e
    except Exception as e:
        err_type = type(e).__name__
        if "Blocked" in err_type or "Ip" in err_type or "Request" in err_type:
            print("[YT] blocked:", err_type)
            raise YouTubeBlocked() from e
        print(f"[YT] caption fetch failed ({err_type}): {e}")
        raise NoCaptions() from e

    parts = []
    for s in entries:
        txt = getattr(s, "text", None)
        if txt is None and isinstance(s, dict):
            txt = s.get("text")
        if txt and str(txt).strip():
            parts.append(str(txt).strip())

    text = " ".join(parts)
    if not text:
        raise NoCaptions()

    return text, _get_video_title(vid)
