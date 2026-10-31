import os
import json
import re
import urllib.request
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled, NoTranscriptFound, RequestBlocked, IpBlocked
)
from youtube_transcript_api.proxies import GenericProxyConfig
from models.db import extract_youtube_video_id
from services.downloader import get_cookie_file_path


class YouTubeBlocked(Exception):
    pass


class NoCaptions(Exception):
    pass


def _client():
    proxy_config = None
    p = os.getenv("YT_PROXY_URL")
    if p:
        proxy_config = GenericProxyConfig(http_url=p, https_url=p)

    http_session = None
    cookie_file = get_cookie_file_path()
    if cookie_file and os.path.exists(cookie_file):
        try:
            import http.cookiejar
            import requests
            cj = http.cookiejar.MozillaCookieJar(cookie_file)
            cj.load(ignore_discard=True, ignore_expires=True)
            http_session = requests.Session()
            http_session.cookies = cj
            print(f"[YT] Injected YouTube cookies into requests session")
        except Exception as ce:
            print(f"[YT] Could not load cookie jar: {ce}")

    if proxy_config and http_session:
        return YouTubeTranscriptApi(proxy_config=proxy_config, http_client=http_session)
    elif proxy_config:
        return YouTubeTranscriptApi(proxy_config=proxy_config)
    elif http_session:
        return YouTubeTranscriptApi(http_client=http_session)
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


def clean_vtt(content: str) -> str:
    """Cleans WebVTT/SRT subtitle text into continuous sentences without duplicate lines."""
    lines = content.splitlines()
    cleaned = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if (
            line.startswith("WEBVTT")
            or line.startswith("Kind:")
            or line.startswith("Language:")
            or line.startswith("NOTE")
            or line.startswith("STYLE")
        ):
            continue
        if "-->" in line:
            continue
        line = re.sub(r"<[^>]+>", "", line).strip()
        if not line or line.isdigit():
            continue
        if not cleaned or cleaned[-1] != line:
            cleaned.append(line)
    return " ".join(cleaned).strip()


def get_ytdlp_transcript(url: str):
    """
    Extracts subtitle text directly via yt-dlp native subtitle downloader
    without downloading video or audio files.
    """
    import glob
    import tempfile
    import uuid

    vid = extract_youtube_video_id(url)
    if not vid:
        return None, "YouTube Video"

    cookie_file = get_cookie_file_path()
    temp_dir = tempfile.gettempdir()
    temp_prefix = f"ytsub_{uuid.uuid4().hex[:8]}"
    outtmpl = os.path.join(temp_dir, f"{temp_prefix}.%(ext)s")

    ydl_opts = {
        "skip_download": True,
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": ["en.*", "en", ".*-orig", "hi.*", "hi"],
        "subtitlesformat": "vtt/srt/best",
        "outtmpl": outtmpl,
        "quiet": True,
        "no_warnings": True,
        "socket_timeout": 30,
        "retries": 3,
    }
    if cookie_file and os.path.exists(cookie_file):
        ydl_opts["cookiefile"] = cookie_file

    title = "YouTube Video"
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get("title") or _get_video_title(vid)

        # Check for downloaded subtitle files
        matches = glob.glob(os.path.join(temp_dir, f"{temp_prefix}*"))
        if matches:
            # Prefer English subtitle file
            chosen_file = None
            for m in matches:
                if ".en." in m or m.endswith(".en.vtt"):
                    chosen_file = m
                    break
            if not chosen_file:
                chosen_file = matches[0]

            with open(chosen_file, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            text = clean_vtt(content)
            if text and len(text) > 30:
                print(f"[YT-DLP] Downloaded and cleaned {len(text)} chars of subtitles from {chosen_file}")
                return text, title

        # Fallback: check metadata if file was not downloaded
        sub_dict = info.get("subtitles") or {}
        if not sub_dict:
            sub_dict = info.get("automatic_captions") or {}

        chosen_formats = None
        for lang, formats in sub_dict.items():
            if lang.startswith("en"):
                chosen_formats = formats
                break
        if not chosen_formats and sub_dict:
            chosen_formats = list(sub_dict.values())[0]

        if not chosen_formats:
            return None, title

        chosen_url = None
        for fmt in chosen_formats:
            if fmt.get("ext") == "json3":
                chosen_url = fmt.get("url")
                break
        if not chosen_url:
            for fmt in chosen_formats:
                chosen_url = fmt.get("url")
                break

        if not chosen_url:
            return None, title

        import http.cookiejar
        import requests

        sess = requests.Session()
        if cookie_file and os.path.exists(cookie_file):
            try:
                cj = http.cookiejar.MozillaCookieJar(cookie_file)
                cj.load(ignore_discard=True, ignore_expires=True)
                sess.cookies = cj
            except Exception:
                pass

        sess.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.youtube.com/",
        })

        resp = sess.get(chosen_url, timeout=15)
        if resp.status_code == 200 and resp.text:
            data = resp.text
            try:
                parsed = json.loads(data)
                parts = []
                for ev in parsed.get("events", []):
                    for s in ev.get("segs", []):
                        t = (s.get("utf8") or "").strip()
                        if t and t != "\n":
                            parts.append(t)
                text = " ".join(parts).strip()
                if text:
                    return text, title
            except Exception:
                pass

            cleaned_text = clean_vtt(data)
            if cleaned_text:
                return cleaned_text, title

        return None, title
    except Exception as e:
        print(f"[YT-DLP] Subtitle extraction error: {e}")
        return None, _get_video_title(vid)
    finally:
        for m in glob.glob(os.path.join(temp_dir, f"{temp_prefix}*")):
            try:
                os.remove(m)
            except Exception:
                pass


