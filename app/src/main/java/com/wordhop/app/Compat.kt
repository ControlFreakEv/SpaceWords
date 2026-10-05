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

/** Opens the games in their floating window (starting the UFO service if needed). */
fun openGameWindow(context: Context) {
    val intent = Intent(context, BubbleService::class.java).setAction(BubbleService.ACTION_OPEN_GAME)
    try {
        context.startService(intent)
    } catch (e: Exception) {
        Log.w("SpaceWords", "Couldn't reach the UFO service", e)
    }
}
