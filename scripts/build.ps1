Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

try {
    Write-Output "[BUILD] Building modern frontend..."
    Set-Location -LiteralPath (Join-Path $RootDir "frontend-modern")
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Modern frontend build failed" }

    Write-Output "[BUILD] Copying legacy frontend..."
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

    Write-Output "[BUILD] Building backend..."
    Set-Location -LiteralPath (Join-Path $RootDir "backend")
    mvn clean package -DskipTests
    if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }

    Write-Output "[OK] Build complete"
    exit 0
}
catch {
    Write-Warning "[FAIL] Build error: $_"
    exit 1
}
