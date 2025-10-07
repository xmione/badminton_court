<#=====================================================
 To run:

       & "C:\repo\badminton_court\Scripts\encryptenvfiles.ps1"

   Or

       .\Scripts\encryptenvfiles.ps1
=====================================================#>


function EncryptEnvFiles {
    $passphrase = .\Scripts\get-gh-variable.ps1 
    Write-Host "Using passphrase: $passphrase"
    $envFiles = @(
        ".env.dev" 
        ,".env.docker" 
        # ,"cypress.env.json"
    )

    foreach ($file in $envFiles) {
        if (Test-Path $file) {
            $gpgOutputFile = "$file.gpg"
            $targetFile = ".e$file.gpg"

            Write-Host "Encrypting $file..."

            & gpg --batch --yes --pinentry-mode loopback --passphrase $passphrase -c $file

            if (Test-Path $gpgOutputFile) {
                if (Test-Path $targetFile) {
                    Remove-Item -Path $targetFile -Force
                }
                Rename-Item -Path $gpgOutputFile -NewName $targetFile -Force
                Write-Host "Encrypted successfully: $targetFile"
            }
            else {
                Write-Warning "Encryption failed for $file. GPG output not found."
            }
        }
        else {
            Write-Warning "$file not found. Skipping."
        }
    }

    # Save passphrase to file (for CI/CD or decrypting later)
    $passFile = "env.passphrase.txt"
    Set-Content -Path $passFile -Value $passphrase
    Write-Host "`nPassphrase saved to $passFile. Keep it safe!" -ForegroundColor Yellow
}

EncryptEnvFiles