<#
.SYNOPSIS
    Updates system components to match versions specified in a JSON configuration file.

.DESCRIPTION
    This script compares currently installed software versions against a versions.json file and updates any mismatched components to match the configuration. It handles:
    - Visual Studio Build Tools
    - Windows SDK
    - Docker Desktop
    - Python interpreter
    - Python packages

    The script will automatically download and install/update components as needed to match the JSON configuration.

.PARAMETER JsonPath
    Specifies the path to the versions.json configuration file.
    Default: "..\versions.json" (root folder relative to script location)

.PARAMETER ForceUpdate
    Forces updates even if versions already match.
    Default: $false

.EXAMPLE
    .\Scripts\Update-SetupFromJson.ps1
    Updates components to match versions in the default versions.json file in the root folder

.EXAMPLE
    .\Scripts\Update-SetupFromJson.ps1 -JsonPath "C:\configs\my_versions.json" -ForceUpdate
    Updates components using a custom JSON file and forces updates even if versions match

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

    Version History:
    1.0 - Initial release
    1.1 - Fixed path resolution for versions.json file
    1.2 - Fixed Visual Studio detection and update using vswhere
#>
param (
    [string]$JsonPath = "..\versions.json",
    [switch]$ForceUpdate = $false
)

# Get the script directory
 $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# If JsonPath is relative, make it relative to the script directory
if (-not ([System.IO.Path]::IsPathRooted($JsonPath))) {
    $JsonPath = Join-Path -Path $ScriptDir -ChildPath $JsonPath
}

