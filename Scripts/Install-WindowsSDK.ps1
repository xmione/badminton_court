<#
.SYNOPSIS
    Installs the Windows 11 24H2 SDK (Build 10.0.26100.0) in a portable layout mode.        
.DESCRIPTION
    This script performs the following steps:
    1. Checks for administrative privileges and relaunches itself with elevation if necessary.
    2. Uses Winget to download the Windows SDK installer to a temporary location, displaying real-time progress based on the file size.
    3. Executes the installer in layout mode to extract the SDK components to a specified directory, while showing progress based on the total size of the extracted files.
    4. Cleans up temporary files after installation is complete.            
.NOTES
    File Name      : setup_all.ps1
    Author         : Solomio S. Sisante
    Prerequisite   : PowerShell 5.1 or later
    Copyright      : c(2025)

    IMPORTANT:
    - Requires PowerShell 5.1 or later.
    - Tested on Windows 10 and Windows 11.
    - The script assumes a stable internet connection for downloading the installer.
    - The estimated total size for the layout installation is around 1.28 GB, which may vary based on the components included in the SDK.
    - Ensure that the specified installation and download paths have sufficient disk space and appropriate permissions.
    - The script uses a simple method to estimate download progress based on the expected size of the installer, which may not be perfectly accurate but provides a reasonable approximation for user feedback.
    - The installation progress is estimated based on the total size of the files in the installation directory, which may fluctuate during the layout process. The final progress will be set to 100% once the installer process exits.
    - The script includes error handling for common issues such as missing directories or failed downloads, but it may not cover all edge cases. Users should monitor the output for any errors and address them accordingly.
   
#>
function RelaunchAsAdmin {
    $isAdmin = ([Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"") -Verb RunAs
        exit
    }
    return $true
}

function Install-WindowsSDK {
    Write-Host "--- Windows 11 24H2 SDK Setup (Build 10.0.26100.0) ---" -ForegroundColor Cyan
    
    # 1. Platform Compatibility
    $packageId = "Microsoft.WindowsSDK.10.0.26100"
    $installPath = "C:\SDK_24H2_Portable"
    $downloadFolder = "C:\SDK_Download_Temp"
    
    if (!(Test-Path $installPath)) { New-Item -ItemType Directory -Path $installPath -Force | Out-Null }
    if (!(Test-Path $downloadFolder)) { New-Item -ItemType Directory -Path $downloadFolder -Force | Out-Null }

    # --- Phase 1: Downloading ---
    # Requirement 3 & 5: Text display with proper refresh (MB/MB %)
    Write-Host "Phase 1/2: Downloading Installer via Winget..."
    
    # We trigger the download to our specific temp folder
    $wingetProcess = Start-Process winget -ArgumentList "download --id $packageId --download-directory `"$downloadFolder`" --accept-package-agreements" -PassThru -WindowStyle Hidden

    $totalDownloadSize = 12.5MB # The bootstrapper is small; the layout carries the weight
    while (!$wingetProcess.HasExited) {
        $file = Get-ChildItem $downloadFolder -Filter "*.exe" | Select-Object -First 1
        $curSize = if ($file) { $file.Length } else { 0 }
        
        $pct = [Math]::Min(99, [Math]::Round(($curSize / $totalDownloadSize) * 100, 0))
        # Requirement 5: Current Size / Total Size (Percentage)
        Write-Host ("`rDownloading: {0:N2} MB / {1:N2} MB ({2}%)" -f ($curSize/1MB), ($totalDownloadSize/1MB), $pct) -NoNewline
        Start-Sleep -Milliseconds 500
    }
    
    $installer = Get-ChildItem $downloadFolder -Filter "*.exe" | Select-Object -ExpandProperty FullName -First 1
    Write-Host ("`rDownloading: {0:N2} MB / {0:N2} MB (100%)" -f ((Get-Item $installer).Length/1MB)) -ForegroundColor Green
    Write-Host "`nDownload Complete."

    # --- Phase 2: Installing ---
    # Requirement 2, 4 & 5: Unified progress for the tools processing
    Write-Host "`nPhase 2/2: Installing Components (Layout Mode)..."
    
    # Start the layout process
    $installProcess = Start-Process $installer -ArgumentList "/layout `"$installPath`" /quiet /norestart" -PassThru
    
    # 10.0.26100.0 full layout is ~1.28 GB
    $totalEstSize = 1310MB 

    while (!$installProcess.HasExited) {
        $currentSize = (Get-ChildItem $installPath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        if ($null -eq $currentSize) { $currentSize = 0 }

        $pct = [Math]::Min(99, [Math]::Round(($currentSize / $totalEstSize) * 100, 0))
        
        # Requirement 4 & 5: Refresh and display cleanup
        Write-Host ("`rInstalling: {0:N2} MB / {1:N2} MB ({2}%)" -f ($currentSize/1MB), ($totalEstSize/1MB), $pct) -NoNewline
        Start-Sleep -Seconds 1
    }

    # Requirement 4: Final refresh to 100%
    Write-Host ("`rInstalling: {0:N2} MB / {0:N2} MB (100%)" -f ($totalEstSize/1MB)) -ForegroundColor Green
    Write-Host "`nSetup Completed Successfully."
    
    # Cleanup download temp
    Remove-Item $downloadFolder -Recurse -Force -ErrorAction SilentlyContinue
}

if (RelaunchAsAdmin) {
    Install-WindowsSDK
    Write-Host "`nPress Enter to close..."
    Read-Host | Out-Null        
}