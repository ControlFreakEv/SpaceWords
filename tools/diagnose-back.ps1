<#
  Records what the frame does when "Back to photos" is tapped, so we can see why the
  screen stays black for a while and whether the UFO button survives. It first saves the
  frame's recent log history (run it before rebooting the frame, or that history is lost).
  Changes nothing on the frame except opening the game if you ask it to.

  Run from the SpaceWords folder, with the Skylight photos showing on the frame:
      powershell -ExecutionPolicy Bypass -File tools\diagnose-back.ps1
  Follow the two prompts. The result is saved to tools\back-to-photos-log.txt
  and copied to the clipboard, ready to paste into the chat.
#>
param([string]$Frame = "192.168.1.242:5555")

$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
$out = Join-Path $PSScriptRoot "back-to-photos-log.txt"
function A { & $adb -s $Frame @args 2>&1 }

$taskLines = 'Stack #|Task id|TaskToReturnTo|realActivity|Hist #|mFocusedActivity|mResumedActivity|mLastPausedActivity'

$serviceLines = 'ServiceRecord|app=|isForeground|startRequested|restartCount|restartDelay|crashCount|createTime|lastActivity'
$windowLines = 'mViewVisibility|mHasSurface|isReadyForDisplay|mAttrs=|Surface: shown|mShownFrame'

function Snapshot([string]$label) {
    $s = @("", "===== ${label}: tasks =====")
    $s += A shell dumpsys activity activities | Where-Object { $_ -match $taskLines } | ForEach-Object { "$_".TrimEnd() }
    $s += "===== ${label}: Skylight / Space Words processes ====="
    $s += A shell ps | Where-Object { $_ -match 'skylight|wordhop' } | ForEach-Object { "$_".TrimEnd() }
    $s += "===== ${label}: UFO service ====="
    $s += A shell dumpsys activity services com.wordhop.app | Where-Object { $_ -match $serviceLines } | ForEach-Object { "$_".TrimEnd() }
    $s += "===== ${label}: Space Words windows ====="
    $win = @(A shell dumpsys window windows)
    for ($i = 0; $i -lt $win.Count; $i++) {
        if ($win[$i] -match 'Window #.*wordhop') {
            $s += "$($win[$i])".TrimEnd()
            $end = [math]::Min($i + 40, $win.Count - 1)
            for ($j = $i + 1; $j -le $end; $j++) {
                if ($win[$j] -match 'Window #') { break }
                if ($win[$j] -match $windowLines) { $s += "$($win[$j])".TrimEnd() }
            }
        }
    }
    return $s
}

function Get-FrameHistory([string]$label) {
    $h = @("", "===== ${label}: app deaths, crashes, restarts =====")
    $h += A logcat -d -v time | Where-Object {
        $_ -match 'wordhop|FATAL|AndroidRuntime|has died|Scheduling restart|lowmemorykiller|Killing |Force stopping|force-stop'
    } | Select-Object -Last 80 | ForEach-Object { "$_".TrimEnd() }
    $h += "", "===== ${label}: process events ====="
    $h += A logcat -b events -d -v time | Where-Object { $_ -match 'am_proc_died|am_kill|am_crash|am_proc_start|am_low_memory' } |
        Select-Object -Last 60 | ForEach-Object { "$_".TrimEnd() }
    $h += "", "===== ${label}: kernel low-memory kills ====="
    $h += A shell dmesg | Where-Object { $_ -match 'lowmemorykiller|lowmem|oom' } | Select-Object -Last 30 | ForEach-Object { "$_".TrimEnd() }
    return $h
}

& $adb connect $Frame | Out-Null
if ((A get-state) -notmatch 'device') {
    Write-Host "Can't reach the frame at $Frame. Connect first: adb connect $Frame" -ForegroundColor Red
    exit 1
}

$log = @("Space Words back-to-photos diagnostics, $(Get-Date)")
$log += "===== memory ====="
$log += A shell cat /proc/meminfo | Select-Object -First 4 | ForEach-Object { "$_".TrimEnd() }
$log += Snapshot "1 photos showing"
$log += Get-FrameHistory "1 before the test (recent history)"

Write-Host ""
Write-Host "STEP 1: On the frame, tap the UFO to open Space Words." -ForegroundColor Yellow
Write-Host "        If the UFO is missing, type O and press Enter to open the game from here."
Write-Host "        When the 'Pick a mission' screen shows, press Enter here."
$answer = Read-Host
if ($answer -match '^[oO]') {
    $log += "", "===== game opened from the PC (UFO was missing) ====="
    A shell am start -n com.wordhop.app/.GameActivity | Out-Null
    Write-Host "Opening the game on the frame. When 'Pick a mission' shows, press Enter."
    Read-Host | Out-Null
}

$log += Snapshot "2 game open"
A logcat -c | Out-Null
A logcat -b events -c | Out-Null

Write-Host ""
Write-Host "STEP 2: Tap 'Back to photos' on the frame." -ForegroundColor Yellow
Write-Host "        Wait until the photos are showing again, then press Enter."
$t0 = Get-Date
Read-Host | Out-Null
$secs = [math]::Round(((Get-Date) - $t0).TotalSeconds)
$log += "", "===== about $secs s from STEP 2 prompt to Enter ====="

$log += Snapshot "3 back on photos"
$log += "", "===== ActivityManager log ====="
$log += A logcat -d -v time -s ActivityManager:I | Select-Object -Last 80 | ForEach-Object { "$_".TrimEnd() }
$log += "", "===== activity events ====="
$log += A logcat -b events -d -v time | Where-Object { $_ -match 'am_|wm_task' } |
    Select-Object -Last 80 | ForEach-Object { "$_".TrimEnd() }
$log += Get-FrameHistory "4 during the test"
Start-Sleep -Seconds 5
$log += Snapshot "5 five seconds later"
$log += "", "===== Skylight app log (last 60 lines) ====="
$log += A logcat -d -v time | Where-Object { $_ -match 'skylight' -and $_ -notmatch 'ActivityManager' } |
    Select-Object -Last 60 | ForEach-Object { "$_".TrimEnd() }

$log | Set-Content -Encoding UTF8 $out
try { ($log -join "`r`n") | Set-Clipboard } catch {}
Write-Host ""
Write-Host "Saved to $out and copied to the clipboard. Paste it into the chat." -ForegroundColor Green
