# Space Words: notes for Claude

Space/UFO reading games for a 5-year-old who reads above grade level. Runs on a Skylight
digital photo frame: a draggable floating UFO button over the Skylight slideshow opens a
"Pick a mission" picker. Stars per level live in localStorage.

- **Picture Planet** (picture-planet.html): picture words in 5 levels (34/45/56/102/53 words). Rounds: read the word and
  tap the picture, hear it and tap the word, spell it from letter tiles.
- **Sight Word Saucer** (saucer.html): all 220 Dolch words over 5 planets (Pre-primer to Grade 3).
  Rounds: hear a word and beam it up from look-alikes, fill-in-the-blank sentences (220 curated,
  one per word, each with its own distractors), look-cover-spell with a Peek button.
- **Math games** (math-game.html?g=count|ops|pattern): Star Count, Rocket Math, Alien Patterns.
  5 levels each, kindergarten starter to about 3rd grade; she's advanced, so keep the range wide.
  Choice rounds plus keypad rounds (3 misses reveal the answer). Stars: localStorage math:<g>:best.
  Alien Patterns rounds carry `rule` {kind, steps, html, say} (Brain busters: 12 rule kinds, numbers
  to 999 said via numSay, web-test.js rebuilds each sequence from its kind): after a right (or revealed) answer the
  step labels between the numbers appear (+3, x2...), a "Rule:" line shows, and it is said
  ("The rule is plus three"). Math rounds move on after the voice finishes (Speech.say done).
  Rocket Math + and - with any 2-digit number (Facts to 20, Big numbers) are stacked (colHtml):
  digits in fixed-width cells, ones under ones, tens under tens (colored green / yellow / pink by
  place), the answer box under the line; setEntry() keeps typed and revealed answers in columns.
  Picture rounds and missing-number rounds stay in a line.
  Adding with a carry (a 2-digit number and the ones make 10+; needsCarry) is a "steps" round in 2
  parts (carryRound): "Add the ones" (choices; the ones digit is written and a pink carried 1 pops
  up over the tens), then "Add the tens: 1 + ..." ; a dashed band marks the column being added.
  R.step / R.busy; web-test.js plays steps rounds part by part. Subtraction borrowing isn't shown yet.

- **Match games** (match.html?g=connect|rhyme): Connect the Pairs (word to picture, Picture
  Planet's word levels) and Rhyming Pairs (42/80/84/85/81 pairs per level, tagged by sound; a
  board never has two pairs with the same sound). 5 levels x 5 boards of 3-5 pairs; lines drawn with inline SVG. Stars:
  localStorage match:<g>:best.

- **Sound Lab** (sound-lab.html): pronunciation. Word notation `[a]` short, `{a}` long (bar on
  top), `<e>` silent, `(ai)` vowel team, `^ar^` bossy R, `-` syllable break; vowel colors a red,
  e orange, i green, o blue, u purple. Levels: short vowels (vowel swap), magic e, vowel teams,
  syllables (sy_* clips are respellings, e.g. "ell uh fent"), bossy R. Lists: 72 swap frames, 83 CVC,
  46 magic e pairs, 98 vowel teams, 68 bossy R, 129 syllable words (web-test.js checks repeats, notation, clips).
  Stars: localStorage sound:best.
  Each syllable clip must say the syllable *as shown*, split the same way (ba-na-na = "bah nah nuh",
  not the dictionary "buh NAN uh"); web-test.js checks every clip starts like its syllable.
- `Speech.say(keys, done)`: done runs once after the last clip (not if interrupted). Look-then-spell rounds
  (Saucer, Class Words "Spell it") hide the word from done (at least ~3 s of looking), not a fixed
  timer, which cut the word off. Rhyming Pairs says the tapped word and the praise in one say(). Rounds that
  say several clips (Sound Lab, Compound Words) move on from done, with a long timer only as a
  safety net; a fixed short timer cut the voice off mid-word.
