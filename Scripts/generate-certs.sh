#!/bin/bash

# =============================================================================
# Certificate Generation Script for Development Environment
# =============================================================================
# This script creates self-signed certificates for local development.
# It will delete any existing certificates before generating new ones.
# =============================================================================

CERT_DIR="certs"
CERT_NAME="posteio"
CERT_SUBJECT="/CN=mail-test"

echo "--- Starting Certificate Generation ---"

# Step 1: Create certs directory if it doesn't exist
echo "=> Checking for certificate directory: $CERT_DIR"
mkdir -p $CERT_DIR
echo "   Directory ensured."

# Step 2: Delete any existing certificates
echo "=> Removing any existing certificates..."
rm -f $CERT_DIR/$CERT_NAME-cert.pem
rm -f $CERT_DIR/$CERT_NAME-key.pem
rm -f $CERT_DIR/ca.pem
echo "   Cleanup complete."

# Step 3: Generate the certificate and key
echo "=> Generating new self-signed certificate and private key..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/$CERT_NAME-key.pem" \
    -out "$CERT_DIR/$CERT_NAME-cert.pem" \
    -subj "$CERT_SUBJECT"
echo "   OpenSSL command executed."

# Step 4: Create a CA certificate file for the client to trust
echo "=> Creating CA certificate file for client trust..."
cp "$CERT_DIR/$CERT_NAME-cert.pem" "$CERT_DIR/ca.pem"
echo "   CA certificate created at $CERT_DIR/ca.pem"

echo "--- Certificate Generation Complete ---"
echo "   Server Cert: $CERT_DIR/$CERT_NAME-cert.pem"
echo "   Server Key:  $CERT_DIR/$CERT_NAME-key.pem"
echo "   Client CA:   $CERT_DIR/ca.pem"