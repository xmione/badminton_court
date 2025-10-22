function Test-EnvFile {
    $envFile = ".env.docker"
    Write-Host "Checking environment file..." -ForegroundColor Yellow
    
    if (-not (Test-Path $envFile)) {
        Write-Host "ERROR: .env.docker file not found in current directory!" -ForegroundColor Red
        Write-Host "Current directory: $(Get-Location)" -ForegroundColor Red
        return $false
    }
    
    try {
        $content = Get-Content $envFile -ErrorAction Stop | Select-Object -First 5
        Write-Host ".env.docker file found. First 5 lines:" -ForegroundColor Green
        $content | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        return $true
    }
    catch {
        Write-Host "ERROR: Cannot read .env.docker file: $_" -ForegroundColor Red
        return $false
    }
}

do {
    Clear-Host
    Write-Host "Docker Management Menu" -ForegroundColor Green
    Write-Host "========================" -ForegroundColor Green
    Write-Host "1. Complete restart (with build and setup)"
    Write-Host "2. Restart without rebuilding"
    Write-Host "3. Restart without setup"
    Write-Host "4. Minimal restart"
    Write-Host "5. Just kill Docker processes"
    Write-Host "6. Just start Docker Desktop"
    Write-Host "7. Reset containers (keep images)"
    Write-Host "8. Reset containers and images"
    Write-Host "9. Continue from error (dev services only)"
    Write-Host "10. Exit"
    Write-Host ""

    $choice = Read-Host "Select an option (1-10)"

    switch ($choice) {
        "1" { 
            & "$PSScriptRoot\docker-restart.ps1"
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "2" { 
            & "$PSScriptRoot\docker-restart.ps1" -SkipBuild
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "3" { 
            & "$PSScriptRoot\docker-restart.ps1" -SkipSetup
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "4" { 
            & "$PSScriptRoot\docker-restart.ps1" -SkipBuild -SkipSetup
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "5" { 
            & "$PSScriptRoot\docker-restart.ps1" -OnlyKill
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "6" { 
            & "$PSScriptRoot\docker-restart.ps1" -OnlyStart
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "7" { 
            npm run docker:reset-keep-images
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "8" { 
            npm run docker:reset
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "9" { 
            if (Test-EnvFile) {
                Write-Host "Continuing from error (dev services only)..." -ForegroundColor Yellow
                npm run docker:continue
            } else {
                Write-Host "Please fix the .env.docker file issue first." -ForegroundColor Red
            }
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10" { 
            Write-Host "Exiting..." -ForegroundColor Green
            exit
        }
        default { 
            Write-Host "Invalid option. Press Enter to continue..." -ForegroundColor Red
            Read-Host
        }
    }
} while ($choice -ne "10")