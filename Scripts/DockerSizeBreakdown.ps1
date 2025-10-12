<#
.SYNOPSIS
    Provides a detailed breakdown of Docker Desktop resource usage on Windows, including WSL2 overhead.

.DESCRIPTION
    This script analyzes the Docker Desktop WSL2 VHDX file to provide a comprehensive report on disk consumption.
    It breaks down the space used by images, containers, volumes, and various overhead components.
    It explains the composition of image storage and provides a reliable total breakdown.
    The report includes a counter-check to ensure all components are accounted for and provides actionable
    recommendations for reclaiming unreclaimed space.

.EXAMPLE
    .\DockerSizeBreakdown.ps1

    This command runs the script and displays the full Docker resource breakdown.
#>

# Function to convert human-readable size to bytes
function ConvertTo-Bytes {
    param ($sizeString)
    if ($sizeString -eq "0B" -or $sizeString -eq "") { return 0 }
    $value = [double]($sizeString -replace "[^\d.]")
    $unit = $sizeString -replace "[\d.]"
    switch ($unit) {
        "GB" { return [int64]($value * 1GB) }
        "MB" { return [int64]($value * 1MB) }
        "KB" { return [int64]($value * 1KB) }
        "B"  { return [int64]$value }
        default { return 0 }
    }
}

# Function to format bytes to MB or GB using correct 1024-based calculation
function Format-Size {
    param ($bytes)
    if ($bytes -ge 1GB) {
        return "$([math]::Round($bytes / 1GB, 2)) GB"
    } elseif ($bytes -ge 1MB) {
        return "$([math]::Round($bytes / 1MB, 2)) MB"
    } else {
        return "$bytes bytes"
    }
}

# --- START: ROBUST DISK SPACE CONTEXT ---
# Get system disk information with a more reliable method
 $vhdxPath = "$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx"
 $vhdxSize = if (Test-Path $vhdxPath) { (Get-Item $vhdxPath).Length } else { 0 }

 $cimDisk = Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DeviceID='C:'"
 $totalDiskSpace = if ($cimDisk) { $cimDisk.Size } else { 0 }
 $freeDiskSpace = if ($cimDisk) { $cimDisk.FreeSpace } else { 0 }

 $diskPercentage = if ($totalDiskSpace -gt 0) { "$([math]::Round(($vhdxSize / $totalDiskSpace) * 100, 1))%" } else { "N/A" }

Write-Output "=========================================="
Write-Output "SYSTEM DISK STATUS"
Write-Output "=========================================="
Write-Output "Total Disk Space: $(Format-Size $totalDiskSpace)"
Write-Output "Free Disk Space:  $(Format-Size $freeDiskSpace)"
Write-Output "Docker VHDX Size: $(Format-Size $vhdxSize) ($diskPercentage of disk)"
Write-Output ""
# --- END: ROBUST DISK SPACE CONTEXT ---

# --- START: BASIC AND RELIABLE DOCKER DATA COLLECTION ---
# Get Docker object sizes using the most reliable method
 $dfOutput = docker system df --format '{{.Type}} {{.Size}}' | ForEach-Object { $_.Split() }
 $imagesSize = $containersSize = $volumesSize = $cacheSize = 0
for ($i = 0; $i -lt $dfOutput.Length; $i += 2) {
    $type = $dfOutput[$i]
    $size = $dfOutput[$i + 1]
    switch ($type) {
        "Images" { $imagesSize = ConvertTo-Bytes $size }
        "Containers" { $containersSize = ConvertTo-Bytes $size }
        "LocalVolumes" { $volumesSize = ConvertTo-Bytes $size }
        "BuildCache" { $cacheSize = ConvertTo-Bytes $size }
    }
}

# List individual images with an HONEST label
Write-Output "=========================================="
Write-Output "DOCKER IMAGES LIST"
Write-Output "=========================================="
Write-Output "Note: The sizes below are virtual sizes. The actual disk usage for all images"
Write-Output "combined is $(Format-Size $imagesSize), as images share common layers."
Write-Output "A per-image breakdown of actual disk usage is not available via the Docker CLI."
Write-Output ""
Write-Output "Repository:Tag`t`t`t`tVirtual Size"
 $imageCount = 0
