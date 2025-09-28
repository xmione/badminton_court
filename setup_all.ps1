# setup_all.ps1
# Description: This PowerShell script handles system-wide setup by: 
#              ✅ Relaunching as Administrator if needed, ensuring proper permissions. 
#              ✅ Checking and installing Visual Studio Build Tools (including C++ workload), ensuring link.exe is available. 
#              ✅ Checking and installing Docker Desktop for containerized deployment.
#              ✅ Restarting the system if necessary to apply environment changes.

param (
    [switch]$Force,
    [switch]$NoRestart,
    [switch]$Verbose,
    [string]$LogFile = "$PSScriptRoot\setup_log.txt"
)

# Load version configuration
 $versions = Get-Content "$PSScriptRoot\versions.json" | ConvertFrom-Json

# Enhanced logging and progress tracking
 $Global:SetupStartTime = Get-Date
 $Global:LogFile = $LogFile

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    if ($Global:LogFile) {
        Add-Content -Path $Global:LogFile -Value $logEntry -ErrorAction SilentlyContinue
    }
}

function Write-Progress-Step {
    param([string]$Step, [int]$Current, [int]$Total)
    $percent = [math]::Round(($Current / $Total) * 100)
    Write-Progress -Activity "System Setup" -Status $Step -PercentComplete $percent
    Write-Log "[$Current/$Total] $Step" -Level "PROGRESS"
}

function Test-InternetConnection {
    try {
        $null = Test-NetConnection -ComputerName "8.8.8.8" -Port 53 -InformationLevel Quiet -WarningAction SilentlyContinue
        return $true
    }
    catch {
        return $false
    }
}

