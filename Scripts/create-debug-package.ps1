# Create debug package for AI analysis
Write-Host "Creating debug package..." -ForegroundColor Green

# Create the output file
 $outputFile = "django-allauth-debug-package.txt"
 $out = New-Item -Path $outputFile -ItemType File -Force

# Add header
Add-Content -Path $outputFile -Value "============================================"
Add-Content -Path $outputFile -Value "Django Allauth Email Verification Issue"
Add-Content -Path $outputFile -Value "============================================"
Add-Content -Path $outputFile -Value "Generated: $(Get-Date)"
Add-Content -Path $outputFile -Value ""

# Add problem description
Add-Content -Path $outputFile -Value "PROBLEM DESCRIPTION:"
Add-Content -Path $outputFile -Value "=================="
Add-Content -Path $outputFile -Value "Django-allauth email verification not working in test environment."
Add-Content -Path $outputFile -Value ""
Add-Content -Path $outputFile -Value "Context:"
Add-Content -Path $outputFile -Value "- Django application using django-allauth for authentication"
Add-Content -Path $outputFile -Value "- Email verification works when manually clicking the link in the email"
Add-Content -Path $outputFile -Value "- But automated tests fail because the verification token is not recognized as valid"
Add-Content -Path $outputFile -Value "- The test creates a user through the signup form, then tries to get the verification token and visit the verification URL"
Add-Content -Path $outputFile -Value "- Django-allauth shows 'This email confirmation link expired or is invalid' error"
Add-Content -Path $outputFile -Value ""
Add-Content -Path $outputFile -Value "What I've tried:"
Add-Content -Path $outputFile -Value "1. Verified ACCOUNT_EMAIL_VERIFICATION = 'mandatory' in settings"
Add-Content -Path $outputFile -Value "2. Created a custom API endpoint to retrieve verification tokens"
Add-Content -Path $outputFile -Value "3. Tried creating EmailConfirmation records manually"
Add-Content -Path $outputFile -Value "4. Added CELERY_TASK_ALWAYS_EAGER = True for testing"
Add-Content -Path $outputFile -Value "5. Added 'testserver' to ALLOWED_HOSTS"
Add-Content -Path $outputFile -Value ""
Add-Content -Path $outputFile -Value "Current behavior:"
Add-Content -Path $outputFile -Value "- User signup works"
Add-Content -Path $outputFile -Value "- Welcome email is sent (custom signal)"
Add-Content -Path $outputFile -Value "- EmailConfirmation record is created in database with valid key"
Add-Content -Path $outputFile -Value "- But visiting the verification URL shows 'expired or invalid' error"
Add-Content -Path $outputFile -Value "- Manual verification by clicking the link in the actual email works"
Add-Content -Path $outputFile -Value ""
Add-Content -Path $outputFile -Value "Question: Why does manual verification work but the automated test with the same token fails?"
Add-Content -Path $outputFile -Value ""

# Function to add a file to the output
function Add-File {
    param(
        [string]$FilePath,
        [string]$Description
    )
    
    if (Test-Path $FilePath) {
        Add-Content -Path $outputFile -Value ""
        Add-Content -Path $outputFile -Value "============================================"
        Add-Content -Path $outputFile -Value "$Description"
        Add-Content -Path $outputFile -Value "============================================"
        Add-Content -Path $outputFile -Value "File: $FilePath"
        Add-Content -Path $outputFile -Value ""
        Get-Content -Path $FilePath | Add-Content -Path $outputFile
        Add-Content -Path $outputFile -Value ""
    } else {
        Add-Content -Path $outputFile -Value ""
        Add-Content -Path $outputFile -Value "WARNING: File not found: $FilePath"
        Add-Content -Path $outputFile -Value ""
    }
}

# Add all relevant files
Add-File -FilePath "badminton_court/settings.py" -Description "DJANGO SETTINGS.PY"
Add-File -FilePath "court_management/views.py" -Description "COURT_MANAGEMENT VIEWS.PY"
Add-File -FilePath "court_management/signals.py" -Description "COURT_MANAGEMENT SIGNALS.PY"
Add-File -FilePath "badminton_court/urls.py" -Description "PROJECT URLS.PY"
Add-File -FilePath "court_management/urls.py" -Description "APP URLS.PY"
Add-File -FilePath "templates/account/signup.html" -Description "SIGNUP TEMPLATE"
Add-File -FilePath "cypress/support/commands/signUp.cy.js" -Description "CYPRESS TEST FILE"

# Add recent error logs
Add-Content -Path $outputFile -Value ""
Add-Content -Path $outputFile -Value "============================================"
Add-Content -Path $outputFile -Value "RECENT ERROR LOGS"
Add-Content -Path $outputFile -Value "============================================"
Add-Content -Path $outputFile -Value ""
Add-Content -Path $outputFile -Value "From Cypress test:"
Add-Content -Path $outputFile -Value "Expected to find content: 'Your email is now confirmed' but never did."
Add-Content -Path $outputFile -Value "Page shows: 'This email confirmation link expired or is invalid. Please issue a new email confirmation request.'"
Add-Content -Path $outputFile -Value ""

Write-Host "Debug package created: $outputFile" -ForegroundColor Green
Write-Host "File size: $((Get-Item $outputFile).Length / 1KB) KB" -ForegroundColor Green
Write-Host "You can now send this file to Grok AI or Claude Sonnet 4.5 for analysis." -ForegroundColor Green