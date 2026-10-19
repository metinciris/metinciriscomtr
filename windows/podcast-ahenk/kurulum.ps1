# Podcast Ahenk - Windows PowerShell 5.1+ safe local installer.
# Python 3.11-3.13 (64-bit). Runs as a normal user; no admin access required.
[CmdletBinding()]
param(
    [string]$Target = "$env:LOCALAPPDATA\PodcastAhenk",
    [ValidateSet("Auto", "3.11", "3.12", "3.13")]
    [string]$PythonVersion = "Auto",
    [switch]$CheckPythonOnly
)

$ErrorActionPreference = "Stop"
$Expected = "https://github.com/metinciris/metinciriscomtr.git"
$Repo = Join-Path $Target "metinciriscomtr"
$Venv = Join-Path $Target "venv"
$Probe = "import sys,struct; print(str(sys.version_info.major)+'.'+str(sys.version_info.minor)+'|'+str(struct.calcsize('P')*8))"
Write-Host "Podcast Ahenk Ses Yoneticisi | metinciris/metinciriscomtr" -ForegroundColor Cyan

function Test-AhenkPython {
    param(
        [string]$Executable,
        [string[]]$Arguments,
        [string]$Version
    )
    try {
        $output = & $Executable @Arguments -c $Probe 2>$null
        if ($LASTEXITCODE -ne 0) { return $false }
        $versionLine = @($output | Select-Object -Last 1)
        if ($versionLine.Count -ne 1) { return $false }
        return ($versionLine[0].ToString().Trim() -eq ($Version + "|64"))
    } catch {
        return $false
    }
}

$Candidates = if ($PythonVersion -eq "Auto") {
    @("3.13", "3.12", "3.11")
} else {
    @($PythonVersion)
}
$SelectedPython = $null
$PythonExe = $null
$PythonArgs = @()

if (Get-Command "py.exe" -ErrorAction SilentlyContinue) {
    foreach ($candidate in $Candidates) {
        $argsForVersion = @("-$candidate")
        if (Test-AhenkPython -Executable "py.exe" -Arguments $argsForVersion -Version $candidate) {
            $SelectedPython = $candidate
            $PythonExe = "py.exe"
            $PythonArgs = $argsForVersion
            break
        }
    }
}
if (-not $SelectedPython -and (Get-Command "python.exe" -ErrorAction SilentlyContinue)) {
    foreach ($candidate in $Candidates) {
        if (Test-AhenkPython -Executable "python.exe" -Arguments @() -Version $candidate) {
            $SelectedPython = $candidate
            $PythonExe = "python.exe"
            $PythonArgs = @()
            break
        }
    }
}

if (-not $SelectedPython) {
    Write-Host "Kontrol: py -0p veya python --version" -ForegroundColor Yellow
    throw "64-bit Python 3.11, 3.12 veya 3.13 bulunamadi."
}
Write-Host "Python $SelectedPython (64-bit) bulundu." -ForegroundColor Green
if ($CheckPythonOnly) {
    Write-Host "Python kontrolu basarili; hicbir dosya degistirilmedi."
    return
}