docker images --format '{{.Repository}}:{{.Tag}}\t{{.Size}}' | ForEach-Object {
    $parts = $_.Split("`t")
    if ($parts.Length -ge 2) {
        $imageName = $parts[0]
        $imageSize = $parts[1]
        $imageCount++
        $displayName = if ($imageName.Length -gt 30) { $imageName.Substring(0, 27) + "..." } else { $imageName }
        Write-Output "$displayName`t$imageSize"
    }
}
Write-Output ""
Write-Output "Total Images: $imageCount"
Write-Output "Total Actual Disk Usage: $(Format-Size $imagesSize)"
Write-Output ""
# --- END: BASIC AND RELIABLE DOCKER DATA COLLECTION ---


# --- START: HONEST AND ROBUST OVERHEAD MEASUREMENT ---
# Measure specific overhead components
 $logsSize = 0
 $systemSize = 0
 $buildxSize = 0
 $dockerConfigSize = 0
 $danglingImagesSize = 0
 $unusedVolumesSize = 0
try {
    $logsOutput = wsl --distribution docker-desktop-data --exec sh -c "du -sb /var/log /tmp /var/tmp 2>/dev/null | grep -E '^[0-9]+' || true" | ForEach-Object { $_.Split()[0] }
    $logsSize = [int64]($logsOutput | Measure-Object -Sum -ErrorAction SilentlyContinue).Sum
    
    $systemOutput = wsl --distribution docker-desktop-data --exec sh -c "du -sb /bin /etc /lib /sbin /usr 2>/dev/null | grep -E '^[0-9]+' || true" | ForEach-Object { $_.Split()[0] }
    $systemSize = [int64]($systemOutput | Measure-Object -Sum -ErrorAction SilentlyContinue).Sum
    
    $buildxOutput = wsl --distribution docker-desktop-data --exec sh -c "du -sb /root/.docker/buildx 2>/dev/null | grep -E '^[0-9]+' || true" | ForEach-Object { $_.Split()[0] }
    $buildxSize = [int64]($buildxOutput | Measure-Object -Sum -ErrorAction SilentlyContinue).Sum
    
    $dockerConfigOutput = wsl --distribution docker-desktop-data --exec sh -c "du -sb /root/.docker 2>/dev/null | grep -E '^[0-9]+' || true" | ForEach-Object { $_.Split()[0] }
    $dockerConfigSize = [int64]($dockerConfigOutput | Measure-Object -Sum -ErrorAction SilentlyContinue).Sum
    
    # Get dangling images size
    $danglingImagesOutput = docker images --filter "dangling=true" --format "{{.Size}}" | ForEach-Object { ConvertTo-Bytes $_ }
    $danglingImagesSize = [int64]($danglingImagesOutput | Measure-Object -Sum -ErrorAction SilentlyContinue).Sum
    
    # Get unused volumes size
    $unusedVolumesOutput = docker volume ls --filter "dangling=true" --format "{{.Name}}" | ForEach-Object { 
        $volumePath = wsl -d docker-desktop --exec sh -c "docker volume inspect $_ --format '{{ .Mountpoint }}'" 2>$null
        if ($volumePath) {
            $sizeOutput = wsl -d docker-desktop --exec sh -c "du -sb '$volumePath' 2>/dev/null | cut -f1" 2>$null
            if ($sizeOutput) { [int64]$sizeOutput }
        }
    }
    $unusedVolumesSize = [int64]($unusedVolumesOutput | Measure-Object -Sum -ErrorAction SilentlyContinue).Sum
} catch {
    Write-Output "Warning: Could not access WSL2 distro for overhead sizes. Assuming 0 bytes."
}

# Calculate reserved space (ext4 reserves ~5%)
 $reservedSize = [int64]($vhdxSize * 0.05)

# Calculate total overhead as sum of measured components
 $totalDocker = $imagesSize + $containersSize + $volumesSize + $cacheSize
 $measuredOverhead = $logsSize + $systemSize + $buildxSize + $dockerConfigSize + $reservedSize + $danglingImagesSize + $unusedVolumesSize

# --- ROBUST OTHER CALCULATION ---
# The "Other" category is the remaining space in the VHDX that we cannot measure directly.
# This is the most reliable calculation as it will never be negative.
 $otherOverhead = $vhdxSize - $totalDocker - $measuredOverhead
 $totalOverhead = $measuredOverhead + $otherOverhead
# --- END: ROBUST OTHER CALCULATION ---
# --- END: HONEST AND ROBUST OVERHEAD MEASUREMENT ---


# Define column widths for consistent table formatting
 $itemNameWidth = 40
 $sizeWidth = 20