# Function to check and install Visual Studio Build Tools
function Update-VisualStudioBuildTools {
    param (
        [object]$vsConfig
    )
    
    $requiredVersion = $vsConfig.version
    $requiredComponents = $vsConfig.components
    $packageId = $vsConfig.package_id
    
    Write-Host "Checking Visual Studio Build Tools..." -ForegroundColor Cyan
    
    # Try to find vswhere.exe
    $vswherePath = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (-not (Test-Path $vswherePath)) {
        # Try in the current directory
        $vswherePath = Get-Command vswhere -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
        if (-not $vswherePath) {
            Write-Warning "vswhere.exe not found. Cannot determine Visual Studio Build Tools version."
            return
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
    
    if (-not $vsInfo) {
        Write-Host "Visual Studio Build Tools not installed. Installing required version..." -ForegroundColor Yellow
        
        # Check if Visual Studio Installer is available
        $vsInstallerPath = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vs_installer.exe"
        if (-not (Test-Path $vsInstallerPath)) {
            Write-Warning "Visual Studio Installer not found. Skipping Visual Studio Build Tools update."
            return
        }
        
        # Install Visual Studio Build Tools
        $componentsArgs = $requiredComponents -join " --add "
        $installArgs = "install --installPath `"C:\BuildTools`" --add $componentsArgs --quiet --norestart"
        Start-Process -FilePath $vsInstallerPath -ArgumentList $installArgs -Wait
        Write-Host "Visual Studio Build Tools installed." -ForegroundColor Green
        return
    }
    
    # Check version
    $installedVersion = $vsInfo.installationVersion
    
    if ($installedVersion -ne $requiredVersion -or $ForceUpdate) {
        Write-Host "Visual Studio Build Tools version mismatch. Current: $installedVersion, Required: $requiredVersion" -ForegroundColor Yellow
        Write-Host "Updating Visual Studio Build Tools..." -ForegroundColor Yellow
        
        # Check if Visual Studio Installer is available
        $vsInstallerPath = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vs_installer.exe"
        if (-not (Test-Path $vsInstallerPath)) {
            Write-Warning "Visual Studio Installer not found. Skipping Visual Studio Build Tools update."
            return
        }
        
        # Update Visual Studio Build Tools
        $updateArgs = "update --installPath `"C:\BuildTools`" --quiet --norestart"
        Start-Process -FilePath $vsInstallerPath -ArgumentList $updateArgs -Wait
        Write-Host "Visual Studio Build Tools updated." -ForegroundColor Green
    } else {
        Write-Host "Visual Studio Build Tools version matches: $requiredVersion" -ForegroundColor Green
    }
}

# Function to check and install Windows SDK
function Update-WindowsSDK {
    param (
        [object]$sdkConfig
    )
    
    $requiredVersion = $sdkConfig.version
    Write-Host "Checking Windows SDK..." -ForegroundColor Cyan
    
    # Check registry for installed SDKs
    $installedSDKs = Get-ChildItem -Path "HKLM:\SOFTWARE\Microsoft\Windows Kits\Installed Roots" -ErrorAction SilentlyContinue
    $sdkFound = $false
    
    foreach ($sdk in $installedSDKs) {
        $sdkPath = $sdk.GetValue("KitsRoot10")
        if ($sdkPath) {
            $sdkVersionPath = Join-Path $sdkPath "Include"
            if (Test-Path $sdkVersionPath) {
                $versions = Get-ChildItem -Path $sdkVersionPath -Directory | Select-Object -ExpandProperty Name
                if ($versions -contains $requiredVersion) {
                    $sdkFound = $true
                    break
                }
            }
        }
    }
    
    if (-not $sdkFound -or $ForceUpdate) {
        Write-Host "Windows SDK $requiredVersion not found. Installing..." -ForegroundColor Yellow
        
        # Download and install SDK (simplified - you might need to adjust the installer URL)
        $sdkInstallerUrl = "https://go.microsoft.com/fwlink/p/?LinkID=2033908" # Windows 10 SDK installer
        $installerPath = "$env:TEMP\WindowsSDKInstaller.exe"
        
        try {
            Invoke-WebRequest -Uri $sdkInstallerUrl -OutFile $installerPath
            Start-Process -FilePath $installerPath -ArgumentList "/quiet /norestart" -Wait
            Write-Host "Windows SDK $requiredVersion installed." -ForegroundColor Green
        } catch {
            Write-Warning "Failed to download or install Windows SDK: $_"
        }
    } else {
        Write-Host "Windows SDK version matches: $requiredVersion" -ForegroundColor Green
    }
}

# Function to check and install Docker Desktop
function Update-DockerDesktop {
    param (
        [object]$dockerConfig
    )
    
    $requiredVersion = $dockerConfig.version
    Write-Host "Checking Docker Desktop..." -ForegroundColor Cyan
    
    # Check if Docker Desktop is installed
    $dockerPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
    if (-not (Test-Path $dockerPath)) {
        Write-Host "Docker Desktop not installed. Installing..." -ForegroundColor Yellow
        
        # Download and install Docker Desktop
        $installerUrl = $dockerConfig.download_url
        $installerPath = "$env:TEMP\DockerDesktopInstaller.exe"
        
        try {
            Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath
            Start-Process -FilePath $installerPath -ArgumentList "install --quiet" -Wait
            Write-Host "Docker Desktop installed." -ForegroundColor Green
        } catch {
            Write-Warning "Failed to download or install Docker Desktop: $_"
        }
        return
    }
    
    # Check version
    $installedVersion = (Get-Item $dockerPath).VersionInfo.ProductVersion
    if ($installedVersion -ne $requiredVersion -or $ForceUpdate) {
        Write-Host "Docker Desktop version mismatch. Current: $installedVersion, Required: $requiredVersion" -ForegroundColor Yellow
        Write-Host "Updating Docker Desktop..." -ForegroundColor Yellow
        
        # Download and install the new version
        $installerUrl = $dockerConfig.download_url
        $installerPath = "$env:TEMP\DockerDesktopInstaller.exe"
        
        try {
            Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath
            Start-Process -FilePath $installerPath -ArgumentList "update --quiet" -Wait
            Write-Host "Docker Desktop updated to $requiredVersion" -ForegroundColor Green
        } catch {
            Write-Warning "Failed to update Docker Desktop: $_"
        }
    } else {
        Write-Host "Docker Desktop version matches: $requiredVersion" -ForegroundColor Green
    }
}

# Function to check and install Python
function Update-Python {
    param (
        [object]$pythonConfig
    )
    
    $requiredVersion = $pythonConfig.version
    Write-Host "Checking Python..." -ForegroundColor Cyan
    
    # Check if Python is installed
    $pythonPath = "$env:LocalAppData\Programs\Python\Python$($requiredVersion.Split('.')[0])$($requiredVersion.Split('.')[1])\python.exe"
    if (-not (Test-Path $pythonPath)) {
        Write-Host "Python $requiredVersion not installed. Installing..." -ForegroundColor Yellow
        
        # Download and install Python
        $installerUrl = $pythonConfig.installer_url
        $installerPath = "$env:TEMP\python-installer.exe"
        
        try {
            Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath
            Start-Process -FilePath $installerPath -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1" -Wait
            Write-Host "Python $requiredVersion installed." -ForegroundColor Green
        } catch {
            Write-Warning "Failed to download or install Python: $_"
        }
        return
    }
    
    # Check version
    $installedVersion = & $pythonPath --version 2>&1
    if ($installedVersion -notmatch $requiredVersion -or $ForceUpdate) {
        Write-Host "Python version mismatch. Current: $installedVersion, Required: $requiredVersion" -ForegroundColor Yellow
        Write-Host "Updating Python..." -ForegroundColor Yellow
        
        # Download and install the new version
        $installerUrl = $pythonConfig.installer_url
        $installerPath = "$env:TEMP\python-installer.exe"
        
        try {
            Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath
            Start-Process -FilePath $installerPath -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1" -Wait
            Write-Host "Python updated to $requiredVersion" -ForegroundColor Green
        } catch {
            Write-Warning "Failed to update Python: $_"
        }
    } else {
        Write-Host "Python version matches: $requiredVersion" -ForegroundColor Green
    }
}

# Function to check and install Python packages
function Update-PythonPackages {
    param (
        [object]$packagesConfig
    )
    
    Write-Host "Checking Python packages..." -ForegroundColor Cyan
    
    # Find Python executable
    $pythonExe = Get-Command python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
    if (-not $pythonExe) {
        Write-Warning "Python not found in PATH. Skipping package updates."
        return
    }
    
    # Get installed packages
    $installedPackages = & $pythonExe -m pip list --format=json | ConvertFrom-Json
    
    foreach ($package in $packagesConfig.PSObject.Properties) {
        $packageName = $package.Name
        $requiredVersion = $package.Value
        
        $installedPackage = $installedPackages | Where-Object { $_.name -eq $packageName }
        
        if (-not $installedPackage -or $installedPackage.version -ne $requiredVersion -or $ForceUpdate) {
            if ($installedPackage) {
                Write-Host "Python package $packageName version mismatch. Current: $($installedPackage.version), Required: $requiredVersion" -ForegroundColor Yellow
            } else {
                Write-Host "Python package $packageName not installed. Installing..." -ForegroundColor Yellow
            }
            
            try {
                & $pythonExe -m pip install "$packageName==$requiredVersion" --quiet
                Write-Host "Python package $packageName updated to $requiredVersion" -ForegroundColor Green
            } catch {
                Write-Warning "Failed to update Python package $packageName: $_"
            }
        } else {
            Write-Host "Python package $packageName version matches: $requiredVersion" -ForegroundColor Green
        }
    }
}

# Main script
try {
    # Resolve the JSON path to ensure it's absolute
    $JsonPath = Resolve-Path $JsonPath -ErrorAction Stop
    
    # Read JSON file
    $jsonContent = Get-Content -Path $JsonPath -Raw | ConvertFrom-Json
    
    # Update system tools
    Update-VisualStudioBuildTools -vsConfig $jsonContent.system_tools.visual_studio_build_tools
    Update-WindowsSDK -sdkConfig $jsonContent.system_tools.windows_sdk
    Update-DockerDesktop -dockerConfig $jsonContent.system_tools.docker_desktop
    
    # Update Python
    Update-Python -pythonConfig $jsonContent.python
    
    # Update Python packages
    Update-PythonPackages -packagesConfig $jsonContent.python_packages
    
    Write-Host "Setup update complete!" -ForegroundColor Green
} catch {
    Write-Error "Error updating setup: $_"
    exit 1
}