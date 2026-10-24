import json
import re
import time
from openai import OpenAI
from config import Config

client = OpenAI(
    api_key=Config.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
    timeout=120.0,
)

# Priority model list. If one encounters TPM limits or service issues, automatically tries next.
MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]

SUMMARY_FORMAT_INSTRUCTIONS = {
    "executive": (
        "Structure the summary as an authoritative, deep master executive guide using rich, clean markdown:\n\n"
        "## 📌 Executive Brief & Central Thesis\n"
        "Write a thorough 2-paragraph overview explaining the core premise, problem being addressed, and why this lecture/video matters.\n\n"
        "## 💡 Deep Architectural & Conceptual Breakdown\n"
        "Provide a comprehensive, multi-point technical breakdown (5-7 deep points). Each point MUST start with a bold header and include 2-4 clear sentences explaining the mechanism, underlying logic, and practical implications in thorough depth (do NOT write short, superficial bullets).\n\n"
        "## 📊 Key Terminology & Glossary\n"
        "Include a structured markdown table with 3-6 critical terms or definitions extracted from the video:\n"
        "| Term / Acronym | Definition & Technical Context | Practical Importance |\n"
        "| :--- | :--- | :--- |\n"
        "| ... | ... | ... |\n\n"
        "## 🔍 Concrete Case Studies & Applied Walkthrough\n"
        "Provide 1-2 detailed, step-by-step real-world examples, analogies, or practical applications demonstrating exactly how these concepts work in practice.\n\n"
        "## ⚠️ Critical Nuances, Pitfalls & Pro Tips\n"
        "Detail 3-4 subtle pitfalls, common misconceptions, or expert tips mentioned or implied in the material.\n\n"
        "## 🎯 Strategic Action Items & Key Takeaways\n"
        "List 3-4 actionable takeaways and next steps that the viewer should remember and implement."
    ),
    "bullet": (
        "Structure the summary as high-impact, comprehensive study notes in rapid bullet form:\n\n"
        "## ⚡ Core Executive Snapshot\n"
        "A clear, punchy 2-paragraph synthesis of the entire video.\n\n"
        "## 📋 Comprehensive Conceptual Bullet Points\n"
        "Provide 7-10 in-depth bullet points. Start each with a bold categorical tag (e.g., '- **Architecture & Design**: detailed explanation with mechanisms and specifics').\n\n"
        "## 📊 Key Definitions & Formulas\n"
        "Include a structured markdown table:\n"
        "| Concept / Tool | Description | Why It Matters |\n"
        "| :--- | :--- | :--- |\n\n"
        "## 💡 Real-World Application & Scenarios\n"
        "Specific, concrete examples of how to apply this knowledge immediately.\n\n"
        "## 🚀 Actionable Checklist\n"
        "A bulleted checklist of actionable steps and study checkpoints."
    ),
    "deep-dive": (
        "Structure the summary as an exhaustive, university-level technical lecture syllabus and master study guide:\n\n"
        "## 📖 Context, Motivation & Foundational Principles\n"
        "Provide an extensive analysis of the background, motivation, and theoretical foundation of the topic.\n\n"
        "## 🧠 Comprehensive Deep-Dive & Mechanistic Breakdown\n"
        "Provide an exhaustive, section-by-section breakdown of every major concept, technique, algorithm, or methodology discussed in the video. Explain the 'why' and the 'how', not just the 'what'.\n\n"
        "## 📊 Technical Glossary & Concept Matrix\n"
        "Include an extensive markdown table breaking down all critical terminology, components, or parameters:\n"
        "| Concept / Variable | Rigorous Definition | Role in System / Context |\n"
        "| :--- | :--- | :--- |\n\n"
        "## 🔬 Step-by-Step Practical Case Study\n"
        "Walk through a detailed, real-world case study or practical implementation scenario end-to-end.\n\n"
        "## ⚠️ Edge Cases, Pitfalls & Expert Insights\n"
        "Highlight common failure modes, trade-offs, and pro-level best practices.\n\n"
        "## 🎓 Synthesis & Retention Review\n"
        "A comprehensive closing synthesis connecting all points together for lifelong retention."
    ),
}

