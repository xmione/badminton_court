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
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"Admin123!"}
ADMIN_FIRST_NAME=${ADMIN_FIRST_NAME:-"Admin"}
ADMIN_LAST_NAME=${ADMIN_LAST_NAME:-"User"}

echo "Checking if admin user exists..."
# Check if admin user already exists
USER_EXISTS=$(mysql -h"$POSTAL_DB_HOST" -P"$POSTAL_DB_PORT" -u"$POSTAL_DB_USER" -p"$POSTAL_DB_PASS" "$POSTAL_DB_NAME" -e "SELECT COUNT(*) FROM users WHERE email = '$ADMIN_EMAIL';" -s -N 2>/dev/null || echo "0")

echo "User exists check result: $USER_EXISTS"

if [ "$USER_EXISTS" = "0" ]; then
    echo "Creating admin user..."
    # Create the admin user non-interactively and capture the output
    USER_CREATION_RESULT=$(printf "$ADMIN_EMAIL\n$ADMIN_FIRST_NAME\n$ADMIN_LAST_NAME\n$ADMIN_PASSWORD\n" | postal make-user 2>&1)
    echo "$USER_CREATION_RESULT"
    
    # Check if the user was actually created despite the error message
    USER_EXISTS_AFTER=$(mysql -h"$POSTAL_DB_HOST" -P"$POSTAL_DB_PORT" -u"$POSTAL_DB_USER" -p"$POSTAL_DB_PASS" "$POSTAL_DB_NAME" -e "SELECT COUNT(*) FROM users WHERE email = '$ADMIN_EMAIL';" -s -N 2>/dev/null || echo "0")
    
    if [ "$USER_EXISTS_AFTER" = "1" ]; then
        echo "Admin user created successfully!"
    else
        echo "Admin user creation failed."
    fi
else
    echo "Admin user already exists."
fi

# Create noreply user if not already created
NOREPLY_EMAIL=${NOREPLY_EMAIL:-"noreply@aeropace.com"}
NOREPLY_PASSWORD=${NOREPLY_PASSWORD:-"Noreply123!"}
NOREPLY_FIRST_NAME=${NOREPLY_FIRST_NAME:-"No-Reply"}
NOREPLY_LAST_NAME=${NOREPLY_LAST_NAME:-"System"}

echo "Checking if noreply user exists..."
# Check if noreply user already exists
NOREPLY_USER_EXISTS=$(mysql -h"$POSTAL_DB_HOST" -P"$POSTAL_DB_PORT" -u"$POSTAL_DB_USER" -p"$POSTAL_DB_PASS" "$POSTAL_DB_NAME" -e "SELECT COUNT(*) FROM users WHERE email = '$NOREPLY_EMAIL';" -s -N 2>/dev/null || echo "0")

echo "Noreply user exists check result: $NOREPLY_USER_EXISTS"

if [ "$NOREPLY_USER_EXISTS" = "0" ]; then
    echo "Creating noreply user..."
    # Create the noreply user non-interactively and capture the output
    NOREPLY_USER_CREATION_RESULT=$(printf "$NOREPLY_EMAIL\n$NOREPLY_FIRST_NAME\n$NOREPLY_LAST_NAME\n$NOREPLY_PASSWORD\n" | postal make-user 2>&1)
    echo "$NOREPLY_USER_CREATION_RESULT"
    
    # Check if the user was actually created despite the error message
    NOREPLY_USER_EXISTS_AFTER=$(mysql -h"$POSTAL_DB_HOST" -P"$POSTAL_DB_PORT" -u"$POSTAL_DB_USER" -p"$POSTAL_DB_PASS" "$POSTAL_DB_NAME" -e "SELECT COUNT(*) FROM users WHERE email = '$NOREPLY_EMAIL';" -s -N 2>/dev/null || echo "0")
    
    if [ "$NOREPLY_USER_EXISTS_AFTER" = "1" ]; then
        echo "Noreply user created successfully!"
    else
        echo "Noreply user creation failed."
    fi
else
    echo "Noreply user already exists."
fi

# Create test user if not already created
TEST_USER_EMAIL=${TEST_USER_EMAIL:-"user@aeropace.com"}
TEST_USER_PASSWORD=${TEST_USER_PASSWORD:-"User123!"}
TEST_USER_FIRST_NAME=${TEST_USER_FIRST_NAME:-"Test"}
TEST_USER_LAST_NAME=${TEST_USER_LAST_NAME:-"User"}

echo "Checking if test user exists..."
# Check if test user already exists
TEST_USER_EXISTS=$(mysql -h"$POSTAL_DB_HOST" -P"$POSTAL_DB_PORT" -u"$POSTAL_DB_USER" -p"$POSTAL_DB_PASS" "$POSTAL_DB_NAME" -e "SELECT COUNT(*) FROM users WHERE email = '$TEST_USER_EMAIL';" -s -N 2>/dev/null || echo "0")

echo "Test user exists check result: $TEST_USER_EXISTS"

