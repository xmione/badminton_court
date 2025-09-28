# Scripts/deploy.ps1
# Deploy the Django application using Docker

param(
    [switch]$Build,
    [switch]$Push,
    [string]$Registry = "",
    [string]$Tag = "latest"
)

# Build Docker images
if ($Build) {
    Write-Host "Building Docker images..."
    docker-compose build
    
    if ($Push -and $Registry) {
        Write-Host "Pushing images to registry..."
        docker-compose push
    }
}

# Stop existing containers
Write-Host "Stopping existing containers..."
docker-compose down

# Start services
Write-Host "Starting services..."
docker-compose up -d

# Run migrations
Write-Host "Running database migrations..."
docker-compose exec web python manage.py migrate

# Collect static files
Write-Host "Collecting static files..."
docker-compose exec web python manage.py collectstatic --noinput

Write-Host "Deployment completed."