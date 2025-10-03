#!/bin/bash
set -e

# Process the ERB template, substituting environment variables
erb /postal/config/postal/postal.yml.erb > /postal/config/postal/postal.yml

# Set correct permissions for the generated file
chmod 644 /postal/config/postal/postal.yml

# Print the final config for debugging
echo "=== Generated Postal Configuration ==="
cat /postal/config/postal/postal.yml
echo "==================================="

# Execute the command passed to the container
exec "$@"