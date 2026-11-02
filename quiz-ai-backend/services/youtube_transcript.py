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

    if not http_session:
        import requests
        http_session = requests.Session()

    http_session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.youtube.com/",
    })

    if proxy_config:
        return YouTubeTranscriptApi(proxy_config=proxy_config, http_client=http_session)
    return YouTubeTranscriptApi(http_client=http_session)


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
        "subtitleslangs": ["en", "en-US", "en-GB", "en-IN", "en-orig", ".*-orig"],
        "subtitlesformat": "vtt/srt/best",
        "outtmpl": outtmpl,
        "quiet": True,
        "no_warnings": True,
        "ignoreerrors": True,
        "socket_timeout": 30,
        "retries": 3,
        "nocheckcertificate": True,
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "web"]
            }
        }
    }
    def _try_ytdlp(use_cookies: bool):
        opts = dict(ydl_opts)
        if use_cookies and cookie_file and os.path.exists(cookie_file):
            opts["cookiefile"] = cookie_file

        sub_text, video_title = None, _get_video_title(vid)
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if info and info.get("title"):
                    video_title = info.get("title")
                ydl.download([url])

            matches = glob.glob(os.path.join(temp_dir, f"{temp_prefix}*"))
            if matches:
                chosen_file = None
                for m in matches:
                    if ".en." in m or m.endswith(".en.vtt") or "en-orig" in m:
                        chosen_file = m
                        break
                if not chosen_file:
                    chosen_file = matches[0]

                with open(chosen_file, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                cleaned = clean_vtt(content)
                if cleaned and len(cleaned) > 30:
                    sub_text = cleaned
        except Exception as e:
            print(f"[YT-DLP] Subtitle attempt (use_cookies={use_cookies}) error: {e}")
        finally:
            for m in glob.glob(os.path.join(temp_dir, f"{temp_prefix}*")):
                try:
                    os.remove(m)
                except Exception:
                    pass

        return sub_text, video_title

    # Attempt 1: with cookies if available
    res_text, res_title = _try_ytdlp(use_cookies=True)
    if res_text:
        return res_text, res_title

    # Attempt 2: without cookies (anonymous mobile client fallback)
    if cookie_file:
        res_text, res_title = _try_ytdlp(use_cookies=False)
        if res_text:
            return res_text, res_title

    return None, _get_video_title(vid)


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
