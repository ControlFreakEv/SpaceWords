@echo off
rem Double-click to update Space Words on the frame: get the latest code, record new
rem voice clips, build the app and install it. Same as tools\update.ps1.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\update.ps1" %*
echo.
pause
