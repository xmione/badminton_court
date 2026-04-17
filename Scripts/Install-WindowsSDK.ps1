<#
.SYNOPSIS
    Installs the Windows 11 24H2 SDK (Build 10.0.26100.0) and promotes binaries to the system Kits folder.         
.DESCRIPTION
    This script performs the following steps:
    1. Checks for administrative privileges and relaunches itself with elevation if necessary.
    2. Uses Winget to download the Windows SDK installer to a temporary location.
    3. Executes the installer in layout mode to extract the SDK components.
    4. Promotes ONLY the core SDK folders (bin, Include, Lib, etc.) to C:\Program Files (x86)\Windows Kits\10.
    5. Cleans up all temporary installation and layout files.            
.NOTES
    File Name      : Install-WindowsSDK.ps1
    Author         : Solomio S. Sisante
    Prerequisite   : PowerShell 5.1 or later
    Copyright      : c(2026) Solomio S. Sisante. All rights reserved.
.PARAMETER DisableEnter
    If specified, the script will not prompt "Press Enter to close" at the end.
.EXAMPLE
    .\Install-WindowsSDK.ps1 -DisableEnter
#>
param([switch]$DisableEnter)

function RelaunchAsAdmin {
    param([switch]$DisableEnter)
    $isAdmin = ([Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        $argList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"")
        if ($DisableEnter) { $argList += '-DisableEnter' }
        
        Start-Process -FilePath 'powershell.exe' -ArgumentList $argList -Verb RunAs
        exit
    }
    return $true
}

