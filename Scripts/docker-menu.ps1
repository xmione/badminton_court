# Docker Management Menu Script
# Scripts/docker-menu.ps1
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
    Write-Host ""
    Write-Host "1. DEVELOPMENT ENVIRONMENT" -ForegroundColor Cyan
    Write-Host "   1.1. Start development environment" -ForegroundColor White
    Write-Host "   1.2. Start development environment (detached)" -ForegroundColor White
    Write-Host "   1.3. Stop development services" -ForegroundColor White
    Write-Host "   1.4. Show development logs" -ForegroundColor White
    Write-Host "   1.5. Restart web-dev container" -ForegroundColor White
    Write-Host "   1.6. Start dev environment with certificates" -ForegroundColor White
    Write-Host "   1.7. Reset and start dev environment" -ForegroundColor White
    Write-Host ""
    Write-Host "2. TESTING ENVIRONMENT" -ForegroundColor Cyan
    Write-Host "   2.1. Start test environment" -ForegroundColor White
    Write-Host "   2.2. Start test environment (detached)" -ForegroundColor White
    Write-Host "   2.3. Stop test services" -ForegroundColor White
    Write-Host "   2.4. Show test logs" -ForegroundColor White
    Write-Host "   2.5. Setup test data" -ForegroundColor White
    Write-Host ""
    Write-Host "3. CYPRESS TESTING" -ForegroundColor Cyan
    Write-Host "   3.1. Start Cypress container" -ForegroundColor White
    Write-Host "   3.2. Open Cypress in existing container" -ForegroundColor White
    Write-Host "   3.3. Run Cypress tests in existing container" -ForegroundColor White
    Write-Host "   3.4. Stop Cypress container" -ForegroundColor White
    Write-Host "   3.5. Run Cypress tests (headed) in new container" -ForegroundColor White
    Write-Host "   3.6. Run Cypress tests (headless) in new container" -ForegroundColor White
    Write-Host "   3.7. Run connectivity tests (headless)" -ForegroundColor White
    Write-Host ""
    Write-Host "4. PRESENTATION ENVIRONMENT" -ForegroundColor Cyan
    Write-Host "   4.1. Select and run Cypress test for presentation" -ForegroundColor White
    Write-Host "   4.2. Post-process videos in Docker" -ForegroundColor White
    Write-Host "   4.3. Run Cypress tests for presentation spec" -ForegroundColor White
    Write-Host ""
    Write-Host "5. TUNNEL MANAGEMENT" -ForegroundColor Cyan
    Write-Host "   5.1. Build tunnel service" -ForegroundColor White
    Write-Host "   5.2. Build tunnel service (no cache)" -ForegroundColor White
    Write-Host "   5.3. Start docker tunnel" -ForegroundColor White
    Write-Host "   5.4. Start docker tunnel (detached)" -ForegroundColor White
    Write-Host "   5.5. Stop docker tunnel" -ForegroundColor White
    Write-Host "   5.6. Show tunnel logs" -ForegroundColor White
    Write-Host ""
    Write-Host "6. DATABASE MANAGEMENT" -ForegroundColor Cyan
    Write-Host "   6.1. Run database migrations in dev container" -ForegroundColor White
    Write-Host "   6.2. Reset database" -ForegroundColor White
    Write-Host "   6.3. Reset database with migrations" -ForegroundColor White
    Write-Host "   6.4. Full database reset with test data" -ForegroundColor White
    Write-Host ""
    Write-Host "7. IMAGE MANAGEMENT" -ForegroundColor Cyan
    Write-Host "   7.1. Build all service images" -ForegroundColor White
    Write-Host "   7.2. Build all service images (no cache)" -ForegroundColor White
    Write-Host "   7.3. Build dev service images" -ForegroundColor White
    Write-Host "   7.4. Build dev service images (no cache)" -ForegroundColor White
    Write-Host "   7.5. Build Cypress service image" -ForegroundColor White
    Write-Host "   7.6. Build Cypress service image (no cache)" -ForegroundColor White
    Write-Host "   7.7. Build presentation service images" -ForegroundColor White
    Write-Host "   7.8. Build presentation service images (no cache)" -ForegroundColor White
    Write-Host ""
    Write-Host "8. SYSTEM MANAGEMENT" -ForegroundColor Cyan
    Write-Host "   8.1. Completely rebuild all services" -ForegroundColor White
    Write-Host "   8.2. Rebuild dev services" -ForegroundColor White
    Write-Host "   8.3. Rebuild test services" -ForegroundColor White
    Write-Host "   8.4. Rebuild presentation services" -ForegroundColor White
    Write-Host "   8.5. Show service logs" -ForegroundColor White
    Write-Host "   8.6. Open shell in service container" -ForegroundColor White
    Write-Host "   8.7. Stop all services and remove volumes" -ForegroundColor White
    Write-Host "   8.8. Clean up unused Docker resources" -ForegroundColor White
    Write-Host "   8.9. Reset environment (remove all)" -ForegroundColor White
    Write-Host "   8.10. Reset environment (keep images)" -ForegroundColor White
    Write-Host "   8.11. Show service status" -ForegroundColor White
    Write-Host ""
    Write-Host "9. ADVANCED CLEANUP" -ForegroundColor Cyan
    Write-Host "   9.1. Complete system cleanup (removes all images, containers, volumes)" -ForegroundColor White
    Write-Host "   9.2. Deep cleanup with Docker Desktop restart" -ForegroundColor White
    Write-Host "   9.3. Factory reset Docker Desktop" -ForegroundColor White
    Write-Host "   9.4. Clean Docker content store (fixes 'blob not found' errors)" -ForegroundColor White
    Write-Host ""
    Write-Host "10. BACKUP & RESTORE" -ForegroundColor Cyan
    Write-Host "   10.1. Backup all Docker images" -ForegroundColor White
    Write-Host "   10.2. Restore all Docker images" -ForegroundColor White
    Write-Host "   10.3. Backup individual images" -ForegroundColor White
    Write-Host "   10.4. Restore specific image" -ForegroundColor White
    Write-Host "   10.5. List backup files" -ForegroundColor White
    Write-Host "   10.6. List backup contents" -ForegroundColor White
    Write-Host "   10.7. List backup image names" -ForegroundColor White
    Write-Host ""
    Write-Host "11. UTILITIES" -ForegroundColor Cyan
    Write-Host "   11.1. Create SSL certificates for development" -ForegroundColor White
    Write-Host "   11.2. Open shell in service container" -ForegroundColor White
    Write-Host "   11.3. Print project folder structure" -ForegroundColor White
    Write-Host "   11.4. Run PSQL" -ForegroundColor White
    Write-Host "   11.5. Encrypt .env files" -ForegroundColor White
    Write-Host "   11.6. Decrypt .env files" -ForegroundColor White
    Write-Host "   11.7. Create PostIO container" -ForegroundColor White
    Write-Host ""
    Write-Host "12. Exit" -ForegroundColor Red
    Write-Host ""

    $choice = Read-Host "Select an option (e.g., 1.1, 2.3, or 12)"

    switch ($choice) {
        # Development Environment
        "1.1" { 
            npm run docker:dev
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "1.2" { 
            npm run docker:dev-detached
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "1.3" { 
            npm run docker:dev-stop
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "1.4" { 
            npm run docker:dev-logs
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "1.5" { 
            npm run docker:dev-restart
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "1.6" { 
            npm run docker:dev-start
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "1.7" { 
            npm run docker:dev-reset-and-start
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Testing Environment
        "2.1" { 
            npm run docker:test
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "2.2" { 
            npm run docker:test-detached
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "2.3" { 
            npm run docker:test-stop
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "2.4" { 
            npm run docker:test-logs
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "2.5" { 
            npm run docker:test-setup
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Cypress Testing
        "3.1" { 
            npm run docker:cypress-start
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "3.2" { 
            npm run docker:cypress-open
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "3.3" { 
            npm run docker:cypress-run
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "3.4" { 
            npm run docker:cypress-stop
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "3.5" { 
            npm run docker:cypress-run-headed
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "3.6" { 
            npm run docker:cypress-run-headless
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "3.7" { 
            npm run docker:cypress-run-connectivity
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Presentation Environment
        "4.1" { 
            npm run docker:select-presentation
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "4.2" { 
            npm run docker:post-process-videos
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "4.3" { 
            npm run docker:cypress-presentation-spec
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Tunnel Management
        "5.1" { 
            npm run docker:tunnel-build
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "5.2" { 
            npm run docker:tunnel-build-nocache
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "5.3" { 
            npm run docker:tunnel
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "5.4" { 
            npm run docker:tunnel-detached
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "5.5" { 
            npm run docker:tunnel-stop
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "5.6" { 
            npm run docker:tunnel-logs
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Database Management
        "6.1" { 
            npm run docker:dev-migrate
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "6.2" { 
            npm run docker:reset-db
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "6.3" { 
            npm run docker:reset-db-migrate
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "6.4" { 
            npm run docker:reset-db-full
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Image Management
        "7.1" { 
            npm run docker:build
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "7.2" { 
            npm run docker:build-nocache
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "7.3" { 
            npm run docker:build-dev
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "7.4" { 
            npm run docker:build-dev-nocache
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "7.5" { 
            npm run docker:build-cypress
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "7.6" { 
            npm run docker:build-cypress-nocache
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "7.7" { 
            npm run docker:build-presentation
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "7.8" { 
            npm run docker:build-presentation-nocache
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # System Management
        "8.1" { 
            npm run docker:rebuild
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "8.2" { 
            npm run docker:rebuild-dev
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "8.3" { 
            npm run docker:rebuild-test
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "8.4" { 
            npm run docker:rebuild-presentation
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "8.5" { 
            npm run docker:logs
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "8.6" { 
            $serviceName = Read-Host "Enter service name"
            npm run docker:shell -- $serviceName
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "8.7" { 
            npm run docker:down-volumes
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "8.8" { 
            npm run docker:prune
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "8.9" { 
            npm run docker:reset
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "8.10" { 
            npm run docker:reset-keep-images
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "8.11" { 
            npm run status
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Advanced Cleanup
        "9.1" { 
            Write-Host "Performing complete system cleanup..." -ForegroundColor Yellow
            docker system prune -a --volumes
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "9.2" { 
            Write-Host "Performing deep cleanup with Docker Desktop restart..." -ForegroundColor Yellow
            Write-Host "Stopping Docker Desktop..." -ForegroundColor Yellow
            Get-Process "Docker Desktop" -ErrorAction SilentlyContinue | Stop-Process -Force
            Write-Host "Waiting for Docker Desktop to fully terminate..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
            Write-Host "Cleaning up Docker resources..." -ForegroundColor Yellow
            docker system prune -a --volumes
            Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
            Start-Process -FilePath "C:\Program Files\Docker\Docker\Docker Desktop.exe"
            Write-Host "Waiting for Docker Desktop to initialize..." -ForegroundColor Yellow
            Start-Sleep -Seconds 30
            Write-Host "Docker Desktop should be starting up. Please wait for it to fully initialize." -ForegroundColor Green
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "9.3" { 
            Write-Host "WARNING: This will reset Docker Desktop to factory defaults!" -ForegroundColor Red
            Write-Host "All images, containers, and settings will be lost." -ForegroundColor Red
            $confirm = Read-Host "Are you sure you want to continue? (y/n)"
            if ($confirm -eq "y") {
                Write-Host "Resetting Docker Desktop to factory defaults..." -ForegroundColor Yellow
                # This is a simplified version - in practice, you might need to automate the UI clicks
                Write-Host "Please manually reset Docker Desktop by:" -ForegroundColor Yellow
                Write-Host "1. Opening Docker Desktop" -ForegroundColor Yellow
                Write-Host "2. Going to Settings > Troubleshooting" -ForegroundColor Yellow
                Write-Host "3. Clicking 'Reset to factory defaults'" -ForegroundColor Yellow
                Write-Host "4. Waiting for the reset to complete" -ForegroundColor Yellow
            }
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "9.4" { 
            Write-Host "Cleaning Docker content store to fix 'blob not found' errors..." -ForegroundColor Yellow
            Write-Host "Stopping Docker Desktop..." -ForegroundColor Yellow
            Get-Process "Docker Desktop" -ErrorAction SilentlyContinue | Stop-Process -Force
            Write-Host "Waiting for Docker Desktop to fully terminate..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
            Write-Host "Cleaning up Docker resources..." -ForegroundColor Yellow
            docker system prune -a --volumes
            Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
            Start-Process -FilePath "C:\Program Files\Docker\Docker\Docker Desktop.exe"
            Write-Host "Waiting for Docker Desktop to initialize..." -ForegroundColor Yellow
            Start-Sleep -Seconds 30
            Write-Host "Docker Desktop should be starting up. Please wait for it to fully initialize." -ForegroundColor Green
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Backup & Restore
        "10.1" { 
            npm run docker:backup-images
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.2" { 
            npm run docker:restore-images
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.3" { 
            $imageName = Read-Host "Enter image name(s) to backup"
            npm run docker:backup-individual -- $imageName
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.4" { 
            $imageName = Read-Host "Enter image name to restore"
            npm run docker:restore-image -- $imageName
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.5" { 
            npm run docker:list-backups
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.6" { 
            npm run docker:list-backup-contents
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.7" { 
            npm run docker:list-backup-image-names
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Utilities
        "11.1" { 
            npm run certs:create
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "11.2" { 
            $serviceName = Read-Host "Enter service name"
            npm run shell -- $serviceName
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "11.3" { 
            npm run pfs
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "11.4" { 
            npm run psql
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "11.5" { 
            npm run encryptenvfiles
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "11.6" { 
            npm run decryptenvfiles
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "11.7" { 
            npm run createpostio
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        "12" { 
            Write-Host "Exiting..." -ForegroundColor Green
            exit
        }
        default { 
            Write-Host "Invalid option. Press Enter to continue..." -ForegroundColor Red
            Read-Host
        }
    }
} while ($choice -ne "12")