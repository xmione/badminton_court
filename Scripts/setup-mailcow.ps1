# scripts\setup-mailcow.ps1
param(
    [switch]$Reset,
    [switch]$SkipCerts
)

Write-Host "Setting up Mailcow email server..." -ForegroundColor Cyan

# Get the project root directory (two levels up from Scripts)
 $projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Create SSL certificates
if (-not $SkipCerts) {
    Write-Host "Creating SSL certificates..." -ForegroundColor Yellow
    
    $sslPath = Join-Path $projectRoot "mailcow\data\assets\ssl"
    if (-not (Test-Path $sslPath)) {
        New-Item -ItemType Directory -Force -Path $sslPath | Out-Null
    }
    
    # Create self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
        -keyout "$sslPath\mail.key" `
        -out "$sslPath\mail.crt" `
        -subj "/C=US/ST=State/L=City/O=Organization/CN=mail.aeropace.com"
    
    Write-Host "SSL certificates created at $sslPath" -ForegroundColor Green
}

# Create Redis configuration
Write-Host "Creating Redis configuration..." -ForegroundColor Yellow

# Create the target directory if it doesn't exist
 $targetDir = ".\mailcow\data\conf\redis"
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}

# Create the redis-conf.sh file in the correct location
@"
#!/bin/sh
cat <<EOF > $targetDir\redis-conf.sh
requirepass $REDISPASS
user quota_notify on nopass ~QW_* -@all +get +hget +ping
EOF

if [ -n "$REDISMASTERPASS" ]; then
    echo "masterauth $REDISMASTERPASS" >> $targetDir\redis-conf.sh
fi

exec redis-server /redis.conf
"@ | Out-File -FilePath "$targetDir\redis-conf.sh" -Encoding UTF8

Write-Host "Created new redis-conf.sh at: $targetDir\redis-conf.sh" -ForegroundColor Green

# Update mailcow.conf
 $mailcowConfPath = Join-Path $projectRoot "mailcow\mailcow.conf"
if (Test-Path $mailcowConfPath) {
    $mailcowConf = Get-Content $mailcowConfPath
    if ($mailcowConf -notmatch "SKIP_LETS_ENCRYPT=y") {
        $mailcowConf += "`n# Skip Let's Encrypt for development`nSKIP_LETS_ENCRYPT=y"
    }
    if ($mailcowConf -notmatch "SKIP_CLAMD=y") {
        $mailcowConf += "`n# Skip ClamAV to reduce resource usage`nSKIP_CLAMD=y"
    }
    $mailcowConf | Out-File -FilePath $mailcowConfPath -Encoding UTF8
    Write-Host "mailcow.conf updated" -ForegroundColor Green
}

# Restart services if not in reset mode
if (-not $Reset) {
    Write-Host "Restarting Mailcow services..." -ForegroundColor Yellow
    Set-Location (Join-Path $projectRoot "mailcow")
    docker-compose down
    docker-compose up -d
    Write-Host "Mailcow services restarted" -ForegroundColor Green
} else {
    Write-Host "Configuration updated. Run 'docker-compose up -d' to start services." -ForegroundColor Green
}

Write-Host "Mailcow setup complete!" -ForegroundColor Green
Write-Host "Access Mailcow at:" -ForegroundColor Cyan
Write-Host "  Webmail: http://localhost:8080/SOGo" -ForegroundColor Cyan
Write-Host "  Admin: https://localhost:8443 (admin/moohoo)" -ForegroundColor Cyan