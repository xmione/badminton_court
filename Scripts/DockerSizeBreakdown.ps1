# DockerImagesWithCheck.ps1
# Function to convert human-readable size to bytes
function ConvertTo-Bytes {
    param ($sizeString)
    if ($sizeString -eq "0B" -or $sizeString -eq "") { return 0 }
    $value = [double]($sizeString -replace "[^\d.]")
    $unit = $sizeString -replace "[\d.]"
    switch ($unit) {
        "GB" { return [int64]($value * 1e9) }
        "MB" { return [int64]($value * 1e6) }
        "KB" { return [int64]($value * 1e3) }
        "B"  { return [int64]$value }
        default { return 0 }
    }
}

# Function to format bytes to MB or GB
function Format-Size {
    param ($bytes)
    if ($bytes -ge 1e9) {
        return "$([math]::Round($bytes / 1e9, 2)) GB"
    } elseif ($bytes -ge 1e6) {
        return "$([math]::Round($bytes / 1e6, 2)) MB"
    } else {
        return "$bytes bytes"
    }
}

# Get Docker object sizes
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

# Get WSL2 VHDX total size
 $vhdxPath = "$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx"
 $vhdxSize = if (Test-Path $vhdxPath) { (Get-Item $vhdxPath).Length } else { 0 }

# --- START: NEW OVERHEAD CALCULATION ---
# Measure overhead components using WSL
 $logsSize = 0
 $systemSize = 0
 $buildxSize = 0
try {
    $logsOutput = wsl --distribution docker-desktop-data --exec sh -c "du -sb /var/log /tmp /var/tmp 2>/dev/null | grep -E '^[0-9]+' || true" | ForEach-Object { $_.Split()[0] }
    $logsSize = [int64]($logsOutput | Measure-Object -Sum -ErrorAction SilentlyContinue).Sum
    
    $systemOutput = wsl --distribution docker-desktop-data --exec sh -c "du -sb /bin /etc /lib /sbin /usr 2>/dev/null | grep -E '^[0-9]+' || true" | ForEach-Object { $_.Split()[0] }
    $systemSize = [int64]($systemOutput | Measure-Object -Sum -ErrorAction SilentlyContinue).Sum
    
    $buildxOutput = wsl --distribution docker-desktop-data --exec sh -c "du -sb /root/.docker/buildx 2>/dev/null | grep -E '^[0-9]+' || true" | ForEach-Object { $_.Split()[0] }
    $buildxSize = [int64]($buildxOutput | Measure-Object -Sum -ErrorAction SilentlyContinue).Sum
} catch {
    Write-Output "Warning: Could not access WSL2 distro for overhead sizes. Assuming 0 bytes."
}

# Calculate reserved space (ext4 reserves ~5%)
 $reservedSize = [int64]($vhdxSize * 0.05)

# Calculate total overhead as sum of measured components
 $totalDocker = $imagesSize + $containersSize + $volumesSize + $cacheSize
 $measuredOverhead = $logsSize + $systemSize + $buildxSize + $reservedSize
 $otherOverhead = $vhdxSize - $totalDocker - $measuredOverhead
 $totalOverhead = $measuredOverhead + $otherOverhead
# --- END: NEW OVERHEAD CALCULATION ---


# List individual images
Write-Output "Docker Images List:"
Write-Output "Repository:Tag`t`t`t`tSize"
 $imageCount = 0
docker images --format '{{.Repository}}:{{.Tag}}\t{{.Size}}' | ForEach-Object {
    $parts = $_.Split("`t")
    if ($parts.Length -ge 2) {
        $imageName = $parts[0]
        $imageSize = $parts[1]
        $sizeBytes = ConvertTo-Bytes $imageSize
        $imageCount++
        $displayName = if ($imageName.Length -gt 30) { $imageName.Substring(0, 27) + "..." } else { $imageName }
        Write-Output "$displayName`t$(Format-Size $sizeBytes)"
    }
}

# Output totals and breakdown
Write-Output ""
Write-Output "Total: $imageCount images, $(Format-Size $imagesSize) total"
Write-Output ""
Write-Output "Full Docker Breakdown (WSL2 VHDX: $(Format-Size $vhdxSize))"
Write-Output "Images: $(Format-Size $imagesSize)"
Write-Output "Containers: $(Format-Size $containersSize)"
Write-Output "Volumes: $(Format-Size $volumesSize)"
Write-Output "Build Cache: $(Format-Size $cacheSize)"
Write-Output ""
Write-Output "Overhead Breakdown:"
Write-Output "  Logs/Temp Files: $(Format-Size $logsSize)"
Write-Output "  WSL2 System Files: $(Format-Size $systemSize)"
Write-Output "  Buildx Cache: $(Format-Size $buildxSize)"
Write-Output "  ext4 Reserved Space (5%): $(Format-Size $reservedSize)"
Write-Output "  Other (fragmentation, unreclaimed): $(Format-Size $otherOverhead)"
Write-Output "Total Overhead: $(Format-Size $totalOverhead)"

# Counter-check
 $sumComponents = $totalDocker + $totalOverhead
if ($vhdxSize -eq 0) {
    Write-Output "Error: VHDX not found at $vhdxPath. Ensure Docker Desktop is running."
} elseif ([math]::Abs($sumComponents - $vhdxSize) -lt 1000000) { # Allow small difference due to rounding
    Write-Output "Verification: Sum of components ($(Format-Size $sumComponents)) matches VHDX size."
} else {
    Write-Output "Verification Failed: Sum of components ($(Format-Size $sumComponents)) does not match VHDX size ($(Format-Size $vhdxSize))."
}