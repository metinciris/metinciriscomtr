# Windows CI test: Task Scheduler creates a real GUI action without
# registering a task or touching users' settings, MP3s, or credentials.
$ErrorActionPreference = "Stop"
$TempRoot = Join-Path $env:TEMP ("Podcast Ahenk Scheduler Test " + [guid]::NewGuid().ToString("N"))
try {
    $Repo = Join-Path $TempRoot "metinciriscomtr"
    $Gui = Join-Path $Repo "windows\podcast-ahenk\two_step_manager.py"
    $Pythonw = Join-Path $TempRoot "venv\Scripts\pythonw.exe"
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Gui) | Out-Null
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Pythonw) | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $Repo ".git") | Out-Null
    [System.IO.File]::WriteAllText($Gui, "print('test')", [System.Text.Encoding]::UTF8)
    [System.IO.File]::WriteAllBytes($Pythonw, [byte[]]@())
    $Installer = Join-Path $PSScriptRoot "gorev_kur.ps1"
    $Output = & $Installer -Target $TempRoot -CheckOnly | Out-String
    if ($Output -notmatch "DENETIM" -or $Output -notmatch "12:30" -or
        $Output -notmatch "two_step_manager\.py" -or
        $Output -notmatch "--scheduled") {
        throw "12:30 check-only scheduled action is not the visible Ahenk GUI."
    }
    $Source = Get-Content -LiteralPath $Installer -Raw -Encoding UTF8
    if ($Source -notmatch "-LogonType Interactive" -or
        $Source -notmatch "-StartWhenAvailable" -or
        $Source -notmatch "-MultipleInstances IgnoreNew") {
        throw "12:30 Task Scheduler must be interactive, miss-tolerant and single-instance."
    }
    $Setup = Get-Content -LiteralPath (Join-Path $PSScriptRoot "kurulum.ps1") -Raw -Encoding UTF8
    if ($Setup -notmatch '& \$Scheduler -Target \$Target') {
        throw "Normal installation must enable the 12:30 scheduled task."
    }
    Write-Host "Ahenk 12:30 visible scheduled task dry-run OK" -ForegroundColor Green
}
finally {
    Remove-Item -LiteralPath $TempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
