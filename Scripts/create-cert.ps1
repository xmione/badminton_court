# Scripts/create-cert.ps1 

param(
    [string]$certPath = "./certs",
    [string]$domain = "localhost",
    [int]$days = 365
)

# Create folder if it doesn't exist
if (!(Test-Path $certPath)) {
    New-Item -ItemType Directory -Path $certPath -Force | Out-Null
}

 $certFile = "$certPath/cert.pem"
 $keyFile = "$certPath/key.pem"

Write-Host "Creating SSL certificate for $domain..."

# Create self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout $keyFile -out $certFile -days $days -nodes -subj "/CN=$domain"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SSL certificate created successfully:"
    Write-Host "`tCertificate: $certFile"
    Write-Host "`tPrivate Key: $keyFile"
    Write-Host ""
    Write-Host "To use these certificates with Django, add the following to your settings.py:"
    Write-Host "SECURE_SSL_REDIRECT = True"
    Write-Host "SECURE_HSTS_SECONDS = 31536000"
    Write-Host "SECURE_HSTS_INCLUDE_SUBDOMAINS = True"
    Write-Host "SECURE_HSTS_PRELOAD = True"
    Write-Host "SESSION_COOKIE_SECURE = True"
    Write-Host "CSRF_COOKIE_SECURE = True"
    Write-Host "SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')"
} else {
    Write-Error "❌ Failed to create SSL certificate"
}