function Install-WindowsSDK {
    param([switch]$DisableEnter)

    Write-Host "--- Windows 11 24H2 SDK Setup (Build 10.0.26100.0) ---" -ForegroundColor Cyan
    
    $packageId = "Microsoft.WindowsSDK.10.0.26100"
    $installPath = "C:\SDK_24H2_Portable"
    $downloadFolder = "C:\SDK_Download_Temp"
    $systemPath = "C:\Program Files (x86)\Windows Kits\10"
    
    # Ensure temporary directories exist
    if (!(Test-Path $installPath)) { New-Item -ItemType Directory -Path $installPath -Force | Out-Null }
    if (!(Test-Path $downloadFolder)) { New-Item -ItemType Directory -Path $downloadFolder -Force | Out-Null }

    # Phase 1: Downloading via Winget
    Write-Host "Phase 1/3: Downloading Installer via Winget..."
    $wingetProcess = Start-Process winget -ArgumentList "download --id $packageId --download-directory `"$downloadFolder`" --accept-package-agreements" -PassThru -WindowStyle Hidden

    $totalDownloadSize = 12.5MB 
    while (!$wingetProcess.HasExited) {
        $file = Get-ChildItem $downloadFolder -Filter "*.exe" | Select-Object -First 1
        $curSize = if ($file) { $file.Length } else { 0 }
        $pct = [Math]::Min(99, [Math]::Round(($curSize / $totalDownloadSize) * 100, 0))
        Write-Host ("`rDownloading: {0:N2} MB / {1:N2} MB ({2}%)" -f ($curSize/1MB), ($totalDownloadSize/1MB), $pct) -NoNewline
        Start-Sleep -Milliseconds 500
    }
    
    $installer = Get-ChildItem $downloadFolder -Filter "*.exe" | Select-Object -ExpandProperty FullName -First 1
    Write-Host ("`rDownloading: {0:N2} MB / {0:N2} MB (100%)" -f ((Get-Item $installer).Length/1MB)) -ForegroundColor Green
    Write-Host "`nDownload Complete."

   # Phase 2: Extracting Components (Layout)
    Write-Host "`nPhase 2/3: Extracting Components (Layout Mode)..."
    $installProcess = Start-Process $installer -ArgumentList "/layout `"$installPath`" /quiet /norestart" -PassThru
    
    # We estimate 1310MB for the bar, but we WAIT for the actual process to exit
    $totalEstSize = 1310MB 
    while (!$installProcess.HasExited) {
        $currentSize = (Get-ChildItem $installPath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        if ($null -eq $currentSize) { $currentSize = 0 }
        
        # Keep progress bar at 99% until the process actually finishes
        $pct = [Math]::Min(99, [Math]::Round(($currentSize / $totalEstSize) * 100, 0))
        Write-Host ("`rExtracting: {0:N2} MB / {1:N2} MB ({2}%)" -f ($currentSize/1MB), ($totalEstSize/1MB), $pct) -NoNewline
        Start-Sleep -Seconds 1
    }
    Write-Host ("`rExtracting: {0:N2} MB / {0:N2} MB (100%)" -f ($totalEstSize/1MB)) -ForegroundColor Green

    # --- Phase 3: Surgical Promotion to System Folder ---
    Write-Host "`nPhase 3/3: Promoting Binaries to System Path..." -ForegroundColor Cyan
    
    # Check if the folder even exists before searching
    if (!(Test-Path $installPath)) {
        Write-Host "ERROR: Layout folder $installPath is missing. You may need to run the script again to redownload." -ForegroundColor Red
        if (-not $DisableEnter) { Read-Host "Press Enter to exit"; exit } else { exit }
    }

    # Search for the MSI
    $msi = Get-ChildItem -Path "C:\SDK_24H2_Portable\Installers" -Filter "Windows SDK Desktop Tools x64-x86_en-us.msi" -Recurse | Select-Object -ExpandProperty FullName -First 1
    $unpackPath = Join-Path $env:TEMP "SDK_Unpack"
    
    if ($null -ne $msi -and (Test-Path $msi)) {
        Write-Host "Found MSI at: $msi" -ForegroundColor Gray
        Write-Host "Unpacking build tools from MSI..." -ForegroundColor Gray
        
        if (Test-Path $unpackPath) { Remove-Item $unpackPath -Recurse -Force -ErrorAction SilentlyContinue }
        Start-Process msiexec -ArgumentList "/a `"$msi`" /qb TARGETDIR=`"$unpackPath`"" -Wait
    } else {
        Write-Host "ERROR: Could not locate 'Windows SDK Desktop Tools-x86_en-us.msi' in $installPath" -ForegroundColor Red
        Write-Host "The folder might be empty or corrupted." -ForegroundColor Yellow
        if (-not $DisableEnter) { Read-Host "Press Enter to exit"; exit } else { exit }
    }

    $kitFolders = @("bin", "Include", "Lib", "Platforms", "References", "UnionMetadata")

    if (!(Test-Path $systemPath)) { New-Item -ItemType Directory -Path $systemPath -Force | Out-Null }

    foreach ($folder in $kitFolders) {
        $source = Join-Path $unpackPath "Windows Kits\10\$folder"
        $destination = Join-Path $systemPath $folder
        
        if (Test-Path $source) {
            if (!(Test-Path $destination)) { New-Item -ItemType Directory -Path $destination -Force | Out-Null }
            
            # This line clarifies exactly WHERE the files are going
            Write-Host "Copying from: $source" -ForegroundColor Gray
            Write-Host "Targeting   : $destination" -ForegroundColor Gray
            
            # The -Force here ensures that existing corrupted 10.0.26100.0 files are REPLACED
            Copy-Item -Path "$source\*" -Destination $destination -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    # Phase 4: Register in "Installed Apps" List
    Write-Host "Registering in Windows Installed Apps..." -ForegroundColor Green
    $version = "10.0.26100.0"
    $regPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\WindowsSDK_24H2_Manual"
    $regProps = @{
        DisplayName     = "Windows Software Development Kit - $version (Manual)"
        DisplayVersion  = $version
        Publisher       = "Microsoft Corporation"
        InstallLocation = $systemPath
        NoModify         = 1
        NoRepair         = 1
        UninstallString = "powershell.exe -Command ""Remove-Item '$regPath' -Force"""
    }
    if (!(Test-Path $regPath)) { New-Item $regPath -Force | Out-Null }
    foreach ($prop in $regProps.GetEnumerator()) { Set-ItemProperty $regPath $prop.Key $prop.Value }

    # Phase 5: Final Cleanup (Now including the unpack folder)
    Write-Host "Cleaning temporary folders..." -ForegroundColor Gray
    Remove-Item $downloadFolder, $installPath, $unpackPath -Recurse -Force -ErrorAction SilentlyContinue

    Write-Host "SUCCESS: SDK is now 'Properly' installed and registered." -ForegroundColor Green
    if (-not $DisableEnter) { Read-Host "Press Enter to exit" }
    
}

# Execution
if (RelaunchAsAdmin -DisableEnter:$DisableEnter) {
    Install-WindowsSDK -DisableEnter:$DisableEnter
}