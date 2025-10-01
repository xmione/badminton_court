<# Scripts/get-gh-variable.ps1
 =================================================================================
 To run:
    & "C:\repo\badminton_court\Scripts\get-gh-variable.ps1"  

 Or
    .\Scripts\get-gh-variable.ps1  
 =================================================================================#>

param (
    [string]$Repo = "xmione/badminton_court",
    [string]$VariableName = "ENV_ENCRYPTION_KEY"
)

$variable = gh variable list --repo $repo --json name,value | ConvertFrom-Json | Where-Object { $_.name -eq $variableName }

if ($variable) {
    Write-Host "[OK] $($variable.name) = $($variable.value)"
} else {
    Write-Error "Variable '$variableName' not found in '$repo'."
}

Write-Host "[OK] Retrieved GitHub variable '$VariableName' from repository '$Repo'."

return $variable.value