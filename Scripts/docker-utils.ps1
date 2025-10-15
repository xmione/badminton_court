# Scripts/docker-utils.ps1

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("status", "shell", "backup", "restore", "prune")]
    [string]$Action,
    
    [string]$Service,
    [string]$ImageName
)

switch ($Action) {
    "status" {
        Write-Host "Docker Status:" -ForegroundColor Cyan
        docker-compose ps
        docker system df
    }
    
    "shell" {
        if (-not $Service) {
            Write-Host "Please specify a service name" -ForegroundColor Red
            exit 1
        }
        Write-Host "Opening shell in $Service..." -ForegroundColor Green
        docker-compose exec $Service /bin/bash
    }
    
    "backup-images" {
        Write-Host "Backing up Docker images..." -ForegroundColor Yellow
        if (-not (Test-Path './backups')) {
            New-Item -ItemType Directory -Path './backups' | Out-Null
        }
        
        $images = docker images --format "table {{.Repository}}:{{.Tag}}" | Select-Object -Skip 1
        foreach ($image in $images) {
            if ($image -like "badminton_court*") {
                $filename = $image -replace "[:/]", "_"
                Write-Host "Backing up $image..." -ForegroundColor Green
                docker save -o "./backups/$filename.tar" $image
            }
        }
        Write-Host "Backup complete!" -ForegroundColor Green
    }
    
    "restore-images" {
        if (-not $ImageName) {
            Write-Host "Please specify an image name to restore" -ForegroundColor Red
            exit 1
        }
        
        $backupFile = "./backups/$ImageName.tar"
        if (Test-Path $backupFile) {
            Write-Host "Restoring $ImageName..." -ForegroundColor Green
            docker load -i $backupFile
            Write-Host "Restore complete!" -ForegroundColor Green
        } else {
            Write-Host "Backup file not found: $backupFile" -ForegroundColor Red
        }
    }
    
    "prune" {
        Write-Host "Pruning Docker resources..." -ForegroundColor Yellow
        docker system prune -f
        Write-Host "Prune complete!" -ForegroundColor Green
    }
}