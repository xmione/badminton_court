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
    - All other tools in the configuration

    The script creates a backup of the original JSON file before making changes.
    Missing Python packages are removed from the JSON file.

.PARAMETER JsonPath
    Specifies the path to the versions.json configuration file.
    Default: "..\versions.json" (root folder relative to script location)

.PARAMETER NoBackup
    Skips creating a backup of the original JSON file before updating.

.PARAMETER KeepMissingPackages
    Keeps Python packages in the JSON file even if they are not installed.

.EXAMPLE
    .\Scripts\Update-JsonFromSetup.ps1
    Updates the default versions.json file in the root folder with current system versions (creates backup, removes missing packages)

.EXAMPLE
    .\Scripts\Update-JsonFromSetup.ps1 -JsonPath "C:\configs\my_versions.json" -NoBackup
    Updates a custom JSON file without creating a backup

.EXAMPLE
    .\Scripts\Update-JsonFromSetup.ps1 -KeepMissingPackages
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
    [switch]$NoBackup,
    [switch]$KeepMissingPackages
)

# Get the script directory
 $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Import the InstallTool module from the same directory
. "$PSScriptRoot\InstallTool.ps1"

# Additional version detection functions for all tools

function Get-ChocolateyVersion {
    $chocoPath = "C:\ProgramData\chocolatey\bin\choco.exe"
    if (Test-Path $chocoPath) {
        try {
            $versionInfo = & $chocoPath --version
            if ($versionInfo -match "(\d+\.\d+\.\d+)") {
                return $matches[1]
            }
        } catch {
            # Fallback to file version
            $fileInfo = Get-Item $chocoPath
            return $fileInfo.VersionInfo.ProductVersion
        }
    }
    return $null
}

function Get-MinGWVersion {
    $gccPath = "C:\ProgramData\mingw64\mingw64\bin\gcc.exe"
    if (Test-Path $gccPath) {
        try {
            $versionInfo = & $gccPath --version
            if ($versionInfo -match "gcc.*?(\d+\.\d+\.\d+)") {
                return $matches[1]
            }
        } catch {}
    }
    return $null
}

function Get-NodeJSVersion {
    $nodePath = "C:\Program Files\nodejs\node.exe"
    if (Test-Path $nodePath) {
        try {
            $versionInfo = & $nodePath --version
            if ($versionInfo -match "v(\d+\.\d+\.\d+)") {
                return $matches[1]
            }
        } catch {}
    }
    return $null
}

function Get-PnpmVersion {
    $pnpmPath = "C:\ProgramData\chocolatey\bin\pnpm.exe"
    if (Test-Path $pnpmPath) {
        try {
            $versionInfo = & $pnpmPath --version
            if ($versionInfo -match "(\d+\.\d+\.\d+)") {
                return $matches[1]
            }
        } catch {}
    }
    return $null
}

function Get-GitVersion {
    $gitPath = "C:\Program Files\Git\cmd\git.exe"
    if (Test-Path $gitPath) {
        try {
            $versionInfo = & $gitPath --version
            if ($versionInfo -match "git version (\d+\.\d+\.\d+)") {
                return $matches[1]
            }
        } catch {}
    }
    return $null
}

function Get-GitHubCLIVersion {
    $ghPath = "C:\Program Files\GitHub CLI\gh.exe"
    if (Test-Path $ghPath) {
        try {
            $versionInfo = & $ghPath --version
            if ($versionInfo -match "gh version (\d+\.\d+\.\d+)") {
                return $matches[1]
            }
        } catch {}
    }
    return $null
}

function Get-NVMVersion {
    $nvmPath = "$env:LOCALAPPDATA\nvm\nvm.exe"
    if (Test-Path $nvmPath) {
        try {
            $fileInfo = Get-Item $nvmPath
            return $fileInfo.VersionInfo.ProductVersion
        } catch {}
    }
    return $null
}

function Get-DotNetVersion {
    $dotnetPath = "$HOME\.dotnet\dotnet.exe"
    if (Test-Path $dotnetPath) {
        try {
            $versionInfo = & $dotnetPath --version
            return $versionInfo.Trim()
        } catch {}
    }
    return $null
}

