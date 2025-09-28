<#
.SYNOPSIS
    Sets up the Python development environment by installing Python, creating a virtual environment, and running the Python setup script.

.DESCRIPTION
    This PowerShell script handles the Python environment setup by:
    - Installing Python (version from versions.json)
    - Creating and activating a virtual environment (venv)
    - Running setup_install.py inside venv to complete Python-side setup

    The script checks for existing Python installations, installs Python if necessary, creates a virtual environment,
    and then runs the Python setup script to install dependencies and configure the Django project.

.PARAMETER Force
    Forces recreation of the virtual environment even if it already exists.

.EXAMPLE
    .\bootstrap.ps1
    Installs Python (if needed), creates a virtual environment, and runs the Python setup script.

.EXAMPLE
    .\bootstrap.ps1 -Force
    Forces recreation of the virtual environment, even if it already exists.

.NOTES
    File Name      : bootstrap.ps1
    Author         : Solomio S. Sisante
    Prerequisite   : PowerShell 5.1 or later
    Copyright      : c(2025)

    IMPORTANT:
    - Run after setup_all.ps1 to ensure system tools are installed.
    - Requires internet connection for downloading Python.
    - The script will exit and prompt for a restart if Python needs to be installed.
    - After installation, you may need to restart your terminal session for PATH changes to take effect.

    Dependencies:
    - versions.json: Configuration file for Python version and installer URL
    - setup_install.py: Python script for package installation and project setup

    Process Flow:
    1. Load Python version configuration from versions.json
    2. Find or install Python
    3. Install MSVC and Windows SDK (required for compiling some Python packages)
    4. Create or recreate virtual environment
    5. Run setup_install.py inside the virtual environment
    6. Activate the virtual environment

    Next Steps After Completion:
    - Create a Django superuser: python manage.py createsuperuser
    - Start the development server: python manage.py runserver
    - Or use Docker: docker-compose up
#>

param(
    [switch]$Force
)

# Import common functions
. "$PSScriptRoot\Scripts\InstallTool.ps1"

# Load version configuration
 $versions = Get-Content "$PSScriptRoot\versions.json" | ConvertFrom-Json

# Get Python configuration from system_tools
 $pythonTool = $versions.system_tools | Where-Object { $_.appName -eq "Python" }
if (-not $pythonTool) {
    Write-Error "Python configuration not found in versions.json"
    exit 1
}

 $venvDir = "venv"
 $venvActivateScript = ".\$venvDir\Scripts\Activate.ps1"
 $pythonExe = ".\$venvDir\Scripts\python.exe"

function Get-VcvarsPathFromEnv {
    $vcvarsCandidates = ($env:PATH -split ';') |
        Where-Object { $_ -match "VC\\Auxiliary\\Build" -and (Test-Path (Join-Path $_ 'vcvars64.bat')) } |
        ForEach-Object { Join-Path $_ 'vcvars64.bat' }

    return $vcvarsCandidates | Select-Object -First 1
}

function Test-RealPython {
    param([string]$PythonCommand)

    try {
        $output = & $PythonCommand --version 2>&1
        if ($output -like "*Microsoft Store*" -or $output -like "*was not found*") {
            return $false
        }
        return $true
    }
    catch {
        return $false
    }
}

function Find-PythonCommand {
    # Try different Python commands in order of preference
    $pythonCommands = @("python", "python3", "py")
    foreach ($cmd in $pythonCommands) {
        if (Test-RealPython $cmd) {
            $version = & $cmd --version 2>&1
            Write-Host "[OK] Found working Python: $cmd ($version)"
            return $cmd
        }
    }
    return $null
}

