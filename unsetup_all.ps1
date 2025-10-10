<#
.SYNOPSIS
    Uninstalls the system-wide development environment tools and dependencies.

.DESCRIPTION
    This PowerShell script handles the system-wide uninstallation by:
    ✅ Relaunching as Administrator if needed.
    ✅ Iterating through core tools defined in versions.json.
    ✅ Calling UninstallTool.ps1 to remove each tool.
    ✅ Cleaning up environment variables (like PATH and VCVars).
    ✅ Providing a summary of the uninstallation process.
    ✅ Restarting the system if necessary to apply changes.

    The script uses the versions.json configuration file to determine which tools to uninstall.
    It uninstalls only core tools marked with "isCoreTool": true in the configuration.

.PARAMETER Force
    Forces removal attempt for all tools, even if the check command indicates they are not installed.

.PARAMETER NoRestart
    Prevents automatic system restart after uninstallation. Use this if you plan to restart manually.

.PARAMETER Verbose
    Enables verbose output, showing detailed information during the uninstallation process.

.EXAMPLE
    .\unsetup_all.ps1
    Uninstalls all core tools with default settings.

.EXAMPLE
    .\unsetup_all.ps1 -Force
    Forces removal attempt for all core tools.

.EXAMPLE
    .\unsetup_all.ps1 -NoRestart -Verbose
    Uninstalls tools without restarting and shows verbose output.

.NOTES
    File Name      : unsetup_all.ps1
    Author         : Solomio S. Sisante
    Prerequisite   : PowerShell 5.1 or later
    Copyright      : c(2025)

    IMPORTANT:
    - Run as Administrator for system-wide uninstallations.
    - This script removes tools installed by setup_all.ps1.
    - It may not remove every single file or configuration (e.g., user data).
    - Uninstalling Chocolatey itself can break other applications; it will be skipped unless forced.
    - Always review what will be removed before running.

    Dependencies:
    - UninstallTool.ps1: Common uninstallation functions module
    - versions.json: Configuration file for tool settings
#>

param (
    [switch]$Force,
    [switch]$NoRestart,
    [switch]$Verbose,
    [string]$LogFile = "$PSScriptRoot\unsetup_log.txt"
)

# Import common functions
. "$PSScriptRoot\Scripts\UninstallTool.ps1"

# Load version configuration
 $versions = Get-Content "$PSScriptRoot\versions.json" | ConvertFrom-Json

# Enhanced logging and progress tracking
 $Global:UnsetupStartTime = Get-Date
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
    Write-Progress -Activity "System Unsetup" -Status $Step -PercentComplete $percent
    Write-Log "[$Current/$Total] $Step" -Level "PROGRESS"
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
        if ($LogFile -ne "$PSScriptRoot\unsetup_log.txt") { $argList += "-LogFile `"$LogFile`"" }

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

function Remove-VCVars {
    Write-Log "Cleaning up VCVars environment variables..." -Level "INFO"
    $vcvarsCandidates = @(
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build",
        "${env:ProgramFiles}\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build",
        "${env:ProgramFiles}\Microsoft Visual Studio\2022\Professional\VC\Auxiliary\Build",
        "${env:ProgramFiles}\Microsoft Visual Studio\2022\Enterprise\VC\Auxiliary\Build",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build"
    )

    $vcvarsRemoved = $false
    foreach ($candidate in $vcvarsCandidates) {
        if (Test-Path $candidate) {
            Write-Log "Found VCVars directory at: $candidate. Removing from PATH." -Level "INFO"
            # Use the function from UninstallTool.ps1
            Remove-FromPath -PathToRemove $candidate
            $vcvarsRemoved = $true
            break
        }
    }
    
    if ($vcvarsRemoved) {
        Write-Log "VCVars cleanup completed. A restart may be needed to apply PATH changes." -Level "SUCCESS"
        return $true
    }
    else {
        Write-Log "No VCVars directories found in PATH. Nothing to clean up." -Level "INFO"
        return $true  # Return true even if nothing was found, as this is not an error
    }
}

function Show-Summary {
    param([hashtable]$Results)
    
    Write-Log "=== UNSETUP SUMMARY ===" -Level "INFO"
    $elapsed = (Get-Date) - $Global:UnsetupStartTime
    Write-Log "Total unsetup time: $([math]::Round($elapsed.TotalMinutes, 2)) minutes" -Level "INFO"
    
    foreach ($key in $Results.Keys) {
        $status = if ($Results[$key]) { "✅ SUCCESS" } else { "❌ FAILED" }
        Write-Log "$key`: $status" -Level "INFO"
    }
    
    $failedCount = ($Results.Values | Where-Object { -not $_ }).Count
    if ($failedCount -eq 0) {
        Write-Log "🎉 All components uninstalled successfully!" -Level "SUCCESS"
    }
    else {
        Write-Log "⚠️  $failedCount component(s) failed to uninstall" -Level "WARNING"
    }
}

