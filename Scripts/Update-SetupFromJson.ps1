<#
.SYNOPSIS
    Updates system components to match versions specified in configuration files.

.DESCRIPTION
    This script compares currently installed software versions against configuration files and updates any mismatched components. It handles:
    - System Tools (using versions.json with Install-Tool function)
    - Python packages (using requirements.txt)

    The script will automatically download and install/update components as needed to match the configuration.

.PARAMETER JsonPath
    Specifies the path to the versions.json configuration file.
    Default: "..\versions.json" (root folder relative to script location)

.PARAMETER RequirementsPath
    Specifies the path to the requirements.txt file.
    Default: "..\requirements.txt" (root folder relative to script location)

.PARAMETER ForceUpdate
    Forces updates even if versions already match.
    Default: $false

.EXAMPLE
    .\Scripts\Update-SetupFromJson.ps1
    Updates components to match versions in the default configuration files

.EXAMPLE
    .\Scripts\Update-SetupFromJson.ps1 -JsonPath "C:\configs\my_versions.json" -RequirementsPath "C:\configs\my_requirements.txt" -ForceUpdate
    Updates components using custom configuration files and forces updates

.NOTES
    File Name      : Scripts\Update-SetupFromJson.ps1
    Author         : Solomio S. Sisante
    Prerequisite   : PowerShell 5.1 or later
    Copyright      : c(2025)

    IMPORTANT:
    - Run as Administrator for system-wide installations
    - Requires internet connection for downloading installers
    - May require system restarts after updates
    - Test in non-production environment first
#>
param (
    [string]$JsonPath = "..\versions.json",
    [string]$RequirementsPath = "..\requirements.txt",
    [switch]$ForceUpdate = $false
)

# Get the script directory
 $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# If JsonPath is relative, make it relative to the script directory
if (-not ([System.IO.Path]::IsPathRooted($JsonPath))) {
    $JsonPath = Join-Path -Path $ScriptDir -ChildPath $JsonPath
}

# If RequirementsPath is relative, make it relative to the script directory
if (-not ([System.IO.Path]::IsPathRooted($RequirementsPath))) {
    $RequirementsPath = Join-Path -Path $ScriptDir -ChildPath $RequirementsPath
}

# Enable TLS12 for secure downloads
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 

# Log file path
 $logFileName = "install_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Redirect all output to the log file
Start-Transcript -Path $logFileName -Append

# Function to log messages
function Write-Message {
    param (
        [string]$message
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "$timestamp - $message"   
}

Write-Message "Starting installation of system tools and packages."

# Function to check if Chocolatey exists, if not, install it
function Test-Chocolatey {
    if (-not (Test-Path "C:\ProgramData\chocolatey\bin\choco.exe")) {
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
        Write-Message "Chocolatey installed successfully."
    }
}

# Function to download a file with progress tracking
function DownloadWithProgress {
    param (
        [string]$url,
        [string]$outputFile
    )

    Write-Message "Starting download of $url..."

    # Use Invoke-WebRequest with the -OutFile parameter
    try {
        Invoke-WebRequest -Uri $url -OutFile $outputFile -UseBasicParsing
    } catch {
        Write-Message "Error downloading file: $_"
    }
    
    Write-Message "Download completed: $outputFile"
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
        [switch]$ForceUpdate = $false
    ) 

    $message = @" 

====================================================================================================================    
appName: $appName 
installCommand: $installCommand 
checkCommand: $checkCommand 
envPath: $envPath 
manualInstallUrl: $manualInstallUrl 
manualInstallPath: $manualInstallPath 
====================================================================================================================
"@ 

    Write-Message $message

    $isInstalled = & $checkCommand -ErrorAction SilentlyContinue

    if (-not $isInstalled -or $ForceUpdate) {
        Write-Message "Installing $appName..."

        Test-Chocolatey
        $installFailed = $false

        try {
            if ($installCommand) {
                Write-Message "Running custom install command for $appName..."
                & $installCommand
            } else {
                Write-Message "Installing $appName via Chocolatey..."
                Start-Process -NoNewWindow -Wait "choco" -ArgumentList "install $appName -y"
            }
        } catch {
            Write-Message "Installation for $appName threw an exception: $_"
            $installFailed = $true
        }

        # Re-check if installation succeeded
        $isInstalled = & $checkCommand -ErrorAction SilentlyContinue
        if (-not $isInstalled) {
            Write-Message "$appName installation failed verification."
            $installFailed = $true
        }

        # Attempt manual install if needed
        if ($installFailed -and $manualInstallUrl -and $manualInstallPath) {
            Write-Message "Attempting manual install for $appName..."
            DownloadWithProgress -url $manualInstallUrl -outputFile $manualInstallPath
            Start-Process -FilePath $manualInstallPath -ArgumentList '/silent' -Wait

            # Final verification
            $isInstalled = & $checkCommand -ErrorAction SilentlyContinue
            if ($isInstalled) {
                Write-Message "$appName manual installation completed and verified."
            } else {
                Write-Message "$appName manual installation failed verification."
            }
        } elseif ($installFailed) {
            Write-Message "Installation failed and no manual install method available for $appName."
        } else {
            Write-Message "$appName installed successfully."
        }
    } else {
        Write-Message "$appName is already installed."
    }

    # If verified, ensure PATH is updated
    if ($isInstalled) {
        $currentPath = [System.Environment]::GetEnvironmentVariable('Path', [System.EnvironmentVariableTarget]::User)
        Write-Message "currentPath = $currentPath"

        if (-not ($currentPath -like "*$envPath*")) {
            $newPath = $currentPath + ";$envPath"
            [System.Environment]::SetEnvironmentVariable('Path', $newPath, [System.EnvironmentVariableTarget]::User)
            $env:Path = $newPath
            Write-Message "Added $appName to the system PATH."
        } else {
            Write-Message "$appName is already in the system PATH."
        }
    }
}

