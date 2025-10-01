# Scripts/pfs.ps1
# This script prints the folder structure of the project, excluding certain directories.

# Determine the script's full path
$scriptPath = $MyInvocation.MyCommand.Path

if ($scriptPath) {
    # Get the directory containing the script (i.e., "Scripts")
    $scriptDir = Split-Path -Path $scriptPath -Parent
    # Then get its parent (i.e., project root)
    $projectRoot = Split-Path -Path $scriptDir -Parent
} else {
    # Fallback to current directory if running interactively
    $projectRoot = (Get-Location).Path
}

Write-Host "Project root is: $projectRoot"

$excludeFolders = @(
    "dist", 
    ".next", 
    ".github", 
    "node_modules", 
    "__pycache", 
    "court_management\__pycache", 
    "court_management\managment\commands\__pycache",
    "court_management\managment\migrations\__pycache",
    "court_management\templatetags\__pycache__",
    "venv"
    ) | ForEach-Object {
    Join-Path $projectRoot $_
}

Write-Host "Excluded folders: $excludeFolders"

PrintFolderStructure -path $projectRoot -excludeFolders $excludeFolders -maxDepth 3 > folderstructure.txt
code folderstructure.txt