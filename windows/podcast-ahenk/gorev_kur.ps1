# Podcast Ahenk: launch its VISIBLE GUI once daily at 12:30 local time.
# The GUI already prepares + uploads missing voices on startup.
# A single interactive scheduled instance must exit after completing.
[CmdletBinding()]
param(
    [string]$Target = "$env:LOCALAPPDATA\PodcastAhenk",
    [switch]$CheckOnly
)
$ErrorActionPreference = "Stop"
$TaskName = "PodcastAhenk_GunlukSes_1230"
$Repo = Join-Path $Target "metinciriscomtr"
$Gui = Join-Path $Repo "windows\podcast-ahenk\two_step_manager.py"
$Pythonw = Join-Path $Target "venv\Scripts\pythonw.exe"
$Log = Join-Path $Target "gorev_1230.log"

if (-not (Test-Path -LiteralPath $Pythonw -PathType Leaf)) {
    throw "Podcast Ahenk Python ortami bulunamadi. Once kurulum.ps1 calistirin."
}
if (-not (Test-Path -LiteralPath $Gui -PathType Leaf)) {
    throw "Podcast Ahenk gorunur pencere kodu bulunamadi. Once kurulum.ps1 ile guncelleyin."
}
if (-not (Test-Path -LiteralPath (Join-Path $Repo ".git"))) {
    throw "Beklenen GitHub deposu bulunamadi: $Repo"
}

$CurrentUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$Existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($null -ne $Existing) {
    $Actions = @($Existing.Actions)
    $Owned = @($Actions | Where-Object {
        [string]::Equals($_.Execute, $Pythonw, [StringComparison]::OrdinalIgnoreCase) -and
        (
            $_.Arguments.Contains("gunluk_otomatik.py") -or
            $_.Arguments.Contains("two_step_manager.py")
        )
    })
    if ($Actions.Count -ne 1 -or $Owned.Count -ne 1) {
        throw "Ayni isimde baska bir Windows gorevi var; degistirilmedi: $TaskName"
    }
    if ($Existing.State -eq "Running" -and -not $CheckOnly) {
        throw "Eski gorev halen calisiyor. Tamamlanmasini bekleyip yeniden deneyin."
    }
}

$When = [DateTime]::Today.AddHours(12).AddMinutes(30)
$Arguments = '"' + $Gui + '" --scheduled'
$Action = New-ScheduledTaskAction -Execute $Pythonw -Argument $Arguments -WorkingDirectory $Repo
$Trigger = New-ScheduledTaskTrigger -Daily -At $When
$Principal = New-ScheduledTaskPrincipal -UserId $CurrentUser -LogonType Interactive -RunLevel Limited
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 6) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

if ($CheckOnly) {
    Write-Host "DENETIM (kayit yapilmadi)" -ForegroundColor Cyan
    Write-Host "Kullanici: $CurrentUser"
    Write-Host "Gorev: $TaskName - gunluk 12:30"
    Write-Host "Gorunur pencere: $Gui"
    Write-Host "Calistirma: $Pythonw $Arguments"
    Write-Host "Onceki kayit: $(if ($Existing) { $Existing.State } else { 'YOK' })"
    return
}

Register-ScheduledTask -TaskName $TaskName -Description "Her gun 12:30: Ahenk penceresini bir kez ac, eksik sesleri otomatik hazirla/yukle, tamamlaninca kapat." -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Force | Out-Null

$Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
if ($Task.State -eq "Disabled") {
    Enable-ScheduledTask -TaskName $TaskName -ErrorAction Stop | Out-Null
    $Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
}
$Installed = @($Task.Actions)
if ($Installed.Count -ne 1 -or -not $Installed[0].Arguments.Contains("two_step_manager.py") -or -not $Installed[0].Arguments.Contains("--scheduled") -or $Task.State -eq "Disabled") {
    throw "12:30 gorevi kaydedildi ama gorunur pencere ayarlari dogrulanamadi."
}
$Info = Get-ScheduledTaskInfo -TaskName $TaskName -ErrorAction Stop
Write-Host "Podcast Ahenk: her gun 12:30 GORUNUR baslatma gorevi AKTIF." -ForegroundColor Green
Write-Host "Kullanici: $CurrentUser"
Write-Host "Sonraki calisma: $($Info.NextRunTime)"
Write-Host "Son calisma: $($Info.LastRunTime)"
Write-Host "Son sonuc kodu: $($Info.LastTaskResult)"
Write-Host "Pencere eksikleri bitirince 90 saniye sonucu gosterip kapanir."
Write-Host "Program zaten aciksa ikinci kopya baslatilmaz."
Write-Host "Bilgisayar kapaliysa gorev ancak tekrar acilip Windows oturumu acildiginda calisabilir."
Write-Host "Gunluk: $Log"
Write-Host "Simdi denemek icin: Start-ScheduledTask -TaskName '$TaskName'"
