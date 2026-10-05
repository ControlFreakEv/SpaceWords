package com.wordhop.app

import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings

/** Overlay permission is granted at install time before Android 6 (API 23). */
fun canOverlay(context: Context): Boolean =
    Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(context)

fun startBubble(context: Context) {
    val intent = Intent(context, BubbleService::class.java)
    if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent) else context.startService(intent)
}