def get_youtube_transcript(url: str):
    """
    Acquires YouTube video transcript using a resilient multi-tier approach:
    1. Direct timed-text subtitles via youtube-transcript-api (with cookies & proxy support)
    2. Subtitle extraction via yt-dlp InnerTube API
    """
    vid = extract_youtube_video_id(url)
    if not vid:
        raise ValueError("Invalid YouTube link")

    title = _get_video_title(vid)

    # Tier 1: Try youtube-transcript-api
    try:
        ytt = _client()
        entries = None
        preferred_langs = ["en", "en-US", "en-GB", "en-IN"]

        try:
            entries = ytt.fetch(vid, languages=preferred_langs)
        except Exception:
            # Try listing available transcripts (both manual and auto-generated)
            try:
                t_list = ytt.list(vid)
                try:
                    t = t_list.find_transcript(preferred_langs)
                    entries = t.fetch()
                except Exception:
                    try:
                        t = t_list.find_generated_transcript(preferred_langs)
                        entries = t.fetch()
                    except Exception:
                        for candidate in t_list:
                            if hasattr(candidate, "translate"):
                                try:
                                    entries = candidate.translate("en").fetch()
                                    break
                                except Exception:
                                    pass
                            entries = candidate.fetch()
                            break
            except Exception:
                pass

        if entries:
            parts = []
            for s in entries:
                txt = getattr(s, "text", None)
                if txt is None and isinstance(s, dict):
                    txt = s.get("text")
                if txt and str(txt).strip():
                    parts.append(str(txt).strip())

            text = " ".join(parts).strip()
            if text:
                return text, title
    except (RequestBlocked, IpBlocked) as e:
        print(f"[YT] youtube-transcript-api blocked ({type(e).__name__}), trying yt-dlp subtitles...")
    except Exception as e:
        print(f"[YT] youtube-transcript-api error ({type(e).__name__}: {e}), trying yt-dlp subtitles...")

    # Tier 2: Try yt-dlp direct subtitle extraction
    try:
        ytdlp_text, ytdlp_title = get_ytdlp_transcript(url)
        if ytdlp_text and len(ytdlp_text) > 30:
            print(f"[YT] Successfully extracted {len(ytdlp_text)} chars of subtitles via yt-dlp!")
            return ytdlp_text, (ytdlp_title or title)
    except Exception as e:
        print(f"[YT] yt-dlp subtitle extraction failed: {e}")

    # Both caption harvesting methods failed
    raise NoCaptions("Could not find or extract direct captions for this video.")
