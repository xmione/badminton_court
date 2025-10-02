#!/bin/bash

# Wait for MariaDB to be ready
until mysqladmin ping -h $DB_HOST -P $DB_PORT --silent; do
  echo "Waiting for MariaDB to be ready..."
  sleep 3
done

# Test connection to the database
until mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME -e 'SELECT 1;' > /dev/null 2>&1; do
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

# Create admin user if not already created
ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@aeropace.com"}
ADMIN_FIRST_NAME=${ADMIN_FIRST_NAME:-"Admin"}
ADMIN_LAST_NAME=${ADMIN_LAST_NAME:-"User"}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"Admin123!"}

echo "Checking if admin user exists..."
# Check if admin user already exists
USER_EXISTS=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME -e "SELECT COUNT(*) FROM users WHERE email = '$ADMIN_EMAIL';" -s -N 2>/dev/null || echo "0")

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
echo "Postal is running. Press Ctrl+C to stop."
wait