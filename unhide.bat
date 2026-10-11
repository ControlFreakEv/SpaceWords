@echo off
rem Double-click to bring Space Words back early after a grown-up hid it (Pick a mission >
rem Grown-ups (hold) > Hide). Same as tools\unhide.ps1.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\unhide.ps1" %*
echo.
pause
