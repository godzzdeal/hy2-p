param(
    [string]$AdminPassword = $env:PANEL_ADMIN_PASSWORD
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$binary = Join-Path $projectRoot 'hy2-panel.exe'
$previewDir = Join-Path $projectRoot 'data\preview'
$port = 8080
$url = 'http://127.0.0.1:8080'
$savedWeb = Get-ChildItem -LiteralPath (Join-Path $previewDir 'web') -Filter 'web-*.json' -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending | Select-Object -First 1
if ($savedWeb) {
    $listener = Get-Content -LiteralPath $savedWeb.FullName -Raw | ConvertFrom-Json
    $port = [int]$listener.port
    $scheme = if ($listener.mode -eq 'http') { 'http' } else { 'https' }
    $address = if ($listener.domain) { $listener.domain } else { '127.0.0.1' }
    $url = if ($listener.publicURL) { $listener.publicURL } else { '{0}://{1}:{2}' -f $scheme,$address,$port }
}

$existing = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    $process = Get-Process -Id $existing[0].OwningProcess -ErrorAction Stop
    if ($process.Path -ne $binary) {
        throw "Port $port is occupied by another application ($($process.ProcessName))."
    }
    Write-Output "Panel is already running: $url/"
    exit 0
}

if ([string]::IsNullOrEmpty($AdminPassword)) {
    $AdminPassword = 'hy2-local-preview-2026-only'
    Write-Output 'Local preview password: hy2-local-preview-2026-only'
}
if ($AdminPassword.Length -lt 16) { throw 'The admin password must contain at least 16 characters.' }

Push-Location $projectRoot
try {
    $latestSource = Get-ChildItem -Path (Join-Path $projectRoot 'cmd'),(Join-Path $projectRoot 'internal') -Filter '*.go' -Recurse |
        Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
    if (!(Test-Path -LiteralPath $binary) -or $latestSource.LastWriteTimeUtc -gt (Get-Item $binary).LastWriteTimeUtc) {
        go build -o $binary ./cmd/panel
        if ($LASTEXITCODE -ne 0) { throw 'Go build failed.' }
    }
    if (!(Test-Path -LiteralPath (Join-Path $projectRoot 'web\dist\index.html'))) {
        Push-Location (Join-Path $projectRoot 'web')
        try {
            bun install --frozen-lockfile
            if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
            bun run build
            if ($LASTEXITCODE -ne 0) { throw 'Web build failed.' }
        } finally { Pop-Location }
    }
    New-Item -ItemType Directory -Path $previewDir -Force | Out-Null
    $env:PANEL_ADMIN_PASSWORD = $AdminPassword
    $env:PANEL_DATA = $previewDir
    $env:PANEL_WEB = Join-Path $projectRoot 'web\dist'
    $env:PANEL_LISTEN = '127.0.0.1:8080'
    $env:PANEL_PUBLIC_URL = 'http://127.0.0.1:8080'
    $env:PANEL_SECURE_COOKIE = 'false'
    $launched = Start-Process -FilePath $binary -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $previewDir 'panel.stdout.log') -RedirectStandardError (Join-Path $previewDir 'panel.stderr.log')
    [IO.File]::WriteAllText((Join-Path $previewDir 'panel.pid'), [string]$launched.Id)
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        if ($launched.HasExited) { throw ('Panel exited. See ' + (Join-Path $previewDir 'panel.stderr.log')) }
        try {
            $connection = [Net.Sockets.TcpClient]::new()
            try {
                $connection.Connect('127.0.0.1', $port)
                if ($connection.Connected) { $ready = $true; break }
            } finally { $connection.Dispose() }
        } catch { Start-Sleep -Milliseconds 200 }
    }
    if (!$ready) { throw 'Panel did not become ready. Check the preview logs.' }
    Write-Output "Panel is running: $url/"
} finally { Pop-Location }
