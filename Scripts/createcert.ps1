function New-OpenSSLCertificate {
    [CmdletBinding()]
    param(
        [Parameter()]
        [string]$Subject = "/CN=localhost",

        [Parameter()]
        [int]$Days = 365,

        [Parameter()]
        [string]$CertPath = "cert.pem",

        [Parameter()]
        [string]$KeyPath = "key.pem"
    )

    # Check if OpenSSL is available on the path.
    $openssl = Get-Command openssl -ErrorAction SilentlyContinue
    if (-not $openssl) {
        Write-Error "OpenSSL is not available on the path."
        return
    }

    # Ensure the output directories exist.
    $certDir = Split-Path $CertPath -Parent
    if (-not (Test-Path $certDir)) {
        New-Item -ItemType Directory -Path $certDir -Force | Out-Null
    }
    $keyDir = Split-Path $KeyPath -Parent
    if (-not (Test-Path $keyDir)) {
        New-Item -ItemType Directory -Path $keyDir -Force | Out-Null
    }

    Write-Output "Executing: openssl req -x509 -nodes -days $Days -newkey rsa:2048 -keyout $KeyPath -out $CertPath -subj $Subject"

    # Build the argument array.
    $pemArgs = @(
        "req",
        "-x509",
        "-nodes",
        "-days", "$Days",
        "-newkey", "rsa:2048",
        "-keyout", $KeyPath,
        "-out", $CertPath,
        "-subj", $Subject
    )

    # Execute OpenSSL with the argument array.
    & openssl @pemArgs

    if ($LASTEXITCODE -eq 0) {
        Write-Output "Certificate and key created successfully: $CertPath, $KeyPath"
    }
    else {
        Write-Error "OpenSSL command failed with exit code $LASTEXITCODE"
    }
}

function New-SigningKey {
    [CmdletBinding()]
    param(
        [Parameter()]
        [int]$KeySize = 2048,
        [Parameter()]
        [string]$KeyPath = "Scripts/certs/signing.key"
    )

    $openssl = Get-Command openssl -ErrorAction SilentlyContinue
    if (-not $openssl) {
        Write-Error "OpenSSL is not available on the path."
        return
    }

    $keyDir = Split-Path $KeyPath -Parent
    if (-not (Test-Path $keyDir)) {
        New-Item -ItemType Directory -Path $keyDir -Force | Out-Null
    }

    Write-Output "Executing: openssl genrsa -out $KeyPath $KeySize"
    & openssl genrsa -out $KeyPath $KeySize

    if ($LASTEXITCODE -eq 0) {
        Write-Output "Signing key created successfully at: $KeyPath"
    }
    else {
        Write-Error "OpenSSL genrsa command failed with exit code $LASTEXITCODE"
    }
}

# Example usage:
New-OpenSSLCertificate -Subject "/CN=localhost" -Days 365 -CertPath "Scripts/certs/cert.pem" -KeyPath "Scripts/certs/key.pem"
New-SigningKey -KeySize 2048 -KeyPath "Scripts/certs/signing.key"
