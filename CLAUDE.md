# Space Words: notes for Claude

Space/UFO reading games for a 5-year-old who reads above grade level. Runs on a Skylight
digital photo frame: a draggable floating UFO button over the Skylight slideshow opens a
"Pick a mission" picker. Stars per level live in localStorage.

- **Picture Planet** (picture-planet.html): picture words in 5 levels. Rounds: read the word and
  tap the picture, hear it and tap the word, spell it from letter tiles.
- **Sight Word Saucer** (saucer.html): all 220 Dolch words over 5 planets (Pre-primer to Grade 3).
  Rounds: hear a word and beam it up from look-alikes, fill-in-the-blank sentences (67 curated,
  each with its own distractors), look-cover-spell with a Peek button.

The owner is a controls engineer who is new to Android. Explain Android Studio and adb steps plainly.

## Target device: drives every technical decision
- Android 5.1.1 (API 22), userdebug build (`adb root` works), Rockchip, 1280x800 touchscreen.
- System WebView is **Chromium 39 (2014)**. Web code must stay **ES5**: no let/const, arrow
  functions, template literals, classes, Array.find/includes, Object.assign, fetch,
  NodeList.forEach. CSS: no variables, grid, gap, clamp(), min()/max(), env(); add -webkit-
  twins for animation, keyframes and transform. Flexbox is fine (with -webkit- prefixes).
  **Run `node tools/check-es5.js` after any web change.**
- No text-to-speech engine. Speech plays pre-recorded MP3s (see Speech below).
- Old emoji font, so pictures are bundled Twemoji SVGs in assets/www/emoji (CC-BY 4.0, credited).
- Skylight packages: `com.skylight` (main app) and `skylight.watchdog` (relaunches Skylight if it
  leaves the screen). Never disable or uninstall either without asking the owner.
- ADB over USB (serial 0123456789ABCDEF) or Wi-Fi at 192.168.1.242:5555 (persist.adb.tcp.port set;
  ro.adb.secure=0, so Wi-Fi adb needs no approval). On the owner's Windows PC adb is not on PATH:
  `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`. Cloud sessions cannot reach the frame.
  The owner deploys with `tools\deploy.ps1` (see README).

## Project
- Kotlin, no third-party dependencies. minSdk 22, targetSdk 33, compileSdk 34, AGP 8.5.2,
  Gradle 8.7 (needs JVM 21, not 25). The owner declined the AGP upgrade on purpose; don't upgrade.
- applicationId `com.wordhop.app`: never change it, or reinstalls lose her stars.
- `GameActivity.kt`: full-screen WebView serving assets/www/* from https://wordhop.local/ via
  shouldInterceptRequest. AndroidTTS JS bridge (used only if a TTS engine exists). "Back to photos"
  shows only on index.html and calls backToSkylight(), which launches com.skylight before
  finishing (a bare finish() leaves a black screen until the watchdog reacts). Back on a game
  returns to the picker.
- `BubbleService.kt`: floating UFO overlay (TYPE_PHONE below API 26), draggable, position saved,
  hidden while the games are open. `BootReceiver.kt` restarts it on boot and after an app update
  (MY_PACKAGE_REPLACED). `Compat.kt`: API helpers.
- `assets/www`: index.html (picker), picture-planet.html, saucer.html, speech.js, phrases.json,
  fonts/ (Andika subset, Fredoka SemiBold), emoji/, audio/.

## Speech
`speech.js` plays `audio/<key>.mp3` for keys listed in `audio/index.json`, falling back to TTS.
`phrases.json` maps every spoken key to its text (about 407). To add spoken text:
1. Add the key to `phrases.json` **and** to the embedded PHRASES copy in `speech.js`.
2. The owner re-runs `python tools\make_audio.py` on their PC (edge-tts, voice en-US-AvaNeural,
   rate -10%). It needs internet access to Microsoft's service, so it can't run in the cloud.
New keys without a clip stay silent on the frame until the clips are regenerated, so list
them for the owner.

The repo must stay **private**: the clips come from an unofficial Microsoft TTS client.

## Build and check
- `node tools/check-es5.js`: ES5 and Chromium 39 checks for all web code.
- `./gradlew assembleDebug`: APK at app/build/outputs/apk/debug/app-debug.apk.
- `./gradlew lintDebug`: Android lint.
- Cloud sessions: `.claude/hooks/session-start.sh` runs **in the background** at session start. It
  installs the Android SDK into ~/android-sdk and writes local.properties, which needs
  `dl.google.com` allowed in the cloud environment's network settings. Before building, read
  `~/.space-words-setup`: "running" means wait (re-check periodically); "done:" lines say whether
  the SDK is available. If it isn't, APK builds will fail; say so instead of claiming a build passed.
- Install on the frame, from the owner's PC: `adb install -r app\build\outputs\apk\debug\app-debug.apk`
  (`-r` keeps her stars).

## Git
Work directly on `master` unless parallel agents need extra branches.
