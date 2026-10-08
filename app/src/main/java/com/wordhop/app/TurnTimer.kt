package com.wordhop.app

import android.os.Handler
import android.os.Looper
import android.os.SystemClock

/**
 * The 5-minute turn timer (Space Words is shared: "switch turns" when it runs out).
 * Lives in the ":ufo" process with the UFO, so it keeps counting while pages change and while
 * the photos are showing. The pages ask it every second through AndroidApp.turnLeft().
 *
 * States: off, running, and "over" (time ran out, the "Switch turns!" popup hasn't been
 * dismissed yet). When it runs out, onOver opens the game window if it's closed, so the popup
 * shows over the photos too.
 */
object TurnTimer {
    private val ui = Handler(Looper.getMainLooper())
    // set from the page's bridge thread and read from both, so volatile; Handler calls are thread-safe
    @Volatile private var endAt = 0L   // SystemClock.uptimeMillis() when the turn ends; 0 = off
    @Volatile private var over = false
    var onOver: (() -> Unit)? = null

    private val fire = Runnable {
        endAt = 0L
        over = true
        onOver?.invoke()
    }

    fun start(ms: Long) {
        ui.removeCallbacks(fire)
        over = false
        endAt = SystemClock.uptimeMillis() + ms
        ui.postDelayed(fire, ms)
    }

    fun stop() {
        ui.removeCallbacks(fire)
        endAt = 0L
        over = false
    }

    /** Milliseconds left; 0 when off; -1 when time ran out and the popup is still up. */
    fun left(): Long = when {
        over -> -1L
        endAt == 0L -> 0L
        else -> maxOf(1L, endAt - SystemClock.uptimeMillis())
    }
}