function Get-SystemInfo {
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    $cpu = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
    $ram = [math]::Round((Get-CimInstance -ClassName Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
    
    Write-Log "System Information:" -Level "INFO"
    Write-Log "  OS: $($os.Caption) ($($os.Version))" -Level "INFO"
    Write-Log "  CPU: $($cpu.Name)" -Level "INFO"
    Write-Log "  RAM: $ram GB" -Level "INFO"
    Write-Log "  PowerShell: $($PSVersionTable.PSVersion)" -Level "INFO"
}

function Test-Prerequisites {
    Write-Log "Checking prerequisites..." -Level "INFO"
    
    # Check internet connection
    if (-not (Test-InternetConnection)) {
        Write-Log "No internet connection detected. Some installations may fail." -Level "WARNING"
        return $false
    }
    
    # Check available disk space (minimum 5GB recommended)
    $systemDrive = Get-PSDrive -Name ($env:SystemDrive.Replace(":", ""))
    $freeSpaceGB = [math]::Round($systemDrive.Free / 1GB, 2)
    Write-Log "Available disk space: $freeSpaceGB GB" -Level "INFO"
    
    if ($freeSpaceGB -lt 5) {
        Write-Log "Low disk space detected. At least 5GB recommended." -Level "WARNING"
    }
    
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Write-Log "Winget not found. Please install Windows Package Manager." -Level "ERROR"
        return $false
    }
    
    return $true
}

# Import environment functions with error handling
try {
    . "$PSScriptRoot\Scripts\Environment.ps1"
    Write-Log "Environment.ps1 loaded successfully" -Level "INFO"
}
catch {
    Write-Log "Failed to load Environment.ps1: $($_.Exception.Message)" -Level "ERROR"
    # Provide fallback SetPath function
    function SetPath {
        param([string]$PathToAdd, [string]$Target = "User")
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", $Target)
        if ($currentPath -notlike "*$PathToAdd*") {
            $newPath = "$currentPath;$PathToAdd"
            [Environment]::SetEnvironmentVariable("PATH", $newPath, $Target)
            Write-Log "Added to PATH ($Target): $PathToAdd" -Level "INFO"
        }
    }
}

function RelaunchAsAdmin {
    $isAdmin = ([Security.Principal.WindowsPrincipal]::new(
            [Security.Principal.WindowsIdentity]::GetCurrent()
        )).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

    if (-not $isAdmin) {
        Write-Log "Not running as administrator. Relaunching with elevated privileges..." -Level "WARNING"
        $scriptPath = $PSCommandPath
        $currentDir = (Get-Location).Path

        $argList = @(
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-File', "`"$scriptPath`""
        )
        if ($Force) { $argList += '-Force' }
        if ($NoRestart) { $argList += '-NoRestart' }
        if ($Verbose) { $argList += '-Verbose' }
        if ($LogFile -ne "$PSScriptRoot\setup_log.txt") { $argList += "-LogFile `"$LogFile`"" }

        try {
            Start-Process -FilePath 'powershell.exe' -ArgumentList $argList -WorkingDirectory $currentDir -Verb RunAs
            return $false
        }
        catch {
            Write-Log "Failed to relaunch as administrator: $($_.Exception.Message)" -Level "ERROR"
            return $false
        }
    }
    return $true
}

function Wait-ForProcess {
    param([string]$ProcessName, [int]$TimeoutSeconds = 300)
    $timeout = [DateTime]::Now.AddSeconds($TimeoutSeconds)
    while ([DateTime]::Now -lt $timeout) {
        if (-not (Get-Process -Name $ProcessName -ErrorAction SilentlyContinue)) {
            return $true
        }
        Start-Sleep -Seconds 2
    }
    return $false
}

function Uninstall-WingetApp {
    param ([string]$PackageId, [int]$TimeoutSeconds = 1800)
    
    try {
        $installed = winget list --id $PackageId 2>$null | Select-String $PackageId
        if ($installed) {
            Write-Log "Uninstalling $PackageId..." -Level "INFO"
            
            $job = Start-Job -ScriptBlock {
                param($id)
                winget uninstall --id $id --silent --accept-source-agreements 2>$null
            } -ArgumentList $PackageId
            
            $timeout = [DateTime]::Now.AddSeconds($TimeoutSeconds)
            while ([DateTime]::Now -lt $timeout -and $job.State -eq "Running") {
                Start-Sleep -Seconds 5
                Write-Host -NoNewline "."
            }
            
            if ($job.State -eq "Running") {
                Stop-Job $job
                Write-Log "Uninstall job timed out for $PackageId" -Level "WARNING"
            }
            Remove-Job $job -Force
            
            # Verify uninstallation
            $check = winget list --id $PackageId 2>$null | Select-String $PackageId
            if (-not $check) {
                Write-Log "$PackageId successfully uninstalled" -Level "SUCCESS"
                return $true
            }
            else {
                Write-Log "$PackageId might not have uninstalled completely" -Level "WARNING"
            }
        }
        else {
            Write-Log "$PackageId is not installed" -Level "INFO"
        }
    }
    catch {
        Write-Log "Error uninstalling $PackageId`: $($_.Exception.Message)" -Level "ERROR"
    }
    return $false
}

function InstallWingetApp {
    param([string]$PackageId, [string]$Override = "", [int]$MaxRetries = 3)
    
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            Write-Log "Installing $PackageId (attempt $i/$MaxRetries)..." -Level "INFO"
            
            $arguments = @("install", "--id", $PackageId, "--silent", "--accept-package-agreements", "--accept-source-agreements")
            if ($Override) { $arguments += @("--override", $Override) }
            
            $process = Start-Process -FilePath "winget" -ArgumentList $arguments -NoNewWindow -Wait -PassThru
            
            if ($process.ExitCode -eq 0) {
                Write-Log "$PackageId installed successfully" -Level "SUCCESS"
                return $true
            }
            else {
                Write-Log "$PackageId installation failed with exit code: $($process.ExitCode)" -Level "WARNING"
            }
        }
        catch {
            Write-Log "Error installing $PackageId (attempt $i): $($_.Exception.Message)" -Level "ERROR"
        }
        
        if ($i -lt $MaxRetries) {
            Write-Log "Retrying in 10 seconds..." -Level "INFO"
            Start-Sleep -Seconds 10
        }
    }
    
    Write-Log "Failed to install $PackageId after $MaxRetries attempts" -Level "ERROR"
    return $false
}

