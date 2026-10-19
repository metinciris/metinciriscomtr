# Podcast Ahenk: safe Windows installer, run only after reviewing this file.
# Uses an existing 64-bit Python 3.11, 3.12 or 3.13; does not install Python.
# No admin permissions are needed to install the application.
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
Write-Host "Podcast Ahenk Ses Yoneticisi | metinciris/metinciriscomtr" -ForegroundColor Cyan

# Probe interpreters instead of assuming Python 3.11 is installed.
# Check both the Windows Python launcher and python.exe from PATH.
$PythonProbe = "import sys,struct; print(str(sys.version_info.major)+'.'+str(sys.version_info.minor)+'|'+str(struct.calcsize('P')*8))"
function Test-AhenkPython {
    param([string]$Exe, [string[]]$Prefix, [string]$WantedVersion)
    try {
        $global:LASTEXITCODE = 1
        $Result = & $Exe @Prefix -c $PythonProbe 2>$null
        if ($LASTEXITCODE -ne 0) { return $false }
        $LastLine = @($Result)[-1].ToString().Trim()
        return ($LastLine -eq ($WantedVersion + "|64"))
    } catch {
        return $false
    }
}
$Candidates = if ($PythonVersion -eq "Auto") { @("3.13", "3.12", "3.11") } else { @($PythonVersion) }
$SelectedPython = $null
$PythonExe = $null
$PythonPrefix = @()
if (Get-Command py -ErrorAction SilentlyContinue) {
    foreach ($Candidate in $Candidates) {
        if (Test-AhenkPython "py" @("-" + $Candidate) $Candidate) {
            $PythonExe = "py"
            $PythonPrefix = @("-" + $Candidate)
            $SelectedPython = $Candidate
            break
        }
    }
}
if (-not $SelectedPython -and (Get-Command python -ErrorAction SilentlyContinue)) {
    foreach ($Candidate in $Candidates) {
        if (Test-AhenkPython "python" @() $Candidate) {
            $PythonExe = "python"
            $SelectedPython = $Candidate
            break
        }
    }
}
if (-not $SelectedPython) {
    Write-Host "Kontrol: py -0p   veya   python --version" -ForegroundColor Yellow
    throw "64-bit Python 3.11, 3.12 veya 3.13 bulunamadi. Python 3.13 kuruluysa py -0p ile kontrol edin."
}
Write-Host "Python $SelectedPython (64-bit) algilandi." -ForegroundColor Green
if ($CheckPythonOnly) {
    Write-Host "Python kontrolu basarili. Hicbir dosya degistirilmedi."
    return
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git for Windows gerekli: https://git-scm.com/download/win"
}
New-Item -ItemType Directory -Force -Path $Target | Out-Null
if (Test-Path (Join-Path $Repo ".git")) {
    $Remote = (& git -C $Repo remote get-url origin).Trim()
    if ($Remote -ne $Expected -and $Remote -ne $Expected.Replace(".git", "")) {
        throw "Guvenlik: beklenmeyen GitHub deposu: $Remote"
    }
    if ((& git -C $Repo branch --show-current).Trim() -ne "main") {
        throw "Beklenmeyen dal: yalniz main desteklenir."
    }
    $Changed = & git -C $Repo status --porcelain --untracked-files=all
    if ($Changed) {
        throw "Yerel dosyalar degismis. Otomatik pull durduruldu; verileriniz silinmez."
    }
    & git -C $Repo pull --ff-only origin main
    if ($LASTEXITCODE -ne 0) { throw "GitHub guvenli guncellemesi basarisiz." }
} elseif (Test-Path $Repo) {
    throw "Hedef klasor zaten dolu ama bir Git deposu degil."
} else {
    Write-Host "GitHub resmi adresinden HTTPS ile kod indiriliyor..."
    & git clone --filter=blob:none --sparse --branch main $Expected $Repo
    if ($LASTEXITCODE -ne 0) { throw "GitHub clone basarisiz." }
}
& git -C $Repo sparse-checkout set scripts public/podcast-audio windows/podcast-ahenk
if ($LASTEXITCODE -ne 0) { throw "Gerekli dosyalar indirilemedi." }
$ExistingVenvPython = Join-Path $Venv "Scripts\python.exe"
$ExistingVenvPythonw = Join-Path $Venv "Scripts\pythonw.exe"
if (Test-Path $Venv) {
    if (-not (Test-Path $ExistingVenvPython) -or -not (Test-Path $ExistingVenvPythonw)) {
        throw "Var olan sanal ortam eksik: $Venv. Otomatik silinmedi. Lutfen elle inceleyin."
    }
    try {
        $VenvInfo = (& $ExistingVenvPython -c $PythonProbe 2>$null | Select-Object -Last 1)
        if ($LASTEXITCODE -ne 0 -or "$VenvInfo" -notmatch '^3\.(11|12|13)\|64$Launcher = Join-Path $Repo "windows\podcast-ahenk\baslat.cmd"
if (-not (Test-Path $Launcher)) { throw "Baslatici dosya bulunamadi." }
$Desktop = [Environment]::GetFolderPath("DesktopDirectory")
if ($Desktop -and (Test-Path $Desktop)) {
    $Shell = New-Object -ComObject WScript.Shell
    $Link = $Shell.CreateShortcut((Join-Path $Desktop "Podcast Ahenk Ses Yoneticisi.lnk"))
    $Link.TargetPath = $Launcher
    $Link.WorkingDirectory = $Repo
    $Link.Description = "Patoloji Podcast Ahenk ses arsivi"
    $Link.Save()
}
Write-Host "Kurulum tamam. Yerel klasor: $Repo" -ForegroundColor Green
Write-Host "FFmpeg kurulumu gerekiyorsa: winget install -e --id Gyan.FFmpeg"
Write-Host "Ses motorunu uygulamadaki 'Ses Motorunu Kur' dugmesiyle kurun."
Start-Process -FilePath $Launcher
) {
            throw "unsupported interpreter"
        }
    } catch {
        throw "Var olan sanal ortama erisilemiyor: $Venv. Otomatik silinmedi."
    }
    $VenvVersion = ("$VenvInfo" -split '\|')[0]
    if ($PythonVersion -ne "Auto" -and $VenvVersion -ne $PythonVersion) {
        throw "Mevcut sanal ortam Python $VenvVersion kullaniyor. Secilen surum $PythonVersion. Ortam otomatik degistirilmez."
    }
    Write-Host "Mevcut Python $VenvVersion sanal ortami korunuyor." -ForegroundColor Green
} else {
    & $PythonExe @PythonPrefix -m venv $Venv
    if ($LASTEXITCODE -ne 0) { throw "Python sanal ortami kurulamadi." }
}
$Launcher = Join-Path $Repo "windows\podcast-ahenk\baslat.cmd"
if (-not (Test-Path $Launcher)) { throw "Baslatici dosya bulunamadi." }
$Desktop = [Environment]::GetFolderPath("DesktopDirectory")
if ($Desktop -and (Test-Path $Desktop)) {
    $Shell = New-Object -ComObject WScript.Shell
    $Link = $Shell.CreateShortcut((Join-Path $Desktop "Podcast Ahenk Ses Yoneticisi.lnk"))
    $Link.TargetPath = $Launcher
    $Link.WorkingDirectory = $Repo
    $Link.Description = "Patoloji Podcast Ahenk ses arsivi"
    $Link.Save()
}
Write-Host "Kurulum tamam. Yerel klasor: $Repo" -ForegroundColor Green
Write-Host "FFmpeg kurulumu gerekiyorsa: winget install -e --id Gyan.FFmpeg"
Write-Host "Ses motorunu uygulamadaki 'Ses Motorunu Kur' dugmesiyle kurun."
Start-Process -FilePath $Launcher
