<#
.SYNOPSIS
    Loads environment variables from a specified file into a given environment variable target or displays current environment variables.

.DESCRIPTION
    The GetLocalEnvVars function can perform two main operations:
    1. Reads an environment file (default: .env.dev) and processes each line to extract environment variable name-value pairs, 
       then sets these variables in the specified target (Process, User, or Machine). If User or Machine level is specified,
       the computer will be restarted after setting the variables.
    2. Displays current environment variables at the specified level (Process, User, or Machine) when using the -DisplayOnly switch.

.PARAMETER EnvFilePath
    The path to the environment file that contains the variable definitions.
    The default value is ".env.dev". This parameter is ignored when -DisplayOnly is used.

.PARAMETER Level
    The target scope for setting or displaying environment variables. Valid values are:
      - Process: Sets/Displays variables in the current process (default).
      - User: Sets/Displays variables for the current user.
      - Machine: Sets/Displays variables system-wide.

.PARAMETER DisplayOnly
    When specified, the function will only display current environment variables at the specified level
    without loading any variables from a file and without restarting the computer.

.EXAMPLE
    Loads environment variables from the .env.dev file into the current process and displays them.
    Import-Module "Scripts\GetLocalEnvVars.psm1"
    GetLocalEnvVars -EnvFilePath ".env.dev" -Level "Process"

.EXAMPLE
    Displays Process level environment variables.
    Import-Module "Scripts\GetLocalEnvVars.psm1"
    GetLocalEnvVars -Level "Process" -DisplayOnly

.EXAMPLE
    Loads environment variables into User level and restarts the computer.
    Import-Module "Scripts\GetLocalEnvVars.psm1"
    GetLocalEnvVars -EnvFilePath ".env.dev" -Level "User"

.NOTES
    File Name     : GetLocalEnvVars.psm1
    Created By    : Solomio S. Sisante
    Created On    : February 25, 2025
    Description   : Loads environment variables from a file into the environment or displays current variables.
#>
function GetLocalEnvVars {
    param(
        [string]$EnvFilePath = ".env.dev",
        [ValidateSet("Process", "User", "Machine")]
        [string]$Level = "Process",
        [switch]$DisplayOnly
    )

    # If DisplayOnly is specified, just show the current environment variables
    if ($DisplayOnly) {
        Write-Host "Displaying current environment variables at '$Level' level:" -ForegroundColor Green
        
        # Get all environment variables at the specified level
        $envVars = @()
        
        # For Process level, we can get all variables directly
        if ($Level -eq "Process") {
            Get-ChildItem Env: | ForEach-Object {
                $envVars += [PSCustomObject]@{
                    Name = $_.Name
                    Value = $_.Value
                }
            }
        } else {
            # For User and Machine levels, we need to use .NET methods
            $targetLevel = [System.EnvironmentVariableTarget]::$Level
            $variables = [System.Environment]::GetEnvironmentVariables($targetLevel)
            foreach ($key in $variables.Keys) {
                $envVars += [PSCustomObject]@{
                    Name = $key
                    Value = $variables[$key]
                }
            }
        }
        
        # Display the environment variables in a table format
        if ($envVars.Count -gt 0) {
            $envVars | Format-Table -AutoSize
        } else {
            Write-Host "No environment variables found at '$Level' level."
        }
        
        # Exit the function after displaying variables
        return
    }

    # Check if the file exists
    if (-not (Test-Path $EnvFilePath)) {
        Write-Host "Error: Environment file '$EnvFilePath' not found." -ForegroundColor Red
        return
    }

    $envVars = @()  # Create an empty array to store environment variables
    $targetLevel = [System.EnvironmentVariableTarget]::$Level

    # Read the file and process each line
    Get-Content $EnvFilePath | ForEach-Object {
        # Skip comments and empty lines
        if ($_ -match "^\s*([^#][^=]*)\s*=\s*(.*)\s*$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim('"').Trim()

            if ($name -and $value) {
                # Set the environment variable
                [System.Environment]::SetEnvironmentVariable($name, $value, $targetLevel)

                # Store the name-value pair in an array
                $envVars += [PSCustomObject]@{
                    Name = $name
                    Value = $value
                }
            }
        }
    }

    Write-Host "Environment variables loaded from '$EnvFilePath' into '$Level' level." -ForegroundColor Green
    
    # Display the environment variables in a table format
    if ($envVars.Count -gt 0) {
        $envVars | Format-Table -AutoSize
    } else {
        Write-Host "No valid environment variables found in '$EnvFilePath'." -ForegroundColor Yellow
    }

    # Restart the computer if setting at User or Machine level
    if ($Level -eq "User" -or $Level -eq "Machine") {
        Write-Host "Restarting computer to apply environment variable changes..." -ForegroundColor Yellow
        Restart-Computer -Force
    }
}

Export-ModuleMember -Function GetLocalEnvVars