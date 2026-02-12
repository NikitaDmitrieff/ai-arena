FROM python:3.13-slim

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install arena-core first for better caching
COPY packages/arena-core /app/packages/arena-core
RUN pip install --no-cache-dir -e /app/packages/arena-core

# Copy requirements and install remaining dependencies
COPY services/codenames/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY services/codenames/src/ ./src/
COPY services/codenames/api/ ./api/
COPY services/codenames/words.txt .
COPY services/codenames/simulation_config.json .
COPY services/codenames/run_api.py .

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8002/ || exit 1

# Run the application
CMD ["uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8002"]

