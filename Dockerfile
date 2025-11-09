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

# Create a script to handle certificate setup at runtime
RUN echo '#!/bin/bash\n\
if [ -f /certs/ca.pem ]; then\n\
    cp /certs/ca.pem /usr/local/share/ca-certificates/ca-posteio.crt\n\
    update-ca-certificates\n\
fi\n\
# Fix ownership after volume mount\n\
chown -R appuser:appuser /app\n\
exec "$@"' > /usr/local/bin/setup-certs.sh && \
    chmod +x /usr/local/bin/setup-certs.sh

# Switch to appuser
USER appuser

# Web service stage
FROM base AS web
EXPOSE 8000
# Use the setup script before starting the server
ENTRYPOINT ["/usr/local/bin/setup-certs.sh"]
CMD ["python manage.py runserver 0.0.0.0:8000"]

# Tunnel service stage
FROM base AS tunnel
ENTRYPOINT ["/usr/local/bin/setup-certs.sh"]
CMD ["python", "tunnel.py"]