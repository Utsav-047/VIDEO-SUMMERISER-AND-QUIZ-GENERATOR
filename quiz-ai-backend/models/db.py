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
def ensure_user_schema():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SHOW COLUMNS FROM users LIKE 'role'")
            if not cur.fetchone():
                cur.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'")
            # Promote user ID 1 or utsavpatel788190@gmail.com to admin by default if not set
            cur.execute("UPDATE users SET role = 'admin' WHERE id = 1 AND (role IS NULL OR role = 'user')")
    except Exception as e:
        print(f"[DB] Error ensuring user schema: {e}")
    finally:
        conn.close()


def insert_user(full_name, email, password_hash, role="user"):
    ensure_user_schema()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
                (full_name, email, password_hash, role),
            )
            return cur.lastrowid
    finally:
        conn.close()


def get_user_by_email(email):
    ensure_user_schema()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE email = %s", (email,))
            return cur.fetchone()
    finally:
        conn.close()


def get_user_by_id(user_id):
    ensure_user_schema()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, full_name, email, COALESCE(role, 'user') AS role, created_at FROM users WHERE id = %s",
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
                    attempts_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user_id (user_id),
                    INDEX idx_otp_code (otp_code)
                )
            """)
            # If the table already existed without attempts_count, add it safely
            try:
                cur.execute("ALTER TABLE password_resets ADD COLUMN attempts_count INT DEFAULT 0")
            except Exception:
                pass  # column already exists
    except Exception as e:
        print(f"[DB] Error ensuring password_resets table: {e}")
    finally:
        conn.close()


def create_password_reset_otp(user_id, otp_code, expires_at):
    ensure_password_resets_table()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM password_resets WHERE user_id = %s", (user_id,))
            cur.execute(
                "INSERT INTO password_resets (user_id, otp_code, expires_at, attempts_count) VALUES (%s, %s, %s, 0)",
                (user_id, otp_code, expires_at),
            )
            return cur.lastrowid
    finally:
        conn.close()


def verify_and_consume_otp(email, input_otp):
    """
    Checks the latest unexpired OTP for the given user email.
    Increments failed attempts on incorrect guesses.
    If failed attempts reach 5, deletes the OTP and locks out the request.
    Returns (reset_row, error_message). If valid, error_message is None.
    """
    ensure_password_resets_table()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT pr.*, u.id AS user_id, u.email 
                FROM password_resets pr
                JOIN users u ON pr.user_id = u.id
                WHERE u.email = %s
                ORDER BY pr.id DESC LIMIT 1
            """, (email,))
            row = cur.fetchone()

            if not row:
                return None, "No active password reset request found. Please request a new code."

            # Check expiration
            from datetime import datetime
            if row["expires_at"] < datetime.now():
                cur.execute("DELETE FROM password_resets WHERE id = %s", (row["id"],))
                return None, "Verification code has expired. Please request a new one."

            # Check if locked out (5 or more attempts)
            attempts = row.get("attempts_count") or 0
            if attempts >= 5:
                cur.execute("DELETE FROM password_resets WHERE id = %s", (row["id"],))
                return None, "Maximum verification attempts exceeded (5/5). This code has been invalidated for security. Please request a new one."

            # Verify the OTP code
            if row["otp_code"] != input_otp:
                new_attempts = attempts + 1
                if new_attempts >= 5:
                    cur.execute("DELETE FROM password_resets WHERE id = %s", (row["id"],))
                    return None, "Maximum verification attempts exceeded (5/5). This code has been invalidated for security. Please request a new one."
                else:
                    cur.execute("UPDATE password_resets SET attempts_count = %s WHERE id = %s", (new_attempts, row["id"]))
                    remaining = 5 - new_attempts
                    return None, f"Invalid verification code. {remaining} attempt{'s' if remaining != 1 else ''} remaining."

            # Code matches and is valid!
            return row, None
    finally:
        conn.close()


def get_valid_password_reset_otp(email, otp_code):
    """Legacy helper for backward compatibility."""
    row, _ = verify_and_consume_otp(email, otp_code)
    return row


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


