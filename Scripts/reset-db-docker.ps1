# Scripts/reset-db-docker.ps1
# Reset the PostgreSQL database in Docker

param(
    [switch]$Force,
    [switch]$Migrate,
    [switch]$LoadTestData
)

Write-Host "Docker Database Reset Script" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if db container is running
$dbContainer = docker ps --filter "name=db" --format "{{.Names}}"
if (-not $dbContainer) {
    Write-Host "ERROR: Database container 'db' is not running." -ForegroundColor Red
    Write-Host "TIP: Run: npm run docker:dev-detached" -ForegroundColor Yellow
    exit 1
}

if (-not $Force) {
    Write-Host ""
    Write-Host "WARNING: This will DELETE ALL DATA in the database!" -ForegroundColor Yellow
    $response = Read-Host "Are you sure you want to reset the database? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Database reset cancelled." -ForegroundColor Gray
        exit 0
    }
}

Write-Host ""
Write-Host "Dropping existing database..." -ForegroundColor Yellow
try {
    docker exec -i db psql -U dbuser -d postgres -c "DROP DATABASE IF EXISTS badminton_court;" | Out-Null
    Write-Host "SUCCESS: Database dropped" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to drop database: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Creating fresh database..." -ForegroundColor Yellow
try {
    docker exec -i db psql -U dbuser -d postgres -c "CREATE DATABASE badminton_court OWNER dbuser;" | Out-Null
    Write-Host "SUCCESS: Database created" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to create database: $_" -ForegroundColor Red
    exit 1
}

if ($Migrate) {
    Write-Host ""
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    try {
        docker-compose --env-file .env.docker --profile dev exec -T web-dev python manage.py migrate
        Write-Host "SUCCESS: Migrations completed" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to run migrations: $_" -ForegroundColor Red
        exit 1
    }
    
    if ($LoadTestData) {
        Write-Host ""
        Write-Host "Loading test data..." -ForegroundColor Yellow
        try {
            docker-compose --env-file .env.docker --profile dev exec -T web-dev python manage.py load_test_data
            Write-Host "SUCCESS: Test data loaded" -ForegroundColor Green
        } catch {
            Write-Host "WARNING: Failed to load test data: $_" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "Database reset and migration completed!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Database reset completed!" -ForegroundColor Green
    Write-Host "TIP: Run with -Migrate flag to apply migrations" -ForegroundColor Cyan
    Write-Host "     Example: .\Scripts\reset-db-docker.ps1 -Force -Migrate -LoadTestData" -ForegroundColor Gray
}

Write-Host ""