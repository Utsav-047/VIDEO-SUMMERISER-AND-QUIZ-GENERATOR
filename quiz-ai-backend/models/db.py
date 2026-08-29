import pymysql
import pymysql.cursors
import json
from config import Config


def get_connection():
    return pymysql.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )


# ---------- users ----------
def insert_user(full_name, email, password_hash):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO users (full_name, email, password_hash) VALUES (%s, %s, %s)",
                (full_name, email, password_hash),
            )
            return cur.lastrowid
    finally:
        conn.close()


def get_user_by_email(email):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE email = %s", (email,))
            return cur.fetchone()
    finally:
        conn.close()


def get_user_by_id(user_id):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, full_name, email, created_at FROM users WHERE id = %s",
                (user_id,),
            )
            return cur.fetchone()
    finally:
        conn.close()


def update_user_password(user_id, password_hash):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET password_hash = %s WHERE id = %s",
                (password_hash, user_id),
            )
            return cur.rowcount
    finally:
        conn.close()


# ---------- password_resets (OTP) ----------
def ensure_password_resets_table():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS password_resets (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    otp_code VARCHAR(6) NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user_id (user_id),
                    INDEX idx_otp_code (otp_code)
                )
            """)
    except Exception as e:
        print(f"[DB] Error creating password_resets table: {e}")
    finally:
        conn.close()


def create_password_reset_otp(user_id, otp_code, expires_at):
    ensure_password_resets_table()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM password_resets WHERE user_id = %s", (user_id,))
            cur.execute(
                "INSERT INTO password_resets (user_id, otp_code, expires_at) VALUES (%s, %s, %s)",
                (user_id, otp_code, expires_at),
            )
            return cur.lastrowid
    finally:
        conn.close()


def get_valid_password_reset_otp(email, otp_code):
    ensure_password_resets_table()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT pr.*, u.id AS user_id, u.email 
                FROM password_resets pr
                JOIN users u ON pr.user_id = u.id
                WHERE u.email = %s AND pr.otp_code = %s AND pr.expires_at > NOW()
                ORDER BY pr.id DESC LIMIT 1
            """, (email, otp_code))
            return cur.fetchone()
    finally:
        conn.close()


def delete_password_resets(user_id):
    ensure_password_resets_table()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM password_resets WHERE user_id = %s", (user_id,))
    finally:
        conn.close()



# ---------- videos ----------
def insert_video(source_type, source_ref, title=None, user_id=None):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO videos (user_id, source_type, source_ref, title) VALUES (%s, %s, %s, %s)",
                (user_id, source_type, source_ref, title),
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
def insert_quiz(video_id, questions, difficulty="medium"):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO quizzes (video_id, difficulty, questions_json) VALUES (%s, %s, %s)",
                (video_id, difficulty, json.dumps(questions)),
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
def get_history(user_id=None):
    """If user_id is given, only that user's videos are returned. Otherwise returns everyone's (used pre-auth)."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if user_id is not None:
                cur.execute("""
                    SELECT v.id AS video_id, v.title, v.source_type, v.created_at,
                           s.summary_text, q.id AS quiz_id
                    FROM videos v
                    LEFT JOIN summaries s ON s.video_id = v.id
                    LEFT JOIN quizzes q ON q.video_id = v.id
                    WHERE v.user_id = %s
                    ORDER BY v.created_at DESC
                """, (user_id,))
            else:
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


# ---------- performance analytics ----------
def get_performance_stats(user_id):
    """Computes real account-based performance statistics from database attempts."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    a.id AS attempt_id,
                    a.score,
                    a.total_questions,
                    a.created_at,
                    q.id AS quiz_id,
                    q.difficulty,
                    v.title AS video_title
                FROM attempts a
                JOIN quizzes q ON a.quiz_id = q.id
                JOIN videos v ON q.video_id = v.id
                WHERE v.user_id = %s
                ORDER BY a.created_at DESC, a.id DESC
            """, (user_id,))
            rows = cur.fetchall()

            total_quizzes = len(rows)
            if total_quizzes == 0:
                return {
                    "total_quizzes": 0,
                    "avg_accuracy": 0,
                    "best_score": None,
                    "streak_days": 0,
                    "accuracy_by_difficulty": {
                        "easy": None,
                        "medium": None,
                        "hard": None
                    },
                    "recent_attempts": []
                }

            total_score = sum(r["score"] for r in rows)
            total_questions = sum(r["total_questions"] for r in rows)
            avg_accuracy = round((total_score / total_questions) * 100) if total_questions > 0 else 0

            best_score = max(
                (round((r["score"] / r["total_questions"]) * 100) for r in rows if r["total_questions"] > 0),
                default=0
            )

            # Accuracy by difficulty
            diff_map = {"easy": [], "medium": [], "hard": []}
            for r in rows:
                diff = (r.get("difficulty") or "medium").lower()
                if diff not in diff_map:
                    diff_map[diff] = []
                if r["total_questions"] > 0:
                    diff_map[diff].append(round((r["score"] / r["total_questions"]) * 100))

            accuracy_by_difficulty = {}
            for level in ("easy", "medium", "hard"):
                scores = diff_map.get(level, [])
                accuracy_by_difficulty[level] = round(sum(scores) / len(scores)) if scores else None

            # Real consecutive calendar day streak
            attempt_dates = sorted(
                list(set(r["created_at"].date() for r in rows if r.get("created_at") and hasattr(r["created_at"], "date"))),
                reverse=True
            )

            streak_days = 1 if attempt_dates else 0
            for i in range(len(attempt_dates) - 1):
                diff = (attempt_dates[i] - attempt_dates[i + 1]).days
                if diff == 1:
                    streak_days += 1
                else:
                    break

            # Recent attempts (up to 10)
            recent_attempts = []
            for r in rows[:10]:
                date_val = r.get("created_at")
                recent_attempts.append({
                    "video_title": r.get("video_title") or "Video Quiz",
                    "date": date_val.isoformat() if date_val and hasattr(date_val, "isoformat") else "Today",
                    "difficulty": (r.get("difficulty") or "medium").lower(),
                    "score": r["score"],
                    "total_questions": r["total_questions"]
                })

            return {
                "total_quizzes": total_quizzes,
                "avg_accuracy": avg_accuracy,
                "best_score": best_score,
                "streak_days": streak_days,
                "accuracy_by_difficulty": accuracy_by_difficulty,
                "recent_attempts": recent_attempts
            }
    finally:
        conn.close()