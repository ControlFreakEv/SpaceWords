package com.wordhop.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Brings the UFO button back after the device restarts, and after an update is installed
 * (installing stops the app, which would otherwise leave the button gone until the next reboot).
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if ((action == Intent.ACTION_BOOT_COMPLETED || action == Intent.ACTION_MY_PACKAGE_REPLACED) &&
            canOverlay(context)
        ) {
            startBubble(context)
        }
    }
}
