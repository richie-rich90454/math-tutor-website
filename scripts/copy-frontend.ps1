Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

try {
    Write-Output "[COPY] Copying modern frontend build..."
    $ModernSrc = Join-Path $RootDir "frontend-modern" "dist"
    $ModernDest = Join-Path $RootDir "backend" "src" "main" "resources" "static"
    if (Test-Path -LiteralPath $ModernSrc) {
        if (-not (Test-Path -LiteralPath $ModernDest)) {
            New-Item -ItemType Directory -Path $ModernDest -Force | Out-Null
        }
        Copy-Item -LiteralPath (Join-Path $ModernSrc "*") -Destination $ModernDest -Recurse -Force
    }

    Write-Output "[COPY] Copying legacy frontend..."
    $LegacySrc = Join-Path $RootDir "frontend-legacy" "src"
    $LegacyDest = Join-Path $RootDir "backend" "src" "main" "resources" "static" "legacy"
    if (-not (Test-Path -LiteralPath $LegacyDest)) {
        New-Item -ItemType Directory -Path $LegacyDest -Force | Out-Null
    }
    Copy-Item -LiteralPath (Join-Path $LegacySrc "index.html") -Destination (Join-Path $LegacyDest "index.html") -Force
    $StylesDest = Join-Path $LegacyDest "styles"
    if (-not (Test-Path -LiteralPath $StylesDest)) { New-Item -ItemType Directory -Path $StylesDest -Force | Out-Null }
    Copy-Item -LiteralPath (Join-Path $LegacySrc "styles" "legacy.css") -Destination (Join-Path $StylesDest "legacy.css") -Force
    $ScriptsDest = Join-Path $LegacyDest "scripts"
    if (-not (Test-Path -LiteralPath $ScriptsDest)) { New-Item -ItemType Directory -Path $ScriptsDest -Force | Out-Null }
    Copy-Item -LiteralPath (Join-Path $LegacySrc "scripts" "legacy.js") -Destination (Join-Path $ScriptsDest "legacy.js") -Force

    Write-Output "[OK] Frontend files copied to backend static directory"
    exit 0
}
catch {
    Write-Warning "[FAIL] Copy error: $_"
    exit 1
}
