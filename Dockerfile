FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

# Default environment variables (override in Railway dashboard)
ENV HOST="0.0.0.0"
ENV PORT="8000"
ENV DATABASE_PATH="/app/data/yunjiang.db"
ENV DRAMA_LLM_API_KEY=""
ENV DRAMA_LLM_BASE_URL="https://api.deepseek.com/v1"
ENV DRAMA_LLM_MODEL="deepseek-chat"

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD-SHELL curl -fsS "http://127.0.0.1:${PORT:-8000}/health" || exit 1

CMD ["sh", "-c", "python -m uvicorn src.api.server:app --host 0.0.0.0 --port ${PORT:-8000}"]