if [ "$TEST_USER_EXISTS" = "0" ]; then
    echo "Creating test user..."
    # Create the test user non-interactively and capture the output
    TEST_USER_CREATION_RESULT=$(printf "$TEST_USER_EMAIL\n$TEST_USER_FIRST_NAME\n$TEST_USER_LAST_NAME\n$TEST_USER_PASSWORD\n" | postal make-user 2>&1)
    echo "$TEST_USER_CREATION_RESULT"
    
    # Check if the user was actually created despite the error message
    TEST_USER_EXISTS_AFTER=$(mysql -h"$POSTAL_DB_HOST" -P"$POSTAL_DB_PORT" -u"$POSTAL_DB_USER" -p"$POSTAL_DB_PASS" "$POSTAL_DB_NAME" -e "SELECT COUNT(*) FROM users WHERE email = '$TEST_USER_EMAIL';" -s -N 2>/dev/null || echo "0")
    
    if [ "$TEST_USER_EXISTS_AFTER" = "1" ]; then
        echo "Test user created successfully!"
    else
        echo "Test user creation failed."
    fi
else
    echo "Test user already exists."
fi

# Create support user if not already created
SUPPORT_EMAIL=${SUPPORT_EMAIL:-"support@aeropace.com"}
SUPPORT_PASSWORD=${SUPPORT_PASSWORD:-"Support123!"}
SUPPORT_FIRST_NAME=${SUPPORT_FIRST_NAME:-"Support"}
SUPPORT_LAST_NAME=${SUPPORT_LAST_NAME:-"Team"}

echo "Checking if support user exists..."
# Check if support user already exists
SUPPORT_USER_EXISTS=$(mysql -h"$POSTAL_DB_HOST" -P"$POSTAL_DB_PORT" -u"$POSTAL_DB_USER" -p"$POSTAL_DB_PASS" "$POSTAL_DB_NAME" -e "SELECT COUNT(*) FROM users WHERE email = '$SUPPORT_EMAIL';" -s -N 2>/dev/null || echo "0")

echo "Support user exists check result: $SUPPORT_USER_EXISTS"

if [ "$SUPPORT_USER_EXISTS" = "0" ]; then
    echo "Creating support user..."
    # Create the support user non-interactively and capture the output
    SUPPORT_USER_CREATION_RESULT=$(printf "$SUPPORT_EMAIL\n$SUPPORT_FIRST_NAME\n$SUPPORT_LAST_NAME\n$SUPPORT_PASSWORD\n" | postal make-user 2>&1)
    echo "$SUPPORT_USER_CREATION_RESULT"
    
    # Check if the user was actually created despite the error message
    SUPPORT_USER_EXISTS_AFTER=$(mysql -h"$POSTAL_DB_HOST" -P"$POSTAL_DB_PORT" -u"$POSTAL_DB_USER" -p"$POSTAL_DB_PASS" "$POSTAL_DB_NAME" -e "SELECT COUNT(*) FROM users WHERE email = '$SUPPORT_EMAIL';" -s -N 2>/dev/null || echo "0")
    
    if [ "$SUPPORT_USER_EXISTS_AFTER" = "1" ]; then
        echo "Support user created successfully!"
    else
        echo "Support user creation failed."
    fi
else
    echo "Support user already exists."
fi

# Create organization if not already created
ORGANIZATION_NAME=${ORGANIZATION_NAME:-"Aeropace"}
ORGANIZATION_SHORTNAME=${ORGANIZATION_SHORTNAME:-"aeropace"}

echo "Checking if organization exists..."
# Check if organization already exists
ORG_EXISTS=$(mysql -h"$POSTAL_DB_HOST" -P"$POSTAL_DB_PORT" -u"$POSTAL_DB_USER" -p"$POSTAL_DB_PASS" "$POSTAL_DB_NAME" -e "SELECT COUNT(*) FROM organizations WHERE shortname = '$ORGANIZATION_SHORTNAME';" -s -N 2>/dev/null || echo "0")

echo "Organization exists check result: $ORG_EXISTS"

if [ "$ORG_EXISTS" = "0" ]; then
    echo "Creating organization..."
    # Create the organization using Postal CLI
    ORG_CREATION_RESULT=$(printf "$ORGANIZATION_NAME\n$ORGANIZATION_SHORTNAME\n" | postal make-organization 2>&1)
    echo "$ORG_CREATION_RESULT"
    
    # Check if the organization was created
    ORG_EXISTS_AFTER=$(mysql -h"$POSTAL_DB_HOST" -P"$POSTAL_DB_PORT" -u"$POSTAL_DB_USER" -p"$POSTAL_DB_PASS" "$POSTAL_DB_NAME" -e "SELECT COUNT(*) FROM organizations WHERE shortname = '$ORGANIZATION_SHORTNAME';" -s -N 2>/dev/null || echo "0")
    
    if [ "$ORG_EXISTS_AFTER" = "1" ]; then
        echo "Organization created successfully!"
        
        # Add the admin user to the organization
        echo "Adding admin user to organization..."
        ADD_USER_RESULT=$(postal add-user-to-organization $ADMIN_EMAIL $ORGANIZATION_SHORTNAME 2>&1)
        echo "$ADD_USER_RESULT"
    else
        echo "Organization creation failed."
    fi
else
    echo "Organization already exists."
    
    # Even if organization exists, ensure admin user is added to it
    echo "Ensuring admin user is added to organization..."
    ADD_USER_RESULT=$(postal add-user-to-organization $ADMIN_EMAIL $ORGANIZATION_SHORTNAME 2>&1)
    echo "$ADD_USER_RESULT"
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