- **Word Search** (wordsearch.html; last card in Word games): letter grids hiding Picture Planet's
  words (same pictures; too-long words and palindromes left out). 5 levels: 5x5 across, 6x6 + down,
  7x7 + slants, 8x8 + backwards, 10x10 every way (3-7 words); 3 puzzles a level, a star each if at
  most 1 miss and no Hint. Find a word by dragging along it or tapping its first then last letter
  (lines snap to 45 degrees). makePuzzle re-rolls until every word appears exactly once in all 8
  directions and no RUDE word shows up by chance (no q/x/z filler). Hint flashes a first letter and
  says "Look for <word>". Stars: localStorage search:best.
  Now and then (ASK_RATE 0.35, at most 2 a puzzle, never the last word, never slanted words) a find
  brings "Which way does <word> go?" in place of the word list: 4 arrow buttons around its picture,
  half the time left/right/up/down, half north/south/east/west ("North is up, like on a map"); the
  word's first letter is ringed pink. 2 wrong taps show the answer; not counted for stars.
  WordSearch.askRate(r) in tests.
- **Compound Words** (compound.html): picture puzzles, match the halves, split it, build it, big
  words. PIC/MID/BIG lists of "first second" (84/112/88, NOT 80 distractors); KNOWN (all of them
  plus EXTRA real compounds) makes sure wrong choices never form a real word and match boards pair
  up one way only. Stars: localStorage compound:best.