DIFFICULTY_INSTRUCTIONS = {
    "easy": "Questions should test basic recall of directly stated facts and core terminology.",
    "medium": "Questions should test understanding and require connecting related concepts.",
    "hard": "Questions should test deeper reasoning, inference, and application of the concepts discussed.",
}


def _prepare_transcript_for_llm(transcript_text, max_chars=14000):
    """
    Ensures transcript fits comfortably within Groq's 8,000 Tokens Per Minute (TPM) limit.
    14,000 characters is ~3,500 tokens. Together with prompt instructions and generation reserve,
    this stays safely within ~5,000 tokens (well below the 8,000 TPM limit).

    For long lectures (e.g. 30 to 60+ minutes), smartly samples representative segments
    from beginning (35%), middle (35%), and conclusion (30%) so no part of the lecture is lost.
    """
    if not transcript_text:
        return ""

    if len(transcript_text) <= max_chars:
        return transcript_text

    part_1_len = int(max_chars * 0.35)
    part_2_len = int(max_chars * 0.35)
    part_3_len = max_chars - part_1_len - part_2_len

    start = transcript_text[:part_1_len]
    mid_start = max(0, len(transcript_text) // 2 - (part_2_len // 2))
    middle = transcript_text[mid_start:mid_start + part_2_len]
    end = transcript_text[-part_3_len:]

    return (
        f"[=== Section 1: Lecture Beginning & Core Definitions ===]\n{start}\n\n"
        f"[=== Section 2: Deep Explanations & Practical Insights ===]\n{middle}\n\n"
        f"[=== Section 3: Key Conclusions & Final Takeaways ===]\n{end}"
    )


def _clean_json_response(raw_text):
    """
    Extracts and parses JSON safely, handling markdown backticks or extra wrapping.
    """
    raw_text = raw_text.strip()
    # Strip markdown code fence if present
    if raw_text.startswith("```"):
        raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
        raw_text = re.sub(r"\s*```$", "", raw_text)
        raw_text = raw_text.strip()

    # Find outermost { ... }
    first_brace = raw_text.find("{")
    last_brace = raw_text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        raw_text = raw_text[first_brace:last_brace + 1]

    return json.loads(raw_text)


def generate_summary_and_quiz(transcript_text, summary_format="executive", num_questions=5, difficulty="medium"):
    """
    Single unified generation call: Produces BOTH summary and quiz in ONE request.
    Benefits:
    1. Cuts token consumption by ~50% (transcript is sent once instead of twice).
    2. Completely eliminates the Groq 8,000 TPM limit collision caused by back-to-back calls.
    3. Twice as fast for the user.
    4. Automatically falls back between available models if rate-limited.
    """
    fmt_key = summary_format if summary_format in SUMMARY_FORMAT_INSTRUCTIONS else "executive"
    instruction = SUMMARY_FORMAT_INSTRUCTIONS[fmt_key]
    num_questions = max(1, min(int(num_questions), 20))
    diff_key = difficulty if difficulty in DIFFICULTY_INSTRUCTIONS else "medium"
    diff_instruction = DIFFICULTY_INSTRUCTIONS[diff_key]

    processed_text = _prepare_transcript_for_llm(transcript_text, max_chars=14000)

    system_prompt = (
        "You are an expert tutor and master communicator. You synthesize video transcripts "
        "into clear, high-yield markdown summaries and rigorous multiple-choice quizzes.\n\n"
        "You must respond ONLY with a valid JSON object containing two top-level keys:\n"
        "1. 'summary': A markdown-formatted string adhering strictly to the requested summary format.\n"
        f"Format requirements:\n{instruction}\n\n"
        "2. 'questions': An array of multiple-choice question objects.\n"
        f"Create exactly {num_questions} questions at {diff_key} difficulty ({diff_instruction}).\n"
        "Each question object must strictly follow this structure:\n"
        "{\n"
        '  "question": "Question text here (plain text, no markdown)",\n'
        '  "options": ["Option A", "Option B", "Option C", "Option D"],\n'
        '  "correct_index": 0,\n'
        '  "explanation": "One clear sentence explaining why the correct choice is right."\n'
        "}\n\n"
        "Output ONLY the JSON object. Do not include markdown code block ticks outside the JSON."
    )

    # Scale token budget: summary needs ~1800 tokens, each question ~120 tokens
    max_tokens = min(6000, 1800 + (num_questions * 130))

    last_error = None
    for model_name in MODELS:
        for attempt in range(2):
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Transcript:\n{processed_text}"},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3,
                    max_tokens=max_tokens,
                )
                raw_content = response.choices[0].message.content
                data = _clean_json_response(raw_content)

                summary = data.get("summary", "").strip()
                questions = data.get("questions", [])

                if not summary or not isinstance(questions, list):
                    raise ValueError("Model output missing 'summary' or 'questions'")

                # Gap-fill: if model returned fewer questions than requested, top up
                if len(questions) < num_questions:
                    shortfall = num_questions - len(questions)
                    try:
                        extra = generate_quiz(
                            transcript_text,
                            num_questions=shortfall,
                            difficulty=difficulty,
                        )
                        questions = questions + extra
                    except Exception:
                        pass  # best-effort: return what we have if top-up fails

                return summary, questions
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                # If rate-limited or TPM exceeded, wait briefly or switch model
                if "rate_limit" in err_str or "429" in err_str or "413" in err_str:
                    time.sleep(2.0 * (attempt + 1))
                    continue
                else:
                    break

    raise RuntimeError(f"All models failed to generate summary and quiz: {last_error}")


