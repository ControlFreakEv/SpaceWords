# Space Words for Skylight

A floating UFO button sits on top of the Skylight screen. Tap it to pick a mission:

- **Picture Planet** - picture words: read it, hear it, spell it.
- **Sight Word Saucer** - Dolch sight words across five planets (Pre-primer to Grade 3):
  hear a word and beam it up, pick the word that fits a sentence, or look-cover-spell.

"Back to photos" on the picker returns to the Skylight. Drag the UFO to move it.
It comes back automatically after a restart. Works on Android 5.1 (Skylight frame) and newer.
Everything is bundled in app/src/main/assets/www, so it runs offline.

## 1. Record the voice (the frame has no text-to-speech engine)
Needs Python 3 on your PC (python.org) and internet for a few minutes.
Open Command Prompt in this SpaceWords folder (not platform-tools), then:

    pip install edge-tts
    python tools\make_audio.py

That saves about 400 MP3 clips into app/src/main/assets/www/audio.
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

Add -Open at the end to open the games afterwards for a quick test. The UFO button
comes back on its own after an update.

One-time setup so Wi-Fi adb survives reboots (frame plugged in by USB, or already connected):

    adb tcpip 5555
    adb connect 192.168.1.242:5555
    adb root
    adb connect 192.168.1.242:5555
    adb shell setprop persist.adb.tcp.port 5555

Turn it off again with:  adb shell setprop persist.adb.tcp.port ""  then reboot.
Note: this frame reports ro.adb.secure=0, so any device on your Wi-Fi can connect to it
without a prompt while Wi-Fi adb is on.

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
