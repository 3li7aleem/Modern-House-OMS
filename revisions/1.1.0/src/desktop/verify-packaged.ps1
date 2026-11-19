param([string]$Executable = (Join-Path $PSScriptRoot 'release\Modern-House-OMS-Portable-1.1.0.exe'))
$ErrorActionPreference = 'Stop'
$testRoot = Join-Path $env:TEMP ('oms-packaged-check-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testRoot | Out-Null
try {
    $reports = @()
    foreach ($run in 1..2) {
        $start = [System.Diagnostics.ProcessStartInfo]::new()
        $start.FileName = (Resolve-Path -LiteralPath $Executable).Path
        $start.UseShellExecute = $false
        $start.CreateNoWindow = $true
        $start.WindowStyle = 'Hidden'
        $start.ArgumentList.Add('--smoke-test')
        $start.ArgumentList.Add('--proxy-server=http://127.0.0.1:1')
        $start.ArgumentList.Add('--proxy-bypass-list=<-loopback>')
        $start.ArgumentList.Add('--host-resolver-rules=MAP * ~NOTFOUND')
        $start.Environment['OMS_TEST_DATA_DIR'] = $testRoot
        [void]$start.Environment.Remove('ELECTRON_RUN_AS_NODE')
        $process = [System.Diagnostics.Process]::Start($start)
        if (-not $process.WaitForExit(45000)) { $process.Kill($true); throw "Verification timeout. See $testRoot" }
        if ($process.ExitCode -ne 0) { throw "Executable exited with code $($process.ExitCode). See $testRoot" }
        $report = Get-Content -LiteralPath (Join-Path $testRoot 'smoke-report.json') -Raw | ConvertFrom-Json
        if (-not $report.bridge -or $report.nodeExposed -or -not $report.localControls -or -not $report.excel -or $report.product.stock -ne 7 -or $report.navigation.Count -ne 7 -or -not $report.periodicBackup -or -not $report.transactions.rollback -or -not $report.transactions.receiveOnce -or $report.version -ne '1.1.0') {
            throw "Packaged application verification failed. See $testRoot"
        }
        if ($report.persisted -ne ($run -eq 2)) { throw "Data persistence check failed on run $run" }
        $reports += $report
    }
    $reports | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'verification.json') -Encoding utf8
    Copy-Item -LiteralPath (Join-Path $testRoot 'smoke.png') -Destination (Join-Path $PSScriptRoot 'verification.png') -Force
    if ((Get-Item -LiteralPath (Join-Path $testRoot 'smoke-print.pdf')).Length -lt 1000) { throw 'PDF output is empty' }
    Write-Output 'PASS: 1.1.0 EXE opened twice with process-local network restrictions; records persisted; order/stock transactions, rollback, receive-once, periodic backup, seven screens, Excel, isolated renderer and PDF verified.'
    Write-Output "Isolated test data: $testRoot"
} finally {}
