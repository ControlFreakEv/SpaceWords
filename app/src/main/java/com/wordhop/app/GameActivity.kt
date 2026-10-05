package com.wordhop.app

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings

/**
 * Launcher icon (and adb "am start"): opens the games in the floating window and closes itself.
 * The games no longer run in an activity; see GameWindow.
 */
class GameActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (canOverlay(this)) {
            openGameWindow(this)
        } else if (Build.VERSION.SDK_INT >= 23) {
            startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")))
        }
        finish()
        overridePendingTransition(0, 0)
    }
}
