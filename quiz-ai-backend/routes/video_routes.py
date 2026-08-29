import os
from flask import Blueprint, request, jsonify, session

from services.downloader import download_youtube_video, save_uploaded_file
from services.audio import extract_audio
from services.transcriber import transcribe_audio
from services.ai_generator import generate_summary, generate_quiz
from models.db import (
    insert_video, insert_transcript, insert_summary, insert_quiz,
    insert_attempt, get_quiz, get_history, get_performance_stats,
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
        else:
            data = request.get_json(silent=True) or {}
            youtube_url = data.get("youtube_url")
            if not youtube_url:
                return jsonify({"error": "Provide a youtube_url or upload a file"}), 400
            video_path, title = download_youtube_video(youtube_url)
            source_type, source_ref = "youtube", youtube_url

        audio_path = extract_audio(video_path)
        transcript_text = transcribe_audio(audio_path)

        video_id = insert_video(source_type, source_ref, title, user_id=user_id)
        insert_transcript(video_id, transcript_text)

        for path in (video_path, audio_path):
            if path and os.path.exists(path):
                os.remove(path)

        return jsonify({"video_id": video_id, "title": title, "transcript": transcript_text})

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()  # prints the full error to your terminal
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500

@video_bp.route("/api/generate/<int:video_id>", methods=["POST"])
def generate(video_id):
    if not session.get("user_id"):
        return jsonify({"error": "You must be logged in"}), 401

    data = request.get_json(silent=True) or {}
    transcript_text = data.get("transcript")
    if not transcript_text:
        return jsonify({"error": "transcript is required"}), 400

    # New settings from the frontend — all optional with sensible defaults
    difficulty = data.get("difficulty", "medium")
    num_questions = data.get("num_questions", 5)
    summary_format = data.get("summary_format", "executive")

    try:
        summary_text = generate_summary(transcript_text, summary_format=summary_format)
        quiz_questions = generate_quiz(transcript_text, num_questions=num_questions, difficulty=difficulty)

        insert_summary(video_id, summary_text)
        quiz_id = insert_quiz(video_id, quiz_questions, difficulty=difficulty)

        return jsonify({"quiz_id": quiz_id, "summary": summary_text, "quiz": quiz_questions})
    except Exception as e:
        return jsonify({"error": f"Generation failed: {str(e)}"}), 500


@video_bp.route("/api/quiz/<int:quiz_id>/submit", methods=["POST"])
def submit_quiz(quiz_id):
    if not session.get("user_id"):
        return jsonify({"error": "You must be logged in"}), 401

    data = request.get_json(silent=True) or {}
    answers = data.get("answers")
    if answers is None:
        return jsonify({"error": "answers is required"}), 400

    quiz_row = get_quiz(quiz_id)
    if not quiz_row:
        return jsonify({"error": "Quiz not found"}), 404

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