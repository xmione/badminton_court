# scripts\reset-mailcow.ps1
param(
    [switch]$Force
)

Write-Host "Resetting Mailcow configuration..." -ForegroundColor Yellow

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

# Stop and remove all Mailcow containers
Write-Host "Stopping Mailcow services..." -ForegroundColor Cyan
docker-compose --env-file .env.docker --profile mailcow down -v --rmi all 2>$null

# Remove Mailcow-specific volumes (be careful!)
$mailcowVolumes = @(
    "mysql-vol-1", "redis-vol-1", "rspamd-vol-1", "postfix-vol-1",
    "vmail-vol-1", "vmail-index-vol-1", "crypt-vol-1", "sogo-web-vol-1",
    "sogo-userdata-backup-vol-1", "clamd-db-vol-1", "postfix-tlspol-vol-1"
)

foreach ($vol in $mailcowVolumes) {
    docker volume rm $vol 2>$null | Out-Null
    Write-Host "Removed volume: $vol" -ForegroundColor Green
}

# Clean up networks
docker network prune -f 2>$null | Out-Null

# Reset Mailcow data directories
$mailcowData = Join-Path $projectRoot "mailcow\data"
if (Test-Path $mailcowData) {
    Write-Host "Clearing Mailcow data directory..." -ForegroundColor Yellow
    Remove-Item "$mailcowData\*" -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $mailcowData | Out-Null
}

Write-Host "Mailcow reset complete! Run 'npm run mailcow:setup' to reinitialize." -ForegroundColor Green