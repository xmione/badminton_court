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
    
    # Use the same log file as the main script
    if ($Global:LogFile) {
        Add-Content -Path $Global:LogFile -Value $logEntry -ErrorAction SilentlyContinue
    }
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

    Write-Message "Processing installation for: $($appName)" -Level "INFO"

    $message = @" 

====================================================================================================================    
appName: $($appName) 
installCommand: $($installCommand) 
checkCommand: $($checkCommand) 
envPath: $($envPath) 
manualInstallUrl: $($manualInstallUrl) 
manualInstallPath: $($manualInstallPath) 
ForceUpdate: $($ForceUpdate) 
MaxRetries: $($MaxRetries) 
====================================================================================================================
"@ 

    Write-Message $message -Level "DEBUG"

    $isInstalled = & $checkCommand -ErrorAction SilentlyContinue

    if (-not $isInstalled -or $ForceUpdate) {
        Write-Message "Installing $($appName)..." -Level "INFO"
        
        if ($ProgressCallback) {
            & $ProgressCallback -Step "Installing $($appName)" -Status "In Progress"
        }

        Test-Chocolatey
        $installFailed = $false
        $retryCount = 0
        $installOutput = ""
        $installError = ""

        while ($retryCount -lt $MaxRetries) {
            try {
                if ($installCommand) {
                    Write-Message "Running custom install command for $($appName) (attempt $($retryCount + 1))..." -Level "INFO"
                    
                    # Check if the install command contains winget and if winget is available
                    $commandString = $installCommand.ToString()
                    if ($commandString -match "winget" -and -not (Test-Winget)) {
                        Write-Message "winget not available, skipping installation for $($appName)" -Level "WARNING"
                        $installFailed = $true
                        break
                    }
                    
                    # Clear previous errors
                    $error.Clear()
                    
                    # Capture all output from the installation command
                    $installOutput = & $installCommand 2>&1 | Out-String
                    
                    # Get any errors that occurred
                    if ($error.Count -gt 0) {
                        $installError = $error[0] | Out-String
                    } else {
                        $installError = ""
                    }
                    
                    # Log the output
                    Write-Message "Installation output for $($appName):" -Level "DEBUG"
                    Write-Message $installOutput -Level "DEBUG"
                    
                    if ($installError) {
                        Write-Message "Installation errors for $($appName):" -Level "ERROR"
                        Write-Message $installError -Level "ERROR"
                    }
                    
                    # Check if the command succeeded
                    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
                        Write-Message "Installation command returned non-zero exit code: $($LASTEXITCODE)" -Level "ERROR"
                        
                        # For Visual Studio Build Tools, check if it's already installed despite the error
                        if ($appName -eq "Visual Studio Build Tools") {
                            # Check if the installation output indicates the tool is already installed
                            if ($installOutput -match "Found an existing package already installed" -or 
                                $installOutput -match "already installed" -or
                                $installOutput -match "Installation completed successfully") {
                                Write-Message "Visual Studio Build Tools appears to be installed despite the error code." -Level "INFO"
                                $installFailed = $false
                            } else {
                                # Try to verify if the tool is actually installed by running the check command
                                $isActuallyInstalled = & $checkCommand -ErrorAction SilentlyContinue
                                if ($isActuallyInstalled) {
                                    Write-Message "Visual Studio Build Tools is already installed on the system." -Level "INFO"
                                    $installFailed = $false
                                } else {
                                    $installFailed = $true
                                }
                            }
                        } else {
                            $installFailed = $true
                        }
                    } else {
                        $installFailed = $false
                    }
                } else {
                    Write-Message "Installing $($appName) via Chocolatey (attempt $($retryCount + 1))..." -Level "INFO"
                    $tempOutput = "${env:TEMP}\choco_output_$($appName).txt"
                    $tempError = "${env:TEMP}\choco_error_$($appName).txt"
                    $installOutput = Start-Process -NoNewWindow -Wait "choco" -ArgumentList "install $($appName) -y" -RedirectStandardOutput $tempOutput -RedirectStandardError $tempError -PassThru
                    
                    # Read and log the output files
                    if (Test-Path $tempOutput) {
                        $installOutput = Get-Content $tempOutput | Out-String
                        Write-Message "Chocolatey output for $($appName):" -Level "DEBUG"
                        Write-Message $installOutput -Level "DEBUG"
                    }
                    
                    if (Test-Path $tempError) {
                        $installError = Get-Content $tempError | Out-String
                        if ($installError.Trim()) {
                            Write-Message "Chocolatey errors for $($appName):" -Level "ERROR"
                            Write-Message $installError -Level "ERROR"
                        }
                    }
                    
                    # Check if the command succeeded
                    if ($installOutput -match "failed|error|not installed") {
                        $installFailed = $true
                    } else {
                        $installFailed = $false
                    }
                }
                
                # Increment retry counter
                $retryCount++
                
                # If installation succeeded, break out of the loop
                if (-not $installFailed) {
                    break
                }
                
                # If we've reached max retries, break out of the loop
                if ($retryCount -ge $MaxRetries) {
                    break
                }
                
                # Wait before retrying
                $waitTime = 5 * $retryCount
                Write-Message "Waiting $($waitTime) seconds before retry..." -Level "INFO"
                Start-Sleep -Seconds $waitTime
                
            } catch {
                Write-Message "Installation attempt $($retryCount + 1) for $($appName) failed: $($_)" -Level "WARNING"
                Write-Message "Exception details: $($_.Exception.Message)" -Level "ERROR"
                Write-Message "Stack trace: $($_.ScriptStackTrace)" -Level "ERROR"
                $installFailed = $true
                
                # Increment retry counter
                $retryCount++
                
                if ($retryCount -lt $MaxRetries) {
                    $waitTime = 5 * $retryCount
                    Write-Message "Waiting $($waitTime) seconds before retry..." -Level "INFO"
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
            Write-Message "$($appName) installation failed verification." -Level "ERROR"
            $installFailed = $true
        }

        # Attempt manual install if needed
        if ($installFailed -and $manualInstallUrl -and $manualInstallPath) {
            Write-Message "Attempting manual install for $($appName)..." -Level "INFO"
            try {
                # Expand environment variables in paths using the execution context
                $expandedInstallPath = $ExecutionContext.InvokeCommand.ExpandString($manualInstallPath)
                DownloadWithProgress -url $manualInstallUrl -outputFile $expandedInstallPath
                $tempOutput = "${env:TEMP}\manual_output_$($appName).txt"
                $tempError = "${env:TEMP}\manual_error_$($appName).txt"
                $manualOutput = Start-Process -FilePath $expandedInstallPath -ArgumentList '/silent' -Wait -RedirectStandardOutput $tempOutput -RedirectStandardError $tempError -PassThru
                
                # Read and log the output files
                if (Test-Path $tempOutput) {
                    $manualOutput = Get-Content $tempOutput | Out-String
                    Write-Message "Manual installation output for $($appName):" -Level "DEBUG"
                    Write-Message $manualOutput -Level "DEBUG"
                }
                
                if (Test-Path $tempError) {
                    $manualError = Get-Content $tempError | Out-String
                    if ($manualError.Trim()) {
                        Write-Message "Manual installation errors for $($appName):" -Level "ERROR"
                        Write-Message $manualError -Level "ERROR"
                    }
                }

                # Add a delay after manual installation
                Write-Message "Waiting 10 seconds after manual installation before verification..." -Level "INFO"
                Start-Sleep -Seconds 10

                # Final verification
                $isInstalled = & $checkCommand -ErrorAction SilentlyContinue
                if ($isInstalled) {
                    Write-Message "$($appName) manual installation completed and verified." -Level "SUCCESS"
                } else {
                    Write-Message "$($appName) manual installation failed verification." -Level "ERROR"
                }
            } catch {
                Write-Message "Manual installation for $($appName) failed: $($_)" -Level "ERROR"
                Write-Message "Exception details: $($_.Exception.Message)" -Level "ERROR"
                Write-Message "Stack trace: $($_.ScriptStackTrace)" -Level "ERROR"
            }
        } elseif ($installFailed) {
            Write-Message "Installation failed and no manual install method available for $($appName)." -Level "ERROR"
            Write-Message "Last installation output was:" -Level "ERROR"
            Write-Message $installOutput -Level "ERROR"
            if ($installError) {
                Write-Message "Last installation error was:" -Level "ERROR"
                Write-Message $installError -Level "ERROR"
            }
        } else {
            Write-Message "$($appName) installed successfully." -Level "SUCCESS"
        }
    } else {
        Write-Message "$($appName) is already installed." -Level "INFO"
    }

    # If verified, ensure PATH is updated
    if ($isInstalled) {
        $currentPath = [System.Environment]::GetEnvironmentVariable('Path', [System.EnvironmentVariableTarget]::User)
        Write-Message "Current PATH: $($currentPath)" -Level "DEBUG"

        if (-not ($currentPath -like "*$($envPath)*")) {
            $newPath = $currentPath + ";$($envPath)"
            [System.Environment]::SetEnvironmentVariable('Path', $newPath, [System.EnvironmentVariableTarget]::User)
            $env:Path = $newPath
            Write-Message "Added $($appName) to the system PATH." -Level "SUCCESS"
        } else {
            Write-Message "$($appName) is already in the system PATH." -Level "INFO"
        }
    }

    if ($ProgressCallback) {
        & $ProgressCallback -Step "Installing $($appName)" -Status "Completed"
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
    try {
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
            # Try to find SDK by checking common paths
            $sdkPaths = @(
                "${env:ProgramFiles(x86)}\Windows Kits\10\Lib\10.0.22621.1\um\x64\kernel32.lib",
                "${env:ProgramFiles(x86)}\Windows Kits\10\Lib\10.0.20348.0\um\x64\kernel32.lib",
                "${env:ProgramFiles(x86)}\Windows Kits\10\Lib\10.0.22000.0\um\x64\kernel32.lib"
            )
            
            foreach ($path in $sdkPaths) {
                if (Test-Path $path) {
                    if ($path -match "10\.0\.([\d.]+)") {
                        return "10.0.$($matches[1])"
                    }
                }
            }
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
                    return $latestVersion
                }
            }
        }
        return $null
    } catch {
        return $null
    }
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

