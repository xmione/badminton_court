<#
.SYNOPSIS
    Sets up the system-wide development environment by installing core tools and dependencies.

.DESCRIPTION
    This PowerShell script handles system-wide setup by:
    ✅ Relaunching as Administrator if needed, ensuring proper permissions.
    ✅ Checking and installing Visual Studio Build Tools (including C++ workload), ensuring link.exe is available.
    ✅ Checking and installing Windows SDK for development.
    ✅ Checking and installing Docker Desktop for containerized deployment.
    ✅ Setting up VCVars environment variables for development.
    ✅ Restarting the system if necessary to apply environment changes.

    The script uses the versions.json configuration file to determine which tools to install and their versions.
    It installs only core tools marked with "isCoreTool": true in the configuration.

.PARAMETER Force
    Forces reinstallation of all tools, even if they are already installed.

.PARAMETER NoRestart
    Prevents automatic system restart after installation. Use this if you plan to restart manually.

.PARAMETER Verbose
    Enables verbose output, showing detailed information during the installation process.

.PARAMETER LogFile
    Specifies the path to the log file. Default is "$PSScriptRoot\setup_log.txt".

.EXAMPLE
    .\setup_all.ps1
    Installs all core tools with default settings.

.EXAMPLE
    .\setup_all.ps1 -Force
    Forces reinstallation of all core tools.

.EXAMPLE
    .\setup_all.ps1 -NoRestart -Verbose
    Installs tools without restarting and shows verbose output.

.EXAMPLE
    .\setup_all.ps1 -LogFile "C:\Logs\my_setup.log"
    Uses a custom log file path.

.NOTES
    File Name      : setup_all.ps1
    Author         : Solomio S. Sisante
    Prerequisite   : PowerShell 5.1 or later
    Copyright      : c(2025)

    IMPORTANT:
    - Run as Administrator for system-wide installations.
    - Requires internet connection for downloading installers.
    - May require system restarts after updates.
    - Test in non-production environment first.
    - The script installs only core tools marked with "isCoreTool": true in versions.json.

    Dependencies:
    - InstallTool.ps1: Common installation functions module
    - versions.json: Configuration file for tool versions and settings

    Core Tools Installed:
    - Chocolatey (Package Manager)
    - Visual Studio Build Tools (with C++ workload)
    - Windows SDK
    - Docker Desktop
    - Python (if marked as core tool)

    After installation, run bootstrap.ps1 to set up the Python environment.
#>

param (
    [switch]$Force,
    [switch]$NoRestart,
    [switch]$Verbose,
    [string]$LogFile = "$PSScriptRoot\setup_log.txt"
)

# Import common functions
. "$PSScriptRoot\Scripts\InstallTool.ps1"

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
            # Add to PATH
            $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
            if ($currentPath -notlike "*$vcvarsDir*") {
                $newPath = "$currentPath;$vcvarsDir"
                [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
                $env:PATH = $newPath
                Write-Log "Added to PATH: $vcvarsDir" -Level "SUCCESS"
            }
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
                        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
                        $newPath = "$currentPath;$p"
                        [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
                        $env:PATH = $newPath
                        Write-Log "Added to PATH: $p" -Level "INFO"
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
        
        # Get core tools only
        $coreTools = $versions.system_tools | Where-Object { $_.isCoreTool -eq $true }
        $totalTools = $coreTools.Count
        $currentTool = 0
        
        # Install core tools
        foreach ($tool in $coreTools) {
            $currentTool++
            Write-Progress-Step "Installing $($tool.appName)" $currentTool ($totalTools + 1)
            
            $progressCallback = {
                param($Step, $Status)
                Write-Progress-Step $Step $currentTool ($totalTools + 1)
            }
            
            $results[$tool.appName] = Install-Tool `
                -appName $tool.appName `
                -installCommand ([scriptblock]::Create($tool.installCommand)) `
                -checkCommand ([scriptblock]::Create($tool.checkCommand)) `
                -envPath $tool.envPath `
                -manualInstallUrl $tool.manualInstallUrl `
                -manualInstallPath $tool.manualInstallPath `
                -ForceUpdate:$Force `
                -MaxRetries $tool.maxRetries `
                -ProgressCallback $progressCallback
            
            if ($results[$tool.appName]) { $needRestart = $true }
        }
        
        # Setup VCVars environment
        Write-Progress-Step "Setting up VCVars environment" ($totalTools + 1) ($totalTools + 1)
        $results["VCVars Environment"] = SetupVCars
        
        # Final verification
        Write-Progress-Step "Final verification" ($totalTools + 2) ($totalTools + 2)
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