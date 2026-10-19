@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
title Podcast Ahenk - Guvenli Windows Kurulumu
echo.
echo ================================================
echo  PODCAST AHENK SES YONETICISI - WINDOWS KURULUM
echo ================================================
echo.
echo Calisilan klasor: %CD%
echo Kurulum PowerShell ile baslatiliyor...
echo.
set "AHENK_PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%AHENK_PS%" (
    echo HATA: Windows PowerShell bulunamadi.
    goto :failed
)
rem Immutable GitHub commit and independent SHA256 check.
rem Nothing is executed before the downloaded installer is verified.
"%AHENK_PS%" -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $uri = 'https://raw.githubusercontent.com/metinciris/metinciriscomtr/1c9b9d67bcde5b600fdaf549c4d9fcc25e1a0cf4/windows/podcast-ahenk/kurulum.ps1'; $expected = '5317cbadff15587886b75a16d4dfdc60fcfe3e92eb43d7af2001386273ee2eb9'; $tempFile = Join-Path $env:TEMP ('PodcastAhenk_' + [guid]::NewGuid().ToString('N') + '.ps1'); try { Write-Host 'GitHub kurulum betigi indiriliyor...' -ForegroundColor Cyan; Invoke-WebRequest -Uri $uri -OutFile $tempFile -UseBasicParsing; $actual = (Get-FileHash -LiteralPath $tempFile -Algorithm SHA256).Hash.ToLowerInvariant(); if ($actual -ne $expected) { throw 'Kurulum dosyasi SHA256 dogrulamasi basarisiz! Dosya calistirilmadi.' }; Write-Host 'SHA256 dogrulandi. PowerShell kurulumu baslatiliyor...' -ForegroundColor Green; & $tempFile } finally { Remove-Item -LiteralPath $tempFile -Force -ErrorAction SilentlyContinue }"
if errorlevel 1 goto :failed
echo.
echo Kurulum komutu tamamlandi. Masaustundeki kisayolu kullanabilirsiniz.
echo.
pause
exit /b 0

:failed
echo.
echo HATA: Kurulum tamamlanamadi. Yukaridaki mesaji paylasabilirsiniz.
echo.
pause
exit /b 1
