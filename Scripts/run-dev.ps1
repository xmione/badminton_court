# Scripts/run-dev.ps1
# Start the Django development server

param(
    [string]$host = "127.0.0.1",
    [int]$port = 8000,
    [switch]$https
)

# Activate virtual environment if it exists
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    .\venv\Scripts\Activate.ps1
}

# Build the command
 $command = "python manage.py runserver"
if ($https) {
    $command += " --settings=badminton_court.settings_https"
}

 $command += " $host`:$port"

Write-Host "Starting Django development server on $host`:$port..."
Invoke-Expression $command