# Function to check and install Python packages from requirements.txt
function Update-PythonPackagesFromRequirements {
    param (
        [string]$requirementsPath
    )
    
    Write-Host "Checking Python packages from requirements.txt..." -ForegroundColor Cyan
    
    # Check if requirements.txt exists
    if (-not (Test-Path $requirementsPath)) {
        Write-Warning "requirements.txt not found at $requirementsPath. Skipping package updates."
        return
    }
    
    # Find Python executable
    $pythonExe = Get-Command python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
    if (-not $pythonExe) {
        Write-Warning "Python not found in PATH. Skipping package updates."
        return
    }
    
    # Install/upgrade packages from requirements.txt
    try {
        Write-Host "Installing/upgrading Python packages from requirements.txt..." -ForegroundColor Yellow
        & $pythonExe -m pip install -r $requirementsPath --upgrade
        Write-Host "Python packages updated successfully from requirements.txt" -ForegroundColor Green
    } catch {
        Write-Warning "Failed to update Python packages from requirements.txt: $_"
    }
}

# Main script
try {
    # Resolve the JSON path to ensure it's absolute
    $JsonPath = Resolve-Path $JsonPath -ErrorAction Stop
    
    # Resolve the requirements path to ensure it's absolute
    $RequirementsPath = Resolve-Path $RequirementsPath -ErrorAction Stop
    
    # Read JSON file
    $jsonContent = Get-Content -Path $JsonPath -Raw | ConvertFrom-Json
    
    # Update system tools using Install-Tool function
    Write-Host "Updating system tools..." -ForegroundColor Cyan
    foreach ($tool in $jsonContent.system_tools) {
        Install-Tool -appName $tool.appName `
                    -installCommand ([scriptblock]::Create($tool.installCommand)) `
                    -checkCommand ([scriptblock]::Create($tool.checkCommand)) `
                    -envPath $tool.envPath `
                    -manualInstallUrl $tool.manualInstallUrl `
                    -manualInstallPath $tool.manualInstallPath `
                    -ForceUpdate:$ForceUpdate
    }
    
    # Update Python packages from requirements.txt
    Update-PythonPackagesFromRequirements -requirementsPath $RequirementsPath
    
    Write-Host "Setup update complete!" -ForegroundColor Green
} catch {
    Write-Error "Error updating setup: $_"
    exit 1
} finally {
    # Stop logging
    Stop-Transcript
}