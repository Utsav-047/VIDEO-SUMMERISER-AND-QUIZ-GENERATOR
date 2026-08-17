import json
from openai import OpenAI
from config import Config


client = OpenAI(
    api_key=Config.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
    timeout=30.0,
)

# llama-3.3-70b-versatile was deprecated by Groq (June 2026).
# openai/gpt-oss-120b is their recommended replacement — same free tier, strong quality.
MODEL = "openai/gpt-oss-120b"


def generate_summary(transcript_text):
    """
    Sends the transcript to Groq's model and returns a concise summary (plain text).
    """
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": "You summarize video transcripts clearly and concisely for students. "
                            "Write 4-6 sentences covering the main ideas only.",
            },
            {"role": "user", "content": transcript_text},
        ],
    )
    return response.choices[0].message.content.strip()


def generate_quiz(transcript_text, num_questions=5):
    """
    Sends the transcript to Groq's model and asks it to return quiz questions as strict JSON.
    Returns a list of dicts: [{ "question": ..., "options": [...], "correct_index": 0 }, ...]
    """
    system_prompt = (
        f"You generate multiple-choice quiz questions from a video transcript. "
        f"Create exactly {num_questions} questions to test understanding of the content. "
        f"Respond ONLY with valid JSON in this exact format, no extra text:\n"
        f'{{"questions": [{{"question": "...", "options": ["...", "...", "...", "..."], "correct_index": 0}}]}}'
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