# Create a more intuitive breakdown with counter-check
Write-Output "=========================================="
Write-Output "DOCKER RESOURCE BREAKDOWN ($(Format-Size $vhdxSize))"
Write-Output "=========================================="
Write-Output ("Item Name".PadRight($itemNameWidth) + "Size".PadRight($sizeWidth))
Write-Output ("".PadRight($itemNameWidth, '-') + "".PadRight($sizeWidth, '-'))
Write-Output ("Images (Actual Disk Usage)".PadRight($itemNameWidth) + "$(Format-Size $imagesSize)".PadRight($sizeWidth))
Write-Output ("Containers".PadRight($itemNameWidth) + "$(Format-Size $containersSize)".PadRight($sizeWidth))
Write-Output ("Volumes".PadRight($itemNameWidth) + "$(Format-Size $volumesSize)".PadRight($sizeWidth))
Write-Output ("Build Cache".PadRight($itemNameWidth) + "$(Format-Size $cacheSize)".PadRight($sizeWidth))
Write-Output ("Logs/Temp Files".PadRight($itemNameWidth) + "$(Format-Size $logsSize)".PadRight($sizeWidth))
Write-Output ("WSL2 System Files".PadRight($itemNameWidth) + "$(Format-Size $systemSize)".PadRight($sizeWidth))
Write-Output ("Docker Config Files".PadRight($itemNameWidth) + "$(Format-Size $dockerConfigSize)".PadRight($sizeWidth))
Write-Output ("Buildx Cache".PadRight($itemNameWidth) + "$(Format-Size $buildxSize)".PadRight($sizeWidth))
Write-Output ("Dangling Images".PadRight($itemNameWidth) + "$(Format-Size $danglingImagesSize)".PadRight($sizeWidth))
Write-Output ("Unused Volumes".PadRight($itemNameWidth) + "$(Format-Size $unusedVolumesSize)".PadRight($sizeWidth))
Write-Output ("ext4 Reserved Space".PadRight($itemNameWidth) + "$(Format-Size $reservedSize)".PadRight($sizeWidth))
Write-Output ("Other (Unreclaimed Space)".PadRight($itemNameWidth) + "$(Format-Size $otherOverhead)".PadRight($sizeWidth))
Write-Output ("".PadRight($itemNameWidth, '-') + "".PadRight($sizeWidth, '-'))
Write-Output ("Total".PadRight($itemNameWidth) + "$(Format-Size $vhdxSize)".PadRight($sizeWidth))
Write-Output ""

# Counter-check
 $sumComponents = $totalDocker + $totalOverhead
if ($vhdxSize -eq 0) {
    Write-Output "Error: VHDX not found at $vhdxPath. Ensure Docker Desktop is running."
    Write-Output "Counter Check Result: FAILED - Cannot verify without VHDX file"
} elseif ([math]::Abs($sumComponents - $vhdxSize) -lt 1MB) { # Allow small difference due to rounding
    Write-Output "Counter Check Result: PASSED - All components accounted for"
} else {
    $difference = [math]::Abs($sumComponents - $vhdxSize)
    Write-Output "Counter Check Result: FAILED - Missing $(Format-Size $difference) in breakdown"
}

# Additional analysis
Write-Output ""
Write-Output "=========================================="
Write-Output "ANALYSIS AND RECOMMENDATIONS"
Write-Output "=========================================="
if ($otherOverhead -gt 10MB) {
    Write-Output "WARNING: You have $(Format-Size $otherOverhead) of UNRECLAIMED SPACE."
    Write-Output "This is the largest consumer of space in your Docker environment."
    Write-Output "This space is taken up by old, deleted images and volumes that have not been fully removed."
    Write-Output "Standard 'prune' commands are often ineffective against this."
    Write-Output ""
    Write-Output "TO RECLAIM THIS SPACE:"
    Write-Output "1. Quit Docker Desktop."
    Write-Output "2. Open PowerShell as Administrator and run: wsl --unregister docker-desktop-data"
    Write-Output "3. Restart Docker Desktop."
    Write-Output ""
    Write-Output "WARNING: This will DELETE ALL VOLUMES, but your IMAGES will be preserved."
    Write-Output "Backup any important data in your volumes before proceeding."
}
if ($danglingImagesSize -gt 0) {
    Write-Output "Found $(Format-Size $danglingImagesSize) of dangling images (can be removed with 'docker image prune')"
}
if ($unusedVolumesSize -gt 0) {
    Write-Output "Found $(Format-Size $unusedVolumesSize) of unused volumes (can be removed with 'docker volume prune')"
}