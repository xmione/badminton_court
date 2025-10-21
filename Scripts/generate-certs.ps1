# =============================================================================
# PowerShell Wrapper for Certificate Generation
# =============================================================================
# This script provides a cross-platform way to generate certificates.
# It prefers Bash (if available) but falls back to native PowerShell.
# =============================================================================

param(
    [switch]$Force
)

Write-Host "--- Starting Certificate Generation (PowerShell Wrapper) ---" -ForegroundColor Cyan

# Step 1: Check if certificates already exist and Force flag is not set
Write-Host "=> Checking for existing certificates..." -ForegroundColor Yellow
if ((Test-Path "certs/posteio-cert.pem") -and (Test-Path "certs/posteio-key.pem") -and (-not $Force)) {
    Write-Host "   Certificates already exist. Use -Force to regenerate." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "   No existing certificates found or -Force flag used. Proceeding." -ForegroundColor Green
}

# Step 2: Check for Bash and use it if available
Write-Host "=> Checking for Git Bash..." -ForegroundColor Yellow
 $bashPath = Get-Command bash -ErrorAction SilentlyContinue

if ($bashPath) {
    Write-Host "   Git Bash found. Using bash script for generation." -ForegroundColor Green
    & bash ./scripts/generate-certs.sh
} else {
    # Step 3: Fallback to native PowerShell if Bash is not found
    Write-Host "   Bash not found. Falling back to native PowerShell." -ForegroundColor Yellow
    
    Write-Host "=> Calling original PowerShell certificate script..." -ForegroundColor Green
    # Call your original script logic
    . ./scripts/createcert-posteio.ps1
    
    # Step 4: Create CA certificate file for the client to trust
    if (Test-Path "certs/posteio-cert.pem") {
        Write-Host "=> Creating CA certificate file for client trust..." -ForegroundColor Green
        Copy-Item "certs/posteio-cert.pem" "certs/ca.pem"
        Write-Host "   CA certificate created: certs/ca.pem" -ForegroundColor Green
    }
}

Write-Host "--- Certificate Generation Complete ---" -ForegroundColor Cyan