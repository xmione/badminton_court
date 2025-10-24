<#
.SYNOPSIS
    Generates a VERSION.md documentation file from a versions.json configuration file.

.DESCRIPTION
    This script reads a versions.json file containing version information for system tools and Python packages, 
    and generates a formatted VERSION.md markdown documentation file. The markdown file includes:
    - System Tools section with Visual Studio Build Tools, Windows SDK, and Docker Desktop details
    - Python section with interpreter information
    - Python Packages section with a table of packages and their versions
    - Update instructions and version testing information

    The script uses predefined descriptions for Python packages to enhance the documentation.

.PARAMETER JsonPath
    Specifies the path to the versions.json configuration file.
    Default: "..\versions.json" (root folder relative to script location)

.PARAMETER MarkdownPath
    Specifies the path where the VERSION.md file will be created.
    Default: "..\VERSION.md" (root folder relative to script location)

.EXAMPLE
    .\Scripts\Generate-VersionDocumentation.ps1
    Generates VERSION.md in the root folder using the default versions.json file

.EXAMPLE
    .\Scripts\Generate-VersionDocumentation.ps1 -JsonPath "C:\configs\my_versions.json" -MarkdownPath "C:\docs\VERSION.md"
    Generates VERSION.md at a custom location using a custom JSON file

.NOTES
    File Name      : Scripts\Generate-VersionDocumentation.ps1
    Author         : Solomio S. Sisante
    Prerequisite   : PowerShell 5.1 or later
    Copyright      : c(2025)

    IMPORTANT:
    - Requires a valid versions.json file in the specified location
    - Overwrites existing VERSION.md file without warning
    - Package descriptions are predefined in the script
    - Test in non-production environment first

    Version History:
    1.0 - Initial release
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
    # Read the JSON file
    if (-not (Test-Path $JsonPath)) {
        throw "versions.json file not found at $JsonPath"
    }
    
    $jsonContent = Get-Content -Path $JsonPath -Raw | ConvertFrom-Json

    # Define package descriptions
    $packageDescriptions = @{
        "asgiref" = "ASGI spec with assorted code"
        "billiard" = "Python multiprocessing fork"
        "celery" = "Distributed Task Queue"
        "certifi" = "Python package for providing Mozilla's CA Bundle"
        "charset-normalizer" = "Unicode Transformation Formats"
        "Django" = "High-level Python web framework"
        "django-celery-beat" = "Celery Periodic Tasks for Django"
        "django-timezone-field" = "Timezone field for Django"
        "kombu" = "Messaging library for Python"
        "matplotlib" = "Python plotting library"
        "numpy" = "Scientific computing with Python"
        "pandas" = "Data analysis and manipulation tool"
        "Pillow" = "Python Imaging Library"
        "plotly" = "Interactive graphing library"
        "psycopg2-binary" = "PostgreSQL database adapter"
        "python-dateutil" = "Extensions to the standard datetime module"
        "pytz" = "World timezone definitions"
        "six" = "Python 2 and 3 compatibility library"
        "sqlparse" = "Non-validating SQL parser"
        "tenacity" = "Retry library"
        "tzdata" = "IANA time zone database"
        "urllib3" = "HTTP library with thread-safe connection pooling"
        "vine" = "Promises, promises, promises"
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
- **Package ID**: $($jsonContent.system_tools.visual_studio_build_tools.package_id)
- **Version**: $($jsonContent.system_tools.visual_studio_build_tools.version)
- **Components**:
"@

    foreach ($component in $jsonContent.system_tools.visual_studio_build_tools.components) {
        $markdown += "  - $component`n"
    }

    # Add Windows SDK section
    $markdown += @"
### Windows SDK
- **Version**: $($jsonContent.system_tools.windows_sdk.version)
- **Display Name**: $($jsonContent.system_tools.windows_sdk.display_name)

"@

    # Add Docker Desktop section
    $markdown += @"
### Docker Desktop
- **Version**: $($jsonContent.system_tools.docker_desktop.version)
- **Download URL**: $($jsonContent.system_tools.docker_desktop.download_url)
- **Expected Version**: $($jsonContent.system_tools.docker_desktop.expected_version)

## Python (installed by bootstrap.ps1)

### Python Interpreter
- **Version**: $($jsonContent.python.version)
- **Installer URL**: $($jsonContent.python.installer_url)

## Python Packages (installed by bootstrap.ps1 via requirements.txt)

| Package | Version | Description |
|---------|---------|-------------|
"@

    # Add Python Packages table
    foreach ($package in $jsonContent.python_packages.PSObject.Properties) {
        $packageName = $package.Name
        $packageVersion = $package.Value
        
        # Get the description from our dictionary, or use a default if not found
        $description = if ($packageDescriptions.ContainsKey($packageName)) { 
            $packageDescriptions[$packageName] 
        } else { 
            "No description available" 
        }
        
        $markdown += "| $packageName | $packageVersion | $description |`n"
    }

    # Add the remaining sections
    $markdown += @"

## How to Update Versions

1. **System Tools**: Update the `versions.json` file with the new version numbers
2. **Python Packages**: Update the `requirements.txt` file with the new version numbers
3. **Documentation**: Update this `VERSIONS.md` file to reflect the changes

## Version Testing

All versions have been tested together and confirmed to work in the following environments:
- Windows 11 Pro (21H2)
- Windows Server 2022
- Docker Desktop $($jsonContent.system_tools.docker_desktop.version)
- Python $($jsonContent.python.version)
"@

    # Write the markdown content to VERSION.md
    $markdown | Out-File -FilePath $MarkdownPath -Encoding UTF8
    
    Write-Host "Successfully generated VERSION.md at $MarkdownPath" -ForegroundColor Green
}
catch {
    Write-Host "Error generating VERSION.md: $_" -ForegroundColor Red
    exit 1
}