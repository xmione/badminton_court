#!/bin/bash

# Start all services except Cypress
docker-compose up -d db redis web celery celery-beat

# Run migrations
echo "Running migrations..."
docker-compose exec -T web python manage.py migrate

# Create superuser if it doesn't exist
echo "Creating superuser if needed..."
docker-compose exec -T web python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'password')
    print('Superuser created')
else:
    print('Superuser already exists')
"

# Load test data for development
echo "Loading test data..."
docker-compose exec -T web python manage.py load_test_data

# Keep the script running
echo "Services started. Press Ctrl+C to stop."
docker-compose logs -f