<#
.SYNOPSIS
    Updates a JSON configuration file to match currently installed software versions.

.DESCRIPTION
    This script scans the current system for installed software versions and updates a versions.json file to reflect the actual installed versions.
    It dynamically loads version detection functions based on the tools defined in the JSON file.

.PARAMETER JsonPath
    Specifies the path to the versions.json configuration file.
    Default: "..\versions.json" (root folder relative to script location)

.PARAMETER NoBackup
    Skips creating a backup of the original JSON file before updating.

.PARAMETER RemoveMissingPackages
    Removes Python packages from the JSON file if they are not installed.
    By default, missing packages are KEPT.

.PARAMETER Verbose
    Enables verbose output with detailed diagnostic information.

.EXAMPLE
    .\Scripts\Update-JsonFromSetup.ps1
    Updates the default versions.json file with current system versions (creates backup, keeps missing packages)

.EXAMPLE
    .\Scripts\Update-JsonFromSetup.ps1 -RemoveMissingPackages
    Updates versions.json and removes missing packages from the file

.EXAMPLE
    .\Scripts\Update-JsonFromSetup.ps1 -Verbose
    Updates versions.json, keeps missing packages, and shows detailed diagnostics

.NOTES
    File Name      : Scripts\Update-JsonFromSetup.ps1
    Author         : Solomio S. Sisante
    Prerequisite   : PowerShell 5.1 or later
    Copyright      : c(2025)
     
#>
param (
    [string]$JsonPath = "..\versions.json",
    [switch]$NoBackup,
    [switch]$RemoveMissingPackages,
    [switch]$Verbose
)

# Import the InstallTool module from the same directory
. "$PSScriptRoot\InstallTool.ps1"

# If JsonPath is relative, make it relative to the script directory
if (-not ([System.IO.Path]::IsPathRooted($JsonPath))) {
    $JsonPath = Join-Path -Path $PSScriptRoot -ChildPath $JsonPath
}

