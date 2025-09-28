<#
.SYNOPSIS
    Retrieves the specified environment variable value.
.DESCRIPTION
    This function retrieves the value of a specified environment variable from the Process, User, or Machine scope.
.PARAMETER Name
    The name of the environment variable to retrieve.
.PARAMETER Target
    The target scope of the environment variable: Process, User, or Machine.
.EXAMPLE
    GetPath -Name "Path" # default (-Target "User")
.EXAMPLE
    GetPath -Name "Path" -Target "Machine"    
.NOTES
    Author: Solomio S. Sisante
    Date  : July 15, 2025
#>
function GetPath{
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,

        [Parameter()]
        [ValidateSet("User", "Machine", "Process")]
        [string]$Target = "User"
    )

    try {
        $value = [System.Environment]::GetEnvironmentVariable($Name, [System.EnvironmentVariableTarget]::$Target)
        if ($null -eq $value) {
            Write-Verbose "Environment variable '$Name' not found at $Target scope."
        } else {
            Write-Verbose "Environment variable '$Name' at $Target scope has value: $value"
        }
        return $value
    } catch {
        Write-Error "An error occurred retrieving environment variable '$Name' at $Target scope. $_"
    }
}

<#
.SYNOPSIS
    Appends a path to the environment PATH variable if it is not already included.
.DESCRIPTION
    This function ensures that a specified directory is included in the PATH environment variable 
    at the specified target level (Process, User, or Machine). If the directory is already present,
    the function does nothing.
.PARAMETER PathToAdd
    The directory path to add to the PATH variable.
.PARAMETER Target
    The scope to which the PATH update should apply: Process, User, or Machine.
.EXAMPLE
    SetPath -PathToAdd "C:\MyTools" -Target "User"
.EXAMPLE
    SetPath -PathToAdd "C:\BuildTools\bin" -Target "Machine"
.NOTES
    Author: Solomio S. Sisante  
    Date  : July 15, 2025
    ⚠️ Requires Administrator privileges if modifying the Machine-level PATH.
#>
function SetPath {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory = $true)]
        [string]$PathToAdd,

        [Parameter()]
        [ValidateSet("User", "Machine", "Process")]
        [string]$Target = "User"
    )

    try {
        $currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::$Target)
        $pathList = $currentPath -split ';' | ForEach-Object { $_.Trim() }

        if ($pathList -contains $PathToAdd) {
            Write-Verbose "Path '$PathToAdd' already exists in $Target scope PATH."
            return
        }

        $newPath = "$currentPath;$PathToAdd"
        [System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::$Target)
        Write-Output "✅ Added '$PathToAdd' to $Target scope PATH."

        if ($Target -ne "Process") {
            Write-Warning "⚠️ Changes to PATH at $Target level may require restarting your terminal or system to take effect."
        }
    } catch {
        Write-Error "❌ Failed to update PATH: $_"
    }
}
