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
    # brightness and sleep: Skylight's window settings (sbrt= brightness, KEEP_SCREEN_ON) and what the screen uses
    $s += "===== ${label}: screen brightness / sleep ====="
    $s += A shell dumpsys power | Where-Object { $_ -match 'mWakefulness=|mScreenBrightnessSetting|mScreenBrightnessOverrideFromWindowManager|mScreenOffTimeoutSetting|mStayOn|mUserActivityTimeoutOverride|SCREEN_BRIGHT_WAKE_LOCK|mHoldingDisplaySuspendBlocker' } | ForEach-Object { "$_".TrimEnd() }
    $s += "screen_off_timeout=$(A shell settings get system screen_off_timeout) brightness=$(A shell settings get system screen_brightness) auto=$(A shell settings get system screen_brightness_mode)"
    $s += $win | Where-Object { $_ -match 'Window #.*skylight' -or ($_ -match 'mAttrs=' -and $_ -match 'skylight') } | ForEach-Object { "$_".TrimEnd() }
    return $s
}

function Get-CrashReports {
    # Android keeps app crash and freeze ("not responding") reports on disk ("dropbox"),
    # so they survive reboots.
    $c = @()
    foreach ($tag in "data_app_crash", "data_app_anr") {
        $c += "", "===== Space Words $tag reports (saved on the frame, newest last) ====="
        $box = @(A shell dumpsys dropbox --print $tag | ForEach-Object { "$_".TrimEnd() })
        $starts = @()
        for ($i = 0; $i -lt $box.Count; $i++) { if ($box[$i] -match '^Process: com\.wordhop\.app') { $starts += $i } }
        if ($starts.Count -eq 0) { $c += "(none found)" }
        foreach ($st in ($starts | Select-Object -Last 2)) {
            $c += "-----"
            $from = [math]::Max($st - 2, 0)
            $to = [math]::Min($st + 70, $box.Count - 1)
            for ($k = $from; $k -le $to; $k++) {
                if ($k -gt $st -and $box[$k] -match '^={10,}') { break }
                $c += $box[$k]
            }
        }
    }
    # The last freeze's thread dump: what the app's main thread was stuck on.
    $c += "", "===== last freeze: Space Words main thread (/data/anr/traces.txt) ====="
    $tr = @(A shell cat /data/anr/traces.txt | ForEach-Object { "$_".TrimEnd() })
    $found = $false
    for ($i = 0; $i -lt $tr.Count -and -not $found; $i++) {
        if ($tr[$i] -match '^Cmd line: com\.wordhop\.app') {
            if ($i -gt 0) { $c += $tr[$i - 1] }
            for ($j = $i; $j -lt $tr.Count; $j++) {
                if ($tr[$j] -match '^"main"') {
                    for ($k = $j; $k -lt [math]::Min($j + 60, $tr.Count); $k++) { if ($tr[$k] -eq "") { break }; $c += $tr[$k] }
                    break
                }
            }
            $found = $true
        }
    }
    if (-not $found) { $c += "(none found)" }
    $c += "", "===== crash log buffer ====="
    $c += A logcat -b crash -d -v time | Select-Object -Last 80 | ForEach-Object { "$_".TrimEnd() }
    $c += "", "===== processes Android has marked bad ====="
    $c += A shell dumpsys activity processes | Where-Object { $_ -match 'Bad process|crashed at|wordhop.*bad' } | ForEach-Object { "$_".TrimEnd() }
    return $c
}

function Get-FrameHistory([string]$label) {
    $h = @("", "===== ${label}: app deaths, crashes, restarts =====")
    $h += A logcat -d -v time | Where-Object {
        $_ -match 'wordhop|SpaceWords|FATAL|AndroidRuntime|has died|crashed too many|Scheduling restart|lowmemorykiller|Killing |Force stopping|force-stop'
    } | Select-Object -Last 80 | ForEach-Object { "$_".TrimEnd() }
    $h += "", "===== ${label}: process events ====="
    $h += A logcat -b events -d -v time | Where-Object { $_ -match 'am_proc_died|am_kill|am_crash|am_proc_bad|am_process_crashed_too_much|am_proc_start|am_low_memory' } |
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
$log += Get-CrashReports

$ufoRunning = (A shell ps | Where-Object { $_ -match 'com\.wordhop\.app' }).Count -gt 0
Write-Host ""
if ($ufoRunning) {
    Write-Host "STEP 1: On the frame, tap the UFO to open Space Words." -ForegroundColor Yellow
    Write-Host "        (If you can't see the UFO, type O and press Enter to open the game from here.)"
    Write-Host "        When the 'Pick a mission' screen shows, press Enter here."
} else {
    Write-Host "STEP 1: Space Words isn't running on the frame, so the UFO is gone." -ForegroundColor Yellow
    Write-Host "        Opening the game on the frame for you now..."
}
$answer = if ($ufoRunning) { Read-Host } else { "o" }
if ($answer -match '^[oO]') {
    $log += "", "===== game opened from the PC ====="
    $log += A shell am startservice -n com.wordhop.app/.BubbleService -a com.wordhop.app.OPEN_GAME | ForEach-Object { "$_".TrimEnd() }
    Write-Host "Opening the game on the frame. When 'Pick a mission' shows, press Enter."
    Read-Host | Out-Null
}
# The games are a full-screen floating window now, not an activity.
$gameUp = (A shell dumpsys window windows | Where-Object { $_ -match 'fillxfill.*packageName=com\.wordhop\.app' }).Count -gt 0
if (-not $gameUp) {
    $log += "", "===== WARNING: the game was not on screen after STEP 1 ====="
    Write-Host "The game doesn't seem to be on screen. Carrying on so the log still gets saved." -ForegroundColor Red
}

$log += Snapshot "2 game open"
$log += Get-FrameHistory "2 while the game opened"
A logcat -c | Out-Null
A logcat -b events -c | Out-Null
A logcat -b crash -c | Out-Null

Write-Host ""
Write-Host "STEP 2: Tap 'Back to photos' on the frame." -ForegroundColor Yellow
Write-Host "        Wait until the photos are showing again, then press Enter."
$t0 = Get-Date
Read-Host | Out-Null
$secs = [math]::Round(((Get-Date) - $t0).TotalSeconds)
$log += "", "===== about $secs s from STEP 2 prompt to Enter ====="

$log += Snapshot "3 back on photos"
$log += "", "===== ActivityManager log ====="
$log += A logcat -d -v time | Where-Object { $_ -match 'ActivityManager' } | Select-Object -Last 80 | ForEach-Object { "$_".TrimEnd() }
$log += "", "===== activity events ====="
$log += A logcat -b events -d -v time | Where-Object { $_ -match 'am_|wm_task' } |
    Select-Object -Last 80 | ForEach-Object { "$_".TrimEnd() }
$log += Get-FrameHistory "4 during the test"
$log += "", "===== crashes during the test ====="
$log += A logcat -b crash -d -v time | Select-Object -Last 80 | ForEach-Object { "$_".TrimEnd() }
Start-Sleep -Seconds 5
$log += Snapshot "5 five seconds later"
$log += "", "===== Skylight app log (last 60 lines) ====="
$log += A logcat -d -v time | Where-Object { $_ -match 'skylight' -and $_ -notmatch 'ActivityManager' } |
    Select-Object -Last 60 | ForEach-Object { "$_".TrimEnd() }

$log | Set-Content -Encoding UTF8 $out
try { ($log -join "`r`n") | Set-Clipboard } catch {}
Write-Host ""
Write-Host "Saved to $out and copied to the clipboard. Paste it into the chat." -ForegroundColor Green
