import os
from flask import Blueprint, request, jsonify

from services.downloader import download_youtube_video, save_uploaded_file
from services.audio import extract_audio
from services.transcriber import transcribe_audio
from services.ai_generator import generate_summary, generate_quiz
from models.db import (
    insert_video, insert_transcript, insert_summary, insert_quiz,
    insert_attempt, get_quiz, get_history,
)

video_bp = Blueprint("video_bp", __name__)


@video_bp.route("/api/process", methods=["POST"])
def process_video():
    """
    Accepts EITHER a JSON body { "youtube_url": "..." }
    OR a multipart form with a "file" field (video upload).
    Downloads/saves the video, extracts audio, transcribes it, and stores everything.
    Returns: { video_id, title, transcript }
    """
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

        video_id = insert_video(source_type, source_ref, title)
        insert_transcript(video_id, transcript_text)

        # cleanup temp files
        for path in (video_path, audio_path):
            if path and os.path.exists(path):
                os.remove(path)

        return jsonify({
            "video_id": video_id,
            "title": title,
            "transcript": transcript_text,
        })

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500


@video_bp.route("/api/generate/<int:video_id>", methods=["POST"])
def generate(video_id):
    """
    Takes a video_id (already processed) plus its transcript from the request body,
    generates a summary and a quiz using GPT, and stores both.
    Body: { "transcript": "..." }
    Returns: { summary, quiz: [ { question, options, correct_index } ] }
    """
    data = request.get_json(silent=True) or {}
    transcript_text = data.get("transcript")

    if not transcript_text:
        return jsonify({"error": "transcript is required"}), 400

    try:
        summary_text = generate_summary(transcript_text)
        quiz_questions = generate_quiz(transcript_text, num_questions=5)

        insert_summary(video_id, summary_text)
        quiz_id = insert_quiz(video_id, quiz_questions)

        return jsonify({
            "quiz_id": quiz_id,
            "summary": summary_text,
            "quiz": quiz_questions,
        })

    except Exception as e:
        return jsonify({"error": f"Generation failed: {str(e)}"}), 500


@video_bp.route("/api/quiz/<int:quiz_id>/submit", methods=["POST"])
def submit_quiz(quiz_id):
    """
    Body: { "answers": [1, 0, 2, ...] }  -- one selected option index per question, in order
    Scores the attempt against the stored correct answers and saves it.
    Returns: { score, total_questions }
    """
    data = request.get_json(silent=True) or {}
    answers = data.get("answers")

    if answers is None:
        return jsonify({"error": "answers is required"}), 400

    quiz_row = get_quiz(quiz_id)
    if not quiz_row:
        return jsonify({"error": "Quiz not found"}), 404

    questions = quiz_row["questions_json"]
    score = sum(
        1 for i, q in enumerate(questions)
        if i < len(answers) and answers[i] == q["correct_index"]
    )

    insert_attempt(quiz_id, score, len(questions), answers)

    return jsonify({"score": score, "total_questions": len(questions)})


@video_bp.route("/api/history", methods=["GET"])
def history():
    """Returns a list of all previously processed videos with their summaries/quizzes."""
    return jsonify(get_history())