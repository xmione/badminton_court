<#
.SYNOPSIS
    Updates a JSON configuration file to match currently installed software versions.

.DESCRIPTION
    This script scans the current system for installed software versions and updates a versions.json file to reflect the actual installed versions. It handles:
    - Visual Studio Build Tools
    - Windows SDK
    - Docker Desktop
    - Python interpreter
    - Python packages

    The script creates a backup of the original JSON file before making changes.
    Missing Python packages are removed from the JSON file.

.PARAMETER JsonPath
    Specifies the path to the versions.json configuration file.
    Default: "..\versions.json" (root folder relative to script location)

.PARAMETER Backup
    Creates a timestamped backup of the original JSON file before updating.
    Default: $true

.PARAMETER RemoveMissingPackages
    Removes Python packages from the JSON file if they are not installed.
    Default: $true

.EXAMPLE
    .\Scripts\Update-JsonFromSetup.ps1
    Updates the default versions.json file in the root folder with current system versions

.EXAMPLE
    .\Scripts\Update-JsonFromSetup.ps1 -JsonPath "C:\configs\my_versions.json" -Backup:$false
    Updates a custom JSON file without creating a backup

.EXAMPLE
    .\Scripts\Update-JsonFromSetup.ps1 -RemoveMissingPackages:$false
    Updates versions.json but keeps missing packages in the file

.NOTES
    File Name      : Scripts\Update-JsonFromSetup.ps1
    Author         : Solomio S. Sisante
    Prerequisite   : PowerShell 5.1 or later
    Copyright      : c(2025)

    IMPORTANT:
    - Run as Administrator for accurate system component detection
    - Requires Python to be in PATH for package version detection
    - Only updates versions for components that are currently installed
    - Test in non-production environment first
     
#>
param (
    [string]$JsonPath = "..\versions.json",
    [switch]$Backup = $true,
    [switch]$RemoveMissingPackages = $true
)

# Get the script directory
 $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# If JsonPath is relative, make it relative to the script directory
