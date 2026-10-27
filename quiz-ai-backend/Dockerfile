FROM python:3.11-slim

# Install system dependencies (ffmpeg for audio, curl, unzip, ca-certificates for deno)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg curl unzip ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Deno JS runtime for yt-dlp
RUN curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh

WORKDIR /app

# Install Python dependencies including yt-dlp[default]
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --upgrade "yt-dlp[default]"

# Copy backend application files
COPY . .

# Set default port
ENV PORT=5000
EXPOSE 5000

# Run with Gunicorn WSGI server, 2 workers, 4 threads, and 300s timeout
CMD exec gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 300
