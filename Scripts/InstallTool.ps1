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

# Function to check if winget exists, if not, provide guidance
function Test-Winget {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Write-Message "winget (Windows Package Manager) not found." -Level "WARNING"
        Write-Message "You can install it from: https://learn.microsoft.com/en-us/windows/package-manager/winget/" -Level "INFO"
        Write-Message "Or run: Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe" -Level "INFO"
        return $false
    }
    return $true
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
                    
                    # Check if the install command contains winget and if winget is available
                    $commandString = $installCommand.ToString()
                    if ($commandString -match "winget" -and -not (Test-Winget)) {
                        Write-Message "winget not available, skipping installation for $appName" -Level "WARNING"
                        $installFailed = $true
                        break
                    }
                    
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

        # Add a delay after installation before verification
        # This is especially important for Python which needs to register itself
        Write-Message "Waiting 10 seconds after installation before verification..." -Level "INFO"
        Start-Sleep -Seconds 10

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

                # Add a delay after manual installation
                Write-Message "Waiting 10 seconds after manual installation before verification..." -Level "INFO"
                Start-Sleep -Seconds 10

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

# Function to get Visual Studio Build Tools version
function Get-VisualStudioBuildToolsVersion {
    # Try to find vswhere.exe
    $vswherePath = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (-not (Test-Path $vswherePath)) {
        # Try in the current directory
        $vswherePath = Get-Command vswhere -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
        if (-not $vswherePath) {
            Write-Warning "vswhere.exe not found. Cannot determine Visual Studio Build Tools version."
            return $null
        }
    }
    
    # Find Visual Studio Build Tools installations
    $vsArgs = @(
        "-latest",
        "-products", "Microsoft.VisualStudio.Product.BuildTools",
        "-requires", "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
        "-property", "installationVersion",
        "-format", "json"
    )
    
    $vsInfo = & $vswherePath $vsArgs | ConvertFrom-Json
    
    if ($vsInfo) {
        $version = $vsInfo.installationVersion
        
        # Get the list of components using the registry
        $components = @()
        $instanceId = $vsInfo.instanceId
        $registryPath = "HKLM:\SOFTWARE\Microsoft\VisualStudio\SxS\VS7"
        if (Test-Path $registryPath) {
            $instances = Get-Item $registryPath | Get-ChildItem
            foreach ($instance in $instances) {
                if ($instance.Name -match $instanceId) {
                    $componentsPath = Join-Path $instance.PSPath "Components"
                    if (Test-Path $componentsPath) {
                        $components = Get-Item $componentsPath | Get-ChildItem | Select-Object -ExpandProperty Name
                    }
                    break
                }
            }
        }
        
        return @{
            version = $version
            components = $components
        }
    }
    
    return $null
}

# Function to get Windows SDK version
function Get-WindowsSDKVersion {
    # Check registry for installed SDKs
    $installedSDKs = Get-ChildItem -Path "HKLM:\SOFTWARE\Microsoft\Windows Kits\Installed Roots" -ErrorAction SilentlyContinue
    if (-not $installedSDKs) {
        # Try 32-bit registry view
        $installedSDKs = Get-ChildItem -Path "HKLM:\SOFTWARE\Wow6432Node\Microsoft\Windows Kits\Installed Roots" -ErrorAction SilentlyContinue
    }
    
    if (-not $installedSDKs) {
        # Try alternative registry path
        $installedSDKs = Get-ChildItem -Path "HKLM:\SOFTWARE\Microsoft\Windows Kits\Installed Kits" -ErrorAction SilentlyContinue
    }
    
    if (-not $installedSDKs) {
        return $null
    }
    
    foreach ($sdk in $installedSDKs) {
        $sdkPath = $sdk.GetValue("KitsRoot10")
        if (-not $sdkPath) {
            $sdkPath = $sdk.GetValue("InstallationFolder")
        }
        
        if ($sdkPath) {
            $sdkVersionPath = Join-Path $sdkPath "Include"
            if (Test-Path $sdkVersionPath) {
                $versions = Get-ChildItem -Path $sdkVersionPath -Directory | Select-Object -ExpandProperty Name
                $latestVersion = $versions | Sort-Object -Descending | Select-Object -First 1
                return @{
                    version = $latestVersion
                    display_name = "Windows 10 SDK ($($latestVersion.Split('.')[2..3] -join '.'))"
                }
            }
        }
    }
    return $null
}

# Function to get Docker Desktop version
function Get-DockerDesktopVersion {
    $dockerPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
    if (-not (Test-Path $dockerPath)) {
        # Try AppData location
        $dockerPath = "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
    }
    
    if (-not (Test-Path $dockerPath)) {
        return $null
    }
    
    $version = (Get-Item $dockerPath).VersionInfo.ProductVersion
    return @{
        version = $version
        expected_version = $version
    }
}

# Function to get Python version
function Get-PythonVersion {
    $pythonExe = Get-Command python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
    if (-not $pythonExe) {
        return $null
    }
    
    $version = & $pythonExe --version 2>&1
    if ($version -match "Python (\d+\.\d+\.\d+)") {
        $versionNumber = $matches[1]
        $installerUrl = "https://www.python.org/ftp/python/$versionNumber/python-$versionNumber-amd64.exe"
        return @{
            version = $versionNumber
            installer_url = $installerUrl
        }
    }
    return $null
}

# Function to get Python packages versions
function Get-PythonPackagesVersions {
    $pythonExe = Get-Command python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
    if (-not $pythonExe) {
        return @{}
    }
    
    $installedPackages = & $pythonExe -m pip list --format=json | ConvertFrom-Json
    $packages = @{}
    
    foreach ($package in $installedPackages) {
        # Store both original name and lowercase for case-insensitive matching
        $packages[$package.name] = $package.version
        $packages[$package.name.ToLower()] = $package.version
        
        # Handle common name variations (e.g., package-name vs package_name)
        $normalized = $package.name.ToLower().Replace('_', '-')
        $packages[$normalized] = $package.version
    }
    
    return $packages
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