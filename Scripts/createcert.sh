#!/bin/bash

CERT_DIR="./certs"
CERT_PEM="$CERT_DIR/cert.pem"
KEY_PEM="$CERT_DIR/key.pem"

# Check if certs already exist
if [[ -f "$CERT_PEM" && -f "$KEY_PEM" ]]; then
    echo "🔐 Certificates already exist. Skipping generation."
    exit 0
fi

mkdir -p "$CERT_DIR"

echo "🔐 Generating self-signed cert for localhost..."

openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "$KEY_PEM" \
  -out "$CERT_PEM" \
  -days 365 \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

if [[ $? -eq 0 ]]; then
    echo "✅ Self-signed certificate generated:"
    echo "   - $CERT_PEM"
    echo "   - $KEY_PEM"
else
    echo "❌ Failed to generate certificate"
    exit 1
fi
