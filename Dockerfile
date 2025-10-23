# Dockerfile for Badminton Court Management Application
# Use a slim Debian image for a good balance of size and compatibility
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DOCKER=true

WORKDIR /app

# Install system dependencies and clean up in the same layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    postgresql-client \
    build-essential \
    curl \
    ca-certificates \
    && pip install --no-cache-dir --upgrade pip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd --create-home --shell /bin/bash appuser

# Copy and install Python dependencies FIRST to leverage Docker cache
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variable to point to the system CA bundle
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt

# Copy project files AFTER dependencies are installed
COPY --chown=appuser:appuser ./badminton_court /app/badminton_court
COPY --chown=appuser:appuser manage.py /app/
COPY --chown=appuser:appuser tunnel.py /app/

# Switch to appuser
USER appuser

# Web service stage
FROM base AS web
EXPOSE 8000
# Use a direct command as the entrypoint instead of a script file
ENTRYPOINT ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Tunnel service stage
FROM base AS tunnel
CMD ["python", "tunnel.py"]