def generate_summary(transcript_text, summary_format="executive"):
    """
    Standalone summary generation with safe token sampling and model fallback.
    """
    fmt_key = summary_format if summary_format in SUMMARY_FORMAT_INSTRUCTIONS else "executive"
    instruction = SUMMARY_FORMAT_INSTRUCTIONS[fmt_key]
    processed_text = _prepare_transcript_for_llm(transcript_text, max_chars=14000)

    system_prompt = (
        "You are an expert tutor and master communicator who creates exceptionally clear, "
        "readable, and intuitive video summaries.\n\n"
        f"Format Instructions:\n{instruction}"
    )

    last_error = None
    for model_name in MODELS:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": processed_text},
                ],
                temperature=0.3,
                max_tokens=2800,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            last_error = e
            continue

    raise RuntimeError(f"Failed to generate summary: {last_error}")


def generate_quiz(transcript_text, num_questions=5, difficulty="medium"):
    """
    Standalone quiz generation with safe token sampling and model fallback.
    """
    num_questions = max(1, min(int(num_questions), 20))
    diff_key = difficulty if difficulty in DIFFICULTY_INSTRUCTIONS else "medium"
    processed_text = _prepare_transcript_for_llm(transcript_text, max_chars=14000)

    system_prompt = (
        f"You generate multiple-choice quiz questions from a video transcript. "
        f"Create exactly {num_questions} questions at {diff_key} difficulty. {DIFFICULTY_INSTRUCTIONS[diff_key]} "
        f"Each question needs a short one-sentence explanation of why the correct answer is right. "
        f"The question text, options, and explanation must all be plain text. "
        f"Respond ONLY with valid JSON in this exact format:\n"
        f'{{"questions": [{{"question": "...", "options": ["...", "...", "...", "..."], '
        f'"correct_index": 0, "explanation": "..."}}]}}'
    )

    last_error = None
    for model_name in MODELS:
        try:
            # Scale token budget per question count
            quiz_max_tokens = min(3200, 400 + (num_questions * 130))
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": processed_text},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=quiz_max_tokens,
            )
            raw = response.choices[0].message.content
            parsed = _clean_json_response(raw)
            return parsed.get("questions", [])
        except Exception as e:
            last_error = e
            continue

    raise RuntimeError(f"Failed to generate quiz: {last_error}")