def get_video_by_id(video_id, user_id=None):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if user_id is not None:
                cur.execute(
                    "SELECT * FROM videos WHERE id = %s AND user_id = %s",
                    (video_id, user_id),
                )
            else:
                cur.execute("SELECT * FROM videos WHERE id = %s", (video_id,))
            return cur.fetchone()
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


def get_quiz(quiz_id, user_id=None):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if user_id is not None:
                cur.execute("""
                    SELECT q.*, v.user_id 
                    FROM quizzes q
                    JOIN videos v ON q.video_id = v.id
                    WHERE q.id = %s AND v.user_id = %s
                """, (quiz_id, user_id))
            else:
                cur.execute("SELECT * FROM quizzes WHERE id = %s", (quiz_id,))
            row = cur.fetchone()
            if row and row.get("questions_json"):
                if isinstance(row["questions_json"], str):
                    try:
                        row["questions_json"] = json.loads(row["questions_json"])
                    except Exception:
                        pass
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
            sql = """
                SELECT 
                    v.id,
                    v.id AS video_id,
                    v.title,
                    v.source_type,
                    v.source_ref,
                    v.created_at,
                    s.summary_text AS summary,
                    s.summary_text,
                    t.transcript_text AS transcript,
                    q.id AS quiz_id,
                    q.difficulty,
                    q.questions_json
                FROM videos v
                LEFT JOIN (
                    SELECT s1.video_id, s1.summary_text 
                    FROM summaries s1
                    INNER JOIN (SELECT video_id, MAX(id) AS max_id FROM summaries GROUP BY video_id) s2 
                    ON s1.id = s2.max_id
                ) s ON s.video_id = v.id
                LEFT JOIN (
                    SELECT t1.video_id, t1.transcript_text
                    FROM transcripts t1
                    INNER JOIN (SELECT video_id, MAX(id) AS max_id FROM transcripts GROUP BY video_id) t2
                    ON t1.id = t2.max_id
                ) t ON t.video_id = v.id
                LEFT JOIN (
                    SELECT q1.video_id, q1.id, q1.difficulty, q1.questions_json
                    FROM quizzes q1
                    INNER JOIN (SELECT video_id, MAX(id) AS max_id FROM quizzes GROUP BY video_id) q2
                    ON q1.id = q2.max_id
                ) q ON q.video_id = v.id
            """
            if user_id is not None:
                sql += " WHERE v.user_id = %s ORDER BY v.created_at DESC"
                cur.execute(sql, (user_id,))
            else:
                sql += " ORDER BY v.created_at DESC"
                cur.execute(sql)

            rows = cur.fetchall()
            for r in rows:
                if r.get("questions_json") and isinstance(r["questions_json"], str):
                    try:
                        r["questions_json"] = json.loads(r["questions_json"])
                    except Exception:
                        pass
            return rows
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


