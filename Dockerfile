FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV LLM_API_KEY=""
ENV LLM_BASE_URL="https://api.deepseek.com"
ENV LLM_MODEL="deepseek-chat"
ENV OPENAI_API_KEY=""
ENV OPENAI_BASE_URL="https://api.deepseek.com"
ENV HOST="0.0.0.0"
ENV PORT="8000"

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "server.py"]
