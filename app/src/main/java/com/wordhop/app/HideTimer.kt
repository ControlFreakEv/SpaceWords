package com.wordhop.app

import android.content.Context

/**
 * "Hide Space Words for N hours" (grown-ups, on Pick a mission): the UFO is gone and the game
 * won't open until the time is up. Kept in SharedPreferences, so it lasts through restarts.
 *
 * The frame's clock starts at January 1 after a power cut until it gets the time from the
 * internet, so besides the end time ("until", wall clock) the time still left ("left") is saved
 * every minute while hidden. With the clock not set yet, "left" is used (the time the frame was
 * off doesn't count, so it may stay hidden a little longer, never shorter); once the clock is
 * right, the end time is used. Taking the smaller of the two also stops a clock that jumps
 * backwards from making it hide longer than it was set for.
 */
object HideTimer {
    private const val PREFS = "hide"
    private const val CLOCK_SET_AFTER = 1704067200000L   // 2024-01-01: earlier means the clock isn't set yet
    const val MAX_MS = 48 * 3_600_000L

    fun hide(ctx: Context, ms: Long) {
        val t = ms.coerceIn(60_000L, MAX_MS)
        prefs(ctx).edit().putLong("until", System.currentTimeMillis() + t).putLong("left", t).commit()
    }

    fun clear(ctx: Context) {
        prefs(ctx).edit().clear().commit()
    }

    /** Milliseconds still hidden; 0 when not hidden. */
    fun left(ctx: Context): Long {
        val p = prefs(ctx)
        val until = p.getLong("until", 0L)
        if (until == 0L) return 0L
        val saved = p.getLong("left", 0L)
        val now = System.currentTimeMillis()
        val left = if (now >= CLOCK_SET_AFTER) minOf(until - now, saved) else saved
        if (left <= 0L) { clear(ctx); return 0L }
        if (left < saved) p.edit().putLong("left", left).commit()
        return left
    }

    private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
