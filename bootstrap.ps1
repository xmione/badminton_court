# bootstrap.ps1
# Description:
#   - Installs Python 3.12.3 system-wide to 'C:\Program Files\Python312' if not found
#     (via official installer with /quiet /InstallAllUsers=1 /PrependPath=1)
#   - Creates and activates virtual environment (venv)
#   - Runs setup_install.py inside venv to complete Python-side setup
# Note: To uninstall system-wide python version, run:
# Get-WmiObject -Query "SELECT * FROM Win32_Product WHERE Name LIKE 'Python %'" | ForEach-Object { $_.Uninstall() }

# To Run and Create Virtual Environment:
# .\bootstrap -Force

# To Run using existing Virtual Environment:
# .\bootstrap

param(
    [switch]$Force
)

 $pythonVersion = "3.12.3"
 $pythonInstallerUrl = "https://www.python.org/ftp/python/$pythonVersion/python-$pythonVersion-amd64.exe"
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
    Write-Host "[INFO] No suitable Python installation found. Downloading Python $pythonVersion..."

    try {
        # Download Python installer
        $installerPath = "python-installer.exe"
        Write-Host "[INFO] Downloading from: $pythonInstallerUrl"
        Invoke-WebRequest -Uri $pythonInstallerUrl -OutFile $installerPath -UseBasicParsing

        # Install Python silently
        Write-Host "[INFO] Installing Python silently..."
        $process = Start-Process -FilePath $installerPath -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1 Include_test=0" -Wait -PassThru

        # Clean up installer
        Remove-Item $installerPath -Force

        if ($process.ExitCode -eq 0) {
            Write-Host "[OK] Python $pythonVersion installed successfully."
            Write-Host "[INFO] Please restart your terminal/PowerShell session and run this script again."
            Write-Host "       (This is needed for the PATH to be updated)"
            exit 0
        }
        else {
            Write-Error "[ERROR] Python installation failed with exit code: $($process.ExitCode)"
            exit 1
        }
    }
    catch {
        Write-Error "[ERROR] Failed to download or install Python: $($_.Exception.Message)"
        exit 1
    }
}

function Install-BuildTools {
    Write-Host "[INFO] Checking for Visual Studio Build Tools..."

    $vcvarsPath = Get-VcvarsPathFromEnv
    if (Test-Path $vcvarsPath) {
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
        if ($vcvarsPath) {
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
            Write-Host "       docker-compose up"
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