#!/bin/bash
# init-mailcow.sh

# Create necessary directories
mkdir -p mailcow-data/web
mkdir -p mailcow-data/conf

# Download Mailcow configuration files
curl -L https://github.com/mailcow/mailcow-dockerized/archive/master.tar.gz | tar xz --strip-components=1 -C mailcow-data

# Generate configuration file
cd mailcow-data
./generate_config.sh

# Start Mailcow services
docker-compose -f docker-compose.yml up -d

echo "Mailcow has been initialized and started!"
echo "Access the admin interface at: http://localhost:8081"
echo "Access the webmail at: http://localhost:8080"