# ---------- admin analytics & management ----------
def get_all_users_rankings():
    """
    Returns all registered users ranked by quiz performance.
    Ranking criteria:
    - Primary: avg_accuracy (for users who have taken quizzes)
    - Secondary: total_quizzes taken
    - Tertiary: total_score (correct answers)
    Users with 0 quizzes are placed at the bottom as Unranked.
    """
    ensure_user_schema()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, full_name, email, COALESCE(role, 'user') AS role, created_at FROM users ORDER BY created_at ASC")
            users = cur.fetchall()

            # Attempts stats aggregated per user
            cur.execute("""
                SELECT 
                    v.user_id,
                    COUNT(a.id) AS total_quizzes,
                    COALESCE(SUM(a.score), 0) AS total_score,
                    COALESCE(SUM(a.total_questions), 0) AS total_questions,
                    MAX(CASE WHEN a.total_questions > 0 THEN ROUND((a.score / a.total_questions) * 100) ELSE 0 END) AS best_score
                FROM attempts a
                JOIN quizzes q ON a.quiz_id = q.id
                JOIN videos v ON q.video_id = v.id
                WHERE v.user_id IS NOT NULL
                GROUP BY v.user_id
            """)
            attempt_map = {row["user_id"]: row for row in cur.fetchall()}

            # Videos count per user
            cur.execute("SELECT user_id, COUNT(*) AS total_videos FROM videos WHERE user_id IS NOT NULL GROUP BY user_id")
            video_map = {row["user_id"]: row["total_videos"] for row in cur.fetchall()}

            ranked_list = []
            for u in users:
                uid = u["id"]
                att = attempt_map.get(uid, {})
                t_quizzes = int(att.get("total_quizzes", 0))
                t_score = int(att.get("total_score", 0))
                t_questions = int(att.get("total_questions", 0))
                best_score = int(att.get("best_score", 0)) if att.get("best_score") is not None else 0
                avg_acc = round((t_score / t_questions) * 100) if t_questions > 0 else 0
                total_vids = int(video_map.get(uid, 0))

                # Assign performance tier
                if t_quizzes >= 5 and avg_acc >= 85:
                    tier = "Diamond"
                    tier_color = "#38bdf8"
                elif t_quizzes >= 3 and avg_acc >= 70:
                    tier = "Gold"
                    tier_color = "#eab308"
                elif t_quizzes >= 1 and avg_acc >= 50:
                    tier = "Silver"
                    tier_color = "#94a3b8"
                elif t_quizzes >= 1:
                    tier = "Bronze"
                    tier_color = "#d97706"
                else:
                    tier = "Unranked"
                    tier_color = "#64748b"

                created_date = u.get("created_at")
                ranked_list.append({
                    "id": uid,
                    "full_name": u["full_name"],
                    "email": u["email"],
                    "role": u["role"],
                    "created_at": created_date.isoformat() if created_date and hasattr(created_date, "isoformat") else str(created_date),
                    "total_videos": total_vids,
                    "total_quizzes": t_quizzes,
                    "total_score": t_score,
                    "total_questions": t_questions,
                    "avg_accuracy": avg_acc,
                    "best_score": best_score,
                    "tier": tier,
                    "tier_color": tier_color,
                    "has_activity": t_quizzes > 0
                })

            active_users = [x for x in ranked_list if x["has_activity"]]
            inactive_users = [x for x in ranked_list if not x["has_activity"]]

            # Sort active users by accuracy desc, then total quizzes desc, then total score desc
            active_users.sort(key=lambda x: (x["avg_accuracy"], x["total_quizzes"], x["total_score"]), reverse=True)
            inactive_users.sort(key=lambda x: x["created_at"])

            # Assign 1-indexed ranks
            for idx, user_item in enumerate(active_users, start=1):
                user_item["rank"] = idx

            for user_item in inactive_users:
                user_item["rank"] = None

            return active_users + inactive_users
    finally:
        conn.close()


def get_admin_overview_stats():
    ensure_user_schema()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS count FROM users")
            total_users = cur.fetchone()["count"]

            cur.execute("SELECT COUNT(*) AS count FROM videos")
            total_videos = cur.fetchone()["count"]

            cur.execute("SELECT COUNT(*) AS count FROM attempts")
            total_quizzes_taken = cur.fetchone()["count"]

            cur.execute("SELECT SUM(score) AS sum_score, SUM(total_questions) AS sum_q FROM attempts")
            acc_row = cur.fetchone()
            sum_score = acc_row["sum_score"] or 0
            sum_q = acc_row["sum_q"] or 0
            platform_avg_accuracy = round((sum_score / sum_q) * 100) if sum_q > 0 else 0

            return {
                "total_users": total_users,
                "total_videos": total_videos,
                "total_quizzes_taken": total_quizzes_taken,
                "platform_avg_accuracy": platform_avg_accuracy,
            }
    finally:
        conn.close()


def get_admin_user_detail(user_id):
    ensure_user_schema()
    user = get_user_by_id(user_id)
    if not user:
        return None
    stats = get_performance_stats(user_id)
    history = get_history(user_id=user_id)
    return {
        "user": user,
        "stats": stats,
        "videos_count": len(history),
        "history": history[:15]
    }


def update_user_role(target_user_id, new_role):
    ensure_user_schema()
    if new_role not in ("admin", "user"):
        raise ValueError("Role must be 'admin' or 'user'")
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET role = %s WHERE id = %s", (new_role, target_user_id))
            return cur.rowcount
    finally:
        conn.close()
