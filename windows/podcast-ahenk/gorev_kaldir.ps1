# Remove only the installed scheduled task; never touch sound files.
[CmdletBinding()]
param()
$ErrorActionPreference = "Stop"
$Name = "PodcastAhenk_GunlukSes_1230"
$Expected = Join-Path $env:LOCALAPPDATA "PodcastAhenk\venv\Scripts\pythonw.exe"
$Task = Get-ScheduledTask -TaskName $Name -ErrorAction SilentlyContinue
if (-not $Task) {
    Write-Host "Podcast Ahenk gunluk gorevi zaten kurulu degil."
    return
}
$Owns = @($Task.Actions | Where-Object {
    [string]::Equals($_.Execute, $Expected, [StringComparison]::OrdinalIgnoreCase) -and
    $_.Arguments.Contains("gunluk_otomatik.py")
})
if ($Owns.Count -ne 1 -or @($Task.Actions).Count -ne 1) {
    throw "Gorev baska bir programa ait olabilir. Silinmedi."
}
Unregister-ScheduledTask -TaskName $Name -Confirm:$false
Write-Host "Gunluk otomatik gorev kaldirildi. Yerel MP3'ler ve GitHub sesleri korunuyor." -ForegroundColor Green
