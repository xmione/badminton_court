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

# Import the InstallTool module from the same directory
. "$PSScriptRoot\InstallTool.ps1"

# If JsonPath is relative, make it relative to the script directory
if (-not ([System.IO.Path]::IsPathRooted($JsonPath))) {
    $JsonPath = Join-Path -Path $ScriptDir -ChildPath $JsonPath
}

# If RequirementsPath is relative, make it relative to the script directory
if (-not ([System.IO.Path]::IsPathRooted($RequirementsPath))) {
    $RequirementsPath = Join-Path -Path $ScriptDir -ChildPath $RequirementsPath
}

# Log file path
$logFileName = "install_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Redirect all output to the log file
Start-Transcript -Path $logFileName -Append

# Main script
try {
    # Resolve the JSON path to ensure it's absolute
    $JsonPath = (Resolve-Path $JsonPath -ErrorAction Stop).Path
    
    # Resolve the requirements path to ensure it's absolute
    $RequirementsPath = (Resolve-Path $RequirementsPath -ErrorAction Stop).Path
    
    # Read JSON file
    $jsonContent = Get-Content -Path $JsonPath -Raw | ConvertFrom-Json
    
    # Update system tools using Install-Tool function
    Write-Host "Updating system tools..." -ForegroundColor Cyan
    foreach ($tool in $jsonContent.system_tools) {

        # --- NEW CORE TOOL CHECK ---
        # Skip if the tool is explicitly marked as NOT a core tool
        if ($tool.PSObject.Properties.Name.Contains("isCoreTool") -and $tool.isCoreTool -eq $false) {
            Write-Host "Skipping non-core tool: $($tool.appName)" -ForegroundColor Gray
            continue
        }
        
        # --- PATH RESOLUTION FIX ---
        # Detects if the installCommand is a local script (.\) and resolves it to an absolute path
        $rawCommand = $tool.installCommand
        if ($rawCommand -like ".\*") {
            # Extract script name and arguments
            $parts = $rawCommand -split " ", 2
            $scriptName = $parts[0].Substring(2) # Remove .\
            
            # Use $scriptArgs instead of the reserved $args variable
            $scriptArgs = if ($parts.Count -gt 1) { $parts[1] } else { "" }
            
            $absoluteScriptPath = Join-Path -Path $PSScriptRoot -ChildPath $scriptName
            $finalCommand = "$absoluteScriptPath $scriptArgs".Trim()
            $executableCommand = [scriptblock]::Create($finalCommand)
        } else {
            $executableCommand = [scriptblock]::Create($rawCommand)
        }

        # --- PRE-INSTALL ENVIRONMENT REFRESH ---
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

        Install-Tool -appName $tool.appName `
                    -installCommand $executableCommand `
                    -checkCommand ([scriptblock]::Create($tool.checkCommand)) `
                    -envPath $tool.envPath `
                    -manualInstallUrl $tool.manualInstallUrl `
                    -manualInstallPath $tool.manualInstallPath `
                    -ForceUpdate:$ForceUpdate `
                    -MaxRetries $tool.maxRetries

        # --- POST-INSTALL ENVIRONMENT REFRESH ---
        # Refreshes the session path so the verification check (checkCommand) sees the new tool
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
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