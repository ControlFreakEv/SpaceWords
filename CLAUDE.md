# Space Words: notes for Claude

Space/UFO reading games for a 5-year-old who reads above grade level. Runs on a Skylight
digital photo frame: a draggable floating UFO button over the Skylight slideshow opens a
"Pick a mission" picker. Stars per level live in localStorage.

- **Picture Planet** (picture-planet.html): picture words in 5 levels. Rounds: read the word and
  tap the picture, hear it and tap the word, spell it from letter tiles.
- **Sight Word Saucer** (saucer.html): all 220 Dolch words over 5 planets (Pre-primer to Grade 3).
  Rounds: hear a word and beam it up from look-alikes, fill-in-the-blank sentences (67 curated,
  each with its own distractors), look-cover-spell with a Peek button.
- **Math games** (math-game.html?g=count|ops|pattern): Star Count, Rocket Math, Alien Patterns.
  5 levels each, kindergarten starter to about 3rd grade; she's advanced, so keep the range wide.
  Choice rounds plus keypad rounds (3 misses reveal the answer). Stars: localStorage math:<g>:best.

- **Match games** (match.html?g=connect|rhyme): Connect the Pairs (word to picture, Picture
  Planet's word levels) and Rhyming Pairs (pairs tagged by sound; a board never has two pairs with
  the same sound). 5 levels x 5 boards of 3-5 pairs; lines drawn with inline SVG. Stars:
  localStorage match:<g>:best.

- **Sound Lab** (sound-lab.html): pronunciation. Word notation `[a]` short, `{a}` long (bar on
  top), `<e>` silent, `(ai)` vowel team, `^ar^` bossy R, `-` syllable break; vowel colors a red,
  e orange, i green, o blue, u purple. Levels: short vowels (vowel swap), magic e, vowel teams,
  syllables (sy_* clips are respellings, e.g. "ell uh fent"), bossy R. Stars: localStorage sound:best.
- **Compound Words** (compound.html): picture puzzles, match the halves, split it, build it, big
  words. PIC/MID/BIG lists of "first second"; KNOWN (all of them plus EXTRA real compounds) makes
  sure wrong choices never form a real word and match boards pair up one way only. Stars:
  localStorage compound:best.
