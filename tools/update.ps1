<#
  Everything in one go: get the latest code, record any new voice clips, build the app, and
  install it on the frame.

  Easiest: double-click update.bat in the SpaceWords folder.
  Or from a terminal in the SpaceWords folder:
      powershell -ExecutionPolicy Bypass -File tools\update.ps1

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
    [switch]$SkipAudio
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

# 1. Latest code from GitHub
Step 1 "Get the latest code (git pull)"
# Two things on this PC change by themselves and would block the update: Android Studio's settings
# (.idea) and the voice clip list (audio\index.json, which step 2 writes again anyway). Put them back.
& git checkout -- .idea "app/src/main/assets/www/audio/index.json" 2>$null
& git pull --ff-only
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
    if ($LASTEXITCODE -ne 0) {
        Stop-With "Recording voice clips failed." "Read the lines just above for why. If it says 'pip install edge-tts', run that once. If clips failed to download, check the internet and run this again (finished clips are kept). To build without the new clips: double-click update.bat again after adding -SkipAudio (or run: powershell -ExecutionPolicy Bypass -File tools\update.ps1 -SkipAudio)"
    }
}

# 3. Build the APK (the same build as Android Studio's Generate APKs)
Step 3 "Build the app"

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
    & (Join-Path $root "gradlew.bat") assembleDebug
} else {
    & (Join-Path $root "gradlew") assembleDebug
}
if ($LASTEXITCODE -ne 0) {
    Stop-With "The build failed." "Copy the red error lines above and send them to Claude. (If Android Studio is building at the same moment, wait for it and run this again.)"
}

# 4. Install on the frame
Step 4 "Install on the frame"
$deployArgs = @{ Frame = $Frame }
if ($Open) { $deployArgs.Open = $true }
& (Join-Path $PSScriptRoot "deploy.ps1") @deployArgs
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "All done. The frame has the latest Space Words." -ForegroundColor Green
