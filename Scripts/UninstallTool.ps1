<#
.SYNOPSIS
    Common uninstallation functions for the development environment.

.DESCRIPTION
    This module contains the Uninstall-Tool function and related helpers for uninstalling
    development tools consistently. It is the counterpart to InstallTool.ps1.

.NOTES
    File Name      : UninstallTool.ps1
    Author         : Solomio S. Sisante
    Prerequisite   : PowerShell 5.1 or later
    Copyright      : c(2025)
#>

# Function to log messages
function Write-Message {
    param (
        [string]$message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $message"
    Write-Host $logEntry
    
    # Use the same log file as the main script
    if ($Global:LogFile) {
        Add-Content -Path $Global:LogFile -Value $logEntry -ErrorAction SilentlyContinue
    }
}

function Remove-FromPath {
    param (
        [string]$PathToRemove
    )

    if (-not $PathToRemove) {
        return
    }

    Write-Message "Attempting to remove '$PathToRemove' from User PATH..." -Level "INFO"
    try {
        # Get the current User PATH
        $userPath = [System.Environment]::GetEnvironmentVariable('Path', [System.EnvironmentVariableTarget]::User)
        
        # Check if the path exists in the current PATH
        if ($userPath -like "*$PathToRemove*") {
            # Split the path into an array, filter out the path to remove, and join back
            $newPath = ($userPath -split ';' | Where-Object { $_ -ne $PathToRemove -and $_ -ne "" }) -join ';'
            
            # Set the new PATH
            [System.Environment]::SetEnvironmentVariable('Path', $newPath, [System.EnvironmentVariableTarget]::User)
            
            # Also update the current session's PATH
            $env:Path = ($env:Path -split ';' | Where-Object { $_ -ne $PathToRemove -and $_ -ne "" }) -join ';'

            Write-Message "Successfully removed '$PathToRemove' from User PATH." -Level "SUCCESS"
        } else {
            Write-Message "'$PathToRemove' not found in User PATH. No changes made." -Level "INFO"
        }
    }
    catch {
        Write-Message "Failed to remove '$PathToRemove' from PATH: $($_.Exception.Message)" -Level "ERROR"
    }
}

function Uninstall-Tool {
    param (
        [string]$appName,
        [scriptblock]$checkCommand,
        [string]$envPath,
        [scriptblock]$uninstallCommand = $null,
        [switch]$Force
    ) 

    Write-Message "Processing uninstall for: $appName" -Level "INFO"

    $isInstalled = & $checkCommand -ErrorAction SilentlyContinue

    if (-not $isInstalled -and -not $Force) {
        Write-Message "$appName is not installed. Skipping." -Level "INFO"
        return $true # Considered a success
    }

    if ($isInstalled -or $Force) {
        Write-Message "Uninstalling $appName..." -Level "WARNING"
        $uninstallSucceeded = $false

        # 1. Try the custom uninstall command if provided
        if ($uninstallCommand) {
            Write-Message "Running custom uninstall command for $appName..." -Level "INFO"
            try {
                & $uninstallCommand
                # Add a delay for the uninstaller to finish and clean up
                Start-Sleep -Seconds 5
                $uninstallSucceeded = $true
            }
            catch {
                Write-Message "Custom uninstall command for $appName failed: $($_.Exception.Message)" -Level "ERROR"
            }
        }
        # 2. Fallback to winget if no custom command or if it failed
        if (-not $uninstallSucceeded) {
            Write-Message "Attempting to uninstall $appName via winget..." -Level "INFO"
            try {
                # winget can often find the package by name or ID
                winget uninstall $appName --accept-source-agreements --accept-package-agreements --force
                Start-Sleep -Seconds 5
                $uninstallSucceeded = $true
            }
            catch {
                Write-Message "winget uninstall for $appName failed or package not found." -Level "WARNING"
            }
        }
        # 3. Fallback to choco
        if (-not $uninstallSucceeded) {
            Write-Message "Attempting to uninstall $appName via Chocolatey..." -Level "INFO"
            try {
                Start-Process -NoNewWindow -Wait "choco" -ArgumentList "uninstall $appName -y --confirm"
                Start-Sleep -Seconds 5
                $uninstallSucceeded = $true
            }
            catch {
                Write-Message "Chocolatey uninstall for $appName failed or package not found." -Level "WARNING"
            }
        }

        # Final verification
        $isStillInstalled = & $checkCommand -ErrorAction SilentlyContinue
        if ($isStillInstalled) {
            Write-Message "$appName uninstall failed verification. It may still be installed." -Level "ERROR"
            return $false
        } else {
            Write-Message "$appName uninstalled successfully." -Level "SUCCESS"
        }
    }

    # Clean up PATH regardless of whether the uninstall command was run (in case of -Force)
    Remove-FromPath -PathToRemove $envPath

    return $true
}