function Test-VSBuildTools {
    # Check for link.exe
    $linker = Get-Command link.exe -ErrorAction SilentlyContinue
    if ($linker) {
        Write-Log "Found link.exe at: $($linker.Source)" -Level "INFO"
        return $true
    }
    
    # Search in common locations
    $commonPaths = @(
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\BuildTools\VC\Tools\MSVC"
    )
    
    foreach ($basePath in $commonPaths) {
        if (Test-Path $basePath) {
            $msvcDirs = Get-ChildItem -Path $basePath -Directory | Sort-Object Name -Descending
            foreach ($dir in $msvcDirs) {
                $binPath = Join-Path $dir.FullName "bin\Hostx64\x64"
                $linkPath = Join-Path $binPath "link.exe"
                if (Test-Path $linkPath) {
                    Write-Log "Found link.exe at: $binPath" -Level "INFO"
                    SetPath -PathToAdd $binPath -Target Machine
                    return $true
                }
            }
        }
    }
    
    return $false
}

function Install-VSBuildTools {
    param([bool]$ForceReinstall = $false)
    
    $vsConfig = $versions.system_tools.visual_studio_build_tools
    
    if ($ForceReinstall) {
        Write-Log "Force mode: Uninstalling Visual Studio Build Tools..." -Level "INFO"
        Uninstall-WingetApp $vsConfig.package_id | Out-Null
    }
    
    if (-not (Test-VSBuildTools)) {
        Write-Log "Installing Visual Studio Build Tools version $($vsConfig.version)..." -Level "INFO"
        
        $vsOverride = $vsConfig.components | ForEach-Object { "--add $_" }
        $vsOverride += "--quiet", "--wait", "--norestart"
        $vsOverrideString = $vsOverride -join " "
        
        if (InstallWingetApp -PackageId $vsConfig.package_id -Override $vsOverrideString) {
            Write-Log "Visual Studio Build Tools version $($vsConfig.version) installation completed" -Level "SUCCESS"
            return $true
        }
        else {
            Write-Log "Visual Studio Build Tools installation failed" -Level "ERROR"
            return $false
        }
    }
    else {
        Write-Log "Visual Studio Build Tools already installed and working" -Level "SUCCESS"
        return $true
    }
}

function Test-WindowsSDK {
    $sdkConfig = $versions.system_tools.windows_sdk
    
    $sdkPaths = @(
        "${env:ProgramFiles(x86)}\Windows Kits\10\Lib\$($sdkConfig.version)\um\x64\kernel32.lib",
        "${env:ProgramFiles(x86)}\Windows Kits\10\Lib\10.0.20348.0\um\x64\kernel32.lib",
        "${env:ProgramFiles(x86)}\Windows Kits\10\Lib\10.0.22000.0\um\x64\kernel32.lib"
    )
    
    foreach ($path in $sdkPaths) {
        if (Test-Path $path) {
            Write-Log "Found Windows SDK at: $path" -Level "INFO"
            return $true
        }
    }
    
    return $false
}

function Install-WindowsSDK {
    if (-not (Test-WindowsSDK)) {
        $sdkConfig = $versions.system_tools.windows_sdk
        Write-Log "Installing Windows SDK version $($sdkConfig.version) ($($sdkConfig.display_name))..." -Level "INFO"
        
        $vsInstallerPath = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vs_installer.exe"
        
        if (-not (Test-Path $vsInstallerPath)) {
            Write-Log "Visual Studio Installer not found. Downloading..." -Level "INFO"
            try {
                $tempFile = "$env:TEMP\vs_buildtools.exe"
                Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vs_buildtools.exe" -OutFile $tempFile
                & $tempFile --quiet --norestart --installPath "C:\BuildTools"
                Start-Sleep -Seconds 30
            }
            catch {
                Write-Log "Failed to download Visual Studio Installer: $($_.Exception.Message)" -Level "ERROR"
                return $false
            }
        }
        
        if (Test-Path $vsInstallerPath) {
            try {
                $installPath = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\BuildTools"
                & $vsInstallerPath modify --installPath $installPath --add Microsoft.VisualStudio.Component.Windows10SDK.19041 --quiet --norestart --force
                
                if (Test-WindowsSDK) {
                    Write-Log "Windows SDK version $($sdkConfig.version) installation completed" -Level "SUCCESS"
                    return $true
                }
            }
            catch {
                Write-Log "Failed to install Windows SDK: $($_.Exception.Message)" -Level "ERROR"
            }
        }
        
        Write-Log "Windows SDK installation failed" -Level "ERROR"
        return $false
    }
    else {
        $sdkConfig = $versions.system_tools.windows_sdk
        Write-Log "Windows SDK version $($sdkConfig.version) already installed" -Level "SUCCESS"
        return $true
    }
}