function Get-OpenSSHVersion {
    $sshPath = "C:\Windows\System32\OpenSSH\ssh.exe"
    if (Test-Path $sshPath) {
        try {
            $fileInfo = Get-Item $sshPath
            return $fileInfo.VersionInfo.ProductVersion
        } catch {}
    }
    return $null
}

function Get-VercelVersion {
    try {
        $vercelCmd = Get-Command vercel -ErrorAction SilentlyContinue
        if ($vercelCmd) {
            $versionInfo = & $vercelCmd.Source --version
            if ($versionInfo -match "(\d+\.\d+\.\d+)") {
                return $matches[1]
            }
        }
    } catch {}
    return $null
}

function Get-GitCredentialManagerVersion {
    $gcmPath = "$env:ProgramFiles\Git\mingw64\bin\git-credential-manager.exe"
    if (Test-Path $gcmPath) {
        try {
            $fileInfo = Get-Item $gcmPath
            return $fileInfo.VersionInfo.ProductVersion
        } catch {}
    }
    return $null
}

function Get-GraphVizVersion {
    $gvprPath = "C:\Program Files\Graphviz\bin\gvpr.exe"
    if (Test-Path $gvprPath) {
        try {
            $fileInfo = Get-Item $gvprPath
            return $fileInfo.VersionInfo.ProductVersion
        } catch {}
    }
    return $null
}

function Get-GPGVersion {
    try {
        $gpgCmd = Get-Command gpg -ErrorAction SilentlyContinue
        if ($gpgCmd) {
            $versionInfo = & $gpgCmd.Source --version
            if ($versionInfo -match "gpg.*?(\d+\.\d+\.\d+)") {
                return $matches[1]
            }
        }
    } catch {}
    return $null
}

function Get-NgrokVersion {
    $ngrokPath = "$env:ProgramData\chocolatey\bin\ngrok.exe"
    if (Test-Path $ngrokPath) {
        try {
            $versionInfo = & $ngrokPath --version
            if ($versionInfo -match "ngrok version (\d+\.\d+\.\d+)") {
                return $matches[1]
            }
        } catch {
            $fileInfo = Get-Item $ngrokPath
            return $fileInfo.VersionInfo.ProductVersion
        }
    }
    return $null
}

# If JsonPath is relative, make it relative to the script directory
if (-not ([System.IO.Path]::IsPathRooted($JsonPath))) {
    $JsonPath = Join-Path -Path $ScriptDir -ChildPath $JsonPath
}