# Main execution
if (RelaunchAsAdmin) {
    try {
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
        $needRestart = $false
        $results = @{}
        
        Write-Log "=== SYSTEM UNSETUP STARTED ===" -Level "WARNING"
        Write-Log "This will remove core development tools installed by setup_all.ps1." -Level "WARNING"
        $response = Read-Host "Are you sure you want to continue? (y/N)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            Write-Log "Unsetup cancelled by user." -Level "INFO"
            exit 0
        }
        
        # Get core tools only
        $coreTools = $versions.system_tools | Where-Object { $_.isCoreTool -eq $true }
        $totalTools = $coreTools.Count
        $currentTool = 0
        
        # Uninstall core tools in reverse order (good practice for dependencies)
        [Array]::Reverse($coreTools)

        foreach ($tool in $coreTools) {
            $currentTool++
            Write-Progress-Step "Uninstalling $($tool.appName)" $currentTool ($totalTools + 1)
            
            # Special case for Chocolatey: warn user heavily
            if ($tool.appName -eq "Chocolatey") {
                $isChocoInstalled = & $checkCommand -ErrorAction SilentlyContinue
                if ($isChocoInstalled -and -not $Force) {
                    Write-Log "Chocolatey is installed but uninstallation skipped as it may break other applications." -Level "WARNING"
                    Write-Log "Use -Force to attempt uninstalling Chocolatey." -Level "WARNING"
                    $results[$tool.appName] = $true # Mark as "success" to not confuse the user
                    continue
                }
                # If not installed or Force is used, proceed with normal uninstallation
            }

            $results[$tool.appName] = Uninstall-Tool `
                -appName $tool.appName `
                -checkCommand ([scriptblock]::Create($tool.checkCommand)) `
                -envPath $tool.envPath `
                -uninstallCommand ([scriptblock]::Create($tool.uninstallCommand)) `
                -Force:$Force
            
            # Track if any tool was actually uninstalled (may need restart)
            if ($results[$tool.appName]) {
                $needRestart = $true
            }
        }
        
        # Cleanup VCVars environment
        Write-Progress-Step "Cleaning up VCVars environment" ($totalTools + 1) ($totalTools + 1)
        $vcvarsResult = Remove-VCVars
        $results["VCVars Environment"] = $vcvarsResult
        if ($vcvarsResult) {
            $needRestart = $true
        }
        
        Write-Progress -Activity "System Unsetup" -Completed
        Show-Summary -Results $results
        
        # Handle restart logic - only restart if something was actually uninstalled
        if ($needRestart -and -not $NoRestart) {
            Write-Log "A restart is required to complete the removal of all components." -Level "WARNING"
            $response = Read-Host "Do you want to restart now? (y/N)"
            if ($response -eq 'y' -or $response -eq 'Y') {
                Write-Log "Restarting system..." -Level "INFO"
                Restart-Computer -Force
            }
            else {
                Write-Log "Restart postponed. Please restart manually to complete unsetup." -Level "WARNING"
            }
        }
        elseif ($needRestart) {
            Write-Log "Restart required but skipped due to -NoRestart flag." -Level "WARNING"
        }
        else {
            Write-Log "Unsetup completed successfully. No restart required." -Level "SUCCESS"
        }
        
    }
    catch {
        Write-Log "Fatal error during unsetup: $($_.Exception.Message)" -Level "ERROR"
        Write-Log "Stack trace: $($_.ScriptStackTrace)" -Level "ERROR"
        exit 1
    }
    finally {
        Write-Log "=== UNSETUP COMPLETED ===" -Level "INFO"
    }
}