- **Volume control** (speech.js, every page; the owner asked for it in place of "Talking: on/off"):
  fixed bottom-left on pickers and level lists, hidden in play (`body[data-screen=game|end]`, set by
  each page's show()). Levels 0 (off) to 6, default 5: 1-4 set the frame's media volume to 1/4..full,
  5-6 keep it full and add a LoudnessEnhancer boost of +6/+12 dB on each clip (GameActivity,
  `AndroidAudio.level()/setLevel()`, SharedPreferences "audio"). The frame's own volume is saved in
  onResume and restored in onPause, so Skylight's volume doesn't change. Level pages keep room with
  `.volroom`; hubs with body padding-bottom.
- **Tap any word to hear it** (all games): `Speech.tapText(text)` wraps words in
  `<span class="tw" data-say="key">`; one page-wide click handler in speech.js plays any element
  with `data-say`. Words map to w_*, numbers to n_*, + - x / = to m_*. Every tappable word needs a
  clip (web-test.js checks what it sees on screen). Answer choices are never tappable words.
- Don't store objects on DOM elements under names modern Chromium owns (`el.part` is a built-in
  there and silently breaks tests even though Chromium 39 doesn't have it).

Pickers: index.html (Word games / Math games) -> words.html or math.html -> game. Shared picker
look: hub.css/hub.js.

**One Back button everywhere** (the owner asked for this; keep it): a yellow "<- Back" pill, fixed
top-left (back.css, `id="backBtn"`), on every page and every screen (level list, game, end).
Each page defines `window.goBack()`: game/end screen -> level list -> picker (`<meta name="parent">`)
-> "Pick a mission" -> photos (`AndroidApp.backToPhotos()`, which calls backToSkylight()). The
Android Back key calls the same goBack(). New pages must include back.css, the button, and
goBack(); the first row of each screen leaves room with `.backroom` / `.barspace`. web-test.js
checks the button is in the identical spot on every screen.

The owner is a controls engineer who is new to Android. Explain Android Studio and adb steps plainly.

## Target device: drives every technical decision
- Android 5.1.1 (API 22), userdebug build (`adb root` works), Rockchip, 1280x800 touchscreen.
- System WebView is **Chromium 39 (2014)**. Web code must stay **ES5**: no let/const, arrow
  functions, template literals, classes, Array.find/includes, Object.assign, fetch,
  NodeList.forEach. CSS: no variables, grid, gap, clamp(), min()/max(), env(); add -webkit-
  twins for animation, keyframes and transform. Flexbox is fine (with -webkit- prefixes).
  **Run `node tools/check-es5.js` after any web change.**
- Speech plays pre-recorded MP3s (see Speech below). The frame has only the Pico TTS engine, which
  the app starts only when clips are missing (`AndroidTTS.enable()`), to keep it off the low-RAM frame.
- Old emoji font, so pictures are bundled Twemoji SVGs in assets/www/emoji (CC-BY 4.0, credited).
- Skylight packages: `com.skylight` (main app) and `skylight.watchdog` (relaunches Skylight if it
  leaves the screen). Never disable or uninstall either without asking the owner.
- ADB over USB (serial 0123456789ABCDEF) or Wi-Fi at 192.168.1.242:5555 (persist.adb.tcp.port set;
  ro.adb.secure=0, so Wi-Fi adb needs no approval). On the owner's Windows PC adb is not on PATH:
  `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`. Cloud sessions cannot reach the frame.
  The owner deploys with `tools\deploy.ps1` (see README).
- **The firmware kills the previous app whenever another app comes to the front** (low-RAM
  policy): Skylight dies when the game opens (so "Back to photos" cold-starts it, about 7 s), and
  the game's process dies 2 ms after its onPause ("user request after error", counted as a crash).
  That is why BubbleService and BootReceiver run in their own process (`:ufo`); GameActivity
  shows/hides the UFO with ACTION_SHOW/ACTION_HIDE intents (`showBubble()` in Compat.kt), and
  the service re-shows itself if the game process is no longer in front.
- `ro.config.low_ram=true`. On 2026-10-05 the old build froze on "Back to photos" and Android
  silently killed it ("user request after error": the frame shows no ANR dialog), which explains
  both the long black screen and the vanished UFO. Prime suspect: WebView's media player stuck
  retrying https://wordhop.local clips (RockFFPlayer "Failed to resolve hostname"); fixed by native
  clip playback and lazy TTS. diagnose-back.ps1 now saves data_app_anr and traces.txt to confirm.
- **The frame blocks background starts** of Space Words (and the Gallery app): BOOT_COMPLETED and
  MY_PACKAGE_REPLACED fail with "process is bad" although nothing crashed and Android's bad-process
  list is empty, so it looks like a vendor rule. Starting it from the foreground works (am start, or
  `am startservice` from adb, which deploy.ps1 uses). `tools\inspect-autostart.ps1` gathers clues. `tools\diagnose-back.ps1` captures the
  frame's task stack, processes, UFO service/window state and kill/crash logs for debugging.

## Project
- Kotlin, no third-party dependencies. minSdk 22, targetSdk 33, compileSdk 34, AGP 8.5.2,
  Gradle 8.7 (needs JVM 21, not 25). The owner declined the AGP upgrade on purpose; don't upgrade.
- applicationId `com.wordhop.app`: never change it, or reinstalls lose her stars.
- `GameActivity.kt`: full-screen WebView serving assets/www/* from https://wordhop.local/ via
  shouldInterceptRequest. AndroidTTS JS bridge (used only if a TTS engine exists). Back on
  "Pick a mission" calls backToSkylight() through the AndroidApp bridge; it launches com.skylight
  before finishing (a bare finish() leaves a black screen until the watchdog reacts).
- `BubbleService.kt`: floating UFO overlay (TYPE_PHONE below API 26), draggable, position saved,
  hidden while the games are open. `BootReceiver.kt` restarts it on boot and after an app update
  (MY_PACKAGE_REPLACED). `Compat.kt`: API helpers.
- `assets/www`: index.html (picker), picture-planet.html, saucer.html, speech.js, phrases.json,
  fonts/ (Andika subset, Fredoka SemiBold), emoji/, audio/.

## Speech
`speech.js` plays `audio/<key>.mp3` for keys listed in `audio/index.json`, falling back to TTS.
On the frame, clips play natively through the `AndroidAudio` bridge (GameActivity, MediaPlayer):
Chromium 39 hands `<audio>` to Android's MediaPlayer, which bypasses shouldInterceptRequest, so
web audio from https://wordhop.local is silent there. mp3s are kept uncompressed in the APK.
`phrases.json` maps every spoken key to its text (about 1,020; numbers are n_0..n_100, math prompts
m_*). To add spoken text:
1. Add the key to `phrases.json`, then run `python3 tools/sync_phrases.py` to update speech.js.
   Every round reads its instructions aloud (i_* keys in the word games, R.say in math).
2. The owner re-runs `python tools\make_audio.py` on their PC (edge-tts, voice en-US-AvaNeural,
   rate -10%). It needs internet access to Microsoft's service, so it can't run in the cloud.
New keys without a clip stay silent on the frame until the clips are regenerated, so list
them for the owner.

The repo must stay **private**: the clips come from an unofficial Microsoft TTS client.

## Build and check
- `node tools/check-es5.js`: ES5 and Chromium 39 checks for all web code.
- `node tools/web-test.js [shot-dir]`: plays every math, match, Sound Lab and Compound Words level in headless Chromium at 1280x800,
  checks generated questions and speech keys, optional screenshots. Modern Chromium, so run
  check-es5 too. `python3 tools/sync_phrases.py --check`: speech.js matches phrases.json.
- PowerShell scripts can be syntax-checked with a portable pwsh (GitHub release tarball).
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
