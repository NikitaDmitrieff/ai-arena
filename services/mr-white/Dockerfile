FROM python:3.13-slim

WORKDIR /app

# Install curl for health checks and git for dependency installation
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy and install arena-core first for better caching
COPY packages/arena-core /app/packages/arena-core
RUN pip install --no-cache-dir -e /app/packages/arena-core

# Copy dependency files first for better caching
COPY services/mr-white/pyproject.toml .
COPY services/mr-white/uv.lock* ./

# Install dependencies using pip
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# Copy application code
COPY services/mr-white/src/ ./src/
COPY services/mr-white/api/ ./api/
COPY services/mr-white/main.py .

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8001/api/v1/health || exit 1

# Run the application
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8001"]