# Main script
try {
    # Resolve the JSON path to ensure it's absolute
    $JsonPath = Resolve-Path $JsonPath -ErrorAction Stop
    
    # Create backup if not skipped
    if (-not $NoBackup) {
        $backupPath = "$JsonPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item -Path $JsonPath -Destination $backupPath
        Write-Host "Created backup at $backupPath" -ForegroundColor Yellow
    }
    
    # Read existing JSON file
    $jsonContent = Get-Content -Path $JsonPath -Raw | ConvertFrom-Json
    
    # Update each tool in the system_tools array
    foreach ($tool in $jsonContent.system_tools) {
        $appName = $tool.appName
        $version = $null
        
        switch ($appName) {
            "Chocolatey" {
                $version = Get-ChocolateyVersion
                if ($version) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    Write-Host "Updated Chocolatey version to $version" -ForegroundColor Green
                }
            }
            
            "Visual Studio Build Tools" {
                $vsInfo = Get-VisualStudioBuildToolsVersion
                if ($vsInfo) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $vsInfo.version
                    } else {
                        $tool.version = $vsInfo.version
                    }
                    
                    if (-not $tool.PSObject.Properties.Name.Contains("components")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "components" -Value $vsInfo.components
                    } else {
                        $tool.components = $vsInfo.components
                    }
                    
                    Write-Host "Updated Visual Studio Build Tools version to $($vsInfo.version)" -ForegroundColor Green
                }
            }
            
            "Windows SDK" {
                $sdkInfo = Get-WindowsSDKVersion
                if ($sdkInfo) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $sdkInfo.version
                    } else {
                        $tool.version = $sdkInfo.version
                    }
                    
                    if (-not $tool.PSObject.Properties.Name.Contains("display_name")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "display_name" -Value $sdkInfo.display_name
                    } else {
                        $tool.display_name = $sdkInfo.display_name
                    }
                    
                    Write-Host "Updated Windows SDK version to $($sdkInfo.version)" -ForegroundColor Green
                }
            }
            
            "Docker Desktop" {
                $dockerInfo = Get-DockerDesktopVersion
                if ($dockerInfo) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $dockerInfo.version
                    } else {
                        $tool.version = $dockerInfo.version
                    }
                    
                    if (-not $tool.PSObject.Properties.Name.Contains("expected_version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "expected_version" -Value $dockerInfo.expected_version
                    } else {
                        $tool.expected_version = $dockerInfo.expected_version
                    }
                    
                    Write-Host "Updated Docker Desktop version to $($dockerInfo.version)" -ForegroundColor Green
                }
            }
            
            "MinGW" {
                $version = Get-MinGWVersion
                if ($version) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    Write-Host "Updated MinGW version to $version" -ForegroundColor Green
                }
            }
            
            "nodejs" {
                $version = Get-NodeJSVersion
                if ($version) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    Write-Host "Updated Node.js version to $version" -ForegroundColor Green
                }
            }
            
            "pnpm" {
                $version = Get-PnpmVersion
                if ($version) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    Write-Host "Updated pnpm version to $version" -ForegroundColor Green
                }
            }
            
            "git" {
                $version = Get-GitVersion
                if ($version) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    Write-Host "Updated Git version to $version" -ForegroundColor Green
                }
            }
            
            "gh" {
                $version = Get-GitHubCLIVersion
                if ($version) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    Write-Host "Updated GitHub CLI version to $version" -ForegroundColor Green
                }
            }
            
            "nvm" {
                $version = Get-NVMVersion
                if ($version) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    Write-Host "Updated NVM version to $version" -ForegroundColor Green
                }
            }
            
            ".NET 9.0.100" {
                $version = Get-DotNetVersion
                if ($version) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    Write-Host "Updated .NET version to $version" -ForegroundColor Green
                }
            }
            
            "OpenSSH" {
                $version = Get-OpenSSHVersion
                if ($version) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    Write-Host "Updated OpenSSH version to $version" -ForegroundColor Green
                }
            }
            
            "Vercel CLI" {
                $version = Get-VercelVersion
                if ($version) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    Write-Host "Updated Vercel CLI version to $version" -ForegroundColor Green
                }
            }
            
            "Git Credential Manager" {
                $version = Get-GitCredentialManagerVersion
                if ($version) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    Write-Host "Updated Git Credential Manager version to $version" -ForegroundColor Green
                }
            }
            
            "GraphViz" {
                $version = Get-GraphVizVersion
                if ($version) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    Write-Host "Updated GraphViz version to $version" -ForegroundColor Green
                }
            }
            
            "GPG" {
                $version = Get-GPGVersion
                if ($version) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    Write-Host "Updated GPG version to $version" -ForegroundColor Green
                }
            }
            
            "Python" {
                $pythonInfo = Get-PythonVersion
                if ($pythonInfo) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $pythonInfo.version
                    } else {
                        $tool.version = $pythonInfo.version
                    }
                    
                    if (-not $tool.PSObject.Properties.Name.Contains("installer_url")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "installer_url" -Value $pythonInfo.installer_url
                    } else {
                        $tool.installer_url = $pythonInfo.installer_url
                    }
                    
                    Write-Host "Updated Python version to $($pythonInfo.version)" -ForegroundColor Green
                }
            }
            
            "ngrok" {
                $version = Get-NgrokVersion
                if ($version) {
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    Write-Host "Updated ngrok version to $version" -ForegroundColor Green
                }
            }
            
            default {
                Write-Warning "No version detection function available for: $appName" -ForegroundColor Yellow
            }
        }
    }
    
    # Save updated JSON
    $jsonContent | ConvertTo-Json -Depth 10 | Set-Content -Path $JsonPath
    Write-Host "`nJSON file updated successfully!" -ForegroundColor Green
    Write-Host "All tools now have version information recorded." -ForegroundColor Green
    
} catch {
    Write-Error "Error updating JSON file: $_"
    exit 1
}