# Scripts/docker-reset.ps1

param(
    [switch]$KeepImages,
    [switch]$Force,
    [switch]$Aggressive
)

Write-Host "Resetting Docker environment..." -ForegroundColor Cyan

# Stop all running containers
Write-Host "Stopping all containers..." -ForegroundColor Yellow
docker stop $(docker ps -aq) 2>$null

# Remove all containers
Write-Host "Removing all containers..." -ForegroundColor Yellow
docker rm $(docker ps -aq) 2>$null

# Remove all volumes (unless KeepImages is specified)
if (-not $KeepImages) {
    Write-Host "Removing all volumes..." -ForegroundColor Yellow
    docker volume rm $(docker volume ls -q) 2>$null
}

# Remove all networks
Write-Host "Removing all networks..." -ForegroundColor Yellow
docker network prune -f

# Remove all images (unless KeepImages is specified)
if (-not $KeepImages) {
    Write-Host "Removing all images..." -ForegroundColor Yellow
    docker rmi $(docker images -q) 2>$null
}

# Prune everything
Write-Host "Pruning Docker system..." -ForegroundColor Yellow
if ($KeepImages) {
    docker system prune -f
} else {
    docker system prune -a --volumes -f
}

# Aggressive cleanup option
if ($Aggressive) {
    Write-Host "Performing aggressive cleanup..." -ForegroundColor Yellow
    Write-Host "This will completely reset Docker Desktop and reclaim all space." -ForegroundColor Yellow
    Write-Host "All volumes will be deleted, but images will be preserved." -ForegroundColor Yellow
    
    if (-not $Force) {
        $confirmation = Read-Host "Are you sure you want to continue? (y/n)"
        if ($confirmation -ne 'y') {
            Write-Host "Aggressive cleanup cancelled." -ForegroundColor Red
            exit 0
        }
    }
    
    Write-Host "Shutting down Docker Desktop..." -ForegroundColor Yellow
    Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
    
    Write-Host "Shutting down WSL..." -ForegroundColor Yellow
    wsl --shutdown
    
    Write-Host "Unregistering Docker WSL distributions..." -ForegroundColor Yellow
    wsl --unregister docker-desktop
    wsl --unregister docker-desktop-data
    
    Write-Host "Removing Docker VHDX file..." -ForegroundColor Yellow
    Remove-Item "$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx" -Force -ErrorAction SilentlyContinue
    
    Write-Host "Docker Desktop will need to be restarted manually." -ForegroundColor Green
    Write-Host "All volumes have been deleted, but your images will be preserved." -ForegroundColor Green
}

Write-Host "Docker environment reset complete!" -ForegroundColor Green