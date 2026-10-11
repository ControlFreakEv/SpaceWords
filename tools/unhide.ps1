<#
  Brings Space Words back on the frame before the hidden time is up (a grown-up hid it from
  Pick a mission > Grown-ups (hold)). Uses Wi-Fi adb, or the USB cable if Wi-Fi doesn't answer.

  Easiest: double-click unhide.bat in the SpaceWords folder.
      -Frame 192.168.1.50:5555   a different frame address
#>
param([string]$Frame = "192.168.1.242:5555")

$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) { Write-Host "adb not found at $adb" -ForegroundColor Red; exit 1 }
function State([string]$serial) { "$(& $adb -s $serial get-state 2>$null)".Trim() }

& $adb connect $Frame | Out-Null
$target = $null
if ((State $Frame) -eq "device") { $target = $Frame }
else {
    & $adb disconnect $Frame | Out-Null
    Start-Sleep -Seconds 1
    & $adb connect $Frame | Out-Null
    Start-Sleep -Seconds 2
    if ((State $Frame) -eq "device") { $target = $Frame }
}
if (-not $target) {
    $target = & $adb devices | Where-Object { $_ -match "^(\S+)\s+device$" -and $_ -notmatch ":" } | ForEach-Object { ($_ -split "\s+")[0] } | Select-Object -First 1
}
if (-not $target) {
    Write-Host "Can't reach the frame at $Frame, and no frame is plugged in by USB." -ForegroundColor Red
    exit 1
}

& $adb -s $target shell am startservice -n com.wordhop.app/.BubbleService -a com.wordhop.app.UNHIDE | Out-Null
Write-Host "Space Words is back: the UFO should show on the frame now." -ForegroundColor Green
