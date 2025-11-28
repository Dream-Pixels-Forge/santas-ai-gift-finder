# Multi-stage Dockerfile for Santa's AI Gift Finder Backend
# Stage 1: Base image with security updates
FROM python:3.9-slim AS base

# Install security updates and essential packages
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        curl \
        && rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Stage 2: Dependencies and models
FROM base AS dependencies

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download spaCy and NLTK models
RUN python -m spacy download en_core_web_sm && \
    python -m nltk.downloader punkt stopwords wordnet

# Stage 3: Production image
FROM base AS production

# Copy installed dependencies from dependencies stage
COPY --from=dependencies /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Copy spaCy and NLTK data
COPY --from=dependencies /usr/local/lib/python3.9/site-packages/en_core_web_sm /usr/local/lib/python3.9/site-packages/en_core_web_sm
COPY --from=dependencies /root/nltk_data /root/nltk_data

# Copy application code
COPY --chown=appuser:appuser . .

# Create necessary directories
RUN mkdir -p /app/instance /app/logs && \
    chown -R appuser:appuser /app

# Create NLTK data directory and set permissions
RUN mkdir -p /app/nltk_data && \
    chown -R appuser:appuser /app/nltk_data

# Switch to non-root user
USER appuser

# Set environment variables
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PATH="/usr/local/bin:$PATH"
ENV NLTK_DATA=/app/nltk_data

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start application with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--threads", "2", "--timeout", "120", "app:app"]