function Test-DockerDesktop {
    $dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
    if ($dockerProcess) {
        Write-Log "Docker Desktop is running" -Level "INFO"
        return $true
    }
    
    $dockerExe = Get-Command docker -ErrorAction SilentlyContinue
    if ($dockerExe) {
        try {
            & docker version --format "{{.Client.Version}}" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Docker is installed and accessible" -Level "INFO"
                return $true
            }
        }
        catch {
            Write-Log "Docker command failed: $($_.Exception.Message)" -Level "WARNING"
        }
    }
    
    return $false
}

function Install-DockerDesktop {
    param([bool]$ForceReinstall = $false)
    
    $dockerConfig = $versions.system_tools.docker_desktop
    
    if ($ForceReinstall) {
        Write-Log "Force mode: Uninstalling Docker Desktop..." -Level "INFO"
        # Note: Docker Desktop doesn't have a reliable uninstall method via script
        # We'll just try to install over it
    }
    
    if (-not (Test-DockerDesktop)) {
        Write-Log "Installing Docker Desktop version $($dockerConfig.version)..." -Level "INFO"
        
        try {
            $installerPath = "$env:TEMP\DockerDesktopInstaller.exe"
            
            Write-Log "Downloading Docker Desktop installer from: $($dockerConfig.download_url)" -Level "INFO"
            Invoke-WebRequest -Uri $dockerConfig.download_url -OutFile $installerPath -UseBasicParsing
            
            Write-Log "Installing Docker Desktop..." -Level "INFO"
            $process = Start-Process -FilePath $installerPath -ArgumentList "install --quiet" -Wait -PassThru
            
            Remove-Item $installerPath -Force
            
            if ($process.ExitCode -eq 0) {
                Write-Log "Docker Desktop version $($dockerConfig.version) installation completed" -Level "SUCCESS"
                Write-Log "Please start Docker Desktop manually after installation" -Level "INFO"
                return $true
            }
            else {
                Write-Log "Docker Desktop installation failed with exit code: $($process.ExitCode)" -Level "ERROR"
                return $false
            }
        }
        catch {
            Write-Log "Failed to install Docker Desktop: $($_.Exception.Message)" -Level "ERROR"
            return $false
        }
    }
    else {
        Write-Log "Docker Desktop already installed and working" -Level "SUCCESS"
        return $true
    }
}

function SetupVCVars {
    $vcvarsCandidates = @(
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat",
        "${env:ProgramFiles}\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat",
        "${env:ProgramFiles}\Microsoft Visual Studio\2022\Professional\VC\Auxiliary\Build\vcvars64.bat",
        "${env:ProgramFiles}\Microsoft Visual Studio\2022\Enterprise\VC\Auxiliary\Build\vcvars64.bat",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
    )

    $vcvarsPath = $null
    foreach ($candidate in $vcvarsCandidates) {
        if (Test-Path $candidate) {
            $vcvarsPath = $candidate
            Write-Log "Found vcvars64.bat at: $vcvarsPath" -Level "SUCCESS"
            $vcvarsDir = Split-Path $vcvarsPath
            SetPath -PathToAdd $vcvarsDir -Target Machine
            break
        }
    }

    if (-not $vcvarsPath) {
        Write-Log "vcvars64.bat not found. MSVC toolchain is not fully installed." -Level "ERROR"
        return $false
    }

    Write-Log "Applying vcvars64.bat environment variables..." -Level "INFO"
    try {
        & cmd /c "`"$vcvarsPath`" && set" | ForEach-Object {
            if ($_ -match "^(.*?)=(.*)$") {
                $name = $matches[1]
                $value = $matches[2]

                if ($name -eq "PATH") {
                    $pathsToAdd = ($value -split ';') | Where-Object { $_ -and ($_ -notin $env:PATH -split ';') }
                    foreach ($p in $pathsToAdd) {
                        SetPath -PathToAdd $p -Target User
                    }
                }
                else {
                    [System.Environment]::SetEnvironmentVariable($name, $value, "User")
                }
            }
        }
        Write-Log "vcvars64.bat environment applied successfully" -Level "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Failed to apply vcvars64.bat environment: $($_.Exception.Message)" -Level "ERROR"
        return $false
    }
}

function Show-Summary {
    param([hashtable]$Results)
    
    Write-Log "=== SETUP SUMMARY ===" -Level "INFO"
    $elapsed = (Get-Date) - $Global:SetupStartTime
    Write-Log "Total setup time: $([math]::Round($elapsed.TotalMinutes, 2)) minutes" -Level "INFO"
    
    foreach ($key in $Results.Keys) {
        $status = if ($Results[$key]) { "✅ SUCCESS" } else { "❌ FAILED" }
        Write-Log "$key`: $status" -Level "INFO"
    }
    
    $failedCount = ($Results.Values | Where-Object { -not $_ }).Count
    if ($failedCount -eq 0) {
        Write-Log "🎉 All components installed successfully!" -Level "SUCCESS"
    }
    else {
        Write-Log "⚠️  $failedCount component(s) failed to install" -Level "WARNING"
    }
}

