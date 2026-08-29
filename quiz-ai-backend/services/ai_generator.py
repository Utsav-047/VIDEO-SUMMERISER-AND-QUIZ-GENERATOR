import json
from openai import OpenAI
from config import Config

client = OpenAI(
    api_key=Config.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
    timeout=30.0,
)

MODEL = "openai/gpt-oss-120b"

NO_MARKDOWN_RULE = (
    "Do not use any markdown formatting — no asterisks, no bold, no headers, no tables, "
    "no bullet symbols like '-' or '|', no horizontal rules like '---'. "
    "Write in plain, clean sentences and paragraphs only, as if writing for a plain text box."
)

SUMMARY_FORMAT_INSTRUCTIONS = {
    "executive": "Write a short, high-level executive summary in 4-6 plain sentences covering only the main ideas.",
    "comprehensive": "Write a detailed summary covering all key points, organized into 3-4 short plain paragraphs, "
                      "each separated by a blank line. No headings.",
    "flashcard": "Write 5-8 short, standalone key-point sentences, one per line, each starting with a plain hyphen "
                 "'- ' followed by a single complete sentence. No bold text, no sub-labels, no colons-as-headers.",
}


def generate_summary(transcript_text, summary_format="executive"):
    instruction = SUMMARY_FORMAT_INSTRUCTIONS.get(summary_format, SUMMARY_FORMAT_INSTRUCTIONS["executive"])

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": f"You summarize video transcripts clearly for students. {instruction} {NO_MARKDOWN_RULE}",
            },
            {"role": "user", "content": transcript_text},
        ],
    )
    return response.choices[0].message.content.strip()


def generate_quiz(transcript_text, num_questions=5, difficulty="medium"):
    num_questions = max(1, min(int(num_questions), 20))
    difficulty = difficulty if difficulty in ("easy", "medium", "hard") else "medium"

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
            {"role": "user", "content": transcript_text},
        ],
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    parsed = json.loads(raw)
    return parsed["questions"]