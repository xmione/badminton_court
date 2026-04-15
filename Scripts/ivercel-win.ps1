#=================================================================================
# File Name : ivercel-win.ps1
# Created By: Solomio S. Sisante
# Created On: November 12, 2024
# Created To: Install Vercel CLI in Windows.
#
# How to run:
#             .\ivercel-win.ps1
#
#=================================================================================

# Log function to write messages to a log file and console
function Write-Log {
    param (
        [string]$message
    )
    $message | Tee-Object -FilePath "$PSScriptRoot\install-vercel.log" -Append
}

Write-Log "Resetting pnpm configuration..."

# Reset pnpm configuration
pnpm config delete prefix
pnpm config delete global-bin-dir

Write-Log "Setting pnpm prefix and global-bin-dir to Windows-appropriate paths..."

# Set pnpm global bin directory and prefix to Windows-appropriate paths
$pnpmPrefix = "$env:APPDATA\pnpm"
$pnpmBin = "$pnpmPrefix\bin"
pnpm config set prefix $pnpmPrefix
pnpm config set global-bin-dir $pnpmBin

# Create the bin directory if it doesn't exist
if (!(Test-Path -Path $pnpmBin)) {
    New-Item -ItemType Directory -Path $pnpmBin | Out-Null
    Write-Log "Created directory: $pnpmBin"
} else {
    Write-Log "$pnpmBin already exists."
}

# Add the bin directory to PATH if it doesn't already exist
if (-not $env:Path.Contains($pnpmBin)) {
    $env:Path += ";$pnpmBin"
    [System.Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::User)
    Write-Log "Added $pnpmBin to PATH"
} else {
    Write-Log "$pnpmBin is already in PATH"
}

# Verify pnpm configuration
$pnpmConfig = pnpm config get prefix
Write-Log "pnpm prefix: $pnpmConfig"

Write-Log "Installing Vercel CLI..."

# Install vercel using pnpm
pnpm add -g vercel@37.14.0

# Refresh the environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User)

Write-Log "Vercel CLI installed and PATH updated successfully. Please restart your terminal and verify the installation with 'vercel --version'."
