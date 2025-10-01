#!/bin/bash
set -e

# Process the ERB template, substituting environment variables
erb /postal/config/postal/postal.yml.erb > /postal/config/postal/postal.yml

# Set correct permissions for the generated file
chmod 644 /postal/config/postal/postal.yml

# Optionally, you can print the final config for debugging:
cat /postal/config/postal/postal.yml

# Execute the command passed to the container
exec "$@"
