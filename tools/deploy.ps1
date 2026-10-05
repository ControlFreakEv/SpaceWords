<#
  Installs the latest Space Words build on the Skylight frame over Wi-Fi.

  Run from the SpaceWords folder:
      powershell -ExecutionPolicy Bypass -File tools\deploy.ps1
  Add -Open to also open the games afterwards (handy for testing):
      powershell -ExecutionPolicy Bypass -File tools\deploy.ps1 -Open
  Different frame address:
      powershell -ExecutionPolicy Bypass -File tools\deploy.ps1 -Frame 192.168.1.50:5555

  Build the APK first in Android Studio: Build > Generate App Bundles or APKs > Generate APKs.
  Her stars are kept: install -r replaces the app without clearing its data.
  Afterwards it restarts the UFO button (installing closes the app, and this frame won't let
  the app restart itself), opening the game on the frame if that's the only way.
#>
param(
    [string]$Frame = "192.168.1.242:5555",
    [switch]$Open
)

$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
$root = Split-Path -Parent $PSScriptRoot
$apk = Join-Path $root "app\build\outputs\apk\debug\app-debug.apk"

if (-not (Test-Path $adb)) {
    Write-Host "adb not found at $adb" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $apk)) {
    Write-Host "No APK yet at $apk" -ForegroundColor Red
    Write-Host "Build it in Android Studio: Build > Generate App Bundles or APKs > Generate APKs."
    exit 1
}

$built = (Get-Item $apk).LastWriteTime
Write-Host "APK built $built"

Write-Host "Connecting to $Frame ..."
& $adb connect $Frame
& $adb -s $Frame get-state 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Can't reach the frame at $Frame." -ForegroundColor Red
    Write-Host "Check it's on Wi-Fi. If it just rebooted and Wi-Fi adb didn't come back, plug in USB and run: adb tcpip 5555"
    exit 1
}

Write-Host "Installing ..."
& $adb -s $Frame install -r $apk
if ($LASTEXITCODE -ne 0) {
    Write-Host "Install failed." -ForegroundColor Red
    exit 1
}

# Installing closes the app, and this frame's software won't let it restart itself in the
# background, so start the UFO service from here.
& $adb -s $Frame shell am startservice -n com.wordhop.app/.BubbleService | Out-Null
Start-Sleep -Seconds 2
$running = (& $adb -s $Frame shell ps | Where-Object { $_ -match 'com\.wordhop\.app' }).Count -gt 0

if ($Open -or -not $running) {
    # Opening the game directly is always allowed, and it starts the UFO too.
    & $adb -s $Frame shell am start -n com.wordhop.app/.GameActivity | Out-Null
    if ($running) {
        Write-Host "Opened Space Words on the frame."
    } else {
        Write-Host "Opened Space Words on the frame to bring the UFO back. Tap 'Back to photos' there." -ForegroundColor Yellow
    }
}
Write-Host "Done." -ForegroundColor Green
