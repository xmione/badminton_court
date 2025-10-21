# Scripts\createcert-posteio.ps1

function New-PosteIOCertificate {
    [CmdletBinding()]
    param(
        [Parameter()]
        [string]$Subject = "/CN=mail-test",

        [Parameter()]
        [int]$Days = 365,

        [Parameter()]
        [string]$CertPath = "certs/posteio-cert.pem",

        [Parameter()]
        [string]$KeyPath = "certs/posteio-key.pem"
    )

    # Check if OpenSSL is available
    $openssl = Get-Command openssl -ErrorAction SilentlyContinue
    if (-not $openssl) {
        Write-Error "OpenSSL is not available on the path."
        return
    }

    # Ensure the output directories exist
    $certDir = Split-Path $CertPath -Parent
    if (-not (Test-Path $certDir)) {
        New-Item -ItemType Directory -Path $certDir -Force | Out-Null
    }
    $keyDir = Split-Path $KeyPath -Parent
    if (-not (Test-Path $keyDir)) {
        New-Item -ItemType Directory -Path $keyDir -Force | Out-Null
    }

    Write-Output "Executing: openssl req -x509 -nodes -days $Days -newkey rsa:2048 -keyout $KeyPath -out $CertPath -subj $Subject"

    # Build the argument array
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

    # Execute OpenSSL
    & openssl @pemArgs

    if ($LASTEXITCODE -eq 0) {
        Write-Output "Poste.io certificate and key created successfully: $CertPath, $KeyPath"
    } else {
        Write-Error "OpenSSL command failed with exit code $LASTEXITCODE"
    }
}

# Generate the certificate for the 'mail-test' hostname
New-PosteIOCertificate