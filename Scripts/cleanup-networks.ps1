# Create scripts/cleanup-networks.ps1
Write-Host "Cleaning up Docker networks..." -ForegroundColor Yellow

# Get all networks
 $networks = docker network ls --format "{{.Name}}"

# Remove networks with conflicts
foreach ($network in $networks) {
    if ($network -like "*mailcow*" -or $network -like "*badminton*") {
        Write-Host "Removing network: $network" -ForegroundColor Yellow
        docker network rm $network 2>$null
    }
}

Write-Host "Network cleanup complete." -ForegroundColor Green