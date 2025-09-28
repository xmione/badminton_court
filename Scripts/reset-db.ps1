# Scripts/reset-db.ps1
# Reset the Django database

param(
    [switch]$Force,
    [switch]$Migrate,
    [switch]$LoadSampleData
)

# Activate virtual environment if it exists
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    .\venv\Scripts\Activate.ps1
}

if (-not $Force) {
    $response = Read-Host "Are you sure you want to reset the database? This will delete all data. (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Database reset cancelled."
        exit 0
    }
}

# Remove the database file if using SQLite
if (Test-Path "db.sqlite3") {
    Remove-Item "db.sqlite3" -Force
    Write-Host "Database file removed."
}

# Remove migrations
if (Test-Path "court_management/migrations") {
    Get-ChildItem "court_management/migrations" -Exclude "__init__.py" | Remove-Item -Force
    Write-Host "Migration files removed."
}

if ($Migrate) {
    # Create migrations
    python manage.py makemigrations
    
    # Apply migrations
    python manage.py migrate
    
    if ($LoadSampleData) {
        # Load sample data if you have a fixture or management command
        # python manage.py loaddata sample_data
        Write-Host "Sample data loaded."
    }
    
    Write-Host "Database reset and migration completed."
} else {
    Write-Host "Database reset completed. Run with -Migrate to recreate the database schema."
}