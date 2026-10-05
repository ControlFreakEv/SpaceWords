package com.wordhop.app

import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.util.Log

/** Overlay permission is granted at install time before Android 6 (API 23). */
fun canOverlay(context: Context): Boolean =
    Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(context)

fun startBubble(context: Context) {
    val intent = Intent(context, BubbleService::class.java)
    if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent) else context.startService(intent)
}

/**
 * Shows or hides the UFO. It runs in its own process (":ufo"), so this goes through Android
 * rather than a direct call; it also starts the UFO service if it isn't running.
 * Only call it while the game is in front (background starts are restricted on newer Android).
 */
fun showBubble(context: Context, visible: Boolean) {
    val intent = Intent(context, BubbleService::class.java)
        .setAction(if (visible) BubbleService.ACTION_SHOW else BubbleService.ACTION_HIDE)
    try {
        context.startService(intent)
    } catch (e: Exception) {
        Log.w("SpaceWords", "Couldn't reach the UFO service", e)
    }
}
