# Scripts/createcert.ps1

$certPath = "./certs"
$pfxFile = "$certPath/thorax.pfx"
$certPem = "$certPath/cert.pem"
$keyPem = "$certPath/key.pem"
$password = "P@ssw0rd123"

# Create folder
if (!(Test-Path $certPath)) {
    New-Item -ItemType Directory -Path $certPath
}

# Export dev cert
dotnet dev-certs https -ep $pfxFile -p $password --trust

# Convert PFX to PEM (cert and key)
openssl pkcs12 -in $pfxFile -clcerts -nokeys -out $certPem -passin pass:$password
openssl pkcs12 -in $pfxFile -nocerts -out $keyPem -nodes -passin pass:$password

Write-Host "✅ Certificates exported to PEM files:"
Write-Host "`t$certPem"
Write-Host "`t$keyPem"