# Function to get Chocolatey version
function Get-ChocolateyVersion {
    try {
        $chocoPath = "$env:ProgramData\chocolatey\bin\choco.exe"
        if (Test-Path $chocoPath) {
            $version = & $chocoPath --version
            return $version.Trim()
        }
        return $null
    } catch {
        return $null
    }
}

# Function to get MinGW version
function Get-MinGWVersion {
    try {
        $mingwPaths = @(
            "C:\ProgramData\mingw64\mingw64\bin\gcc.exe",
            "C:\MinGW\bin\gcc.exe",
            "C:\msys64\mingw64\bin\gcc.exe"
        )
        
        foreach ($path in $mingwPaths) {
            if (Test-Path $path) {
                $version = & $path --version
                if ($version -match "gcc\s+\(.*\)\s+([\d.]+)") {
                    return $matches[1]
                }
            }
        }
        return $null
    } catch {
        return $null
    }
}

# Function to get Node.js version
function Get-nodejsVersion {
    try {
        $nodePaths = @(
            "C:\Program Files\nodejs\node.exe",
            "$env:LocalAppData\Programs\nodejs\node.exe"
        )
        
        foreach ($path in $nodePaths) {
            if (Test-Path $path) {
                $version = & $path --version
                return $version.Trim()
            }
        }
        
        # Try to find node in PATH
        $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
        if ($nodeCmd) {
            $version = & $nodeCmd.Source --version
            return $version.Trim()
        }
        return $null
    } catch {
        return $null
    }
}

