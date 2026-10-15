<#
  Everything in one go: get the latest code, record any new voice clips, build the app, and
  install it on the frame.

  Easiest: double-click update.bat in the SpaceWords folder.
  Or from a terminal in the SpaceWords folder:
      powershell -ExecutionPolicy Bypass -File tools\update.ps1

  The Android app for other phones and tablets (android-app.bat):
      powershell -ExecutionPolicy Bypass -File tools\update.ps1 -AndroidApp
  does steps 1-3 for that app instead and leaves SpaceWords-Android.apk in the SpaceWords folder
  (the frame isn't touched).

  Options:
      -Open        open the games on the frame afterwards
      -SkipAudio   don't record voice clips (faster, when you know nothing new was added)
      -Frame 192.168.1.50:5555   a different frame address
      -JavaHome "C:\path\to\jdk"  use this Java for the build (must be Java 17 to 21)
#>
param(
    [string]$Frame = "192.168.1.242:5555",
    [string]$JavaHome = "",
    [switch]$Open,
    [switch]$SkipAudio,
    [switch]$AndroidApp
)

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$isWin = ($env:OS -eq "Windows_NT")

function Step([string]$n, [string]$text) { Write-Host ""; Write-Host "== Step $n of 4: $text ==" -ForegroundColor Cyan }
function Stop-With([string]$why, [string]$fix) {
    Write-Host ""
    Write-Host "Stopped: $why" -ForegroundColor Red
    if ($fix) { Write-Host $fix }
    exit 1
}

# git needs a name for the voice clip uploads (step 2) and to put them on top of new code; use this
# one if none is set on this PC
$gitWho = @()
if (-not (& git config user.email)) { $gitWho = @("-c", "user.name=Space Words update", "-c", "user.email=update@spacewords.local") }

# 1. Latest code from GitHub
Step 1 "Get the latest code (git pull)"
# Two things on this PC change by themselves and would block the update: Android Studio's settings
# (.idea) and the voice clip list (audio\index.json, which step 2 writes again anyway). Put them back.
& git checkout -- .idea "app/src/main/assets/www/audio/index.json" 2>$null
& git pull --ff-only
if ($LASTEXITCODE -ne 0) {
    # Voice clips saved here last time but not uploaded (step 2) while new code arrived on GitHub:
    # put the clips on top of the new code.
    & git @gitWho pull --rebase 2>$null
    if ($LASTEXITCODE -ne 0) { & git rebase --abort 2>$null; $global:LASTEXITCODE = 1 }
}
if ($LASTEXITCODE -ne 0) {
    # Still blocked: files here differ from GitHub (copied in by hand, or edited). All the code comes
    # from GitHub, so offer to make the folder match it. Recorded voice clips aren't touched.
    & git fetch origin
    if ($LASTEXITCODE -ne 0) { Stop-With "Couldn't reach GitHub." "Check the internet (or the GitHub sign-in) and run this again." }
    Write-Host ""
    Write-Host "Some files in this folder don't match GitHub (listed above), so git won't update them." -ForegroundColor Yellow
    Write-Host "All the code comes from GitHub, so the fix is to make this folder match it." -ForegroundColor Yellow
    Write-Host "Your recorded voice clips are kept." -ForegroundColor Yellow
    $answer = Read-Host "Make this folder match GitHub? Type Y and press Enter"
    if ($answer -notmatch '^[Yy]') { Stop-With "Update cancelled; nothing was changed." "" }
    & git reset --hard '@{u}'
    if ($LASTEXITCODE -ne 0) { Stop-With "Couldn't make the folder match GitHub." "Tell Claude what it printed." }
}

# 2. Voice clips (only records the ones that are missing, so it's quick when nothing is new)
# New clips are uploaded to GitHub (the repo is private), so builds made elsewhere, like Claude's in
# the cloud, have the whole voice too. If the upload fails the update carries on; it's tried again next time.
function Save-Clips {
    $audio = "app/src/main/assets/www/audio"
    & git add -- $audio
    & git diff --cached --quiet -- $audio
    if ($LASTEXITCODE -eq 0) { Write-Host "The voice clips on GitHub are up to date."; return }
    $n = @(& git diff --cached --name-only -- $audio).Count
    & git @gitWho commit -q -m "Voice clips: $n new or changed files (recorded by update.ps1)" -- $audio
    if ($LASTEXITCODE -ne 0) { Write-Host "  (couldn't save the voice clips for GitHub; carrying on)" -ForegroundColor Yellow; return }
    Write-Host "Uploading $n voice clip files to GitHub (the first time takes a few minutes)..."
    & git push -q 2>$null
    if ($LASTEXITCODE -ne 0) {
        # GitHub got new code while the clips were recording: put the clips on top and try once more
        & git @gitWho pull --rebase -q
        if ($LASTEXITCODE -eq 0) { & git push -q } else { & git rebase --abort 2>$null; $global:LASTEXITCODE = 1 }
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Couldn't upload the voice clips to GitHub. They're saved on this PC and will be uploaded next time; the update carries on." -ForegroundColor Yellow
    } else { Write-Host "Voice clips uploaded." }
}
if ($SkipAudio) {
    Write-Host ""; Write-Host "== Step 2 of 4: voice clips skipped (-SkipAudio) ==" -ForegroundColor DarkGray
} else {
    Step 2 "Record any new voice clips"
    $py = Get-Command python -ErrorAction SilentlyContinue
    if (-not $py) { $py = Get-Command python3 -ErrorAction SilentlyContinue }
    if (-not $py) { Stop-With "Python isn't installed (or isn't on PATH)." "Install it from python.org (tick 'Add python.exe to PATH'), then run: pip install edge-tts" }
    # Microsoft changes its voice service now and then and old edge-tts versions get refused (403),
    # so keep edge-tts up to date (quick when it already is).
    Write-Host "Checking the voice recorder (edge-tts) is up to date..."
    & $py.Source -m pip install --upgrade --quiet --disable-pip-version-check edge-tts
    if ($LASTEXITCODE -ne 0) { Write-Host "  (couldn't update edge-tts; trying with the one installed)" -ForegroundColor Yellow }
    & $py.Source tools\make_audio.py
    $recorded = $LASTEXITCODE
    Save-Clips   # whatever was recorded, even if some clips failed
    if ($recorded -ne 0) {
        Stop-With "Recording voice clips failed." "Read the lines just above for why. If it says 'pip install edge-tts', run that once. If clips failed to download, check the internet and run this again (finished clips are kept). To build without the new clips: double-click update.bat again after adding -SkipAudio (or run: powershell -ExecutionPolicy Bypass -File tools\update.ps1 -SkipAudio)"
    }
}

# 3. Build the APK (the same build as Android Studio's Generate APKs)
# :app is the frame's app; :home is Space Words for other phones and tablets (-AndroidApp).
$task = if ($AndroidApp) { ":home:assembleDebug" } else { ":app:assembleDebug" }
Step 3 $(if ($AndroidApp) { "Build the app for other phones and tablets" } else { "Build the app" })

# Gradle 8.7 runs on Java 17 to 21 only (on Java 25 it fails with just "25.0.3").
# Find one: Android Studio's built-in Java first, then other installed JDKs.
function Java-Major([string]$jdk) {
    if (-not $jdk -or -not (Test-Path (Join-Path $jdk "bin\java.exe"))) { return 0 }
    $rel = Join-Path $jdk "release"
    $v = $null
    if (Test-Path $rel) {
        $m = Select-String -Path $rel -Pattern 'JAVA_VERSION="([0-9._]+)' | Select-Object -First 1
        if ($m) { $v = $m.Matches[0].Groups[1].Value }
    }
    if (-not $v) {
        $out = (& (Join-Path $jdk "bin\java.exe") -version 2>&1 | Out-String)
        if ($out -match 'version "([0-9._]+)') { $v = $Matches[1] }
    }
    if (-not $v) { return 0 }
    $parts = $v.Split(".")
    if ($parts[0] -eq "1") { return [int]$parts[1] }   # 1.8 = Java 8
    return [int]$parts[0]
}
function Find-Java {
    $c = New-Object System.Collections.Generic.List[string]
    if ($JavaHome) { $c.Add($JavaHome) }
    foreach ($key in "HKLM:\SOFTWARE\Android Studio", "HKCU:\SOFTWARE\Android Studio", "HKLM:\SOFTWARE\WOW6432Node\Android Studio") {
        $p = (Get-ItemProperty -Path $key -Name Path -ErrorAction SilentlyContinue).Path
        if ($p) { $c.Add((Join-Path $p "jbr")); $c.Add((Join-Path $p "jre")) }
    }
    foreach ($base in "$env:ProgramFiles\Android", "${env:ProgramFiles(x86)}\Android", "$env:LOCALAPPDATA\Programs", "$env:LOCALAPPDATA\Google") {
        if (Test-Path $base) {
            Get-ChildItem $base -Directory -Filter "Android Studio*" -ErrorAction SilentlyContinue | ForEach-Object { $c.Add((Join-Path $_.FullName "jbr")); $c.Add((Join-Path $_.FullName "jre")) }
        }
    }
    $tb = "$env:LOCALAPPDATA\JetBrains\Toolbox\apps"
    if (Test-Path $tb) {
        Get-ChildItem $tb -Recurse -Directory -Filter "jbr" -Depth 4 -ErrorAction SilentlyContinue | ForEach-Object { $c.Add($_.FullName) }
    }
    if ($env:JAVA_HOME) { $c.Add($env:JAVA_HOME) }
    foreach ($base in "$env:ProgramFiles\Java", "$env:ProgramFiles\Eclipse Adoptium", "$env:ProgramFiles\Microsoft", "$env:ProgramFiles\Zulu", "$env:ProgramFiles\Amazon Corretto", "$env:USERPROFILE\.jdks") {
        if (Test-Path $base) { Get-ChildItem $base -Directory -ErrorAction SilentlyContinue | ForEach-Object { $c.Add($_.FullName) } }
    }
    foreach ($jdk in $c) {
        $major = Java-Major $jdk
        if ($major -ge 17 -and $major -le 21) { return @($jdk, $major) }
    }
    return $null
}

if ($isWin) {
    $found = Find-Java
    if (-not $found) {
        Stop-With "Couldn't find Java 17 to 21 for the build (Java 25 is too new for this project's Gradle)." ("In Android Studio: File > Settings > Build, Execution, Deployment > Build Tools > Gradle shows the 'Gradle JDK' folder. " +
            "Run this again with that folder:  powershell -ExecutionPolicy Bypass -File tools\update.ps1 -JavaHome ""C:\that\folder""")
    }
    $env:JAVA_HOME = $found[0]
    $env:Path = (Join-Path $found[0] "bin") + ";" + $env:Path
    Write-Host "Using Java $($found[1]): $($found[0])"
    # a Gradle background process left over from another Java can get in the way; stop it quietly
    & (Join-Path $root "gradlew.bat") --stop *> $null
    # Gradle needs to know where the Android SDK is.
    if (-not (Test-Path (Join-Path $root "local.properties"))) {
        $sdk = (Join-Path $env:LOCALAPPDATA "Android\Sdk") -replace '\\', '\\' -replace ':', '\:'
        Set-Content -Encoding ASCII (Join-Path $root "local.properties") "sdk.dir=$sdk"
    }
    & (Join-Path $root "gradlew.bat") $task
} else {
    & (Join-Path $root "gradlew") $task
}
if ($LASTEXITCODE -ne 0) {
    Stop-With "The build failed." "Copy the red error lines above and send them to Claude. (If Android Studio is building at the same moment, wait for it and run this again.)"
}

# 4. The app for other phones and tablets: put it where it's easy to find and send
if ($AndroidApp) {
    Step 4 "Copy the app for other phones and tablets"
    $apk = Join-Path $root "SpaceWords-Android.apk"
    Copy-Item (Join-Path $root "home\build\outputs\apk\debug\home-debug.apk") $apk -Force
    Write-Host ""
    Write-Host "All done: $apk" -ForegroundColor Green
    Write-Host "Send that file to the other phone or tablet (email, Google Drive, a USB cable) and tap it there to install."
    Write-Host "Android asks once to allow installing apps from that place (Files, Gmail, Drive...): allow it."
    Write-Host "To update it later, run this again and install the new file over the old one: the stars are kept."
    exit 0
}

# 4. Install on the frame
Step 4 "Install on the frame"
$deployArgs = @{ Frame = $Frame }
if ($Open) { $deployArgs.Open = $true }
& (Join-Path $PSScriptRoot "deploy.ps1") @deployArgs
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "All done. The frame has the latest Space Words." -ForegroundColor Green
