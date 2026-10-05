<#
  Installs the latest Space Words build on the Skylight frame, over Wi-Fi or, if Wi-Fi adb
  isn't answering, over the USB cable (and then switches Wi-Fi adb back on).

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

function State([string]$serial) { "$(& $adb -s $serial get-state 2>$null)".Trim() }

# 1. Wi-Fi. "already connected" can be a stale link left over from a reboot or a Wi-Fi drop,
#    so if the frame doesn't answer, drop the link and connect again.
Write-Host "Connecting to $Frame over Wi-Fi ..."
& $adb connect $Frame | Out-Null
$target = $null
if ((State $Frame) -eq "device") { $target = $Frame }
else {
    Write-Host "No answer; reconnecting ..."
    & $adb disconnect $Frame | Out-Null
    Start-Sleep -Seconds 1
    & $adb connect $Frame | Out-Null
    Start-Sleep -Seconds 2
    if ((State $Frame) -eq "device") { $target = $Frame }
}

# 2. USB, if Wi-Fi didn't work and the frame is plugged in.
$viaUsb = $false
if (-not $target) {
    $usb = & $adb devices | Where-Object { $_ -match "^(\S+)\s+device$" -and $_ -notmatch ":" } | ForEach-Object { ($_ -split "\s+")[0] } | Select-Object -First 1
    if ($usb) { $target = $usb; $viaUsb = $true; Write-Host "Using the USB cable ($usb)." }
}

if (-not $target) {
    Write-Host "Can't reach the frame at $Frame, and no frame is plugged in by USB." -ForegroundColor Red
    Write-Host "adb sees:"
    & $adb devices
    Write-Host "Fix: plug the frame into this PC with the USB cable and run this script again."
    Write-Host "It installs over USB and switches Wi-Fi adb back on for next time."
    Write-Host "If the frame's Wi-Fi address changed, check it in the frame's Wi-Fi settings and add -Frame <address>:5555."
    exit 1
}
$Frame = $target

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
        Write-Host "Opened Space Words on the frame to bring the UFO back. Tap Back there to return to the photos." -ForegroundColor Yellow
    }
}
# Over USB, switch Wi-Fi adb back on so the next update can skip the cable.
if ($viaUsb) {
    & $adb -s $Frame tcpip 5555 | Out-Null
    Write-Host "Wi-Fi adb is back on. You can unplug the cable."
}
Write-Host "Done." -ForegroundColor Green
