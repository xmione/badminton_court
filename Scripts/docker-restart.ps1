param(
    [switch]$SkipBuild,
    [switch]$SkipSetup,
    [switch]$OnlyKill,
    [switch]$OnlyStart
)

Write-Host "Restarting Docker environment..." -ForegroundColor Green

# Function to check if a process is running
function Test-ProcessRunning {
    param($ProcessName)
    return Get-Process $ProcessName -ErrorAction SilentlyContinue
}

# Function to wait for process to terminate
function Wait-ProcessTermination {
    param($ProcessName, $Timeout = 30)
    $elapsed = 0
    while ((Test-ProcessRunning $processName) -and $elapsed -lt $Timeout) {
        Write-Host "Waiting for $processName to terminate... ($elapsed/$Timeout seconds)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    
    if (Test-ProcessRunning $processName) {
        Write-Host "$processName did not terminate within $Timeout seconds, forcing termination..." -ForegroundColor Yellow
        Get-Process $processName -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Seconds 5
    }
}

# Function to test DNS resolution
function Test-DnsResolution {
    param([string]$Hostname)
    try {
        Resolve-DnsName -Name $Hostname -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Function to check Docker Desktop is ready
function Wait-DockerReady {
    param($Timeout = 180)
    $elapsed = 0
    Write-Host "Waiting for Docker Desktop to be ready..." -ForegroundColor Yellow
    
    while ($elapsed -lt $Timeout) {
        try {
            # Check if the process is running
            if (-not (Test-ProcessRunning "Docker Desktop")) {
                Write-Host "Docker Desktop process not found, waiting..." -ForegroundColor Yellow
                Start-Sleep -Seconds 5
                $elapsed += 5
                continue
            }
            
            # Check if Docker daemon is responding
            $dockerVersion = docker version 2>$null
            $dockerInfo = docker info 2>$null
            
            if (($LASTEXITCODE -eq 0) -and ($null -ne $dockerVersion) -and ($null -ne $dockerInfo)) {
                Write-Host "Docker Desktop is ready!" -ForegroundColor Green
                
                # Test DNS resolution for Docker Hub
                if (Test-DnsResolution -Hostname "registry-1.docker.io") {
                    Write-Host "Docker Hub DNS resolution successful!" -ForegroundColor Green
                    return $true
                } else {
                    Write-Host "WARNING: Cannot resolve Docker Hub DNS. This may cause image pull failures." -ForegroundColor Yellow
                    Write-Host "You may need to check your DNS settings or network configuration." -ForegroundColor Yellow
                    # Continue anyway since local images might work
                    return $true
                }
            }
        }
        catch {
            # Docker not ready yet
        }
        
        Write-Host "Docker Desktop starting... ($elapsed/$Timeout seconds)" -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        $elapsed += 5
        
        if ($elapsed % 30 -eq 0) {
            Write-Host "Still waiting for Docker Desktop... ($elapsed seconds elapsed)" -ForegroundColor Yellow
        }
    }
    
    Write-Host "Docker Desktop failed to start within $Timeout seconds" -ForegroundColor Red
    return $false
}

# Function to check if .env.docker file exists and is readable
function Test-EnvFile {
    $envFile = ".env.docker"
    if (-not (Test-Path $envFile)) {
        Write-Host "ERROR: .env.docker file not found!" -ForegroundColor Red
        return $false
    }
    
    try {
        $content = Get-Content $envFile -ErrorAction Stop
        if ($content.Count -eq 0) {
            Write-Host "WARNING: .env.docker file is empty!" -ForegroundColor Yellow
            return $false
        }
        
        # Check for required variables
        $requiredVars = @("POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB", "REDIS_URL", "ALLOWED_HOSTS")
        $missingVars = @()
        
        foreach ($var in $requiredVars) {
            if ($content -notmatch "^$var=") {
                $missingVars += $var
            }
        }
        
        if ($missingVars.Count -gt 0) {
            Write-Host "WARNING: Missing required variables in .env.docker: $($missingVars -join ', ')" -ForegroundColor Yellow
        }
        
        return $true
    }
    catch {
        Write-Host "ERROR: Cannot read .env.docker file: $_" -ForegroundColor Red
        return $false
    }
}

# Step 1: Kill Docker processes
if (-not $OnlyStart) {
    Write-Host "Terminating Docker processes..." -ForegroundColor Yellow

    $dockerProcesses = @("Docker Desktop", "Docker Desktop Backend", "com.docker.backend", "dockerd")

    foreach ($processName in $dockerProcesses) {
        if (Test-ProcessRunning $processName) {
            Write-Host "Stopping $processName..." -ForegroundColor Yellow
            Get-Process $processName -ErrorAction SilentlyContinue | Stop-Process -Force
            Wait-ProcessTermination $processName
        } else {
            Write-Host "$processName is not running" -ForegroundColor Green
        }
    }

    # Additional cleanup for any remaining Docker-related processes
    Write-Host "Cleaning up remaining Docker processes..." -ForegroundColor Yellow
    Get-Process | Where-Object { $_.ProcessName -like "*docker*" -and $_.ProcessName -ne "docker-restart" } | Stop-Process -Force -ErrorAction SilentlyContinue

    # Step 2: Wait a moment for processes to fully terminate
    Write-Host "Waiting for processes to fully terminate..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Step 3: Reset Docker environment BEFORE starting Docker Desktop
    Write-Host "Resetting Docker containers and volumes..." -ForegroundColor Yellow
    npm run docker:reset
}

# Step 4: Start Docker Desktop
if (-not $OnlyKill) {
    Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow

    # Try different possible paths for Docker Desktop
    $dockerPaths = @(
        "$env:PROGRAMFILES\Docker\Docker\Docker Desktop.exe",
        "$env:LOCALAPPDATA\Programs\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe"
    )

    $dockerStarted = $false
    foreach ($path in $dockerPaths) {
        if (Test-Path $path) {
            Write-Host "Found Docker Desktop at: $path" -ForegroundColor Green
            Start-Process -FilePath $path
            $dockerStarted = $true
            break
        }
    }

    if (-not $dockerStarted) {
        Write-Host "Docker Desktop not found in standard locations" -ForegroundColor Red
        Write-Host "Please install Docker Desktop or update the script with the correct path" -ForegroundColor Red
        exit 1
    }

    # Step 5: Wait for Docker to be ready
    Write-Host "Waiting for Docker Desktop to fully initialize..." -ForegroundColor Yellow
    Write-Host "This may take 1-3 minutes..." -ForegroundColor Yellow
    
    if (-not (Wait-DockerReady)) {
        Write-Host "Docker Desktop failed to start properly" -ForegroundColor Red
        Write-Host "Please check Docker Desktop manually" -ForegroundColor Red
        exit 1
    }

    # If we're only starting Docker Desktop, exit here
    if ($OnlyStart) {
        Write-Host "Docker Desktop started successfully" -ForegroundColor Green
        exit 0
    }

    # Step 6: Check .env.docker file
    Write-Host "Checking environment configuration..." -ForegroundColor Yellow
    if (-not (Test-EnvFile)) {
        Write-Host "Please fix the .env.docker file before continuing" -ForegroundColor Red
        exit 1
    }

    # Step 7: Start Mailcow
    Write-Host "Starting Mailcow..." -ForegroundColor Yellow
    npm run mailcow:start

    # Step 8: Wait for Mailcow to initialize
    Write-Host "Waiting for Mailcow to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 45

    # Verify Mailcow is running
    Write-Host "Verifying Mailcow services..." -ForegroundColor Yellow
    try {
        Set-Location mailcow
        docker-compose ps | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: Mailcow may not be fully ready" -ForegroundColor Yellow
        }
        Set-Location ..
    }
    catch {
        Write-Host "Warning: Could not verify Mailcow status" -ForegroundColor Yellow
    }

    # Step 9: Setup Mailcow (if not skipped)
    if (-not $SkipSetup) {
        Write-Host "Setting up Mailcow configuration..." -ForegroundColor Yellow
        npm run mailcow:setup
    }

    # Step 10: Build containers (if not skipped)
    if (-not $SkipBuild) {
        Write-Host "Building application containers (no cache)..." -ForegroundColor Yellow
        Write-Host "Note: If this fails due to DNS issues, you can try:" -ForegroundColor Yellow
        Write-Host "1. Checking your network connection" -ForegroundColor Yellow
        Write-Host "2. Changing your DNS settings to 8.8.8.8" -ForegroundColor Yellow
        Write-Host "3. Using a VPN if you're in a region with network restrictions" -ForegroundColor Yellow
        
        npm run docker:build-nocache
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Build failed, but continuing with startup..." -ForegroundColor Yellow
            Write-Host "You can try building later with: npm run docker:build-nocache" -ForegroundColor Yellow
        }
    }

    # Step 11: Start application
    Write-Host "Starting application in detached mode..." -ForegroundColor Yellow
    npm run docker:dev-detached

    # Step 12: Verify everything is running
    Write-Host "Verifying services are running..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    try {
        $appStatus = docker-compose ps
        Write-Host "Application status:" -ForegroundColor Green
        $appStatus
    }
    catch {
        Write-Host "Could not verify application status" -ForegroundColor Yellow
    }

    Write-Host "Complete development environment is ready!" -ForegroundColor Green
    Write-Host "Application: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "Mailcow Admin: https://mail.aeropace.com" -ForegroundColor Cyan
}