# ⚡ Synapse Video Intelligence
### AI-Powered Video Learning & Interactive Assessment Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Groq](https://img.shields.io/badge/Groq_AI-LLM-F55036?style=for-the-badge)](https://console.groq.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://dev.mysql.com)

> **Transform any YouTube video or local file into structured study notes, adaptive quizzes, 3D flashcards, concept mindmaps, and a live AI chat — in one click.**

---

## 📋 Table of Contents
- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#-architecture)
- [Quick Setup](#-quick-setup)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Learning Modes](#-learning-modes)
- [License](#-license)

---

## 🧠 Overview

**Synapse Video Intelligence** is a full-stack AI web application that converts video-based learning content into a complete interactive study toolkit. Submit a YouTube URL or upload a local video, and the system automatically:

1. Downloads or saves the media
2. Extracts the audio with FFmpeg
3. Transcribes speech to text via Groq Whisper
4. **Caches the transcript** — same URL is never re-processed
5. Generates summary, quiz, flashcards, mindmap, and enables live AI chat

---

## ✨ Features

### 🎥 Video Ingestion
- **YouTube URL** — validates format in real time, downloads via `yt-dlp`
- **Local file upload** — drag-and-drop; MP4, MKV, MOV, WEBM, AVI, MP3, WAV (up to 500 MB)
- **Transcript caching** — same URL reuses the stored transcript; no redundant API calls

### 📝 Executive Summary (3 Formats)
- **Executive Brief** — thesis, deep breakdown, terminology table, case study, action items
- **Rapid Bullet Points** — concise snapshot, 7–10 categorical bullets, definitions, checklist
- **Deep Dive Study Notes** — university-level exhaustive breakdown with technical glossary

### 🎯 Adaptive Quiz with Timer
- Easy / Medium / Hard difficulty with AI-calibrated question intent
- 1–20 configurable questions — **guaranteed delivery** via dynamic token budget + gap-fill retry
- **Timer modes:** 3 min Speed Blitz · 5 min Recommended · 10 min Exam Mode · No Timer · Custom
- Live countdown, animated progress bar, auto-submit on expiry
- Detailed score review with per-question explanations

### 🃏 3D Interactive Flashcards
- AI-generated high-yield study cards with CSS 3D flip animation
- Category-tagged cards for organised spaced-repetition review

### 🧠 Concept Mindmap
- Visual hierarchical knowledge graph of the video's core ideas
- Central theme → branches → sub-topic nodes with colour coding

### 💬 Ask Video AI — Live Chat
- Natural language Q&A grounded strictly in the video transcript
- Conversation history context (up to 6 prior exchanges)
- Available as embedded tab or floating slide-over drawer

### 📊 Performance Analytics
- Overall accuracy, best score, total attempts
- Per-difficulty breakdown (Easy / Medium / Hard)
- Consecutive calendar-day learning streak
- Recent attempt timeline

### 🔐 Authentication & Security
- Werkzeug password hashing (no plaintext storage)
- Flask server-side sessions with secure cookies
- 6-digit OTP email recovery with 10-minute expiry
- Flask-Limiter rate controls on all endpoints

### 🌓 Modern UI & Theming
- Dark / Light mode toggle — persisted to `localStorage`
- Professional ambient gradient backgrounds for all dashboard views
- Sidebar navigation: Studio · History · Analytics · Admin portal

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite 6 | Component UI and build tooling |
| Routing | React Router v7 | Client-side navigation |
| Styling | Project CSS + Lucide React | Theming, dark/light mode, icons |
| Backend | Python 3.10+ / Flask 3 | REST API, sessions, pipeline control |
| Media | yt-dlp | Download audio from YouTube |
| Audio | FFmpeg | Extract mono 16 kHz MP3 |
| Transcription | Groq — `whisper-large-v3-turbo` | Speech-to-text |
| Generation | Groq — `gpt-oss-120b` / `qwen3.8-27b` / `gpt-oss-20b` | Summary, quiz, flashcards, mindmap, chat |
| Database | MySQL 8 + PyMySQL | All persistent data |
| Auth | Werkzeug, Flask sessions, SMTP OTP | Security and recovery |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│         PRESENTATION TIER — React 19 + Vite           │
│  Landing · Auth · Studio · 5-Mode Results ·           │
│  History · Analytics · Admin · Dark/Light Theme        │
└─────────────────────┬────────────────────────────────┘
                      │ HTTP / JSON
┌─────────────────────▼────────────────────────────────┐
│         APPLICATION TIER — Flask                      │
│  Auth · Video · Generation · Admin Blueprints         │
│  Flask-CORS · Flask-Limiter · Werkzeug · SMTP         │
│                                                       │
│  ┌─────────┐  ┌─────────┐  ┌──────────────────────┐ │
│  │ yt-dlp  │  │ FFmpeg  │  │  Groq Cloud API       │ │
│  └─────────┘  └─────────┘  └──────────────────────┘ │
└─────────────────────┬────────────────────────────────┘
                      │ PyMySQL
┌─────────────────────▼────────────────────────────────┐
│         PERSISTENCE TIER — MySQL 8                    │
│  users · password_reset · videos · transcripts        │
│  summaries · quizzes · quiz_attempts                  │
└──────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Setup

### Prerequisites
- Python 3.10+, Node.js 18+, MySQL 8 (or XAMPP)
- [FFmpeg](https://ffmpeg.org/download.html) installed and in system PATH
- [Groq API key](https://console.groq.com)

### 1. Clone
```bash
git clone https://github.com/Utsav-047/VIDEO-SUMMERISER-AND-QUIZ-GENERATOR.git
cd VIDEO-SUMMERISER-AND-QUIZ-GENERATOR
```

### 2. Backend Setup
```bash
cd quiz-ai-backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Database Setup
```sql
CREATE DATABASE IF NOT EXISTS quiz_ai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Tables are created automatically on first run.

### 5. Start Backend
```bash
python app.py
# Runs at http://localhost:5000
```

### 6. Start Frontend
```bash
cd ../quiz-ai-react-frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

---

## 🔑 Environment Variables

Copy `quiz-ai-backend/.env.example` → `quiz-ai-backend/.env`:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
SECRET_KEY=your_secret_key_change_in_production
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=quiz_ai_db
UPLOAD_FOLDER=uploads
MAX_VIDEO_MINUTES=50
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_NAME=Synapse Video Intelligence
```

> ⚠️ **Never commit `.env`** — it is in `.gitignore`

---

## 📁 Project Structure

```
VIDEO-SUMMERISER-AND-QUIZ-GENERATOR/
├── quiz-ai-backend/
│   ├── app.py
│   ├── config.py
│   ├── models/db.py             # All DB helpers
│   ├── routes/
│   │   ├── auth_routes.py       # Register, login, OTP recovery
│   │   ├── video_routes.py      # Ingestion + transcript caching
│   │   ├── generation_routes.py # Summary, quiz, flashcards, mindmap, chat
│   │   └── admin_routes.py      # Platform stats, user management
│   ├── services/
│   │   ├── ai_generator.py      # Groq LLM + fallback chain
│   │   ├── transcriber.py       # Whisper transcription
│   │   ├── downloader.py        # yt-dlp acquisition
│   │   ├── audio.py             # FFmpeg extraction
│   │   └── email_service.py     # SMTP OTP delivery
│   ├── requirements.txt
│   └── .env.example
│
└── quiz-ai-react-frontend/
    ├── public/
    │   ├── dashboard-light-bg.jpg
    │   └── dashboard-dark-bg.jpg
    └── src/
        ├── App.jsx               # Shell, sidebar, result viewer (5 tabs)
        ├── index.css             # Global CSS + theme tokens
        ├── components/
        │   ├── VideoProcessor.jsx
        │   ├── SummaryViewer.jsx
        │   ├── QuizPlayer.jsx    # Timed MCQ with countdown
        │   ├── FlashcardPlayer.jsx
        │   ├── MindmapViewer.jsx
        │   ├── VideoChatDrawer.jsx
        │   ├── HistoryFeed.jsx
        │   └── PerformanceStats.jsx
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── AuthPage.jsx
        │   └── AdminDashboard.jsx
        ├── services/api.js
        └── context/AuthContext.jsx
```

---

## 🎓 Learning Modes

After any video is processed, five study modes are instantly available:

| Mode | Description |
|------|-------------|
| 📝 **Executive Summary** | Formatted markdown notes with headers, tables, emphasis |
| 🎯 **Quiz & Timer** | Timed adaptive MCQ, countdown, auto-submit, score review |
| 🃏 **3D Flashcards** | CSS 3D flip-card deck for spaced repetition |
| 🧠 **Concept Mindmap** | Visual knowledge graph of topics and sub-topics |
| 💬 **Ask Video AI** | Natural language chat grounded in the video transcript |

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).

---

<p align="center">Built with ❤️ using React 19 · Flask · Groq AI · Whisper · MySQL</p>
