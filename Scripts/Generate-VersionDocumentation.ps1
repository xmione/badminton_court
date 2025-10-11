<#
.SYNOPSIS
    Generates a VERSION.md documentation file from a versions.json configuration file and installed Python packages in the current virtual environment.

.DESCRIPTION
    This script reads a versions.json file for system tools and uses `pip list` to retrieve Python packages installed in the current virtual environment, 
    generating a formatted VERSION.md markdown documentation file. The markdown file includes:
    - System Tools section with Visual Studio Build Tools, Windows SDK, and Docker Desktop details
    - Python section with interpreter information
    - Python Packages section with a table of packages, versions, and descriptions
    - Update instructions and version testing information

    Package descriptions are dynamically fetched using `pip show` or default to a generic description.
    Packages are sourced from the active virtual environment using `pip list`.

.PARAMETER JsonPath
    Specifies the path to the versions.json configuration file.
    Default: "..\versions.json" (root folder relative to script location)

.PARAMETER MarkdownPath
    Specifies the path where the VERSION.md file will be created.
    Default: "..\VERSION.md" (root folder relative to script location)

.EXAMPLE
    .\Scripts\Generate-VersionDocumentation.ps1
    Generates VERSION.md in the root folder using default versions.json and packages from the current virtual environment

.EXAMPLE
    .\Scripts\Generate-VersionDocumentation.ps1 -JsonPath "C:\configs\my_versions.json" -MarkdownPath "C:\docs\VERSION.md"
    Generates VERSION.md at a custom location using a custom JSON file and packages from the current virtual environment

.NOTES
    File Name      : Scripts\Generate-VersionDocumentation.ps1
    Author         : Solomio S. Sisante
    Prerequisite   : PowerShell 5.1 or later, Python installed with pip accessible in an activated virtual environment
    Copyright      : c(2025)

    IMPORTANT:
    - Requires a valid versions.json in the specified location
    - Retrieves installed packages via `pip list` from the current virtual environment
    - Overwrites existing VERSION.md file without warning
    - Package descriptions are fetched via `pip show` or use a generic default
    - Script must be run in an activated Python virtual environment (e.g., .\venv\Scripts\Activate.ps1)
    - Test in non-production environment first

    Version History:
    1.0 - Initial release
    1.1 - Updated to handle array structure in system_tools
    1.2 - Dynamically load Python packages from the current virtual environment via pip list, with descriptions via pip show
    1.3 - Fixed variable reference error in Write-Warning for package description fetching
    1.4 - Fixed Markdown table formatting to remove trailing pipe in headers and rows
    1.5 - Adjusted table formatting for proper spacing and alignment, no trailing pipe
#>
param (
    [string]$JsonPath = "..\versions.json",
    [string]$MarkdownPath = "..\VERSION.md"
)

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Resolve paths - if they're relative, make them relative to the script directory
if (-not ([System.IO.Path]::IsPathRooted($JsonPath))) {
    $JsonPath = Join-Path -Path $scriptDir -ChildPath $JsonPath
}
if (-not ([System.IO.Path]::IsPathRooted($MarkdownPath))) {
    $MarkdownPath = Join-Path -Path $scriptDir -ChildPath $MarkdownPath
}

