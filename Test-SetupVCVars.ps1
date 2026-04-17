<#
.SYNOPSIS
    Test script to validate the native resolution logic for Visual Studio environment variables, specifically for MSVC tools.
.DESCRIPTION
    This script attempts to locate the Visual Studio installation using vswhere.exe, resolves the MSVC
    tools path, and injects it into the current session's PATH. It also sets a user-level environment variable for VCINSTALLDIR.
    The script includes logging for better visibility of the process and error handling to catch any issues during
    resolution.
.NOTES
    File Name      : Test-SetupVCVars.ps1
    Author         : Solomio S. Sisante
    Prerequisite   : PowerShell 5.1 or later
    Copyright      : c(2026) Solomio S. Sisante. All rights reserved.

    IMPORTANT:
    - This script is intended for testing the native resolution logic. It should be run in a clean environment where the original
      setup_all.ps1 logic is not present to ensure that we are truly testing the native resolution.
    - Ensure that vswhere.exe is available on the system, as it is critical for locating the Visual Studio installation.
    - The script will attempt to find the latest Visual Studio installation and resolve the MSVC tools path. If successful, it will
      inject the path into the current session and set a user-level environment variable for VCINSTALLDIR.
    - After running this test, you can verify that link.exe is available in the PATH to confirm that the resolution was successful.
    - This script is for testing purposes only and should not be used in production environments without proper validation and adjustments as needed.

#>

# Define logger for the test environment
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message"
}

function SetupVCVars {
    # 1. Locate vswhere.exe (Standard VS locator)
    $vsWherePath = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (!(Test-Path $vsWherePath)) {
        Write-Log "vswhere.exe not found. Cannot resolve VS paths." -Level "ERROR"
        return $false
    }

    # 2. Find the latest installation path
    $vsInstallPath = & $vsWherePath -latest -products * -property installationPath
    if (!$vsInstallPath) {
        Write-Log "Visual Studio installation not found." -Level "ERROR"
        return $false
    }

    Write-Log "Found VS at: $vsInstallPath" -Level "INFO"

    try {
        # 3. Resolve the MSVC Tools version directory
        $toolsRoot = Join-Path $vsInstallPath "VC\Tools\MSVC"
        if (!(Test-Path $toolsRoot)) { throw "MSVC Tools folder missing." }
        
        # Get the latest version folder (e.g., 14.40.33810)
        $version = Get-ChildItem $toolsRoot | Sort-Object Name -Descending | Select-Object -First 1 -ExpandProperty Name
        $msvcBinPath = Join-Path $toolsRoot "$version\bin\Hostx64\x64"

        if (Test-Path $msvcBinPath) {
            # 4. Inject into current session PATH
            $currentPaths = $env:PATH -split ';'
            if ($msvcBinPath -notin $currentPaths) {
                $env:PATH = "$msvcBinPath;" + $env:PATH
                Write-Log "Injected MSVC binaries into PATH." -Level "SUCCESS"
            }

            # 5. Set User-level variable to match your original script logic
            $vcDir = Join-Path $vsInstallPath "VC\"
            [System.Environment]::SetEnvironmentVariable("VCINSTALLDIR", $vcDir, "User")
            Set-Content -Path "env:VCINSTALLDIR" -Value $vcDir
            
            Write-Log "VCVars environment resolved natively." -Level "SUCCESS"
            return $true
        }
    }
    catch {
        Write-Log "Native resolution failed: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
    return $false
}

# Run the test
Write-Host "--- TESTING SETUPVCVARS NATIVE LOGIC ---" -ForegroundColor Cyan
$result = SetupVCVars

if ($result) {
    # Verify link.exe can actually be found now
    $checkLink = Get-Command link.exe -ErrorAction SilentlyContinue
    if ($checkLink) {
        Write-Host "VERIFIED: link.exe found at $($checkLink.Source)" -ForegroundColor Green
    }
}