# Docker Management Menu Script
# This script provides a menu-driven interface for managing Docker environments and services.
# It allows users to start, stop, and manage various Docker containers and services related to development, testing, and presentation.
# Ensure you have Docker and Docker Compose installed and running before using this script.
# Usage: Run this script in PowerShell to display the Docker management menu.
# Check for .env.docker file in the current directory
# If not found, display an error message and exit.
# If found, display the first few lines of the file for verification.
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
    Write-Host "1. LOCAL DEVELOPMENT" -ForegroundColor Cyan
    Write-Host "   1.1. Start local development environment" -ForegroundColor White
    Write-Host "   1.2. Start local development environment (detached)" -ForegroundColor White
    Write-Host "   1.3. Stop local dev server" -ForegroundColor White
    Write-Host "   1.4. Load local dev data" -ForegroundColor White
    Write-Host "   1.5. Start dev tunnel" -ForegroundColor White
    Write-Host ""
    Write-Host "2. LOCAL CYPRESS TESTING" -ForegroundColor Cyan
    Write-Host "   2.1. Open Cypress in interactive mode" -ForegroundColor White
    Write-Host "   2.2. Run Cypress tests (headed)" -ForegroundColor White
    Write-Host "   2.3. Run Cypress tests (headless)" -ForegroundColor White
    Write-Host "   2.4. Run Cypress tests for presentation (headed)" -ForegroundColor White
    Write-Host "   2.5. Select a Cypress test for presentation (headed)" -ForegroundColor White
    Write-Host "   2.6. Run Post-Process Videos" -ForegroundColor White
    Write-Host "   2.7. Run Cypress tests for presentation spec (headed)" -ForegroundColor White
    Write-Host ""
    Write-Host "3. DOCKER DEVELOPMENT ENVIRONMENT" -ForegroundColor Cyan
    Write-Host "   3.1. Start development environment" -ForegroundColor White
    Write-Host "   3.2. Start development environment (detached)" -ForegroundColor White
    Write-Host "   3.3. Stop development services" -ForegroundColor White
    Write-Host "   3.4. Show development logs" -ForegroundColor White
    Write-Host "   3.5. Restart web-dev container" -ForegroundColor White
    Write-Host "   3.6. Start dev environment with certificates" -ForegroundColor White
    Write-Host "   3.7. Reset and start dev environment" -ForegroundColor White
    Write-Host "   3.8. Force recreate dev containers (keeps existing images)" -ForegroundColor White
    Write-Host ""
    Write-Host "4. DOCKER TESTING ENVIRONMENT" -ForegroundColor Cyan
    Write-Host "   4.1. Start test environment" -ForegroundColor White
    Write-Host "   4.2. Start test environment (detached)" -ForegroundColor White
    Write-Host "   4.3. Stop test services" -ForegroundColor White
    Write-Host "   4.4. Show test logs" -ForegroundColor White
    Write-Host "   4.5. Setup test data" -ForegroundColor White
    Write-Host ""
    Write-Host "5. DOCKER CYPRESS TESTING" -ForegroundColor Cyan
    Write-Host "   5.1. Start Cypress container" -ForegroundColor White
    Write-Host "   5.2. Open Cypress in existing container" -ForegroundColor White
    Write-Host "   5.3. Run Cypress tests in existing container" -ForegroundColor White
    Write-Host "   5.4. Stop Cypress container" -ForegroundColor White
    Write-Host "   5.5. Run Cypress tests (headed) in new container" -ForegroundColor White
    Write-Host "   5.6. Run Cypress tests (headless) in new container" -ForegroundColor White
    Write-Host "   5.7. Run connectivity tests (headless)" -ForegroundColor White
    Write-Host ""
    Write-Host "6. DOCKER PRESENTATION ENVIRONMENT" -ForegroundColor Cyan
    Write-Host "   6.1. Select and run Cypress test for presentation" -ForegroundColor White
    Write-Host "   6.2. Post-process videos in Docker" -ForegroundColor White
    Write-Host "   6.3. Run Cypress tests for presentation spec" -ForegroundColor White
    Write-Host ""
    Write-Host "7. DOCKER TUNNEL MANAGEMENT" -ForegroundColor Cyan
    Write-Host "   7.1. Build tunnel service" -ForegroundColor White
    Write-Host "   7.2. Build tunnel service (no cache)" -ForegroundColor White
    Write-Host "   7.3. Start docker tunnel" -ForegroundColor White
    Write-Host "   7.4. Start docker tunnel (detached)" -ForegroundColor White
    Write-Host "   7.5. Stop docker tunnel" -ForegroundColor White
    Write-Host "   7.6. Show tunnel logs" -ForegroundColor White
    Write-Host ""
    Write-Host "8. DOCKER DATABASE MANAGEMENT" -ForegroundColor Cyan
    Write-Host "   8.1. Run database migrations in dev container" -ForegroundColor White
    Write-Host "   8.2. Reset database" -ForegroundColor White
    Write-Host "   8.3. Reset database with migrations" -ForegroundColor White
    Write-Host "   8.4. Full database reset with test data" -ForegroundColor White
    Write-Host ""
    Write-Host "9. DOCKER IMAGE MANAGEMENT" -ForegroundColor Cyan
    Write-Host "   9.1. Build all service images" -ForegroundColor White
    Write-Host "   9.2. Build all service images (no cache)" -ForegroundColor White
    Write-Host "   9.3. Build dev service images" -ForegroundColor White
    Write-Host "   9.4. Build dev service images (no cache)" -ForegroundColor White
    Write-Host "   9.5. Build Cypress service image" -ForegroundColor White
    Write-Host "   9.6. Build Cypress service image (no cache)" -ForegroundColor White
    Write-Host "   9.7. Build presentation service images" -ForegroundColor White
    Write-Host "   9.8. Build presentation service images (no cache)" -ForegroundColor White
    Write-Host ""
    Write-Host "10. DOCKER SYSTEM MANAGEMENT" -ForegroundColor Cyan
    Write-Host "   10.1. Completely rebuild all services" -ForegroundColor White
    Write-Host "   10.2. Rebuild dev services" -ForegroundColor White
    Write-Host "   10.3. Rebuild test services" -ForegroundColor White
    Write-Host "   10.4. Rebuild presentation services" -ForegroundColor White
    Write-Host "   10.5. Show service logs" -ForegroundColor White
    Write-Host "   10.6. Open shell in service container" -ForegroundColor White
    Write-Host "   10.7. Stop all services and remove volumes" -ForegroundColor White
    Write-Host "   10.8. Clean up unused Docker resources" -ForegroundColor White
    Write-Host "   10.9. Reset environment (remove all)" -ForegroundColor White
    Write-Host "   10.10. Reset environment (keep images)" -ForegroundColor White
    Write-Host "   10.11. Show service status" -ForegroundColor White
    Write-Host ""
    Write-Host "11. ADVANCED CLEANUP" -ForegroundColor Cyan
    Write-Host "   11.1. Complete system cleanup (removes all images, containers, volumes)" -ForegroundColor White
    Write-Host "   11.2. Deep cleanup with Docker Desktop restart" -ForegroundColor White
    Write-Host "   11.3. Factory reset Docker Desktop" -ForegroundColor White
    Write-Host "   11.4. Clean Docker content store (fixes 'blob not found' errors)" -ForegroundColor White
    Write-Host "   11.5. COMPLETE Docker reset (fixes content store corruption)" -ForegroundColor Red
    Write-Host "   11.6. COMPLETE Docker reset and restart dev environment" -ForegroundColor Red
    Write-Host ""
    Write-Host "12. BACKUP & RESTORE" -ForegroundColor Cyan
    Write-Host "   12.1. Backup all Docker images" -ForegroundColor White
    Write-Host "   12.2. Restore all Docker images" -ForegroundColor White
    Write-Host "   12.3. Backup individual images" -ForegroundColor White
    Write-Host "   12.4. Restore specific image" -ForegroundColor White
    Write-Host "   12.5. List backup files" -ForegroundColor White
    Write-Host "   12.6. List backup contents" -ForegroundColor White
    Write-Host "   12.7. List backup image names" -ForegroundColor White
    Write-Host ""
    Write-Host "13. UTILITIES" -ForegroundColor Cyan
    Write-Host "   13.1. Create SSL certificates for development" -ForegroundColor White
    Write-Host "   13.2. Open shell in service container" -ForegroundColor White
    Write-Host "   13.3. Print project folder structure" -ForegroundColor White
    Write-Host "   13.4. Run PSQL" -ForegroundColor White
    Write-Host "   13.5. Encrypt .env files" -ForegroundColor White
    Write-Host "   13.6. Decrypt .env files" -ForegroundColor White
    Write-Host "   13.7. Create PostIO container" -ForegroundColor White
    Write-Host ""
    Write-Host "14. Exit" -ForegroundColor Red
    Write-Host ""

    $choice = Read-Host "Select an option (e.g., 1.1, 2.3, or 14)"

    switch ($choice) {
        # Local Development
        "1.1" { 
            npm run dev
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "1.2" { 
            npm run dev:detached
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "1.3" { 
            npm run dev:stop
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "1.4" { 
            npm run dev:load-data
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "1.5" { 
            npm run dev:tunnel
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Local Cypress Testing
        "2.1" { 
            npm run dev:cypress-open
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "2.2" { 
            npm run dev:cypress-headed
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "2.3" { 
            npm run dev:cypress-headless
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "2.4" { 
            npm run dev:cypress-presentation
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "2.5" { 
            npm run dev:select-presentation
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "2.6" { 
            npm run dev:post-process-videos
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "2.7" { 
            $spec = Read-Host "Enter spec file path (optional)"
            if ($spec) {
                npm run dev:cypress-presentation-spec -- --spec $spec
            }
            else {
                npm run dev:cypress-presentation-spec
            }
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Docker Development Environment
        "3.1" { 
            npm run docker:dev
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "3.2" { 
            npm run docker:dev-detached
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "3.3" { 
            npm run docker:dev-stop
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "3.4" { 
            npm run docker:dev-logs
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "3.5" { 
            npm run docker:dev-restart
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "3.6" { 
            npm run docker:dev-start
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "3.7" { 
            npm run docker:dev-reset-and-start
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "3.8" { 
            Write-Host "Force recreating dev containers..." -ForegroundColor Yellow
            npm run docker:dev-recreate
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }

        # Docker Testing Environment
        "4.1" { 
            npm run docker:test
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "4.2" { 
            npm run docker:test-detached
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "4.3" { 
            npm run docker:test-stop
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "4.4" { 
            npm run docker:test-logs
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "4.5" { 
            npm run docker:test-setup
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Docker Cypress Testing
        "5.1" { 
            npm run docker:cypress-start
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "5.2" { 
            npm run docker:cypress-open
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "5.3" { 
            npm run docker:cypress-run
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "5.4" { 
            npm run docker:cypress-stop
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "5.5" { 
            npm run docker:cypress-run-headed
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "5.6" { 
            npm run docker:cypress-run-headless
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "5.7" { 
            npm run docker:cypress-run-connectivity
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Docker Presentation Environment
        "6.1" { 
            npm run docker:select-presentation
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "6.2" { 
            npm run docker:post-process-videos
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "6.3" { 
            $spec = Read-Host "Enter spec file path (optional)"
            if ($spec) {
                npm run docker:cypress-presentation-spec -- --spec $spec
            }
            else {
                npm run docker:cypress-presentation-spec
            }
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Docker Tunnel Management
        "7.1" { 
            npm run docker:tunnel-build
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "7.2" { 
            npm run docker:tunnel-build-nocache
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "7.3" { 
            npm run docker:tunnel
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "7.4" { 
            npm run docker:tunnel-detached
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "7.5" { 
            npm run docker:tunnel-stop
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "7.6" { 
            npm run docker:tunnel-logs
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Docker Database Management
        "8.1" { 
            npm run docker:dev-migrate
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "8.2" { 
            npm run docker:reset-db
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "8.3" { 
            npm run docker:reset-db-migrate
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "8.4" { 
            npm run docker:reset-db-full
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Docker Image Management
        "9.1" { 
            npm run docker:build
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "9.2" { 
            npm run docker:build-nocache
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "9.3" { 
            npm run docker:build-dev
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "9.4" { 
            npm run docker:build-dev-nocache
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "9.5" { 
            npm run docker:build-cypress
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "9.6" { 
            npm run docker:build-cypress-nocache
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "9.7" { 
            npm run docker:build-presentation
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "9.8" { 
            npm run docker:build-presentation-nocache
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Docker System Management
        "10.1" { 
            npm run docker:rebuild
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.2" { 
            npm run docker:rebuild-dev
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.3" { 
            npm run docker:rebuild-test
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.4" { 
            npm run docker:rebuild-presentation
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.5" { 
            npm run docker:logs
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.6" { 
            $serviceName = Read-Host "Enter service name"
            npm run docker:shell -- $serviceName
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.7" { 
            npm run docker:down-volumes
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.8" { 
            npm run docker:prune
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.9" { 
            npm run docker:reset
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.10" { 
            npm run docker:reset-keep-images
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "10.11" { 
            npm run status
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Advanced Cleanup
        "11.1" { 
            Write-Host "Performing complete system cleanup..." -ForegroundColor Yellow
            npm run docker:system-prune-all
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "11.2" { 
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
        "11.3" { 
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
        "11.4" { 
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
        # Enhanced option 11.5 for complete Docker reset
        "11.5" { 
            Write-Host "WARNING: This will completely reset Docker's content store!" -ForegroundColor Red
            Write-Host "This is the most aggressive cleanup option and should fix 'blob not found' errors." -ForegroundColor Red
            $confirm = Read-Host "Are you sure you want to continue? (y/n)"
            if ($confirm -eq "y") {
                npm run docker:desktop-reset
                Write-Host "Docker reset completed successfully!" -ForegroundColor Green
                Write-Host "You can now use option 11.6 to completely reset and restart your environment." -ForegroundColor Green
            }
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }

        # Enhanced option 11.6 that combines complete cleanup with dev container recreation
        "11.6" { 
            Write-Host "WARNING: This will completely reset Docker and rebuild everything from scratch!" -ForegroundColor Red
            Write-Host "This will remove all Docker resources and rebuild all images before starting dev environment." -ForegroundColor Red
            $confirm = Read-Host "Are you sure you want to continue? (y/n)"
            if ($confirm -eq "y") {
                npm run docker:desktop-reset-and-rebuild
                Write-Host "Complete reset, rebuild, and restart finished!" -ForegroundColor Green
            }
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }   
        # Backup & Restore
        "12.1" { 
            npm run docker:backup-images
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "12.2" { 
            npm run docker:restore-images
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "12.3" { 
            $imageName = Read-Host "Enter image name(s) to backup"
            npm run docker:backup-individual -- $imageName
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "12.4" { 
            $imageName = Read-Host "Enter image name to restore"
            npm run docker:restore-image -- $imageName
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "12.5" { 
            npm run docker:list-backups
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "12.6" { 
            npm run docker:list-backup-contents
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "12.7" { 
            npm run docker:list-backup-image-names
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        # Utilities
        "13.1" { 
            npm run certs:create
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "13.2" { 
            $serviceName = Read-Host "Enter service name"
            npm run shell -- $serviceName
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "13.3" { 
            npm run pfs
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "13.4" { 
            npm run psql
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "13.5" { 
            npm run encryptenvfiles
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "13.6" { 
            npm run decryptenvfiles
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        "13.7" { 
            npm run createpostio
            Write-Host "Press Enter to continue..." -ForegroundColor Yellow
            Read-Host
        }
        
        "14" { 
            Write-Host "Exiting..." -ForegroundColor Green
            exit
        }
        default { 
            Write-Host "Invalid option. Press Enter to continue..." -ForegroundColor Red
            Read-Host
        }
    }
} while ($choice -ne "14")