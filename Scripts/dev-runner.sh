#!/bin/bash

echo "🚀 Starting development environment..."

# Start all services except Cypress
docker-compose up -d db redis web celery celery-beat

# Run migrations
echo "🔄 Running migrations..."
docker-compose exec -T web python manage.py migrate

# Get domain from environment or use default
POSTE_DOMAIN=$(grep "^POSTE_DOMAIN=" .env.docker | cut -d '=' -f2)
if [ -z "$POSTE_DOMAIN" ]; then
    return
fi

# Create superuser if it doesn't exist
echo "👤 Creating superuser if needed..."
docker-compose exec -T web python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@$POSTE_DOMAIN')
    print('Superuser created with email admin@$POSTE_DOMAIN')
else:
    print('Superuser already exists')
"

# Load test data for development
echo "📊 Loading test data..."
docker-compose exec -T web python manage.py load_test_data

# Keep the script running
echo "✅ Services started. Press Ctrl+C to stop."
echo "🌐 Application available at: http://localhost:8000"
echo "🔐 Admin login: admin/password"
echo "📧 Admin email: admin@$POSTE_DOMAIN"
docker-compose logs -f