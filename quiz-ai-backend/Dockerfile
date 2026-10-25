FROM python:3.11-slim

# Install system dependencies (ffmpeg is essential for audio extraction and chunking)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --upgrade yt-dlp

# Copy backend application files
COPY . .

# Set default port
ENV PORT=5000
EXPOSE 5000

# Run with Gunicorn WSGI server, 2 workers, and 120s timeout for AI video operations
CMD exec gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
