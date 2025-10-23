# Scripts/wait-docker.ps1
param(
    [int]$Timeout = 180
)

 $elapsedTime = 0
 $dockerReady = $false

Write-Host "Waiting for Docker Desktop to fully initialize..." -ForegroundColor Yellow

while (-not $dockerReady -and $elapsedTime -lt $Timeout) {
    try {
        docker version 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $dockerReady = $true
            Write-Host "Docker Desktop is fully initialized!" -ForegroundColor Green
        } else {
            Write-Host "Waiting for Docker Desktop to initialize... ($elapsedTime/$Timeout seconds)" -ForegroundColor Yellow
            Start-Sleep -Seconds 5
            $elapsedTime += 5
        }
    } catch {
        Write-Host "Waiting for Docker Desktop to initialize... ($elapsedTime/$Timeout seconds)" -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        $elapsedTime += 5
    }
}

if (-not $dockerReady) {
    Write-Host "Docker Desktop failed to initialize within the expected time." -ForegroundColor Red
    exit 1
}