# Main execution
if (RelaunchAsAdmin) {
    try {
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
        $needRestart = $false
        $results = @{}
        
        Write-Log "=== SYSTEM SETUP STARTED ===" -Level "INFO"
        Write-Log "Script version: Enhanced v2.0" -Level "INFO"
        Write-Log "Parameters: Force=$Force, NoRestart=$NoRestart, Verbose=$Verbose" -Level "INFO"
        Write-Log "Using version configuration from versions.json" -Level "INFO"
        
        Get-SystemInfo
        
        if (-not (Test-Prerequisites)) {
            Write-Log "Prerequisites check failed. Exiting." -Level "ERROR"
            exit 1
        }
        
        # Step 1: Visual Studio Build Tools
        Write-Progress-Step "Installing Visual Studio Build Tools" 1 5
        $results["Visual Studio Build Tools"] = Install-VSBuildTools -ForceReinstall $Force
        if ($results["Visual Studio Build Tools"]) { $needRestart = $true }
        
        # Step 2: Windows SDK
        Write-Progress-Step "Installing Windows SDK" 2 5
        $results["Windows SDK"] = Install-WindowsSDK
        if ($results["Windows SDK"]) { $needRestart = $true }
        
        # Step 3: Docker Desktop
        Write-Progress-Step "Installing Docker Desktop" 3 5
        $results["Docker Desktop"] = Install-DockerDesktop -ForceReinstall $Force
        if ($results["Docker Desktop"]) { $needRestart = $true }
        
        # Step 4: VCVars Setup
        Write-Progress-Step "Setting up VCVars environment" 4 5
        $results["VCVars Environment"] = SetupVCVars
        
        # Step 5: Final verification
        Write-Progress-Step "Final verification" 5 5
        Write-Log "Performing final verification..." -Level "INFO"
        
        # Verify all components
        $linkExists = Get-Command link.exe -ErrorAction SilentlyContinue
        $dockerExists = Get-Command docker -ErrorAction SilentlyContinue
        
        Write-Log "Final verification results:" -Level "INFO"
        Write-Log "  link.exe: $(if ($linkExists) { '✅ Available' } else { '❌ Missing' })" -Level "INFO"
        Write-Log "  docker: $(if ($dockerExists) { '✅ Available' } else { '❌ Missing' })" -Level "INFO"
        
        Write-Progress -Activity "System Setup" -Completed
        Show-Summary -Results $results
        
        if ($needRestart -and -not $NoRestart) {
            Write-Log "A restart is required to complete the setup." -Level "WARNING"
            $response = Read-Host "Do you want to restart now? (y/N)"
            if ($response -eq 'y' -or $response -eq 'Y') {
                Write-Log "Restarting system..." -Level "INFO"
                Restart-Computer -Force
            }
            else {
                Write-Log "Restart postponed. Please restart manually to complete setup." -Level "WARNING"
            }
        }
        elseif ($needRestart) {
            Write-Log "Restart required but skipped due to -NoRestart flag." -Level "WARNING"
        }
        else {
            Write-Log "Setup completed successfully. No restart required." -Level "SUCCESS"
        }
        
    }
    catch {
        Write-Log "Fatal error during setup: $($_.Exception.Message)" -Level "ERROR"
        Write-Log "Stack trace: $($_.ScriptStackTrace)" -Level "ERROR"
        exit 1
    }
    finally {
        Write-Log "=== SETUP COMPLETED ===" -Level "INFO"
    }
}