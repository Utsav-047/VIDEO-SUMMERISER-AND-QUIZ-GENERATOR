# ⚡ Synapse — AI Video Summarizer & Interactive Quiz Generator

An intelligent full-stack AI web application that transforms long YouTube videos and local video uploads into concise summaries, key takeaways, and adaptive interactive quizzes powered by Groq LLMs and Whisper transcription.

---

## ✨ Features

- 🎥 **Dual Video Ingestion**: Supports YouTube URLs (via `yt-dlp`) and direct video uploads (MP4, MKV, MOV).
- 🎙️ **High-Precision Transcription**: Fast audio extraction and speech-to-text transcription with Whisper.
- 📝 **Structured AI Summaries**: Executive summaries, bullet points, key takeaways, and action items powered by Groq AI.
- 🎯 **Interactive AI Quizzes**: Auto-generated multiple-choice questions with customized difficulty levels (Easy, Medium, Hard).
- 📊 **Account-Based Performance Analytics**:
  - Real-time quiz accuracy tracking across all attempts.
  - Performance breakdown by difficulty level.
  - Consecutive calendar day learning streaks.
  - Assessment history and score logs.
- 🔐 **Authentication & Security**:
  - Secure session-based authentication with bcrypt password hashing.
  - 6-Digit OTP verification flow for forgot password and recovery.
- 🌓 **Modern Responsive UI**: Dark & light mode with glassmorphism and Tailwind CSS.

---

## 🛠️ Tech Stack

### Frontend
- **HTML5 & Vanilla JavaScript** (Modular, reactive architecture)
- **Tailwind CSS** (Responsive UI with Dark/Light mode)
- **Google Material Symbols & Typography**

### Backend
- **Python 3.10+ / Flask**
- **PyMySQL** (MySQL Database layer)
- **Groq API / OpenAI Client** (Fast LLM generation)
- **Whisper & yt-dlp** (Audio extraction & transcription)

---

## 🚀 Quick Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Utsav-047/VIDEO-SUMMERISER-AND-QUIZ-GENERATOR.git
cd VIDEO-SUMMERISER-AND-QUIZ-GENERATOR
```

### 2. Backend Setup
```bash
cd quiz-ai-backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration
Copy `.env.example` to `.env` inside `quiz-ai-backend/`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your_flask_secret_key
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=quiz_ai_db
```

### 4. Database Setup (MySQL / XAMPP)
Create the database in MySQL / phpMyAdmin:
```sql
CREATE DATABASE IF NOT EXISTS quiz_ai_db;
```

### 5. Run Backend Server
```bash
python app.py
```
Backend will start on `http://localhost:5000`.

### 6. Frontend Setup
Open `quiz-ai-frontend/landing.html` or `quiz-ai-frontend/login.html` directly in your browser or serve it via Live Server / VS Code.

---

## 📄 License
This project is open-source under the MIT License.
