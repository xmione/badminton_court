<#
.SYNOPSIS
    Forcefully removes non-standard clutter from the Windows Kits 10 directory.
#>
function RelaunchAsAdmin {
    $isAdmin = ([Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        Write-Host "Requesting Administrative Privileges..." -ForegroundColor Yellow
        Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"") -Verb RunAs
        exit
    }
}

function RunCleanup {
    $kitsPath = "C:\Program Files (x86)\Windows Kits\10"
    # List of folders that SHOULD be in a clean SDK install
    $safeFolders = @("bin", "Include", "Lib", "Platforms", "References", "UnionMetadata", "Catalogs", "DesignTime")

    Write-Host "--- Cleaning Windows Kits Clutter (Admin Mode) ---" -ForegroundColor Cyan

    if (Test-Path $kitsPath) {
        $items = Get-ChildItem -Path $kitsPath -Force
        foreach ($item in $items) {
            if ($safeFolders -notcontains $item.Name) {
                Write-Host "Removing Clutter: $($item.Name)" -ForegroundColor Yellow
                try {
                    # Using -Force and -Recurse to handle read-only files and subdirectories
                    Remove-Item -Path $item.FullName -Recurse -Force -ErrorAction Stop
                    Write-Host "Successfully removed: $($item.Name)" -ForegroundColor Green
                } catch {
                    Write-Host "CRITICAL: Could not remove $($item.Name). Reason: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        Write-Host "`nCleanup Complete. Folder structure normalized." -ForegroundColor Green
    } else {
        Write-Host "Path not found: $kitsPath" -ForegroundColor Red
    }
    
    Write-Host "`nPress Enter to close..."
    Read-Host | Out-Null
}

# Entry Point
RelaunchAsAdmin
RunCleanup