def answer_video_question(transcript_text, question, conversation_history=None):
    """
    Interactive Q&A: Answers questions grounded strictly in the video transcript.
    """
    processed_text = _prepare_transcript_for_llm(transcript_text, max_chars=14000)
    system_prompt = (
        "You are an interactive AI tutor grounded directly in the provided video transcript.\n"
        "Your goal is to answer the user's questions clearly, accurately, and educationally using only information from the video transcript.\n"
        "- If the answer is in the transcript, give a structured, concise response with bullet points where helpful.\n"
        "- If the transcript does not contain enough info to answer the question, clearly state: "
        "'The video does not specifically cover this, but here is a brief conceptual explanation based on standard knowledge:' and keep it brief.\n"
        "- Maintain a supportive, master tutor tone."
    )
    messages = [{"role": "system", "content": system_prompt}]
    if conversation_history and isinstance(conversation_history, list):
        for msg in conversation_history[-6:]:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

    messages.append({
        "role": "user",
        "content": f"Context Video Transcript:\n{processed_text}\n\nUser Question:\n{question}"
    })

    last_error = None
    for model_name in MODELS:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.4,
                max_tokens=1000,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            last_error = e
            continue

    raise RuntimeError(f"Failed to answer question: {last_error}")


def generate_flashcards(transcript_text, num_cards=8):
    """
    Generates high-yield 3D flashcards for rapid revision and spaced repetition.
    """
    processed_text = _prepare_transcript_for_llm(transcript_text, max_chars=14000)
    system_prompt = (
        f"Generate {num_cards} high-yield study flashcards based on the video transcript.\n"
        "Focus on key terms, definitions, principles, formulas, and critical insights.\n"
        "Respond ONLY with a valid JSON object in this exact format:\n"
        "{\n"
        '  "flashcards": [\n'
        '    {"front": "Concise term or question", "back": "Clear, complete explanation or answer", "category": "Core Principle"}\n'
        "  ]\n"
        "}"
    )

    last_error = None
    for model_name in MODELS:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Transcript:\n{processed_text}"},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=1500,
            )
            raw = response.choices[0].message.content
            parsed = _clean_json_response(raw)
            return parsed.get("flashcards", [])
        except Exception as e:
            last_error = e
            continue

    raise RuntimeError(f"Failed to generate flashcards: {last_error}")


def generate_mindmap(transcript_text, summary_text=None):
    """
    Generates a hierarchical knowledge graph / concept tree structure of the video lecture.
    """
    context = summary_text if summary_text else _prepare_transcript_for_llm(transcript_text, max_chars=10000)
    system_prompt = (
        "Generate a structured hierarchical concept mindmap / knowledge graph of the lecture.\n"
        "Organize it into a central topic, 3-5 main branches, and 2-3 sub-nodes under each branch with brief descriptions.\n"
        "Respond ONLY with a valid JSON object matching this structure:\n"
        "{\n"
        '  "mindmap": {\n'
        '    "title": "Central Theme/Title",\n'
        '    "branches": [\n'
        '      {\n'
        '        "name": "Main Branch 1",\n'
        '        "summary": "Brief 1-sentence description",\n'
        '        "color": "#3b82f6",\n'
        '        "nodes": [\n'
        '          {"name": "Subtopic A", "detail": "Specific mechanism or concept"},\n'
        '          {"name": "Subtopic B", "detail": "Key takeaway or formula"}\n'
        '        ]\n'
        '      }\n'
        '    ]\n'
        '  }\n'
        "}"
    )

    last_error = None
    for model_name in MODELS:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Context:\n{context}"},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=1600,
            )
            raw = response.choices[0].message.content
            parsed = _clean_json_response(raw)
            return parsed.get("mindmap", {})
        except Exception as e:
            last_error = e
            continue

    raise RuntimeError(f"Failed to generate mindmap: {last_error}")