# Windows regression: execute the real installer's Python runner as a .py file.
# Works with a throwaway Git repo and does not contact GitHub or alter user files.
$ErrorActionPreference = "Stop"
$Installer = Join-Path $PSScriptRoot "kurulum.ps1"
$Source = [System.IO.File]::ReadAllText($Installer, [System.Text.Encoding]::UTF8)
$ExpectedCommand = '& $PythonExe @PythonArgs $SyncRunner $Repo $Target'
if (-not $Source.Contains($ExpectedCommand)) {
    throw "Kurulum betigi gecici Python dosyasini calistirmiyor."
}
if ($Source.Contains('-c $SyncPython')) {
    throw "HATALI eski python -c cagrisi tekrar eklenmis."
}
$Pattern = '(?ms)^[ \t]*\$SyncPython = @''\r?\n(?<code>.*?)\r?\n''@'
$Match = [System.Text.RegularExpressions.Regex]::Match($Source, $Pattern)
if (-not $Match.Success) {
    throw "Kurulum betigindeki SyncPython bolumu bulunamadi."
}
$RunnerCode = $Match.Groups["code"].Value
if ($RunnerCode -notmatch 'refs/remotes/origin/main:windows/podcast-ahenk/git_sync.py') {
    throw "GitHub sync kaynagi beklenen konumda degil."
}
$TempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("Ahenk Runner " + [guid]::NewGuid().ToString("N"))
$LocalRepo = Join-Path $TempRoot "repo with spaces"
$RunnerFile = Join-Path $TempRoot "sync runner.py"
$Utf8 = [System.Text.UTF8Encoding]::new($false)
try {
    New-Item -ItemType Directory -Path $TempRoot -Force | Out-Null
    & git.exe init --initial-branch=main $LocalRepo | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Test Git deposu olusturulamadi." }
    $ModuleFile = Join-Path $LocalRepo "windows\podcast-ahenk\git_sync.py"
    New-Item -ItemType Directory -Path (Split-Path -Parent $ModuleFile) -Force | Out-Null
    $ModuleSource = @'
from pathlib import Path

def sync(root, home):
    repo = Path(root)
    target = Path(home)
    if not (repo / ".git").is_dir():
        raise RuntimeError("Git directory missing")
    (target / "runner_ok.txt").write_text("AHENK_SYNC_OK", encoding="utf-8")
    return "AHENK_RUNNER_OK"
'@
    [System.IO.File]::WriteAllText($ModuleFile, $ModuleSource, $Utf8)
    & git.exe -C $LocalRepo add -- windows/podcast-ahenk/git_sync.py | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Test modulu Git'e eklenemedi." }
    & git.exe -C $LocalRepo -c user.name=AhenkTest -c user.email=ahenk@example.invalid commit -m "local fixture" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Test Git commit olusturulamadi." }
    $Commit = (& git.exe -C $LocalRepo rev-parse HEAD).Trim()
    & git.exe -C $LocalRepo update-ref refs/remotes/origin/main $Commit
    if ($LASTEXITCODE -ne 0) { throw "Test Git tracking ref olusturulamadi." }
    [System.IO.File]::WriteAllText($RunnerFile, $RunnerCode, $Utf8)
    & python.exe $RunnerFile $LocalRepo $TempRoot
    if ($LASTEXITCODE -ne 0) {
        throw "Python file runner failed. Multi-line -c quoting regression."
    }
    $Marker = Join-Path $TempRoot "runner_ok.txt"
    if (-not (Test-Path -LiteralPath $Marker)) {
        throw "Runner completed without invoking sync."
    }
    $Result = [System.IO.File]::ReadAllText($Marker, [System.Text.Encoding]::UTF8)
    if ($Result -ne "AHENK_SYNC_OK") {
        throw "Runner returned wrong result."
    }
    Write-Host "Ahenk installer Python file handoff OK" -ForegroundColor Green
}
finally {
    Remove-Item -LiteralPath $TempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
