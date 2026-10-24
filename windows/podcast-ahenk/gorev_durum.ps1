# Read the Windows Podcast Ahenk 12:30 schedule and last visible launch.
[CmdletBinding()]
param([string]$Target = "$env:LOCALAPPDATA\PodcastAhenk")
$Name = "PodcastAhenk_GunlukSes_1230"
$Task = Get-ScheduledTask -TaskName $Name -ErrorAction SilentlyContinue
if (-not $Task) {
    Write-Host "12:30 GOREVI KURULU DEGIL." -ForegroundColor Yellow
    Write-Host ('Gorev kurulumu: powershell -NoProfile -ExecutionPolicy Bypass -File "' + $Target + '\metinciriscomtr\windows\podcast-ahenk\gorev_kur.ps1"')
    return
}
$Info = Get-ScheduledTaskInfo -TaskName $Name -ErrorAction SilentlyContinue
Write-Host "Gorev: $Name / Durum: $($Task.State)"
$Action = @($Task.Actions)[0]
$Mode = if ($Action.Arguments.Contains("two_step_manager.py")) {
    "GORUNUR Ahenk penceresi"
} elseif ($Action.Arguments.Contains("gunluk_otomatik.py")) {
    "ESKI - arka plan (guncelleme gerekli)"
} else {
    "BILINMEYEN"
}
Write-Host "Baslatma modu: $Mode"
if ($Info) {
    Write-Host "Son calisma: $($Info.LastRunTime)"
    Write-Host "Son Windows kodu: $($Info.LastTaskResult)"
    Write-Host "Siradaki calisma: $($Info.NextRunTime)"
}
Write-Host "Giris tipi: $($Task.Principal.LogonType)"
Write-Host "Saat 12:30'da Windows oturumu acik ve bilgisayar calisir durumda olmali."
$SettingsFile = Join-Path $Target "acilis_otomatik.json"
if (Test-Path -LiteralPath $SettingsFile) {
    try {
        $Enabled = (Get-Content -LiteralPath $SettingsFile -Raw -Encoding UTF8 | ConvertFrom-Json).enabled
        if ($Enabled -eq $false) {
            Write-Host "DIKKAT: Ahenk icinde acilista otomatik calisma KAPALI." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Otomatik baslatma tercihi okunamadi."
    }
}
$Log = Join-Path $Target "gorev_1230.log"
if (Test-Path -LiteralPath $Log) {
    Write-Host "Son acilis gunlugu:"
    Get-Content -LiteralPath $Log -Tail 12 -Encoding UTF8
} else {
    Write-Host "Henuz kaydedilmis gorunur baslatma gunlugu yok: $Log"
}
$ResultFile = Join-Path $Target "gunluk_otomatik_sonuc.json"
if (Test-Path -LiteralPath $ResultFile) {
    Write-Host "Son islem raporu:"
    Get-Content -LiteralPath $ResultFile -Raw -Encoding UTF8 | Write-Host
}