# Main script
try {
    Write-Host "Starting JSON configuration update..." -ForegroundColor Cyan
    if ($Verbose) {
        Write-Host "Verbose mode enabled" -ForegroundColor Yellow
    }
    
    # Resolve the JSON path to ensure it's absolute
    $JsonPath = Resolve-Path $JsonPath -ErrorAction Stop
    Write-Verbose "JSON file path resolved to: $JsonPath"
    
    # Create backup if not skipped
    if (-not $NoBackup) {
        $backupPath = "$JsonPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item -Path $JsonPath -Destination $backupPath
        Write-Host "Created backup at $backupPath" -ForegroundColor Yellow
    }
    
    # Read existing JSON file
    $jsonContent = Get-Content -Path $JsonPath -Raw | ConvertFrom-Json
    Write-Verbose "Loaded JSON configuration with $($jsonContent.system_tools.Count) tools"
    
    # Initialize counters
    $toolsProcessed = 0
    $toolsUpdated = 0
    $toolsNotFound = 0
    
    # Process each tool in the system_tools array
    foreach ($tool in $jsonContent.system_tools) {
        $toolsProcessed++
        $appName = $tool.appName
        Write-Host "Processing tool: $appName" -ForegroundColor White
        
        # Dynamically call the appropriate version detection function
        # Special handling for .NET 9.0.100
        if ($appName -eq ".NET 9.0.100") {
            $functionName = "Get-DOTNET9Version"
        } else {
            $functionName = "Get-$($appName.Replace(' ', '').Replace('.', ''))Version"
        }
        Write-Verbose "Looking for function: $functionName"
        
        # Check if the function exists
        if (Get-Command $functionName -ErrorAction SilentlyContinue) {
            Write-Verbose "Function $functionName found, executing..."
            $versionResult = & $functionName
            
            if ($versionResult) {
                # Handle different result types
                if ($versionResult -is [hashtable]) {
                    # It's a hashtable with version and additional properties
                    $version = $versionResult.version
                    
                    # Add or update version property
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    
                    # Add additional properties from the result
                    foreach ($prop in $versionResult.Keys) {
                        if ($prop -ne "version") {
                            if (-not $tool.PSObject.Properties.Name.Contains($prop)) {
                                $tool | Add-Member -MemberType NoteProperty -Name $prop -Value $versionResult[$prop]
                            } else {
                                $tool.$prop = $versionResult[$prop]
                            }
                            Write-Verbose "Added property $prop with value $($versionResult[$prop])"
                        }
                    }
                    
                    Write-Host "  Updated $appName version to $version" -ForegroundColor Green
                    $toolsUpdated++
                } else {
                    # It's a simple version string
                    $version = $versionResult
                    
                    # Add or update version property
                    if (-not $tool.PSObject.Properties.Name.Contains("version")) {
                        $tool | Add-Member -MemberType NoteProperty -Name "version" -Value $version
                    } else {
                        $tool.version = $version
                    }
                    
                    Write-Host "  Updated $appName version to $version" -ForegroundColor Green
                    $toolsUpdated++
                }
            } else {
                Write-Host "  $appName not found or version detection failed" -ForegroundColor Red
                $toolsNotFound++
            }
        } else {
            Write-Warning "No version detection function available for: $appName"
            $toolsNotFound++
        }
    }
    
    # Handle Python packages section if it exists
    if ($jsonContent.PSObject.Properties.Name.Contains("python_packages")) {
        Write-Host "Processing Python packages..." -ForegroundColor Cyan
        
        $packagesInfo = Get-PythonPackagesVersions
        if ($packagesInfo.Count -gt 0) {
            $missingPackages = @()
            $packagesToRemove = @()
            
            # Create a new ordered dictionary for packages
            $newPackages = [ordered]@{}
            
            foreach ($package in $jsonContent.python_packages.PSObject.Properties.Name) {
                # Try exact match first
                if ($packagesInfo.ContainsKey($package)) {
                    $newPackages[$package] = $packagesInfo[$package]
                    Write-Host "  Updated Python package $package to $($packagesInfo[$package])" -ForegroundColor Green
                    continue
                }
                
                # Try case-insensitive match
                $lowercasePackage = $package.ToLower()
                if ($packagesInfo.ContainsKey($lowercasePackage)) {
                    $newPackages[$package] = $packagesInfo[$lowercasePackage]
                    Write-Host "  Updated Python package $package to $($packagesInfo[$lowercasePackage])" -ForegroundColor Green
                    continue
                }
                
                # Try normalized name (underscores to hyphens)
                $normalizedPackage = $package.ToLower().Replace('_', '-')
                if ($packagesInfo.ContainsKey($normalizedPackage)) {
                    $newPackages[$package] = $packagesInfo[$normalizedPackage]
                    Write-Host "  Updated Python package $package (normalized as $normalizedPackage) to $($packagesInfo[$normalizedPackage])" -ForegroundColor Green
                    continue
                }
                
                # Package not found
                $missingPackages += $package
                if ($RemoveMissingPackages) {
                    $packagesToRemove += $package
                    Write-Host "  Removing missing Python package $package from JSON file" -ForegroundColor Yellow
                } else {
                    # Keep the package with its original version
                    $newPackages[$package] = $jsonContent.python_packages.$package
                    Write-Host "  Python package $package not found, but kept in JSON" -ForegroundColor Yellow
                }
            }
            
            # Update the python_packages object only if we're removing packages
            if ($RemoveMissingPackages -and $packagesToRemove.Count -gt 0) {
                $jsonContent.python_packages = $newPackages
                Write-Host "Removed $($packagesToRemove.Count) missing packages from JSON file" -ForegroundColor Yellow
            } elseif ($newPackages.Count -gt 0) {
                # Update with new versions but keep all packages
                $jsonContent.python_packages = $newPackages
            }
            
            if ($missingPackages.Count -gt 0) {
                Write-Host "Missing Python packages: $($missingPackages -join ', ')" -ForegroundColor Yellow
                if ($RemoveMissingPackages) {
                    Write-Host "These packages were removed because RemoveMissingPackages was specified." -ForegroundColor Yellow
                } else {
                    Write-Host "These packages were kept in the JSON file (default behavior)." -ForegroundColor Green
                    Write-Host "You can install them manually:" -ForegroundColor Yellow
                    foreach ($pkg in $missingPackages) {
                        Write-Host "  pip install $pkg" -ForegroundColor Yellow
                    }
                }
            }
        } else {
            Write-Warning "Python packages not found. Versions not updated."
        }
    }
    
    # Save updated JSON
    $jsonContent | ConvertTo-Json -Depth 10 | Set-Content -Path $JsonPath
    
    # Display summary
    Write-Host "=== UPDATE SUMMARY ===" -ForegroundColor Cyan
    Write-Host "Tools processed: $toolsProcessed" -ForegroundColor White
    Write-Host "Tools updated: $toolsUpdated" -ForegroundColor Green
    Write-Host "Tools not found: $toolsNotFound" -ForegroundColor Red
    
    if ($toolsNotFound -gt 0) {
        Write-Host "Tools not found:" -ForegroundColor Yellow
        $notFoundTools = $jsonContent.system_tools | Where-Object { -not $_.PSObject.Properties.Name.Contains("version") } | Select-Object -ExpandProperty appName
        foreach ($toolName in $notFoundTools) {
            Write-Host "  - $toolName" -ForegroundColor Red
        }
        Write-Host "You may need to install these tools manually or check if they are installed in non-standard locations." -ForegroundColor Yellow
    }
    
    Write-Host "JSON file updated successfully!" -ForegroundColor Green
    Write-Host "All detected tools now have version information recorded." -ForegroundColor Green
    if (-not $RemoveMissingPackages) {
        Write-Host "Missing Python packages were preserved in the configuration file (default behavior)." -ForegroundColor Green
    }
    
} catch {
    $errorMessage = $_.Exception.Message
    Write-Error "Error updating JSON file: $errorMessage"
    exit 1
}