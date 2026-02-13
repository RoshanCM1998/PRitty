# PRitty Build Script
# Creates a distributable .zip containing only the extension files.
#
# Usage:
#   .\build.ps1              # build with current version from manifest.json
#   .\build.ps1 -Bump patch  # bump patch version (1.1.0 -> 1.1.1) then build
#   .\build.ps1 -Bump minor  # bump minor version (1.1.0 -> 1.2.0) then build
#   .\build.ps1 -Bump major  # bump major version (1.1.0 -> 2.0.0) then build

param(
    [ValidateSet("patch", "minor", "major")]
    [string]$Bump
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$manifest = Join-Path $root "manifest.json"
$distDir = Join-Path $root "dist"

# --- Read current version ---
$json = Get-Content $manifest -Raw | ConvertFrom-Json
$versionParts = $json.version.Split('.') | ForEach-Object { [int]$_ }

# --- Bump version if requested ---
if ($Bump) {
    switch ($Bump) {
        "major" { $versionParts[0]++; $versionParts[1] = 0; $versionParts[2] = 0 }
        "minor" { $versionParts[1]++; $versionParts[2] = 0 }
        "patch" { $versionParts[2]++ }
    }
    $newVersion = $versionParts -join '.'
    $raw = Get-Content $manifest -Raw
    $raw = $raw -replace '"version":\s*"[^"]+"', "`"version`": `"$newVersion`""
    Set-Content $manifest $raw -NoNewline
    Write-Host "Version bumped to $newVersion" -ForegroundColor Green
} else {
    $newVersion = $versionParts -join '.'
}

# --- Prepare dist folder ---
if (Test-Path $distDir) { Remove-Item $distDir -Recurse -Force }
New-Item $distDir -ItemType Directory | Out-Null

$zipName = "PRitty-v$newVersion.zip"
$zipPath = Join-Path $distDir $zipName

# --- Collect files ---
$stagingDir = Join-Path $env:TEMP "PRitty-build-$newVersion"
if (Test-Path $stagingDir) { Remove-Item $stagingDir -Recurse -Force }
New-Item $stagingDir -ItemType Directory | Out-Null

$filesToCopy = @("manifest.json", "LICENSE")
$foldersToCopy = @("src", "styles")

foreach ($file in $filesToCopy) {
    Copy-Item (Join-Path $root $file) (Join-Path $stagingDir $file)
}
foreach ($folder in $foldersToCopy) {
    Copy-Item (Join-Path $root $folder) (Join-Path $stagingDir $folder) -Recurse
}

# Icons — only copy the ones referenced in manifest.json
$iconsDestDir = Join-Path $stagingDir "icons"
New-Item $iconsDestDir -ItemType Directory | Out-Null
foreach ($icon in $json.icons.PSObject.Properties) {
    $iconSource = Join-Path $root $icon.Value
    $iconDest = Join-Path $stagingDir $icon.Value
    Copy-Item $iconSource $iconDest
}

# --- Create zip ---
Compress-Archive -Path "$stagingDir\*" -DestinationPath $zipPath -Force

# --- Cleanup staging ---
Remove-Item $stagingDir -Recurse -Force

# --- Summary ---
$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host ""
Write-Host "Build complete!" -ForegroundColor Cyan
Write-Host "  Version : $newVersion"
Write-Host "  Output  : dist\$zipName"
Write-Host "  Size    : ${sizeMB} KB"
