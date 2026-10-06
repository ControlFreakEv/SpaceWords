# Space Words for Skylight

A floating UFO button sits on top of the Skylight screen. Tap it to pick a mission:

**Word games**
- **Class Words** - her kindergarten class list (69 words to read and write), with the class
  handout's practice ideas built in: word hunts on space mail, signs and cereal boxes; saying a
  sentence ("car time"); teaching Zib the alien, who sometimes reads wrong; rainbow tracing; and
  roll & read with silly voices. Two new words a week plus review, as the handout suggests. To
  match the class newsletter, press and hold "Grown-ups" for a second and tap words to choose
  this week's words. The Word wall shows how many she has learned.
- **Picture Planet** - picture words: read it, hear it, spell it.
- **Sight Word Saucer** - Dolch sight words across five planets (Pre-primer to Grade 3):
  hear a word and beam it up, pick the word that fits a sentence, or look-cover-spell.
- **Connect the Pairs** - tap a word, then its picture; a line joins them. Picture Planet's
  five word levels, 3 to 5 pairs per board.
- **Rhyming Pairs** - tap two words that rhyme: short vowels (cat, hat), long vowels
  (cake, lake), same sound with new spelling (blue, shoe), and two-part words (kitten, mitten).

- **Sound Lab** - pronunciation: every vowel has its own color, long vowels get a bar on top,
  silent e is gray, vowel teams and bossy R are underlined. Levels: short vowels (swap the
  vowel in b_g to hear bag, beg, big, bog, bug), magic e (cap, cape), vowel teams (rain, boat),
  syllables (clap and count; tap each part to hear it), and bossy R (car, fork, bird).

- **Compound Words** - sun + flower = sunflower: picture puzzles, match the halves, split it
  (tap between the letters), build it, and big words like thunderstorm. Wrong choices are
  checked so they never make a real word too (sun + set would).

The volume control sits in the bottom-left corner of the pickers and level lists. Tap -, +,
or a bar. The bottom bar off is silent; the two orange bars are louder than the frame's own
maximum. The frame's volume for Skylight is put back when you return to the photos.

Next to "Hear it" there's a turtle switch. While it's on (green), every word is said slowly;
instructions and praise stay normal. It stays on until she taps it off.

In every game, tapping a word that isn't an answer choice reads it aloud (instructions,
sentences, numbers in math questions). In Picture Planet's "read the word" rounds that counts
as a hint, like Peek, and costs the round's gold star.

**Math games** (five levels each, from kindergarten starter to about 3rd grade)
- **Star Count** - count to 10 and 20, more or fewer, numbers to 100, tens and ones.
- **Rocket Math** - add to 5 with pictures, add and take away, facts to 20, two-digit
  numbers, times and sharing. Harder levels use a number keypad instead of choices.
- **Alien Patterns** - picture patterns, counting up and down, skip counting,
  number rules, and brain busters like 1, 2, 4, 8.

The games open in a full-screen window floating over the slideshow, so Skylight keeps running
underneath and "Back to photos" is instant. The game closes by itself after 10 minutes without
a touch. Every screen has the same yellow Back button in the top-left corner. It goes back one
step at a time, and on "Pick a mission" it returns to the photos. The frame's Back key does the same. Drag the UFO to move it.
It comes back automatically after a restart. Works on Android 5.1 (Skylight frame) and newer.
Everything is bundled in app/src/main/assets/www, so it runs offline.

## Updating the frame (the usual routine)
Double-click **update.bat** in this folder. It runs the four steps in order and stops with
a plain message if one fails:

1. git pull (latest code)
2. python tools\make_audio.py (records only the clips that are new)
3. build the APK (same as Android Studio's Generate APKs)
4. tools\deploy.ps1 (install on the frame over Wi-Fi, or USB if Wi-Fi isn't answering)

From a terminal instead: `powershell -ExecutionPolicy Bypass -File tools\update.ps1`
Add `-Open` to open the games afterwards, or `-SkipAudio` to skip recording.

## 1. Record the voice (the frame has no text-to-speech engine)
Needs Python 3 on your PC (python.org) and internet for a few minutes.
Open Command Prompt in this SpaceWords folder (not platform-tools), then:

    pip install edge-tts
    python tools\make_audio.py

That saves about 1,850 MP3 clips into app/src/main/assets/www/audio. It only records clips
that are missing, so after an update that adds new spoken text (like the math games),
run it again and then rebuild.
To hear other voices:  python tools\make_audio.py --list
To switch voices:      python tools\make_audio.py --voice en-US-AnaNeural --force

## 2. Build (Android Studio)
1. File > Open > this SpaceWords folder. Wait for the Gradle sync bar at the bottom to finish
   (the Build menu items stay grey until it does). Decline the Android Gradle plugin upgrade.
2. Build > Generate App Bundles or APKs > Generate APKs.
   (Older Android Studio versions call this Build > Build Bundle(s) / APK(s) > Build APK(s).)
3. A "Build APK(s)" popup appears when it is done; its "locate" link opens the folder.
   The APK lands in app/build/outputs/apk/debug/app-debug.apk

Or from a terminal in this folder (uses Android Studio's Java; adjust the path if yours differs):

    set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
    gradlew assembleDebug

## 3. Install on the frame (ADB already working)
    adb install -r app\build\outputs\apk\debug\app-debug.apk
    adb shell am start -n com.wordhop.app/.GameActivity

On Android 5.1 the floating-button permission is granted at install.
On newer Android, also run:
    adb shell appops set com.wordhop.app SYSTEM_ALERT_WINDOW allow

Stars are kept across reinstalls with -r.

## Updating over Wi-Fi (no USB cable)
The frame is set up for Wi-Fi adb at 192.168.1.242 (reserve that address for it in your router,
hardware address e0:cb:56:8c:bd:58). After building a new APK, from this folder run:

    powershell -ExecutionPolicy Bypass -File tools\deploy.ps1

Add -Open at the end to open the games afterwards for a quick test. Installing closes the
app, and this frame's software won't let it restart itself in the background, so the script
starts the UFO again (opening the game on the frame if that's the only way).

The same frame rule means the UFO doesn't come back on its own after the frame reboots.
Open Space Words once (or run the deploy script) to bring it back.

One-time setup so Wi-Fi adb survives reboots (frame plugged in by USB, or already connected):

    adb tcpip 5555
    adb connect 192.168.1.242:5555
    adb root
    adb connect 192.168.1.242:5555
    adb shell setprop persist.adb.tcp.port 5555

Turn it off again with:  adb shell setprop persist.adb.tcp.port ""  then reboot.
Note: this frame reports ro.adb.secure=0, so any device on your Wi-Fi can connect to it
without a prompt while Wi-Fi adb is on.

## Troubleshooting scripts (run from this folder)
    powershell -ExecutionPolicy Bypass -File tools\diagnose-back.ps1     slow "Back to photos", missing UFO
    powershell -ExecutionPolicy Bypass -File tools\inspect-autostart.ps1 why the app can't start itself
Both only read from the frame, save a log in tools\, and copy it to the clipboard.

## If the Skylight app keeps jumping in front of the game
    adb shell pm disable-user --user 0 skylight.watchdog
Undo with:
    adb shell pm enable skylight.watchdog

## Uninstall
    adb uninstall com.wordhop.app

## Credits
Pictures: Twemoji by Twitter and contributors, CC-BY 4.0.
Fonts: Andika (SIL) and Fredoka, SIL Open Font License.
Word lists: Dolch sight words.

The internal app id stays com.wordhop.app so reinstalls keep her stars.
