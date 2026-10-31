import os
import traceback
from urllib.parse import urlparse
from flask import Blueprint, request, jsonify, session

from extensions import limiter
from services.downloader import download_youtube_video, save_uploaded_file
from services.audio import extract_audio
from services.transcriber import transcribe_audio
from services.youtube_transcript import get_youtube_transcript, YouTubeBlocked, NoCaptions
from services.ai_generator import (
    generate_summary, generate_quiz, generate_summary_and_quiz,
    answer_video_question, generate_flashcards, generate_mindmap
)
from models.db import (
    insert_video, get_video_by_id, insert_transcript, get_transcript_by_video,
    find_existing_transcript_by_source_ref, extract_youtube_video_id,
    insert_summary, insert_quiz, insert_attempt, get_quiz,
    get_history, get_performance_stats,
)

video_bp = Blueprint("video_bp", __name__)


def require_video(video_id, user_id):
    """Access control helper: verifies the video belongs to user_id."""
    if not user_id:
        return None
    try:
        return get_video_by_id(video_id, user_id=user_id)
    except Exception:
        return None


@video_bp.route("/api/process", methods=["POST"])
@limiter.limit("10 per hour", key_func=lambda: str(session.get("user_id")))
def process_video():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in to process a video"}), 401

    video_path, audio_path = None, None
    try:
        if "file" in request.files:
            try:
                video_path, title = save_uploaded_file(request.files["file"])
                source_type, source_ref = "upload", title
                audio_path = extract_audio(video_path)
                transcript_text = transcribe_audio(audio_path)

                video_id = insert_video(source_type, source_ref, title, user_id=user_id)
                insert_transcript(video_id, transcript_text)

                return jsonify({"video_id": video_id, "title": title, "transcript": transcript_text, "cached": False})
            finally:
                for p in (video_path, audio_path):
                    if p and os.path.exists(p):
                        try:
                            os.remove(p)
                        except Exception:
                            pass
        else:
            data = request.get_json(silent=True) or {}
            youtube_url = (data.get("youtube_url") or "").strip()
            if not youtube_url:
                return jsonify({"error": "Provide a youtube_url or upload a file"}), 400

            # URL host validation
            parsed = urlparse(youtube_url)
            if parsed.netloc.lower() not in {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"}:
                return jsonify({"error": "Only YouTube URLs are accepted (youtube.com, youtu.be)"}), 400

            vid = extract_youtube_video_id(youtube_url)
            if not vid:
                return jsonify({"error": "Invalid YouTube video link"}), 400

            canonical_url = f"https://www.youtube.com/watch?v={vid}"

            # Check cache with canonical URL
            cached = find_existing_transcript_by_source_ref(canonical_url)
            if cached and cached.get("transcript_text"):
                cached_title = cached.get("title") or "YouTube Video"
                cached_transcript = cached["transcript_text"]
                print(f"[CACHE HIT] Reusing cached transcript for '{cached_title}'")
                video_id = insert_video("youtube", canonical_url, cached_title, user_id=user_id)
                insert_transcript(video_id, cached_transcript)
                return jsonify({
                    "video_id": video_id,
                    "title": cached_title,
                    "transcript": cached_transcript,
                    "cached": True
                })

            # Fetch captions directly (tries youtube-transcript-api and yt-dlp subtitles)
            transcript_text = None
            title = "YouTube Video"
            try:
                transcript_text, title = get_youtube_transcript(canonical_url)
            except Exception as caption_err:
                print(f"[PROCESS] Direct caption extraction failed: {caption_err}. Falling back to audio download + Whisper...")

            # Fallback: If direct captions could not be fetched, download audio and transcribe with Whisper
            if not transcript_text:
                yt_video_path, yt_audio_path = None, None
                try:
                    yt_video_path, title = download_youtube_video(canonical_url)
                    yt_audio_path = extract_audio(yt_video_path)
                    transcript_text = transcribe_audio(yt_audio_path)
                except Exception as dl_err:
                    print(f"[PROCESS] yt-dlp fallback download/transcription failed: {dl_err}")
                    err_msg = str(dl_err).lower()
                    if "blocked" in err_msg or "bot" in err_msg or "429" in err_msg or "sign in" in err_msg:
                        return jsonify({
                            "error": "YouTube is temporarily blocking automated access from cloud servers. Please upload the video file directly.",
                            "code": "youtube_blocked",
                            "details": str(dl_err)
                        }), 503
                    return jsonify({
                        "error": "Could not extract audio or captions for this YouTube video. Please upload the video file directly.",
                        "code": "youtube_failed",
                        "details": str(dl_err)
                    }), 422
                finally:
                    for p in (yt_video_path, yt_audio_path):
                        if p and os.path.exists(p):
                            try:
                                os.remove(p)
                            except Exception:
                                pass

            if not transcript_text or not transcript_text.strip():
                return jsonify({
                    "error": "Could not extract speech from this video. Please upload the video file directly.",
                    "code": "empty_transcript"
                }), 422

            video_id = insert_video("youtube", canonical_url, title, user_id=user_id)
            insert_transcript(video_id, transcript_text)

            return jsonify({"video_id": video_id, "title": title, "transcript": transcript_text, "cached": False})

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception:
        traceback.print_exc()
        return jsonify({
            "error": "An error occurred while processing the video. Please verify the link or upload the video file directly."
        }), 500


@video_bp.route("/api/generate/<int:video_id>", methods=["POST"])
@limiter.limit("10 per hour", key_func=lambda: str(session.get("user_id")))
def generate(video_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in"}), 401

    video = require_video(video_id, user_id)
    if not video:
        return jsonify({"error": "Video not found or access denied"}), 404

    data = request.get_json(silent=True) or {}

    transcript_record = get_transcript_by_video(video_id)
    if transcript_record and transcript_record.get("transcript_text"):
        transcript_text = transcript_record["transcript_text"]
    else:
        transcript_text = data.get("transcript")

    if not transcript_text:
        return jsonify({"error": "Transcript not found for this video"}), 400

    raw_difficulty = str(data.get("difficulty", "medium")).lower()
    difficulty = raw_difficulty if raw_difficulty in ("easy", "medium", "hard") else "medium"

    raw_summary_format = str(data.get("summary_format", "executive")).lower()
    summary_format = raw_summary_format if raw_summary_format in ("executive", "bullet", "detailed") else "executive"

    try:
        num_questions = min(max(int(data.get("num_questions", 5)), 1), 30)
    except (TypeError, ValueError):
        num_questions = 5

    try:
        summary_text, quiz_questions = generate_summary_and_quiz(
            transcript_text,
            summary_format=summary_format,
            num_questions=num_questions,
            difficulty=difficulty,
        )

        insert_summary(video_id, summary_text)
        quiz_id = insert_quiz(video_id, quiz_questions, difficulty=difficulty)

        return jsonify({"quiz_id": quiz_id, "summary": summary_text, "quiz": quiz_questions})
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Failed to generate summary and quiz. Please try again."}), 500


@video_bp.route("/api/quiz/<int:quiz_id>/submit", methods=["POST"])
def submit_quiz(quiz_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in"}), 401

    data = request.get_json(silent=True) or {}
    answers = data.get("answers")
    if answers is None or not isinstance(answers, list):
        return jsonify({"error": "answers list is required"}), 400

    quiz_row = get_quiz(quiz_id, user_id=user_id)
    if not quiz_row:
        return jsonify({"error": "Quiz not found or access denied"}), 404

    questions = quiz_row["questions_json"]
    score = sum(1 for i, q in enumerate(questions) if i < len(answers) and answers[i] == q["correct_index"])
    insert_attempt(quiz_id, score, len(questions), answers)
    return jsonify({"score": score, "total_questions": len(questions)})


@video_bp.route("/api/history", methods=["GET"])
def history():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in"}), 401
    return jsonify(get_history(user_id=user_id))


@video_bp.route("/api/performance", methods=["GET"])
def performance():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in"}), 401
    return jsonify(get_performance_stats(user_id=user_id))


@video_bp.route("/api/chat/<int:video_id>", methods=["POST"])
@limiter.limit("10 per hour", key_func=lambda: str(session.get("user_id")))
def chat_with_video(video_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in"}), 401

    video = require_video(video_id, user_id)
    if not video:
        return jsonify({"error": "Video not found or access denied"}), 404

    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()[:1000]
    if not message:
        return jsonify({"error": "Message is required"}), 400

    transcript_record = get_transcript_by_video(video_id)
    transcript_text = transcript_record.get("transcript_text") if transcript_record else None
    if not transcript_text:
        return jsonify({"error": "Transcript not found for this video"}), 400

    raw_history = data.get("history", [])
    clean_history = []
    if isinstance(raw_history, list):
        for item in raw_history[-10:]:
            if isinstance(item, dict) and item.get("role") in ("user", "assistant") and isinstance(item.get("content"), str):
                clean_history.append({"role": item["role"], "content": item["content"][:2000]})

    try:
        reply = answer_video_question(transcript_text, message, conversation_history=clean_history)
        return jsonify({"reply": reply})
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Failed to process chat message."}), 500


@video_bp.route("/api/flashcards/<int:video_id>", methods=["POST"])
@limiter.limit("10 per hour", key_func=lambda: str(session.get("user_id")))
def get_flashcards(video_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in"}), 401

    video = require_video(video_id, user_id)
    if not video:
        return jsonify({"error": "Video not found or access denied"}), 404

    transcript_record = get_transcript_by_video(video_id)
    transcript_text = transcript_record.get("transcript_text") if transcript_record else None
    if not transcript_text:
        return jsonify({"error": "Transcript not found"}), 400

    try:
        cards = generate_flashcards(transcript_text)
        return jsonify({"flashcards": cards})
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Failed to generate flashcards."}), 500


@video_bp.route("/api/mindmap/<int:video_id>", methods=["POST"])
@limiter.limit("10 per hour", key_func=lambda: str(session.get("user_id")))
def get_mindmap(video_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in"}), 401

    video = require_video(video_id, user_id)
    if not video:
        return jsonify({"error": "Video not found or access denied"}), 404

    transcript_record = get_transcript_by_video(video_id)
    transcript_text = transcript_record.get("transcript_text") if transcript_record else ""
    data = request.get_json(silent=True) or {}
    summary_text = data.get("summary")

    if not transcript_text and not summary_text:
        return jsonify({"error": "Transcript or summary required"}), 400

    try:
        mindmap_data = generate_mindmap(transcript_text or "", summary_text=summary_text)
        return jsonify({"mindmap": mindmap_data})
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Failed to generate mindmap."}), 500