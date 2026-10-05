<#
  Looks for the frame setting that stops Space Words from starting by itself (at boot and
  after an update). Read-only: it changes nothing on the frame.

  Run from the SpaceWords folder:
      powershell -ExecutionPolicy Bypass -File tools\inspect-autostart.ps1
  The result is saved to tools\autostart-log.txt and copied to the clipboard.
#>
param([string]$Frame = "192.168.1.242:5555")

$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
$out = Join-Path $PSScriptRoot "autostart-log.txt"
function A { & $adb -s $Frame @args 2>&1 | ForEach-Object { "$_".TrimEnd() } }
$hint = 'white|black|autostart|auto_start|forbid|allow|bootstart|boot_start|lowram|low_ram|limit|bg_|background|skylight|watchdog'

& $adb connect $Frame | Out-Null
if ((A get-state) -notmatch 'device') {
    Write-Host "Can't reach the frame at $Frame. Connect first: adb connect $Frame" -ForegroundColor Red
    exit 1
}
Write-Host "Collecting (about 30 seconds)..."

$log = @("Space Words autostart inspection, $(Get-Date)")
$log += "", "===== build ====="
$log += A shell getprop ro.build.fingerprint
$log += A shell getprop ro.product.model
$log += "", "===== properties that look related ====="
$log += A shell getprop | Where-Object { $_ -match $hint }
$log += "", "===== files that look like app lists ====="
foreach ($dir in "/system/etc", "/system/etc/init.d", "/data/system", "/data/local", "/system/bin", "/oem", "/vendor/etc") {
    $names = A shell ls $dir | Where-Object { $_ -match "$hint|\.sh$|list" }
    foreach ($n in $names) { $log += "$dir/$n" }
}
$log += "", "===== startup config lines about scripts, Skylight or the watchdog ====="
$rcs = A shell ls / | Where-Object { $_ -match '\.rc$' }
foreach ($rc in $rcs) {
    $log += A shell cat "/$rc" | Where-Object { $_ -match 'skylight|watchdog|\.sh|whitelist|blacklist|autostart' } | ForEach-Object { "${rc}: $_" }
}
$log += "", "===== files mentioning skylight (needs grep on the frame) ====="
$log += A shell "grep -rl -i skylight /system/etc /system/bin /system/xbin /data/local /init.rc 2>/dev/null"
$log += "", "===== scripts found above (first 60 lines each) ====="
$scripts = $log | Where-Object { $_ -match '^/.*\.sh$' } | Select-Object -Unique
foreach ($sh in $scripts) {
    $log += "----- $sh"
    $log += A shell cat $sh | Select-Object -First 60
}
$log += "", "===== package state: Space Words vs the watchdog vs Gallery ====="
foreach ($pkg in "com.wordhop.app", "skylight.watchdog", "com.android.gallery3d") {
    $log += "----- $pkg"
    $log += A shell dumpsys package $pkg | Where-Object { $_ -match 'flags=|pkgFlags|privateFlags|stopped=|enabled=|installerPackageName|codePath=|userId=' } | Select-Object -First 12
}
$log += "", "===== activity manager: anything about bad, forbidden or listed processes ====="
$log += A shell dumpsys activity processes | Where-Object { $_ -match 'bad|forbid|white|black|wordhop|gallery3d' } | Select-Object -First 40
$log += "", "===== media volume (STREAM_MUSIC is what the games use) ====="
$audio = @(A shell dumpsys audio)
for ($i = 0; $i -lt $audio.Count; $i++) {
    if ($audio[$i] -match 'STREAM_MUSIC') { $log += $audio[$i..([math]::Min($i + 4, $audio.Count - 1))]; break }
}
$log += "", "===== recent log lines about blocked starts ====="
$log += A logcat -d -v time | Where-Object { $_ -match 'process is bad|wordhop|forbid|whitelist|blacklist|autostart|not allowed' } | Select-Object -Last 40

$log | Set-Content -Encoding UTF8 $out
try { ($log -join "`r`n") | Set-Clipboard } catch {}
Write-Host "Saved to $out and copied to the clipboard. Paste it into the chat." -ForegroundColor Green
