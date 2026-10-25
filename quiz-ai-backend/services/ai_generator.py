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
        f"{start}\n\n"
        f"[...lecture continues in depth: middle discussion...]\n\n"
        f"{middle}\n\n"
        f"[...lecture conclusion and synthesis...]\n\n"
        f"{end}"
    )


def _clean_json_response(raw_text):
    """Cleans and extracts JSON object from LLM response text."""
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Fallback: regex search for outer JSON object
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


def generate_summary_and_quiz(
    transcript_text,
    summary_format="executive",
    num_questions=5,
    difficulty="medium",
):
    """
    Single combined LLM call to generate both the structured summary and quiz questions.
    Uses multi-model fallback and dynamic token budget.
    """
    fmt_key = summary_format if summary_format in SUMMARY_FORMAT_INSTRUCTIONS else "executive"
    diff_key = difficulty if difficulty in DIFFICULTY_INSTRUCTIONS else "medium"
    num_questions = max(1, min(int(num_questions), 20))

    summary_instruction = SUMMARY_FORMAT_INSTRUCTIONS[fmt_key]
    difficulty_instruction = DIFFICULTY_INSTRUCTIONS[diff_key]

    processed_text = _prepare_transcript_for_llm(transcript_text, max_chars=14000)

    # Dynamic token budget calculation:
    # Summary takes ~1200-1500 tokens. Each quiz question takes ~100-120 tokens.
    base_summary_tokens = 1500
    quiz_tokens = num_questions * 130
    max_tokens = min(4096, base_summary_tokens + quiz_tokens + 300)

    system_prompt = (
        "You are an expert tutor and assessment designer. Analyze the video transcript "
        "and produce BOTH a comprehensive structured summary AND a high-quality multiple-choice quiz.\n\n"
        f"--- SUMMARY INSTRUCTIONS ({fmt_key.upper()}) ---\n"
        f"{summary_instruction}\n\n"
        f"--- QUIZ INSTRUCTIONS ({diff_key.upper()} DIFFICULTY) ---\n"
        f"Create exactly {num_questions} multiple-choice questions. {difficulty_instruction}\n"
        "Each question must have:\n"
        "- Exactly 4 plausible options\n"
        "- Exactly one correct answer indicated by correct_index (0, 1, 2, or 3)\n"
        "- A clear 1-2 sentence explanation of why the correct answer is right\n"
        "- Plain text only for questions and options (no markdown symbols)\n\n"
        "--- OUTPUT FORMAT ---\n"
        "You MUST respond ONLY with a valid JSON object matching this exact schema:\n"
        "{\n"
        '  "summary": "Full formatted markdown summary following the instructions above",\n'
        '  "questions": [\n'
        "    {\n"
        '      "question": "Question text?",\n'
        '      "options": ["Option A", "Option B", "Option C", "Option D"],\n'
        '      "correct_index": 0,\n'
        '      "explanation": "Why this answer is correct."\n'
        "    }\n"
        "  ]\n"
        "}"
    )

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
    Strictly focuses on core educational/academic concepts, theories, formulas, and mechanisms.
    Excludes presenter introductions, channel names, sponsor promotions, or video production meta-data.
    """
    processed_text = _prepare_transcript_for_llm(transcript_text, max_chars=14000)
    system_prompt = (
        f"You are an expert university professor creating {num_cards} high-yield study flashcards based on the video transcript.\n"
        "CRITICAL RULES:\n"
        "1. Focus STRICTLY and EXCLUSIVELY on the academic, technical, and educational concepts, definitions, theories, formulas, key steps, and mechanisms discussed in the lecture.\n"
        "2. ABSOLUTELY DO NOT create flashcards about the presenter's identity, host name, YouTube channel name, video intro/outro, subscribe/like requests, sponsors, or greetings.\n"
        "3. Every card must have:\n"
        "   - 'front': A concise conceptual question, technical term, or problem statement (e.g. 'What is backpropagation?', 'Explain Amdahl\\'s Law').\n"
        "   - 'back': A clear, complete explanation, formula, or definitive answer (2-3 sentences max).\n"
        "   - 'category': An educational domain label (e.g., 'Core Principle', 'Architecture', 'Algorithm', 'Terminology', 'Mechanism', 'Application').\n"
        "Respond ONLY with a valid JSON object in this exact format:\n"
        "{\n"
        '  "flashcards": [\n'
        '    {"front": "...", "back": "...", "category": "..."}\n'
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
            cards = parsed.get("flashcards", [])

            # Secondary sanitization: filter out any card mentioning presenter or channel metadata
            meta_blacklist = [
                "presenter", "speaker", "channel", "host", "video is presented by",
                "welcome to", "subscribe", "like and share", "youtube channel",
                "author of the video", "who presented", "who is the speaker"
            ]
            clean_cards = []
            for card in cards:
                combined = f"{card.get('front', '')} {card.get('back', '')}".lower()
                if not any(b in combined for b in meta_blacklist):
                    clean_cards.append(card)

            return clean_cards if clean_cards else cards
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
        '  "root": {\n'
        '    "title": "Central Topic Title",\n'
        '    "children": [\n'
        "      {\n"
        '        "title": "Main Theme 1",\n'
        '        "description": "Brief description of theme 1",\n'
        '        "children": [\n'
        '          {"title": "Sub-concept A", "description": "Details about sub-concept A"},\n'
        '          {"title": "Sub-concept B", "description": "Details about sub-concept B"}\n'
        "        ]\n"
        "      }\n"
        "    ]\n"
        "  }\n"
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
                max_tokens=1500,
            )
            raw = response.choices[0].message.content
            parsed = _clean_json_response(raw)
            return parsed.get("root", {})
        except Exception as e:
            last_error = e
            continue

    raise RuntimeError(f"Failed to generate mindmap: {last_error}")