# Function to get pnpm version
function Get-pnpmVersion {
    try {
        # Try to find pnpm in PATH first
        $pnpmCmd = Get-Command pnpm -ErrorAction SilentlyContinue
        if ($pnpmCmd) {
            $version = & $pnpmCmd.Source --version
            return $version.Trim()
        }
        
        $pnpmPaths = @(
            "C:\ProgramData\chocolatey\bin\pnpm.exe",
            "$env:APPDATA\npm\pnpm.cmd",
            "$env:APPDATA\pnpm\bin\pnpm.exe",
            "$env:LOCALAPPDATA\pnpm\pnpm.exe"
        )
        
        foreach ($path in $pnpmPaths) {
            if (Test-Path $path) {
                $version = & $path --version
                return $version.Trim()
            }
        }
        return $null
    } catch {
        return $null
    }
}

# Function to get Git version
function Get-gitVersion {
    try {
        $gitPaths = @(
            "C:\Program Files\Git\cmd\git.exe",
            "C:\Program Files\Git\bin\git.exe"
        )
        
        foreach ($path in $gitPaths) {
            if (Test-Path $path) {
                $version = & $path --version
                if ($version -match "git\s+version\s+([\d.]+)") {
                    return $matches[1]
                }
            }
        }
        
        # Try to find git in PATH
        $gitCmd = Get-Command git -ErrorAction SilentlyContinue
        if ($gitCmd) {
            $version = & $gitCmd.Source --version
            if ($version -match "git\s+version\s+([\d.]+)") {
                return $matches[1]
            }
        }
        return $null
    } catch {
        return $null
    }
}

