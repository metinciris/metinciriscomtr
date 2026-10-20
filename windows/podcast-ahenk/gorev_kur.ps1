# Daily Podcast Ahenk background job, current Windows user, 12:30 local time.
# Installs one Task Scheduler entry only; never deletes or edits audio files.
[CmdletBinding()]
param([switch]$CheckOnly)
$ErrorActionPreference = "Stop"
$TaskName = "PodcastAhenk_GunlukSes_1230"
$Repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..")).Path
$Pythonw = Join-Path $env:LOCALAPPDATA "PodcastAhenk\venv\Scripts\pythonw.exe"
$Worker = Join-Path $PSScriptRoot "gunluk_otomatik.py"
if (-not (Test-Path -LiteralPath $Pythonw -PathType Leaf)) {
    throw "Podcast Ahenk Python sanal ortami eksik. Once kurulum.ps1 calistirin."
}
if (-not (Test-Path -LiteralPath $Worker -PathType Leaf)) {
    throw "Gunluk Ahenk kaynak dosyasi eksik. Once kurulum.ps1 ile Github guncelleyin."
}
if (-not (Test-Path -LiteralPath (Join-Path $Repo ".git"))) {
    throw "Beklenen Podcast GitHub deposu bulunamadi."
}
$UserName = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$Existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($Existing) {
    $Same = @($Existing.Actions | Where-Object {
        [string]::Equals($_.Execute, $Pythonw, [StringComparison]::OrdinalIgnoreCase) -and
        $_.Arguments.Contains("gunluk_otomatik.py")
    })
    if ($Same.Count -ne 1 -or @($Existing.Actions).Count -ne 1) {
        throw "Ayni isimde baska bir Windows gorevi var; degistirilmedi: $TaskName"
    }
}
$When = [DateTime]::Today.AddHours(12).AddMinutes(30)
$Action = New-ScheduledTaskAction -Execute $Pythonw -Argument ('"' + $Worker + '"') -WorkingDirectory $Repo
$Trigger = New-ScheduledTaskTrigger -Daily -At $When
$Principal = New-ScheduledTaskPrincipal -UserId $UserName -LogonType Interactive -RunLevel Limited
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 5) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
if ($CheckOnly) {
    Write-Host "Denetim basarili: Gorev $TaskName; her gun 12:30; kullanici: $UserName" -ForegroundColor Green
    Write-Host "Kayit yapilmadi."
    return
}
Register-ScheduledTask -TaskName $TaskName -Description "Her gun 12:30: podcast eksik seslerini PC'de uret, Github'a tek seferde yayinla, cik." -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Force | Out-Null
$State = Get-ScheduledTaskInfo -TaskName $TaskName
Write-Host "Podcast Ahenk gunluk gorevi kuruldu: 12:30 (Windows yerel saati)" -ForegroundColor Green
Write-Host "Gorev: $TaskName"
Write-Host "Sonraki calisma: $($State.NextRunTime)"
Write-Host "Yalniz Windows oturumunuz acikken calisir; bilgisayar kapaliysa sonradan dener."
Write-Host "Kayit: $env:LOCALAPPDATA\PodcastAhenk\gunluk_otomatik.log"
Write-Host "Devre disi birakmak icin: gorev_kaldir.ps1"