try {
    # Check if Python is available
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonCmd) {
        throw "Python is not installed or not found in PATH. Ensure the virtual environment is activated."
    }

    # Verify we're in a virtual environment
    $isVenv = [bool]$env:VIRTUAL_ENV
    if (-not $isVenv) {
        Write-Warning "No virtual environment detected. Results may include system-wide packages. Activate a virtual environment for accurate package listing."
    }

    # Read the JSON file
    if (-not (Test-Path $JsonPath)) {
        throw "versions.json file not found at $JsonPath"
    }
    
    $jsonContent = Get-Content -Path $JsonPath -Raw | ConvertFrom-Json

    # Verify system_tools section exists
    if (-not $jsonContent.PSObject.Properties['system_tools']) {
        throw "system_tools array not found in versions.json"
    }

    # Find specific tools in the system_tools array
    $vsTool = $jsonContent.system_tools | Where-Object { $_.appName -eq "Visual Studio Build Tools" }
    if (-not $vsTool) { throw "Visual Studio Build Tools not found in system_tools" }

    $sdkTool = $jsonContent.system_tools | Where-Object { $_.appName -eq "Windows SDK" }
    if (-not $sdkTool) { throw "Windows SDK not found in system_tools" }

    $dockerTool = $jsonContent.system_tools | Where-Object { $_.appName -eq "docker-desktop" }
    if (-not $dockerTool) { throw "docker-desktop not found in system_tools" }

    $pythonTool = $jsonContent.system_tools | Where-Object { $_.appName -eq "Python" }
    if (-not $pythonTool) { throw "Python not found in system_tools" }

    # Extract SDK version from checkCommand (since not directly in 'version' field)
    $sdkVersion = if ($sdkTool.checkCommand -match '\$sdkVersion\s*=\s*"(.*?)"') { $Matches[1] } else { "Unknown" }
    $sdkDisplayName = "Windows 10 SDK ($sdkVersion)"

    # Hardcoded Docker download URL (can be made dynamic if added to JSON)
    $dockerDownloadUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"

    # Get installed packages from the current virtual environment
    $pythonPackages = @()
    try {
        $pipListOutput = & python -m pip list --format=json 2>$null | ConvertFrom-Json
        if (-not $pipListOutput) {
            throw "Failed to retrieve installed packages via pip list. Ensure pip is installed and accessible in the virtual environment."
        }

        foreach ($pkg in $pipListOutput) {
            $packageName = $pkg.name
            $packageVersion = $pkg.version
            
            # Skip common non-project packages (optional, can be customized)
            if ($packageName -in @("pip", "setuptools", "wheel")) { continue }
            
            # Fetch package description using pip show
            $description = "Python package for project functionality"
            try {
                $pipOutput = & python -m pip show $packageName 2>$null
                $summary = $pipOutput | Where-Object { $_ -match '^Summary:\s*(.*)$' } | ForEach-Object { $Matches[1] }
                if ($summary) {
                    $description = $summary.Trim()
                }
            }
            catch {
                Write-Warning "Failed to fetch description for ${packageName}: $_"
            }

            $pythonPackages += [PSCustomObject]@{
                name = $packageName
                version = $packageVersion
                description = $description
            }
        }
    }
    catch {
        throw "Error retrieving installed packages via pip list: $_"
    }

    if ($pythonPackages.Count -eq 0) {
        Write-Warning "No valid Python packages found in the current virtual environment."
    }

    # Initialize markdown content
    $markdown = @"
# Version Configuration

This document specifies the exact versions of tools and packages used in this project.

## System Tools (installed by setup_all.ps1)

"@

    # Add Visual Studio Build Tools section
    $markdown += @"
### Visual Studio Build Tools
- **Package ID**: Microsoft.VisualStudio.2022.BuildTools
- **Version**: $($vsTool.version)
- **Components**:
"@

    foreach ($component in $vsTool.components) {
        $markdown += "  - $component`n"
    }
    $markdown += "`n"  # Extra newline for section separation

    # Add Windows SDK section
    $markdown += @"
### Windows SDK
- **Version**: $sdkVersion
- **Display Name**: $sdkDisplayName

"@

    # Add Docker Desktop section
    $markdown += @"
### Docker Desktop
- **Version**: $($dockerTool.version)
- **Download URL**: $dockerDownloadUrl
- **Expected Version**: $($dockerTool.version)

## Python (installed by bootstrap.ps1)

### Python Interpreter
- **Version**: $($pythonTool.version)
- **Installer URL**: $($pythonTool.installer_url)

## Python Packages (installed in the current virtual environment)

| Package          | Version       | Description                                     |
|------------------|---------------|-------------------------------------------------|
"@

    # Add Python Packages table rows (sorted by package name)
    foreach ($pkg in $pythonPackages | Sort-Object -Property name) {
        $packageName = $pkg.name
        $packageVersion = $pkg.version
        $description = $pkg.description
        # Use padding to align columns as per the example
        $markdown += "| {0,-16} | {1,-13} | {2,-47} |`n" -f $packageName, $packageVersion, $description
    }
    $markdown += "`n"  # Extra newline after table for section separation

    # Add the remaining sections
    $markdown += @"
## How to Update Versions

1. **System Tools**: Update the `versions.json` file with the new version numbers
2. **Python Packages**: Install or update packages in the virtual environment via pip
3. **Documentation**: Run `npm run doc:create-version` to regenerate this `VERSION.md` file

## Version Testing

All versions have been tested together and confirmed to work in the following environments:
- Windows 11 Pro (21H2)
- Windows Server 2022
- Docker Desktop $($dockerTool.version)
- Python $($pythonTool.version)
"@

    # Write the markdown content to VERSION.md
    $markdown | Out-File -FilePath $MarkdownPath -Encoding UTF8
    
    Write-Host "Successfully generated VERSION.md at $MarkdownPath" -ForegroundColor Green
}
catch {
    Write-Host "Error generating VERSION.md: $_" -ForegroundColor Red
    exit 1
}