# Function to get GitHub CLI version
function Get-ghVersion {
    try {
        # Try to find gh in PATH first
        $ghCmd = Get-Command gh -ErrorAction SilentlyContinue
        if ($ghCmd) {
            $version = & $ghCmd.Source --version
            if ($version -match "gh\s+version\s+([\d.]+)") {
                return $matches[1]
            }
        }
        
        $ghPaths = @(
            "C:\Program Files\GitHub CLI\gh.exe",
            "$env:LocalAppData\Programs\GitHub CLI\gh.exe",
            "$env:ProgramFiles(x86)\GitHub CLI\gh.exe"
        )
        
        foreach ($path in $ghPaths) {
            if (Test-Path $path) {
                $version = & $path --version
                if ($version -match "gh\s+version\s+([\d.]+)") {
                    return $matches[1]
                }
            }
        }
        return $null
    } catch {
        return $null
    }
}

# Function to get NVM version
function Get-nvmVersion {
    try {
        $nvmPath = "$env:LOCALAPPDATA\nvm\nvm.exe"
        if (Test-Path $nvmPath) {
            $version = & $nvmPath version
            return $version.Trim()
        }
        
        # Try alternative path
        $nvmPath = "$env:ProgramData\nvm\nvm.exe"
        if (Test-Path $nvmPath) {
            $version = & $nvmPath version
            return $version.Trim()
        }
        return $null
    } catch {
        return $null
    }
}

# Function to get .NET version
function Get-DOTNET9Version {
    try {
        $dotnetPaths = @(
            "$HOME\.dotnet\dotnet.exe",
            "C:\Program Files\dotnet\dotnet.exe"
        )
        
        foreach ($path in $dotnetPaths) {
            if (Test-Path $path) {
                $version = & $path --version
                if ($version -match "([\d.]+)") {
                    return $matches[1]
                }
            }
        }
        
        # Try to find dotnet in PATH
        $dotnetCmd = Get-Command dotnet -ErrorAction SilentlyContinue
        if ($dotnetCmd) {
            $version = & $dotnetCmd.Source --version
            if ($version -match "([\d.]+)") {
                return $matches[1]
            }
        }
        return $null
    } catch {
        return $null
    }
}

# Function to get OpenSSH version
function Get-OpenSSHVersion {
    try {
        $sshPath = "C:\Windows\System32\OpenSSH\ssh.exe"
        if (Test-Path $sshPath) {
            $version = & $sshPath -V 2>&1
            if ($version -match "OpenSSH_([\d.]+)") {
                return "OpenSSH_$($matches[1]) for Windows"
            }
        }
        return $null
    } catch {
        return $null
    }
}

# Function to get Vercel CLI version
function Get-VercelCLIVersion {
    try {
        # Try to find vercel in PATH first
        $vercelCmd = Get-Command vercel -ErrorAction SilentlyContinue
        if ($vercelCmd) {
            $version = & $vercelCmd.Source --version
            if ($version -match "([\d.]+)") {
                return $matches[1]
            }
        }
        
        # Check common pnpm/npm global locations
        $vercelPaths = @(
            "$env:APPDATA\pnpm\bin\vercel.cmd",
            "$env:APPDATA\npm\vercel.cmd",
            "$env:LOCALAPPDATA\pnpm\cache\vercel.cmd"
        )
        
        foreach ($path in $vercelPaths) {
            if (Test-Path $path) {
                $version = & $path --version
                if ($version -match "([\d.]+)") {
                    return $matches[1]
                }
            }
        }
        return $null
    } catch {
        return $null
    }
}

