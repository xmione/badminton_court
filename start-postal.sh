#!/bin/bash

# Print environment variables for debugging
echo "=== Environment Variables ==="
echo "POSTAL_DB_HOST: '${POSTAL_DB_HOST}'"
echo "POSTAL_DB_PORT: '${POSTAL_DB_PORT}'"
echo "POSTAL_DB_USER: '${POSTAL_DB_USER}'"
echo "POSTAL_DB_PASS: '${POSTAL_DB_PASS:0:5}...'"
echo "POSTAL_DB_NAME: '${POSTAL_DB_NAME}'"
echo "RAILS_SECRET_KEY: '${RAILS_SECRET_KEY:0:10}...'"
echo "==========================="

# Wait for MariaDB to be ready
echo "Waiting for MariaDB to be ready..."
until mysqladmin ping -h"$POSTAL_DB_HOST" -P"$POSTAL_DB_PORT" --silent; do
    echo "Waiting for MariaDB to be ready..."
    sleep 3
done

# Test connection to the database
echo "Testing database connection..."
until mysql -h"$POSTAL_DB_HOST" -P"$POSTAL_DB_PORT" -u"$POSTAL_DB_USER" -p"$POSTAL_DB_PASS" "$POSTAL_DB_NAME" -e 'SELECT 1;' > /dev/null 2>&1; do
    echo "Waiting for database connection..."
    sleep 3
done

echo "Database connection successful!"

# Initialize Postal
echo "Initializing Postal..."
bundle exec rake postal:update

# Initialize Postal
echo "Running postal initialize..."
bundle exec bin/postal initialize

# Skip asset precompilation for development and set Rails to compile on the fly
export RAILS_SERVE_STATIC_FILES=true
export RAILS_ENV=development

# Create admin user if not already created
ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@aeropace.com"}
ADMIN_FIRST_NAME=${ADMIN_FIRST_NAME:-"Admin"}
ADMIN_LAST_NAME=${ADMIN_LAST_NAME:-"User"}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"StrongPassword123!"}

echo "Checking if admin user exists..."
# Check if admin user already exists
USER_EXISTS=$(mysql -h"$POSTAL_DB_HOST" -P"$POSTAL_DB_PORT" -u"$POSTAL_DB_USER" -p"$POSTAL_DB_PASS" "$POSTAL_DB_NAME" -e "SELECT COUNT(*) FROM users WHERE email = '$ADMIN_EMAIL';" -s -N 2>/dev/null || echo "0")

if [ "$USER_EXISTS" = "0" ]; then
    echo "Creating admin user..."
    # Create the admin user non-interactively
    printf "$ADMIN_EMAIL\n$ADMIN_FIRST_NAME\n$ADMIN_LAST_NAME\n$ADMIN_PASSWORD\n" | postal make-user
    echo "Admin user created successfully!"
else
    echo "Admin user already exists."
fi

# Start the services
echo "Starting Postal services..."
bundle exec bin/postal web-server --config=/postal/config/postal/postal.yml &
WEB_SERVER_PID=$!

bundle exec bin/postal smtp-server --config=/postal/config/postal/postal.yml &
SMTP_SERVER_PID=$!

# Wait a moment for services to start
sleep 5

# Check if services are running
if kill -0 $WEB_SERVER_PID 2>/dev/null; then
    echo "Web server is running (PID: $WEB_SERVER_PID)"
else
    echo "Web server failed to start"
fi

if kill -0 $SMTP_SERVER_PID 2>/dev/null; then
    echo "SMTP server is running (PID: $SMTP_SERVER_PID)"
else
    echo "SMTP server failed to start"
fi

# Keep the container running and wait for services
echo "Postal is running. Access it at http://$POSTAL_HOST:$POSTAL_PORT"
echo "Press Ctrl+C to stop."
wait