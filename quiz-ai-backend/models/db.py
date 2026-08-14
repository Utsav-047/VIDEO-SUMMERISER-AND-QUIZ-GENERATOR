import pymysql
import pymysql.cursors
import json
from config import Config


def get_connection():
    """Open a fresh MySQL connection. Called per-request (simple, safe for a college project)."""
    return pymysql.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )


# ---------- videos ----------
def insert_video(source_type, source_ref, title=None):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO videos (source_type, source_ref, title) VALUES (%s, %s, %s)",
                (source_type, source_ref, title),
            )
            return cur.lastrowid
    finally:
        conn.close()


# ---------- transcripts ----------
def insert_transcript(video_id, transcript_text):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO transcripts (video_id, transcript_text) VALUES (%s, %s)",
                (video_id, transcript_text),
            )
            return cur.lastrowid
    finally:
        conn.close()


def get_transcript_by_video(video_id):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM transcripts WHERE video_id = %s ORDER BY id DESC LIMIT 1",
                (video_id,),
            )
            return cur.fetchone()
    finally:
        conn.close()


# ---------- summaries ----------
def insert_summary(video_id, summary_text):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO summaries (video_id, summary_text) VALUES (%s, %s)",
                (video_id, summary_text),
            )
            return cur.lastrowid
    finally:
        conn.close()


# ---------- quizzes ----------
def insert_quiz(video_id, questions):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO quizzes (video_id, questions_json) VALUES (%s, %s)",
                (video_id, json.dumps(questions)),
            )
            return cur.lastrowid
    finally:
        conn.close()


def get_quiz(quiz_id):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM quizzes WHERE id = %s", (quiz_id,))
            row = cur.fetchone()
            if row:
                row["questions_json"] = json.loads(row["questions_json"])
            return row
    finally:
        conn.close()


# ---------- attempts ----------
def insert_attempt(quiz_id, score, total_questions, answers):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO attempts (quiz_id, score, total_questions, answers_json) VALUES (%s, %s, %s, %s)",
                (quiz_id, score, total_questions, json.dumps(answers)),
            )
            return cur.lastrowid
    finally:
        conn.close()


# ---------- history ----------
def get_history():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT v.id AS video_id, v.title, v.source_type, v.created_at,
                       s.summary_text, q.id AS quiz_id
                FROM videos v
                LEFT JOIN summaries s ON s.video_id = v.id
                LEFT JOIN quizzes q ON q.video_id = v.id
                ORDER BY v.created_at DESC
            """)
            return cur.fetchall()
    finally:
        conn.close()