if (-not (Get-Command "git.exe" -ErrorAction SilentlyContinue)) {
    throw "Git for Windows gerekli: https://git-scm.com/download/win"
}
New-Item -ItemType Directory -Path $Target -Force | Out-Null
if (Test-Path -LiteralPath (Join-Path $Repo ".git")) {
    $remote = (& git.exe -C $Repo remote get-url origin)
    if ($LASTEXITCODE -ne 0) { throw "GitHub deposu dogrulanamadi." }
    $remote = "$remote".Trim().TrimEnd("/")
    if (@($Expected, $Expected.Replace(".git", ""),
          "git@github.com:metinciris/metinciriscomtr.git",
          "git@github.com:metinciris/metinciriscomtr") -notcontains $remote) {
        throw "Beklenmeyen GitHub deposu: $remote"
    }
    $branch = & git.exe -C $Repo branch --show-current
    if ($LASTEXITCODE -ne 0 -or "$branch".Trim() -ne "main") {
        throw "Yalniz main dalinda guncelleme yapilir."
    }
    $dirty = @( & git.exe -C $Repo status --porcelain --untracked-files=all )
    if ($LASTEXITCODE -ne 0) { throw "Yerel Git durumu okunamadi." }
    $dirtyPaths = @()
    foreach ($line in $dirty) {
        if ($line.Length -lt 4) { throw "Yerel Git durumu gecersiz." }
        $relative = $line.Substring(3).Replace("\", "/")
        $allowed = ($relative -eq "public/podcast-audio/manifest.json" -or
                    $relative -eq "public/podcast-audio/pronunciation.json" -or
                    $relative -match '^public/podcast-audio/[a-f0-9]{24}\.mp3$')
        if (-not $allowed) {
            throw "Beklenmeyen yerel degisiklik: $relative. Otomatik guncelleme durduruldu."
        }
        $dirtyPaths += $relative
    }
    & git.exe -C $Repo fetch origin main
    if ($LASTEXITCODE -ne 0) { throw "GitHub guncellemesi kontrol edilemedi." }
    if ($dirtyPaths.Count -gt 0) {
        Write-Host "Yerel yeni MP3 ve telaffuz dosyalari bulundu. Korunarak guncellenecek." -ForegroundColor Yellow
        # The sync helper is loaded from the verified repository's fetched
        # main ref. It is standard-library-only and performs per-title
        # manifest merges with backups; never hard resets audio.
        $SyncPython = @'
import importlib.util
import pathlib
import subprocess
import sys
import tempfile
root = pathlib.Path(sys.argv[1])
home = pathlib.Path(sys.argv[2])
source = subprocess.check_output([
    "git", "-C", str(root), "show",
    "refs/remotes/origin/main:windows/podcast-ahenk/git_sync.py"
])
with tempfile.TemporaryDirectory(prefix="ahenk-updater-", dir=str(home)) as folder:
    script = pathlib.Path(folder) / "git_sync.py"
    script.write_bytes(source)
    spec = importlib.util.spec_from_file_location("ahenk_sync_updater", script)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    print(module.sync(root, home), flush=True)
'@
        # Windows PowerShell 5.1 can mangle multiline Python passed via -c.
        # Persist the exact source in a temporary UTF-8 .py file and run that
        # file as the script (not a quoted command string).
        $SyncRunner = Join-Path $Target ("ahenk_senkron_" + [guid]::NewGuid().ToString("N") + ".py")
        try {
            [System.IO.File]::WriteAllText(
                $SyncRunner, $SyncPython, [System.Text.UTF8Encoding]::new($false)
            )
            & $PythonExe @PythonArgs $SyncRunner $Repo $Target
            $SyncExitCode = $LASTEXITCODE
            if ($SyncExitCode -ne 0) {
                throw "Yerel seslerle GitHub guncellemesi tamamlanamadi. Yedekler korundu."
            }
        }
        finally {
            Remove-Item -LiteralPath $SyncRunner -Force -ErrorAction SilentlyContinue
        }
    } else {
        & git.exe -C $Repo pull --ff-only origin main
        if ($LASTEXITCODE -ne 0) { throw "GitHub guvenli guncellemesi basarisiz." }
    }
} elseif (Test-Path -LiteralPath $Repo) {
    throw "Hedef klasor dolu, fakat Git deposu degil: $Repo"
} else {
    Write-Host "Resmi GitHub deposu indiriliyor..." -ForegroundColor Cyan
    & git.exe clone --filter=blob:none --sparse --branch main $Expected $Repo
    if ($LASTEXITCODE -ne 0) { throw "GitHub indirme hatasi." }
}

& git.exe -C $Repo sparse-checkout set scripts public/podcast-audio windows/podcast-ahenk
if ($LASTEXITCODE -ne 0) { throw "Gerekli uygulama dosyalari alinamadi." }

$venvPython = Join-Path $Venv "Scripts\python.exe"
$venvPythonw = Join-Path $Venv "Scripts\pythonw.exe"
if (Test-Path -LiteralPath $Venv) {
    if (-not (Test-Path -LiteralPath $venvPython) -or
        -not (Test-Path -LiteralPath $venvPythonw)) {
        throw "Mevcut Python sanal ortami eksik. Guvenlik icin otomatik silinmedi: $Venv"
    }
    $venvInfo = & $venvPython -c $Probe
    if ($LASTEXITCODE -ne 0) { throw "Mevcut Python ortami baslatilamadi: $Venv" }
    $venvText = "$venvInfo".Trim()
    if ($venvText -notmatch '^3\.(11|12|13)\|64$') {
        throw "Mevcut Python sanal ortami desteklenmiyor: $venvText"
    }
    $venvVersion = ($venvText -split '\|')[0]
    if ($PythonVersion -ne "Auto" -and $venvVersion -ne $PythonVersion) {
        throw "Mevcut Python ortami $venvVersion. Istenen surum $PythonVersion; ortam korunuyor."
    }
    Write-Host "Mevcut Python $venvVersion sanal ortami korundu." -ForegroundColor Green
} else {
    & $PythonExe @PythonArgs -m venv $Venv
    if ($LASTEXITCODE -ne 0) { throw "Python sanal ortami olusturulamadi." }
}

$Launcher = Join-Path $Repo "windows\podcast-ahenk\baslat.cmd"
if (-not (Test-Path -LiteralPath $Launcher)) {
    throw "Podcast Ahenk baslatma dosyasi bulunamadi: $Launcher"
}
$Desktop = [Environment]::GetFolderPath("DesktopDirectory")
if ($Desktop -and (Test-Path -LiteralPath $Desktop)) {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut((Join-Path $Desktop "Podcast Ahenk Ses Yoneticisi.lnk"))
    $shortcut.TargetPath = $Launcher
    $shortcut.WorkingDirectory = $Repo
    $shortcut.Description = "Patoloji Podcast Ahenk ses arsivi"
    $shortcut.Save()
}
Write-Host "Kurulum tamam. Uygulama klasoru: $Repo" -ForegroundColor Green
Write-Host "FFmpeg eksikse: winget install -e --id Gyan.FFmpeg"
Write-Host "Uygulamada 'Ses Motorunu Kur' secenegini kullanin."
Start-Process -FilePath $Launcher
