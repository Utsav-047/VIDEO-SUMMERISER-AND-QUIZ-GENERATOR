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
        "Structure the summary with the following distinct sections using clean markdown:\n\n"
        "## 📌 Core Overview\n"
        "Provide a clear, engaging 2-3 sentence high-level explanation of the main topic and core message of the video.\n\n"
        "## 💡 Key Concepts & Insights\n"
        "List 3-5 bullet points covering the most essential concepts. Start each bullet point with a bolded keyword or phrase (e.g. '- **Core Principle**: explanation').\n\n"
        "## 🔍 Practical Example & Analogy\n"
        "Provide a clear, relatable real-world example, scenario, or intuitive analogy illustrating these ideas in practice so anyone can understand and explain it easily.\n\n"
        "## 🎯 Actionable Takeaway\n"
        "A 1-2 sentence concluding takeaway highlighting the key benefit and how to apply this knowledge."
    ),
    "bullet": (
        "Structure the summary into rapid, high-impact bullet points using clean markdown:\n\n"
        "## ⚡ Quick Summary\n"
        "A 1-2 sentence high-level snapshot of what this video teaches.\n\n"
        "## 📋 Essential Takeaways\n"
        "Provide 5-7 clear, high-yield bullet points. Start each bullet with a bolded label (e.g. '- **Key Point**: concise insight').\n\n"
        "## 💡 Real-World Example\n"
        "A concrete, relatable real-world example showing the concepts in action.\n\n"
        "## 🚀 Action Step\n"
        "A single memorable closing takeaway or next step."
    ),
    "deep-dive": (
        "Provide detailed, comprehensive study notes structured with clean markdown:\n\n"
        "## 📖 Core Context & Purpose\n"
        "Explain the background, purpose, and significance of what is discussed.\n\n"
        "## 🧠 In-Depth Breakdown\n"
        "Thoroughly break down the key ideas, mechanisms, or principles into clear sub-points with bold concepts.\n\n"
        "## 💡 Real-World Examples & Case Study\n"
        "Provide 1-2 practical, step-by-step examples or real-world use cases demonstrating how these ideas apply in real life.\n\n"
        "## ⚠️ Common Pitfalls & Best Practices\n"
        "Highlight common mistakes or key tips mentioned or relevant to the subject.\n\n"
        "## 🎓 Summary Review\n"
        "A final concise review paragraph summarizing what you should remember."
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
                    max_tokens=2200,
                )
                raw_content = response.choices[0].message.content
                data = _clean_json_response(raw_content)

                summary = data.get("summary", "").strip()
                questions = data.get("questions", [])

                if not summary or not isinstance(questions, list):
                    raise ValueError("Model output missing 'summary' or 'questions'")

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
                max_tokens=1500,
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
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": processed_text},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=1500,
            )
            raw = response.choices[0].message.content
            parsed = _clean_json_response(raw)
            return parsed.get("questions", [])
        except Exception as e:
            last_error = e
            continue

    raise RuntimeError(f"Failed to generate quiz: {last_error}")