- **Class Words** (class-words.html; first card in Word games): her kindergarten class handout
  "Support Reading at Home": 69 high-frequency words to read and write by year end, in the
  handout's order (the first two, "I" and "a", were under a crayon scribble in the photo; check with
  the owner if unsure). Activities map to the handout's ideas: Find it, Fill the blank (curated
  distractors that can't fit), Teach Zib (alien reads, sometimes wrong = "Teach a Toy"), Word hunt
  (mail/sign/cereal box), Spell it, Rainbow write (finger tracing on canvas, scored on the middle band of each stroke,
  >=55% of max stroke depth, with a hit radius of 0.75x the drawn line width: 75% overall AND every
  ~12%-of-height square at least half traced. An I missing a bar fails; a whole word traced up to
  about a line-width off-centre passes. web-test.js checks both. The guide word is its own canvas
  under the ink, so the Eraser (2x line width, destination-out) rubs out ink and its credit only.
  The rainbow swatch (default) draws shimmering ink: strokes go into an offscreen mask and a top
  canvas paints a sliding rainbow + a sweep of light through it (~25 fps, only while rainbow ink is
  on screen); solid colors stay on their own canvas until the word is done, then all of it shimmers), Roll &
  read (die + silly voices), Car time (say a sentence). Mission = 8 mixed rounds ("short + fun").
  Words take turns by themselves (the owner doesn't want to pick words): every mission draws from all
  69 by weight = (0.4 + 3 x missRate) x staleness, missRate = first-try misses smoothed toward 1/2,
  staleness grows with missions since the word was last played (wordsFor, weight). So missed words
  come back more, known ones less, and all keep cycling. localStorage classwords:stats {ok, miss, last}
  / missions / best (the old weekly plan is gone). Home shows "Tricky words" (tricky(): missed twice
  and ~half the time, or missed and never right); Grown-ups (hold) is a read-only progress list.
  ClassWords.plan().week is a tests-only override. Sentences: cs_<word> clips.
  Home's "Tricky words" box (#weekChips) has a fixed height: fitWeek() shrinks the chips (7 -> 3.6vmin)
  and past that folds the last ones into "+N more" (opens the word wall). Runs from show("home") too, since renderHome runs while home is hidden.
- **Silly voices**: `Speech.say(keys, done, speed)`; on the frame `AndroidAudio.playRate()` plays
  through SoundPool (speed and pitch 0.5-2.0; MediaPlayer can't before Android 6). No volume
  boost on those. Zib speaks at 1.35.
- **Turtle toggle** (owner's request; the rabbit was dropped): `Speech.turtleButton(wordKey)` next
  to "Hear it" in Picture Planet / Saucer and next to the speaker in Sound Lab, Compound Words and
  Class Words. On/off, remembered (localStorage speech:slow). While on, every w_ key said at normal
  speed plays slowly: ws_<word> (its own clip recorded at -45% by make_audio.py; every w_ key has a
  ws_ twin) or, if missing, the word at 0.7x. Instructions, sentences, praise and silly voices are
  never slowed (the speech queue carries a rate per clip).
- **Volume control** (speech.js, every page; the owner asked for it in place of "Talking: on/off"):
  fixed top-right (level with the Back button, smaller) on pickers and level lists, hidden in play
  (`body[data-screen=game|end]`, set by each page's show()). The first row (`.backroom`) gets
  padding-right 40vmin there; web-test.js checks nothing overlaps it on all 12 screens. Levels 0 (off) to 6, default 5: 1-4 set the frame's media volume to 1/4..full,
  5-6 keep it full and add a LoudnessEnhancer boost of +6/+12 dB on each clip (GameActivity,
  `AndroidAudio.level()/setLevel()`, SharedPreferences "audio"). The frame's own volume is saved when
  the game window opens and restored when it closes, so Skylight's volume doesn't change.
- **Instructions button**: every round of every game shows its instruction with a yellow speaker
  button (`.hintrow` + `.sayb`) that says it again; web-test.js checks every round has one. In
  Picture Planet's "read the word, tap the picture" it says only the instruction (the word is the answer).
- **Turn timer** (the owner's son plays too): on Pick a mission (#turnbar), - / + pick 1-30 minutes
  (TURN_CHOICES, remembered as speech:turnMin, default 5), then "Start a N-minute turn".
  The countdown lives natively in TurnTimer.kt (:ufo process; AndroidApp.turnStart/turnLeft/turnStop,
  left -1 = ran out, popup not dismissed), so it runs across pages and over the photos; when it runs
  out BubbleService opens the game window if it's closed. speech.js (every page) polls it each second:
  a countdown pill (in play under the stars, top right; on pickers/level lists just left of the volume
  control, the top row gets padding-right 67vmin while it runs) and the "Switch turns!" popup (Next
  turn / All done; the Back key closes it via Turns.back()). Browser fallback: localStorage
  speech:turnEnd. Said: p_your_turn, n_<min>, p_minutes|p_minute, p_have_fun; p_switch_turns. web-test.js checks the popup flow and that the
  countdown overlaps nothing on level lists and play screens.
- **Hide for N hours** (grown-ups; owner's request): Pick a mission > "Grown-ups (hold)" 1.5 s >
  1-24 hours (hub.js). AndroidApp.hideFor(h) -> HideTimer.kt (SharedPreferences "hide", so it lasts
  through reboots): wall-clock end time plus the time left, saved each minute; before the frame's
  clock is set after a power cut (it starts at Jan 1) the saved time left is used, and the smaller
  of the two always wins. While hidden BubbleService keeps the UFO gone, won't open the game (turn
  timer stopped, its popup can't open it) and checks each minute. Early unhide: unhide.bat (adb,
  action com.wordhop.app.UNHIDE).
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
-> "Pick a mission" -> photos (`AndroidApp.backToPhotos()`, which closes the game window). The
Android Back key calls the same goBack(). New pages must include back.css, the button, and
goBack(); the first row of each screen leaves room with `.backroom` / `.barspace`. web-test.js
checks the button is in the identical spot on every screen.

**The frame can be turned to portrait (800 x 1280).** Pages have portrait rules; on pickers and level lists
the title moves under the Back/volume row (speech.js). Anything measured in px must be redone on
resize: Connect the Pairs lines (paintLines), Rainbow write's canvas (restarts the trace), the UFO's
position (BubbleService.onConfigurationChanged clamps it on screen). web-test.js checks every screen
in portrait for overflow and the Back button.

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
  The owner updates with **update.bat** (repo root) = `tools\update.ps1`: git pull, make_audio.py,
  gradlew assembleDebug (finds a Java 17-21: Android Studio's jbr first; the owner's JAVA_HOME is
  Java 25, which Gradle 8.7 can't run on), deploy.ps1. When telling the owner
  how to get a change onto the frame, just say "double-click update.bat".
- **The firmware kills the previous app whenever another app comes to the front** (low-RAM
  policy): when the games were an activity, Skylight died as they opened, so "Back to photos"
  cold-started it (about 7 s), and the game's process died 2 ms after its onPause.
  **So the games run in a floating window, never as an activity in front** (GameWindow.kt, owned
  by BubbleService in the `:ufo` process): TYPE_PHONE, full screen, focusable for the Back key.
  Skylight stays the top activity underneath, so it isn't killed and "Back to photos" just removes
  the window. Never open the games with an activity start; use `openGameWindow()` (Compat.kt) or
  `am startservice -n com.wordhop.app/.BubbleService -a com.wordhop.app.OPEN_GAME`. GameActivity is
  only a translucent launcher trampoline. The WebView is created on open and destroyed on close
  (low RAM); the window closes itself after 10 minutes without a touch (any touch resets it, so a
  long turn isn't cut short), and that idle close also cancels the turn timer.
- `ro.config.low_ram=true`. On 2026-10-05 the old build froze on "Back to photos" and Android
  silently killed it ("user request after error": the frame shows no ANR dialog), which explains
  both the long black screen and the vanished UFO. Prime suspect: WebView's media player stuck
  retrying https://wordhop.local clips (RockFFPlayer "Failed to resolve hostname"); fixed by native
  clip playback and lazy TTS. diagnose-back.ps1 now saves data_app_anr and traces.txt to confirm.
- **The frame blocks background starts** of Space Words (and the Gallery app): BOOT_COMPLETED and
  MY_PACKAGE_REPLACED fail with "process is bad" although nothing crashed and Android's bad-process
  list is empty, so it looks like a vendor rule. Starting it from the foreground works (am start, or
  `am startservice` from adb, which deploy.ps1 uses). Even Gallery's broadcasts are refused; service
  starts aren't. So the UFO comes back after a power cut through services the system binds itself
  (UfoKeeper.kt): UfoListener, a notification listener Android binds at boot (deploy.ps1 adds it to
  `settings secure enabled_notification_listeners`), and UfoJob, a persisted 15-minute periodic job
  (fallback, no settings needed). Both just start BubbleService; logcat says "UFO woken by ...". `tools\inspect-autostart.ps1` gathers clues. `tools\diagnose-back.ps1` captures the
  frame's task stack, processes, UFO service/window state and kill/crash logs for debugging.

## Project
- Kotlin, no third-party dependencies. minSdk 22, targetSdk 33, compileSdk 34, AGP 8.5.2,
  Gradle 8.7 (needs JVM 21, not 25). The owner declined the AGP upgrade on purpose; don't upgrade.
- applicationId `com.wordhop.app`: never change it, or reinstalls lose her stars.
- `GameWindow.kt`: the floating full-screen WebView serving assets/www/* from
  https://wordhop.local/ via shouldInterceptRequest, plus the JS bridges: AndroidAudio (clips,
  volume), AndroidTTS (only if clips are missing), AndroidApp (backToPhotos() closes the window).
  The WebView's localStorage (her stars) lives in the app's data folder, shared by both processes;
  only ever run one WebView at a time.
- `BubbleService.kt`: floating UFO overlay (TYPE_PHONE below API 26), draggable, position saved,
  hidden while the game window is open. `BootReceiver.kt` would restart it on boot and after an app
  update (MY_PACKAGE_REPLACED), but this frame blocks those broadcasts; `UfoKeeper.kt` does it instead. `Compat.kt`: API helpers.
- `assets/www`: index.html (picker), picture-planet.html, saucer.html, speech.js, phrases.json,
  fonts/ (Andika subset, Fredoka SemiBold), emoji/, audio/.

## Speech
`speech.js` plays `audio/<key>.mp3` for keys listed in `audio/index.json`, falling back to TTS.
On the frame, clips play natively through the `AndroidAudio` bridge (GameWindow, MediaPlayer):
Chromium 39 hands `<audio>` to Android's MediaPlayer, which bypasses shouldInterceptRequest, so
web audio from https://wordhop.local is silent there. mp3s are kept uncompressed in the APK.
`phrases.json` maps every spoken key to its text (about 1,850, incl. ~720 ws_ slow words; numbers are n_0..n_100, math prompts
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
- `node tools/web-test.js [shot-dir]`: plays every math, match, Sound Lab, Compound Words, Word Search and Class Words level in headless Chromium at 1280x800,
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
- If Gradle gets "429 Too Many Requests" from repo.maven.apache.org in a cloud session, add a
  ~/.gradle/init.d script that puts https://maven-central.storage-download.googleapis.com/maven2/
  first in settings' pluginManagement and dependencyResolutionManagement repositories (not committed).
- Install on the frame, from the owner's PC: `adb install -r app\build\outputs\apk\debug\app-debug.apk`
  (`-r` keeps her stars).

## Git
Work directly on `master` unless parallel agents need extra branches.
