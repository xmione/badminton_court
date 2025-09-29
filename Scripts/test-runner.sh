#!/bin/bash

# Exit on error
set -e

echo "Starting test environment..."

# Start the database and Redis
docker-compose up -d db redis

# Wait for database to be ready
echo "Waiting for database to be ready..."
until docker-compose exec -T db pg_isready -U postgres; do
  echo "Waiting for postgres..."
  sleep 2
done

# Run migrations
echo "Running migrations..."
docker-compose exec -T web python manage.py migrate

# Start the web application
docker-compose up -d web

# Wait for web application to be ready
echo "Waiting for web application to be ready..."
until docker-compose exec -T web python manage.py check --deploy; do
  echo "Waiting for web application..."
  sleep 2
done

# Load test data
echo "Loading test data..."
docker-compose --profile test run --rm test-setup

# Start Celery workers
docker-compose up -d celery celery-beat

# Run Cypress tests
echo "Running Cypress tests..."
docker-compose --profile test run --rm cypress

# Capture the exit code
TEST_EXIT_CODE=$?

# Stop all services
echo "Stopping services..."
docker-compose down

# Exit with the test exit code
exit $TEST_EXIT_CODE