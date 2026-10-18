# Podcast Ahenk: safe Windows installer, run only after reviewing this file.
# Needs Python 3.11 (py launcher) and Git for Windows. Does not require admin.
param([string]$Target = "$env:LOCALAPPDATA\PodcastAhenk")
$ErrorActionPreference = "Stop"
$Expected = "https://github.com/metinciris/metinciriscomtr.git"
$Repo = Join-Path $Target "metinciriscomtr"
$Venv = Join-Path $Target "venv"
Write-Host "Podcast Ahenk Ses Yoneticisi | metinciris/metinciriscomtr" -ForegroundColor Cyan
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git for Windows gerekli: https://git-scm.com/download/win"
}
if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
    throw "Python 3.11 (64-bit) gerekli: https://www.python.org/downloads/windows/"
}
& py -3.11 -c "import sys; assert sys.version_info[:2] == (3, 11); print(sys.version)"
if ($LASTEXITCODE -ne 0) { throw "Python 3.11 bulunamadi." }
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
if (-not (Test-Path (Join-Path $Venv "Scripts\pythonw.exe"))) {
    & py -3.11 -m venv $Venv
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