function Install-Python {
    Write-Host "[INFO] Installing Python using Install-Tool function..."
    
    try {
        # Use the Install-Tool function to install Python
        $progressCallback = {
            param($Step, $Status)
            Write-Host "[INFO] $Step - $Status"
        }
        
        $installSuccess = Install-Tool `
            -appName $pythonTool.appName `
            -installCommand ([scriptblock]::Create($pythonTool.installCommand)) `
            -checkCommand ([scriptblock]::Create($pythonTool.checkCommand)) `
            -envPath $pythonTool.envPath `
            -manualInstallUrl $pythonTool.manualInstallUrl `
            -manualInstallPath $pythonTool.manualInstallPath `
            -ForceUpdate:$Force `
            -MaxRetries $pythonTool.maxRetries `
            -ProgressCallback $progressCallback
        
        if ($installSuccess) {
            Write-Host "[OK] Python installed successfully."
            Write-Host "[INFO] Please restart your terminal/PowerShell session and run this script again."
            Write-Host "       (This is needed for the PATH to be updated)"
            exit 0
        } else {
            # Let's try to manually verify if Python is installed
            Write-Host "[WARNING] Install-Tool reported failure, let's manually check..."
            
            $requiredVersion = "3.12.3"
            $pythonPaths = @(
                "$env:LocalAppData\Programs\Python\Python312\python.exe",
                "$env:ProgramFiles\Python312\python.exe",
                "$env:ProgramFiles\Python39\python.exe"
            )
            
            foreach ($path in $pythonPaths) {
                if (Test-Path $path) {
                    try {
                        $installedVersion = & $path --version 2>&1
                        Write-Host "[INFO] Found Python at $path with version: $installedVersion"
                        if ($installedVersion -match $requiredVersion) {
                            Write-Host "[OK] Python $requiredVersion is installed correctly."
                            Write-Host "[INFO] Please restart your terminal/PowerShell session and run this script again."
                            exit 0
                        }
                    } catch {
                        # Store the error message in a variable to avoid the $_ issue
                        $errorMessage = $_.Exception.Message
                        Write-Host "[WARNING] Error checking Python version at $(path): $($errorMessage)"
                    }
                }
            }
            
            # Check if Python is in PATH
            $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
            if ($pythonCmd) {
                try {
                    $installedVersion = & $pythonCmd.Source --version 2>&1
                    Write-Host "[INFO] Found Python in PATH at $($pythonCmd.Source) with version: $installedVersion"
                    if ($installedVersion -match $requiredVersion) {
                        Write-Host "[OK] Python $requiredVersion is installed correctly."
                        Write-Host "[INFO] Please restart your terminal/PowerShell session and run this script again."
                        exit 0
                    }
                } catch {
                    # Store the error message in a variable to avoid the $_ issue
                    $errorMessage = $_.Exception.Message
                    Write-Host "[WARNING] Error checking Python version in PATH: $errorMessage"
                }
            }
            
            Write-Error "[ERROR] Python installation verification failed."
            exit 1
        }
    }
    catch {
        # Store the error message in a variable to avoid the $_ issue
        $errorMessage = $_.Exception.Message
        Write-Error "[ERROR] Failed to install Python: $errorMessage"
        exit 1
    }
}

function Install-BuildTools {
    Write-Host "[INFO] Checking for Visual Studio Build Tools..."

    $vcvarsPath = Get-VcvarsPathFromEnv
    if ($vcvarsPath -and (Test-Path $vcvarsPath)) {
        Write-Host "[OK] Visual Studio Build Tools already installed."
        return
    }

    Write-Host "[INFO] Visual Studio Build Tools not found. Installing..."
    $buildToolsInstallerUrl = "https://aka.ms/vs/17/release/vs_BuildTools.exe"
    $buildToolsInstaller = "vs_BuildTools.exe"

    try {
        Write-Host "[INFO] Downloading Visual Studio Build Tools..."
        Invoke-WebRequest -Uri $buildToolsInstallerUrl -OutFile $buildToolsInstaller -UseBasicParsing

        Write-Host "[INFO] Installing C++ build tools and Windows SDK silently..."
        Start-Process -FilePath ".\vs_BuildTools.exe" -ArgumentList `
            "--quiet", "--wait", "--norestart", `
            "--add", "Microsoft.VisualStudio.Workload.VCTools", `
            "--add", "Microsoft.VisualStudio.Component.VC.Tools.x86.x64", `
            "--add", "Microsoft.VisualStudio.Component.Windows10SDK.19041", `
            "--includeRecommended" `
            -Wait -NoNewWindow

        Remove-Item $buildToolsInstaller -Force
        Write-Host "[OK] Visual Studio Build Tools installed."

        $vcvarsPath = Get-VcvarsPathFromEnv
        if ($vcvarsPath -and (Test-Path $vcvarsPath)) {
            & $vcvarsPath | Out-Null
            Write-Host "[OK] vcvars64.bat executed to set up environment."
        }
    }
    catch {
        Write-Error "[ERROR] Failed to install Visual Studio Build Tools: $($_.Exception.Message)"
        exit 1
    }
}

function New-VirtualEnvironment {
    param([string]$PythonCommand)

    if (-Not (Test-Path $venvDir) -or $Force) {
        if ($Force -and (Test-Path $venvDir)) {
            # Try deactivating if it's currently active
            if (Get-Command deactivate -ErrorAction SilentlyContinue) {
                Write-Host "[INFO] Deactivating virtual environment..."
                deactivate
            }

            Write-Host "[INFO] Removing existing virtual environment..."
            Remove-Item $venvDir -Recurse -Force

            Start-Sleep -Seconds 1
            if (Test-Path $venvDir) {
                Write-Error "[ERROR] Failed to delete virtual environment folder: $venvDir"
                exit 1
            }
        }

        Write-Host "[INFO] Creating virtual environment: $venvDir"
        & $PythonCommand -m venv $venvDir

        if (-Not (Test-Path $pythonExe)) {
            Write-Error "[ERROR] Failed to create virtual environment. Check if Python venv module is available."
            exit 1
        }

        Write-Host "[OK] Virtual environment created successfully."
    }
    else {
        Write-Host "[OK] Virtual environment already exists: $venvDir"
    }
}

function Start-Setup {
    # Check if required files exist
    if (-Not (Test-Path $venvActivateScript)) {
        Write-Error "[ERROR] Could not find activation script: $venvActivateScript"
        exit 1
    }

    if (-Not (Test-Path "setup_install.py")) {
        Write-Error "[ERROR] setup_install.py not found in current directory."
        Write-Host "[INFO] Current directory: $(Get-Location)"
        Write-Host "[INFO] Directory contents:"
        Get-ChildItem | Format-Table Name, Length, LastWriteTime
        exit 1
    }

    Write-Host "[INFO] Running setup inside virtual environment..."
    
    # Method 1: Try to run directly with venv python
    try {
        Write-Host "[INFO] Installing dependencies and running setup..."
        & $pythonExe setup_install.py
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Setup completed successfully!"
            Write-Host ""
            Write-Host "[INFO] To activate the virtual environment in the future, run:"
            Write-Host "       .\$venvDir\Scripts\Activate.ps1"
            Write-Host ""
            Write-Host "[INFO] To run Python in the virtual environment:"
            Write-Host "       .\$venvDir\Scripts\python.exe"
            Write-Host ""
            Write-Host "[INFO] To start the application with Docker Compose:"
            Write-Host "       docker compose up"
        }
        else {
            Write-Error "[ERROR] Setup script failed with exit code: $LASTEXITCODE"
            exit 1
        }
    }
    catch {
        Write-Error "[ERROR] Failed to run setup: $($_.Exception.Message)"
        exit 1
    }
}

# Main execution
Write-Host "[INFO] Starting Python environment setup..."
Write-Host "[INFO] Working directory: $(Get-Location)"
Write-Host "[INFO] Using Python version: $($pythonTool.version)"

# Check if Force flag was used
if ($Force) {
    Write-Host "[WARN] Force flag detected - will recreate virtual environment"
}

# Step 1: Find or install Python
 $pythonCmd = Find-PythonCommand

if ($null -eq $pythonCmd) {
    Install-Python
}
else {
    Write-Host "[OK] Using Python command: $pythonCmd"
}

# Step 1.5: Install MSVC and Windows SDK (required for compiling some Python packages)
Install-BuildTools

# Step 2: Create virtual environment
New-VirtualEnvironment -PythonCommand $pythonCmd

# Step 3: Run setup
Start-Setup

Write-Host "[SUCCESS] Bootstrap process completed!"
Write-Host "[INFO] Activating virtual environment..."
& ".\$venvDir\Scripts\Activate.ps1"