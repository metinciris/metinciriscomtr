# Remove ONLY the Podcast Ahenk daily task; never delete user's MP3s.
[CmdletBinding()]
param([string]$Target = "$env:LOCALAPPDATA\PodcastAhenk")
$ErrorActionPreference = "Stop"
$Name = "PodcastAhenk_GunlukSes_1230"
$Expected = Join-Path $Target "venv\Scripts\pythonw.exe"
$Task = Get-ScheduledTask -TaskName $Name -ErrorAction SilentlyContinue
if (-not $Task) {
    Write-Host "Podcast Ahenk gunluk gorevi kurulu degil."
    return
}
$Actions = @($Task.Actions)
$Owns = @($Actions | Where-Object {
    [string]::Equals($_.Execute, $Expected, [StringComparison]::OrdinalIgnoreCase) -and
    ($_.Arguments.Contains("gunluk_otomatik.py") -or
     $_.Arguments.Contains("two_step_manager.py"))
})
if ($Actions.Count -ne 1 -or $Owns.Count -ne 1) {
    throw "Bu gorev baska bir programa ait olabilir; silinmedi."
}
Unregister-ScheduledTask -TaskName $Name -Confirm:$false
Write-Host "Gorev kaldirildi. Yerel MP3'ler ve GitHub kayitlari degistirilmedi." -ForegroundColor Green
