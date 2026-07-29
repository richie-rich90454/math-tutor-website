Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

try {
    Write-Output "[START] Starting Spring Boot backend..."
    $backendJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location -LiteralPath $dir
        mvn spring-boot:run
    } -ArgumentList (Join-Path $RootDir "backend")

    Write-Output "[START] Waiting 10 seconds for backend..."
    Start-Sleep -Seconds 10

    Write-Output "[START] Starting Vite dev server..."
    $frontendJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location -LiteralPath $dir
        npm run dev
    } -ArgumentList (Join-Path $RootDir "frontend-modern")

    Write-Output "[OK] Dev servers started"
    Write-Output "[OK] Backend on http://localhost:8080"
    Write-Output "[OK] Frontend on http://localhost:5173"
    Write-Output "[INFO] Use 'Get-Job' to see running jobs"
    Write-Output "[INFO] Use 'Stop-Job' to stop them"

    while ($true) {
        Start-Sleep -Seconds 30
        $backendState = (Get-Job -Id $backendJob.Id).State
        $frontendState = (Get-Job -Id $frontendJob.Id).State
        if ($backendState -eq "Failed") {
            Write-Warning "[FAIL] Backend job failed"
            Receive-Job -Id $backendJob.Id
        }
        if ($frontendState -eq "Failed") {
            Write-Warning "[FAIL] Frontend job failed"
            Receive-Job -Id $frontendJob.Id
        }
    }
}
catch {
    Write-Warning "[FAIL] Start error: $_"
    exit 1
}
