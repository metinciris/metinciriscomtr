# Show current schedule and last local run; does not create or change tasks.
$Name = "PodcastAhenk_GunlukSes_1230"
$Task = Get-ScheduledTask -TaskName $Name -ErrorAction SilentlyContinue
if ($Task) {
    $Info = Get-ScheduledTaskInfo -TaskName $Name
    Write-Host "Gorev: $Name / $($Task.State)"
    Write-Host "Son calisma: $($Info.LastRunTime)"
    Write-Host "Son kod: $($Info.LastTaskResult)"
    Write-Host "Siradaki: $($Info.NextRunTime)"
} else {
    Write-Host "Gunluk gorev kurulu degil."
}
$State = Join-Path $env:LOCALAPPDATA "PodcastAhenk\gunluk_otomatik_sonuc.json"
if (Test-Path -LiteralPath $State) {
    Get-Content -LiteralPath $State -Raw -Encoding UTF8 | Write-Host
}
Write-Host "Gunluk: $env:LOCALAPPDATA\PodcastAhenk\gunluk_otomatik.log"
