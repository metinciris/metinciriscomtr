@echo off
set "AHENK_PY=%LOCALAPPDATA%\PodcastAhenk\venv\Scripts\pythonw.exe"
if not exist "%AHENK_PY%" (
  echo Python sanal ortami bulunamadi. Once kurulum.ps1 calistirin.
  pause
  exit /b 1
)
start "" "%AHENK_PY%" "%~dp0podcast_ahenk_gui.py"
