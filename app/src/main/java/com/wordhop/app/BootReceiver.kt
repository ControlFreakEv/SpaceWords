package com.wordhop.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Brings the UFO button back after the device restarts. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED && canOverlay(context)) {
            startBubble(context)
        }
    }
}
