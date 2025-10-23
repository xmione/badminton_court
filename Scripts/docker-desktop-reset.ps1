# Scripts/docker-desktop-reset.ps1
function Reset-DockerDesktop {
    param(
        [switch]$SkipRebuild
    )
    
    Write-Host "Stopping all Docker processes..." -ForegroundColor Yellow
    Get-Process "*docker*" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "Waiting for processes to fully terminate..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10

    Write-Host "Clearing Docker's content store..." -ForegroundColor Yellow
    Remove-Item -Path "$env:LOCALAPPDATA\Docker" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$env:APPDATA\Docker" -Recurse -Force -ErrorAction SilentlyContinue

    Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
    Start-Process -FilePath "C:\Program Files\Docker\Docker\Docker Desktop.exe"

    Write-Host "Waiting for Docker Desktop to fully initialize..." -ForegroundColor Yellow
    $maxWaitTime = 180  # Maximum wait time in seconds
    $elapsedTime = 0
    $dockerReady = $false

    while (-not $dockerReady -and $elapsedTime -lt $maxWaitTime) {
        try {
            docker version 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $dockerReady = $true
                Write-Host "Docker Desktop is fully initialized!" -ForegroundColor Green
            } else {
                Write-Host "Waiting for Docker Desktop to initialize... ($elapsedTime/$maxWaitTime seconds)" -ForegroundColor Yellow
                Start-Sleep -Seconds 5
                $elapsedTime += 5
            }
        } catch {
            Write-Host "Waiting for Docker Desktop to initialize... ($elapsedTime/$maxWaitTime seconds)" -ForegroundColor Yellow
            Start-Sleep -Seconds 5
            $elapsedTime += 5
        }
    }

    if ($dockerReady) {
        Write-Host "Force removing all containers including mail-test..." -ForegroundColor Yellow
        docker container rm -f $(docker container ls -aq) 2>$null
        
        # Specifically target the mail-test container if it still exists
        $mailTestContainer = docker container ls -q -f name=mail-test 2>$null
        if ($mailTestContainer) {
            Write-Host "Force removing mail-test container..." -ForegroundColor Yellow
            docker container rm -f $mailTestContainer 2>$null
        }
        
        Write-Host "Force removing all images including analogic/poste.io..." -ForegroundColor Yellow
        docker image rm -f $(docker image ls -aq) 2>$null
        
        # Specifically target the analogic/poste.io image if it still exists
        $posteImage = docker image ls -q analogic/poste.io 2>$null
        if ($posteImage) {
            Write-Host "Force removing analogic/poste.io image..." -ForegroundColor Yellow
            docker image rm -f $posteImage 2>$null
        }
        
        Write-Host "Removing all volumes..." -ForegroundColor Yellow
        docker volume rm -f $(docker volume ls -q) 2>$null
        
        Write-Host "Performing complete system cleanup..." -ForegroundColor Yellow
        docker system prune -a --volumes -f
        
        if (-not $SkipRebuild) {
            Write-Host "Building all images with no cache..." -ForegroundColor Yellow
            npm run docker:build-nocache
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Images built successfully. Now recreating dev containers..." -ForegroundColor Yellow
                npm run docker:dev-recreate
                Write-Host "Complete reset, rebuild, and restart finished!" -ForegroundColor Green
            } else {
                Write-Host "Image build failed. Please check the error messages above." -ForegroundColor Red
                Write-Host "You may need to build the images manually with: npm run docker:build-nocache" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "Docker reset completed successfully!" -ForegroundColor Green
        }
    } else {
        Write-Host "Docker Desktop failed to initialize within the expected time." -ForegroundColor Red
        Write-Host "You may need to restart Docker Desktop manually and then run the cleanup again." -ForegroundColor Red
        exit 1
    }
}

# Option 11.5: Reset only
Reset-DockerDesktop -SkipRebuild