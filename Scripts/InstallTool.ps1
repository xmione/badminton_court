# InstallTool.ps1
<#
.SYNOPSIS
    Common installation functions for development environment setup.

.DESCRIPTION
    This module contains the Install-Tool function and related helpers for installing
    development tools consistently across different setup scripts.

.NOTES
    File Name      : InstallTool.ps1
    Author         : Solomio S. Sisante
    Prerequisite   : PowerShell 5.1 or later
    Copyright      : c(2025)
#>

# Enable TLS12 for secure downloads
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 

# Function to log messages
function Write-Message {
    param (
        [string]$message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $message"
    Write-Host $logEntry
}

# Function to check if Chocolatey exists, if not, install it
function Test-Chocolatey {
    if (-not (Test-Path "C:\ProgramData\chocolatey\bin\choco.exe")) {
        Write-Message "Installing Chocolatey..." -Level "INFO"
        try {
            Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
            Write-Message "Chocolatey installed successfully." -Level "SUCCESS"
        } catch {
            Write-Message "Failed to install Chocolatey: $_" -Level "ERROR"
            throw
        }
    }
}

# Function to download a file with progress tracking
function DownloadWithProgress {
    param (
        [string]$url,
        [string]$outputFile
    )

    Write-Message "Starting download of $url..." -Level "INFO"

    try {
        Invoke-WebRequest -Uri $url -OutFile $outputFile -UseBasicParsing
        Write-Message "Download completed: $outputFile" -Level "SUCCESS"
    } catch {
        Write-Message "Error downloading file: $_" -Level "ERROR"
        throw
    }
}

# Function to install a tool
function Install-Tool {
    param (
        [string]$appName,
        [scriptblock]$installCommand,
        [scriptblock]$checkCommand,
        [string]$envPath,
        [string]$manualInstallUrl = $null,
        [string]$manualInstallPath = $null,
        [switch]$ForceUpdate = $false,
        [int]$MaxRetries = 1,
        [scriptblock]$ProgressCallback = $null
    ) 

    Write-Message "Processing installation for: $appName" -Level "INFO"

    $message = @" 

====================================================================================================================    
appName: $appName 
installCommand: $installCommand 
checkCommand: $checkCommand 
envPath: $envPath 
manualInstallUrl: $manualInstallUrl 
manualInstallPath: $manualInstallPath 
ForceUpdate: $ForceUpdate 
MaxRetries: $MaxRetries 
====================================================================================================================
"@ 

    Write-Message $message -Level "DEBUG"

    $isInstalled = & $checkCommand -ErrorAction SilentlyContinue

    if (-not $isInstalled -or $ForceUpdate) {
        Write-Message "Installing $appName..." -Level "INFO"
        
        if ($ProgressCallback) {
            & $ProgressCallback -Step "Installing $appName" -Status "In Progress"
        }

        Test-Chocolatey
        $installFailed = $false
        $retryCount = 0

        while ($retryCount -lt $MaxRetries) {
            try {
                if ($installCommand) {
                    Write-Message "Running custom install command for $appName (attempt $($retryCount + 1))..." -Level "INFO"
                    & $installCommand
                } else {
                    Write-Message "Installing $appName via Chocolatey (attempt $($retryCount + 1))..." -Level "INFO"
                    Start-Process -NoNewWindow -Wait "choco" -ArgumentList "install $appName -y"
                }
                
                # If we get here, the command completed without throwing an exception
                $installFailed = $false
                break
            } catch {
                Write-Message "Installation attempt $($retryCount + 1) for $appName failed: $_" -Level "WARNING"
                $installFailed = $true
                $retryCount++
                
                if ($retryCount -lt $MaxRetries) {
                    $waitTime = 5 * $retryCount
                    Write-Message "Waiting $waitTime seconds before retry..." -Level "INFO"
                    Start-Sleep -Seconds $waitTime
                }
            }
        }

        # Re-check if installation succeeded
        $isInstalled = & $checkCommand -ErrorAction SilentlyContinue
        if (-not $isInstalled) {
            Write-Message "$appName installation failed verification." -Level "ERROR"
            $installFailed = $true
        }

        # Attempt manual install if needed
        if ($installFailed -and $manualInstallUrl -and $manualInstallPath) {
            Write-Message "Attempting manual install for $appName..." -Level "INFO"
            try {
                DownloadWithProgress -url $manualInstallUrl -outputFile $manualInstallPath
                Start-Process -FilePath $manualInstallPath -ArgumentList '/silent' -Wait

                # Final verification
                $isInstalled = & $checkCommand -ErrorAction SilentlyContinue
                if ($isInstalled) {
                    Write-Message "$appName manual installation completed and verified." -Level "SUCCESS"
                } else {
                    Write-Message "$appName manual installation failed verification." -Level "ERROR"
                }
            } catch {
                Write-Message "Manual installation for $appName failed: $_" -Level "ERROR"
            }
        } elseif ($installFailed) {
            Write-Message "Installation failed and no manual install method available for $appName." -Level "ERROR"
        } else {
            Write-Message "$appName installed successfully." -Level "SUCCESS"
        }
    } else {
        Write-Message "$appName is already installed." -Level "INFO"
    }

    # If verified, ensure PATH is updated
    if ($isInstalled) {
        $currentPath = [System.Environment]::GetEnvironmentVariable('Path', [System.EnvironmentVariableTarget]::User)
        Write-Message "Current PATH: $currentPath" -Level "DEBUG"

        if (-not ($currentPath -like "*$envPath*")) {
            $newPath = $currentPath + ";$envPath"
            [System.Environment]::SetEnvironmentVariable('Path', $newPath, [System.EnvironmentVariableTarget]::User)
            $env:Path = $newPath
            Write-Message "Added $appName to the system PATH." -Level "SUCCESS"
        } else {
            Write-Message "$appName is already in the system PATH." -Level "INFO"
        }
    }

    if ($ProgressCallback) {
        & $ProgressCallback -Step "Installing $appName" -Status "Completed"
    }

    return $isInstalled
}

