@echo off
rem Double-click to make Space Words for another Android phone or tablet: get the latest code,
rem record new voice clips and build the app. Leaves SpaceWords-Android.apk in this folder to send
rem to that device. The frame isn't touched. Same as tools\update.ps1 -AndroidApp.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\update.ps1" -AndroidApp %*
echo.
pause