if (-not ([System.IO.Path]::IsPathRooted($JsonPath))) {
    $JsonPath = Join-Path -Path $ScriptDir -ChildPath $JsonPath
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
        
        # Get the installation path
        $pathArgs = @(
            "-latest",
            "-products", "Microsoft.VisualStudio.Product.BuildTools",
            "-requires", "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
            "-property", "installationPath",
            "-format", "json"
        )
        $pathInfo = & $vswherePath $pathArgs | ConvertFrom-Json
        $installationPath = $pathInfo.installationPath
        
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

# Main script
try {
    # Resolve the JSON path to ensure it's absolute
    $JsonPath = Resolve-Path $JsonPath -ErrorAction Stop
    
    # Create backup if requested
    if ($Backup) {
        $backupPath = "$JsonPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item -Path $JsonPath -Destination $backupPath
        Write-Host "Created backup at $backupPath" -ForegroundColor Yellow
    }
    
    # Read existing JSON file
    $jsonContent = Get-Content -Path $JsonPath -Raw | ConvertFrom-Json
    
    # Update Visual Studio Build Tools
    $vsInfo = Get-VisualStudioBuildToolsVersion
    if ($vsInfo) {
        $jsonContent.system_tools.visual_studio_build_tools.version = $vsInfo.version
        if ($vsInfo.components.Count -gt 0) {
            $jsonContent.system_tools.visual_studio_build_tools.components = $vsInfo.components
        }
        Write-Host "Updated Visual Studio Build Tools version to $($vsInfo.version)" -ForegroundColor Green
    } else {
        Write-Warning "Visual Studio Build Tools not found. Version not updated."
    }
    
    # Update Windows SDK
    $sdkInfo = Get-WindowsSDKVersion
    if ($sdkInfo) {
        $jsonContent.system_tools.windows_sdk.version = $sdkInfo.version
        $jsonContent.system_tools.windows_sdk.display_name = $sdkInfo.display_name
        Write-Host "Updated Windows SDK version to $($sdkInfo.version)" -ForegroundColor Green
    } else {
        Write-Warning "Windows SDK not found. Version not updated."
    }
    
    # Update Docker Desktop
    $dockerInfo = Get-DockerDesktopVersion
    if ($dockerInfo) {
        $jsonContent.system_tools.docker_desktop.version = $dockerInfo.version
        $jsonContent.system_tools.docker_desktop.expected_version = $dockerInfo.expected_version
        Write-Host "Updated Docker Desktop version to $($dockerInfo.version)" -ForegroundColor Green
    } else {
        Write-Warning "Docker Desktop not found. Version not updated."
    }
    
    # Update Python
    $pythonInfo = Get-PythonVersion
    if ($pythonInfo) {
        $jsonContent.python.version = $pythonInfo.version
        $jsonContent.python.installer_url = $pythonInfo.installer_url
        Write-Host "Updated Python version to $($pythonInfo.version)" -ForegroundColor Green
    } else {
        Write-Warning "Python not found. Version not updated."
    }
    
    # Update Python packages
    $packagesInfo = Get-PythonPackagesVersions
    if ($packagesInfo.Count -gt 0) {
        $missingPackages = @()
        $packagesToRemove = @()
        
        # Create a new ordered dictionary for packages
        $newPackages = [ordered]@{}
        
        foreach ($package in $jsonContent.python_packages.PSObject.Properties.Name) {
            # Try exact match first
            if ($packagesInfo.ContainsKey($package)) {
                $newPackages[$package] = $packagesInfo[$package]
                Write-Host "Updated Python package $package to $($packagesInfo[$package])" -ForegroundColor Green
                continue
            }
            
            # Try case-insensitive match
            $lowercasePackage = $package.ToLower()
            if ($packagesInfo.ContainsKey($lowercasePackage)) {
                $newPackages[$package] = $packagesInfo[$lowercasePackage]
                Write-Host "Updated Python package $package to $($packagesInfo[$lowercasePackage])" -ForegroundColor Green
                continue
            }
            
            # Try normalized name (underscores to hyphens)
            $normalizedPackage = $package.ToLower().Replace('_', '-')
            if ($packagesInfo.ContainsKey($normalizedPackage)) {
                $newPackages[$package] = $packagesInfo[$normalizedPackage]
                Write-Host "Updated Python package $package (normalized as $normalizedPackage) to $($packagesInfo[$normalizedPackage])" -ForegroundColor Green
                continue
            }
            
            # Package not found
            $missingPackages += $package
            if ($RemoveMissingPackages) {
                $packagesToRemove += $package
                Write-Host "Removing missing Python package $package from JSON file" -ForegroundColor Yellow
            } else {
                Write-Warning "Python package $package not found. Version not updated."
            }
        }
        
        # Update the python_packages object
        if ($RemoveMissingPackages -and $packagesToRemove.Count -gt 0) {
            $jsonContent.python_packages = $newPackages
            Write-Host "Removed $($packagesToRemove.Count) missing packages from JSON file" -ForegroundColor Yellow
        }
        
        if ($missingPackages.Count -gt 0) {
            Write-Host "`nMissing packages: $($missingPackages -join ', ')" -ForegroundColor Yellow
            if (-not $RemoveMissingPackages) {
                Write-Host "You may need to install these packages manually:" -ForegroundColor Yellow
                foreach ($pkg in $missingPackages) {
                    Write-Host "  pip install $pkg" -ForegroundColor Yellow
                }
            }
        }
    } else {
        Write-Warning "Python packages not found. Versions not updated."
    }
    
    # Save updated JSON
    $jsonContent | ConvertTo-Json -Depth 10 | Set-Content -Path $JsonPath
    Write-Host "`nJSON file updated successfully!" -ForegroundColor Green
} catch {
    Write-Error "Error updating JSON file: $_"
    exit 1
}