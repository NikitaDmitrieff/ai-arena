FROM python:3.13-slim

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY api/ ./api/
COPY words.txt .
COPY simulation_config.json .
COPY run_api.py .

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8002/ || exit 1

# Run the application
CMD ["uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8002"]