# Function to get Git Credential Manager version
function Get-GitCredentialManagerVersion {
    try {
        $gcmPaths = @(
            "$env:ProgramFiles\Git\mingw64\bin\git-credential-manager.exe",
            "$env:ProgramFiles\Git\mingw64\bin\git-credential-manager-core.exe"
        )
        
        foreach ($path in $gcmPaths) {
            if (Test-Path $path) {
                $version = & $path --version
                if ($version -match "([\d.]+)") {
                    return $matches[1]
                }
            }
        }
        return $null
    } catch {
        return $null
    }
}

# Function to get GraphViz version
function Get-GraphVizVersion {
    try {
        # Try to find gvpr in PATH first
        $gvprCmd = Get-Command gvpr -ErrorAction SilentlyContinue
        if ($gvprCmd) {
            $version = & $gvprCmd.Source -V 2>&1
            if ($version -match "gvpr\s+([\d.]+)") {
                return $matches[1]
            }
        }
        
        $gvprPath = "C:\Program Files\Graphviz\bin\gvpr.exe"
        if (Test-Path $gvprPath) {
            $version = & $gvprPath -V 2>&1
            if ($version -match "gvpr\s+([\d.]+)") {
                return $matches[1]
            }
        }
        
        # Try alternative path
        $gvprPath = "C:\Program Files (x86)\Graphviz\bin\gvpr.exe"
        if (Test-Path $gvprPath) {
            $version = & $gvprPath -V 2>&1
            if ($version -match "gvpr\s+([\d.]+)") {
                return $matches[1]
            }
        }
        return $null
    } catch {
        return $null
    }
}

# Function to get GPG version
function Get-GPGVersion {
    try {
        # Try to find gpg in PATH first
        $gpgCmd = Get-Command gpg -ErrorAction SilentlyContinue
        if ($gpgCmd) {
            $version = & $gpgCmd.Source --version
            if ($version -match "gpg\s+\(.*\)\s+([\d.]+)") {
                return $matches[1]
            }
        }
        
        $gpgPaths = @(
            "C:\Program Files (x86)\GnuPG\bin\gpg.exe",
            "C:\Program Files\GnuPG\bin\gpg.exe",
            "$env:ProgramFiles\GnuPG\bin\gpg.exe"
        )
        
        foreach ($path in $gpgPaths) {
            if (Test-Path $path) {
                $version = & $path --version
                if ($version -match "gpg\s+\(.*\)\s+([\d.]+)") {
                    return $matches[1]
                }
            }
        }
        return $null
    } catch {
        return $null
    }
}

# Function to get ngrok version
function Get-ngrokVersion {
    try {
        # Try to find ngrok in PATH first
        $ngrokCmd = Get-Command ngrok -ErrorAction SilentlyContinue
        if ($ngrokCmd) {
            $version = & $ngrokCmd.Source --version
            if ($version -match "ngrok\s+version\s+([\d.]+)") {
                return $matches[1]
            }
        }
        
        $ngrokPaths = @(
            "$env:ProgramData\chocolatey\bin\ngrok.exe",
            "C:\Program Files\ngrok\ngrok.exe",
            "$env:LOCALAPPDATA\ngrok\ngrok.exe"
        )
        
        foreach ($path in $ngrokPaths) {
            if (Test-Path $path) {
                $version = & $path --version
                if ($version -match "ngrok\s+version\s+([\d.]+)") {
                    return $matches[1]
                }
            }
        }
        return $null
    } catch {
        return $null
    }
}

# Function to check if a command exists
function Test-CommandExists {
    param (
        [string]$command
    )
    $commandExists = $false
    try {
        $output = & $command --version 2>$null
        if ($output) { $commandExists = $true }
    } catch {
        $commandExists = $false
    }
    return $commandExists
}