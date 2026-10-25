import os
import traceback
from flask import Blueprint, request, jsonify, session

from services.downloader import download_youtube_video, save_uploaded_file
from services.audio import extract_audio
from services.transcriber import transcribe_audio
from services.youtube_transcript import get_youtube_transcript
from services.ai_generator import (
    generate_summary, generate_quiz, generate_summary_and_quiz,
    answer_video_question, generate_flashcards, generate_mindmap
)
from models.db import (
    insert_video, get_video_by_id, insert_transcript, get_transcript_by_video,
    find_existing_transcript_by_source_ref,
    insert_summary, insert_quiz, insert_attempt, get_quiz,
    get_history, get_performance_stats,
)

video_bp = Blueprint("video_bp", __name__)


@video_bp.route("/api/process", methods=["POST"])
def process_video():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in to process a video"}), 401

    try:
        if "file" in request.files:
            video_path, title = save_uploaded_file(request.files["file"])
            source_type, source_ref = "upload", title
            audio_path = extract_audio(video_path)
            transcript_text = transcribe_audio(audio_path)

            video_id = insert_video(source_type, source_ref, title, user_id=user_id)
            insert_transcript(video_id, transcript_text)

            for path in (video_path, audio_path):
                if path and os.path.exists(path):
                    try:
                        os.remove(path)
                    except Exception:
                        pass

            return jsonify({"video_id": video_id, "title": title, "transcript": transcript_text, "cached": False})
        else:
            data = request.get_json(silent=True) or {}
            youtube_url = (data.get("youtube_url") or "").strip()
            if not youtube_url:
                return jsonify({"error": "Provide a youtube_url or upload a file"}), 400

            # 🚀 INSTANT TRANSCRIPT CACHING:
            # If this YouTube link was already transcribed previously, reuse the transcript!
            cached = find_existing_transcript_by_source_ref(youtube_url)
            if cached and cached.get("transcript_text"):
                cached_title = cached.get("title") or "YouTube Video"
                cached_transcript = cached["transcript_text"]
                print(f"\n[CACHE HIT] Found existing transcript for '{cached_title}'! Reusing without downloading.\n")
                # Create a video record for this user so it's in their private history
                video_id = insert_video("youtube", youtube_url, cached_title, user_id=user_id)
                insert_transcript(video_id, cached_transcript)
                return jsonify({
                    "video_id": video_id,
                    "title": cached_title,
                    "transcript": cached_transcript,
                    "cached": True
                })

            # 🎯 PRIMARY METHOD: YouTube Transcript API (no download, no ffmpeg, no bot detection)
            # Works on cloud servers like Render where yt-dlp is blocked by YouTube's datacenter IP filter.
            transcript_text = None
            title = "YouTube Video"
            try:
                print(f"\n[YT-TRANSCRIPT] Fetching captions directly from YouTube for: {youtube_url}\n")
                transcript_text, title = get_youtube_transcript(youtube_url)
                print(f"[YT-TRANSCRIPT] ✅ Got transcript via YouTube captions for '{title}' ({len(transcript_text)} chars)\n")
            except Exception as yt_api_err:
                # ⬇️ FALLBACK: yt-dlp + Whisper (for videos with no captions)
                print(f"[YT-TRANSCRIPT] ⚠️ YouTube captions unavailable ({yt_api_err}). Falling back to yt-dlp + Whisper...\n")
                video_path, title = download_youtube_video(youtube_url)
                audio_path = extract_audio(video_path)
                transcript_text = transcribe_audio(audio_path)

                for path in (video_path, audio_path):
                    if path and os.path.exists(path):
                        try:
                            os.remove(path)
                        except Exception:
                            pass

            video_id = insert_video("youtube", youtube_url, title, user_id=user_id)
            insert_transcript(video_id, transcript_text)

            return jsonify({"video_id": video_id, "title": title, "transcript": transcript_text, "cached": False})

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Processing failed: {str(e)}\n\nTip: If this is a YouTube video, make sure it has captions/subtitles enabled. For videos without captions, try uploading the file directly."}), 500



@video_bp.route("/api/generate/<int:video_id>", methods=["POST"])
def generate(video_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in"}), 401

    # Resilient ownership check
    video = get_video_by_id(video_id, user_id=user_id)
    if not video:
        video = get_video_by_id(video_id)
    if not video:
        return jsonify({"error": "Video not found or access denied"}), 404

    data = request.get_json(silent=True) or {}

    # Prefer transcript stored in DB, fallback to client-supplied transcript
    transcript_record = get_transcript_by_video(video_id)
    if transcript_record and transcript_record.get("transcript_text"):
        transcript_text = transcript_record["transcript_text"]
    else:
        transcript_text = data.get("transcript")

    if not transcript_text:
        return jsonify({"error": "Transcript not found for this video"}), 400

    difficulty = data.get("difficulty", "medium")
    num_questions = data.get("num_questions", 5)
    summary_format = data.get("summary_format", "executive")

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
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Generation failed: {str(e)}"}), 500


@video_bp.route("/api/quiz/<int:quiz_id>/submit", methods=["POST"])
def submit_quiz(quiz_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in"}), 401

    data = request.get_json(silent=True) or {}
    answers = data.get("answers")
    if answers is None:
        return jsonify({"error": "answers is required"}), 400

    quiz_row = get_quiz(quiz_id, user_id=user_id)
    if not quiz_row:
        quiz_row = get_quiz(quiz_id)
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
def chat_with_video(video_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in"}), 401

    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    if not message:
        return jsonify({"error": "Message is required"}), 400

    transcript_record = get_transcript_by_video(video_id)
    transcript_text = transcript_record.get("transcript_text") if transcript_record else data.get("transcript")
    if not transcript_text:
        return jsonify({"error": "Transcript not found for this video"}), 400

    history_msgs = data.get("history", [])
    try:
        reply = answer_video_question(transcript_text, message, conversation_history=history_msgs)
        return jsonify({"reply": reply})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Chat failed: {str(e)}"}), 500


@video_bp.route("/api/flashcards/<int:video_id>", methods=["POST"])
def get_flashcards(video_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in"}), 401

    data = request.get_json(silent=True) or {}
    transcript_record = get_transcript_by_video(video_id)
    transcript_text = transcript_record.get("transcript_text") if transcript_record else data.get("transcript")
    if not transcript_text:
        return jsonify({"error": "Transcript not found"}), 400

    try:
        cards = generate_flashcards(transcript_text)
        return jsonify({"flashcards": cards})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Flashcards generation failed: {str(e)}"}), 500


@video_bp.route("/api/mindmap/<int:video_id>", methods=["POST"])
def get_mindmap(video_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in"}), 401

    data = request.get_json(silent=True) or {}
    transcript_record = get_transcript_by_video(video_id)
    transcript_text = transcript_record.get("transcript_text") if transcript_record else data.get("transcript")
    summary_text = data.get("summary")

    if not transcript_text and not summary_text:
        return jsonify({"error": "Transcript or summary required"}), 400

    try:
        mindmap_data = generate_mindmap(transcript_text or "", summary_text=summary_text)
        return jsonify({"mindmap": mindmap_data})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Mindmap generation failed: {str(e)}"}), 500