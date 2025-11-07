#!/bin/bash

#=====================================================
# To run:
#     chmod +x Scripts/decryptenvfiles.sh
#     ./Scripts/decryptenvfiles.sh
#=====================================================#

function DecryptEnvFile {
    local encryptedFile="$1"
    local outputFile="$2"
    
    # Get passphrase from get-gh-variable.sh
    local passphrase=$(./Scripts/get-gh-variable.sh)
    echo "Using passphrase: [REDACTED]"
    
    if [ ! -f "$encryptedFile" ]; then
        echo "Error: Encrypted file not found: $encryptedFile" >&2
        return 1
    fi
    
    if [ -z "$outputFile" ]; then
        outputFile=$(basename "$encryptedFile" .gpg)
        outputFile=$(basename "$outputFile" .e.)
    fi
    
    echo "Decrypting $encryptedFile to $outputFile..."
    
    # Use gpg to decrypt the file
    echo "$passphrase" | gpg --batch --yes --pinentry-mode loopback --passphrase-fd 0 -o "$outputFile" -d "$encryptedFile"
    
    if [ -f "$outputFile" ]; then
        echo "Decrypted successfully: $outputFile"
    else
        echo "Warning: Failed to decrypt: $encryptedFile" >&2
        return 1
    fi
    
    # Clear the passphrase variable
    passphrase=""
}

# Make sure the Scripts directory exists
mkdir -p Scripts

# Make sure get-gh-variable.sh is executable
if [ -f "Scripts/get-gh-variable.sh" ]; then
    chmod +x Scripts/get-gh-variable.sh
fi

# Decrypt the environment files
DecryptEnvFile ".e.env.dev.gpg" ".env.dev"
DecryptEnvFile ".e.env.docker.gpg" ".env.docker"
# DecryptEnvFile ".e.cypress.env.json.gpg" ".cypress.env.json"