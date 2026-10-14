import json
from openai import OpenAI
from config import Config

client = OpenAI(
    api_key=Config.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
    timeout=120.0,    # Increased to 120s for long transcript (30-60 min) processing
)

MODEL = "openai/gpt-oss-120b"

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


def _prepare_transcript_for_llm(transcript_text, max_chars=60000):
    """
    Ensures transcript fits comfortably within single-turn generation limits.
    60,000 characters is ~12,000 words (more than a typical 60-70 min lecture).
    If longer, samples evenly from beginning, middle, and conclusion.
    """
    if len(transcript_text) <= max_chars:
        return transcript_text

    part_len = max_chars // 3
    start = transcript_text[:part_len]
    mid_start = len(transcript_text) // 2 - (part_len // 2)
    middle = transcript_text[mid_start:mid_start + part_len]
    end = transcript_text[-part_len:]

    return f"{start}\n\n[...section continued...]\n\n{middle}\n\n[...conclusion section...]\n\n{end}"


def generate_summary(transcript_text, summary_format="executive"):
    fmt_key = summary_format if summary_format in SUMMARY_FORMAT_INSTRUCTIONS else "executive"
    instruction = SUMMARY_FORMAT_INSTRUCTIONS[fmt_key]
    processed_text = _prepare_transcript_for_llm(transcript_text)

    system_prompt = (
        "You are an expert tutor and master communicator who creates exceptionally clear, "
        "readable, and intuitive video summaries. Your goal is to make complex topics simple, "
        "memorable, and effortless to explain to others.\n\n"
        "Guidelines:\n"
        "1. Write in a clear, engaging, conversational-yet-professional tone.\n"
        "2. Break information into bite-sized, logical sections.\n"
        "3. Bold key terms (**like this**) so the summary is scannable at a glance.\n"
        "4. Always include a concrete, relatable real-world example or intuitive analogy.\n"
        "5. Follow the requested structure strictly using standard markdown headers (##) and bullet points (- ).\n\n"
        f"Format Instructions:\n{instruction}"
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {"role": "user", "content": processed_text},
        ],
    )
    return response.choices[0].message.content.strip()


def generate_quiz(transcript_text, num_questions=5, difficulty="medium"):
    num_questions = max(1, min(int(num_questions), 20))
    difficulty = difficulty if difficulty in ("easy", "medium", "hard") else "medium"
    processed_text = _prepare_transcript_for_llm(transcript_text)

    difficulty_instructions = {
        "easy": "Questions should test basic recall of directly stated facts.",
        "medium": "Questions should test understanding and require connecting a couple of ideas.",
        "hard": "Questions should test deeper reasoning, inference, and application of the concepts discussed.",
    }

    system_prompt = (
        f"You generate multiple-choice quiz questions from a video transcript. "
        f"Create exactly {num_questions} questions at {difficulty} difficulty. {difficulty_instructions[difficulty]} "
        f"Each question needs a short one-sentence explanation of why the correct answer is right. "
        f"The question text, options, and explanation must all be plain text with no markdown formatting "
        f"(no asterisks, no bold, no bullet symbols). "
        f"Respond ONLY with valid JSON in this exact format, no extra text:\n"
        f'{{"questions": [{{"question": "...", "options": ["...", "...", "...", "..."], '
        f'"correct_index": 0, "explanation": "..."}}]}}'
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": processed_text},
        ],
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    parsed = json.loads(raw)
    return parsed["questions"]