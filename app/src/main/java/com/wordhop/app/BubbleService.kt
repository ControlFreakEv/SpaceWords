package com.wordhop.app

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import android.widget.ImageView
import kotlin.math.abs

/**
 * Keeps a draggable UFO button floating over the Skylight app.
 * Tap it to open Space Words; drag it wherever you want it (position is remembered).
 *
 * Tapping it opens the games in a floating window (GameWindow) above the slideshow, so Skylight
 * never leaves the screen. Runs in its own process (":ufo" in the manifest).
 */
class BubbleService : Service() {

    companion object {
        private const val CHANNEL = "bubble"
        private const val TAG = "SpaceWords"
        const val ACTION_OPEN_GAME = "com.wordhop.app.OPEN_GAME"
        /** grown-ups (or unhide.bat over adb): show the UFO again before the hidden time is up */
        const val ACTION_UNHIDE = "com.wordhop.app.UNHIDE"
    }

    private var wm: WindowManager? = null
    private var bubble: View? = null
    private var game: GameWindow? = null
    private var bubbleLp: WindowManager.LayoutParams? = null
    private val ui = Handler(Looper.getMainLooper())
    /** while hidden (HideTimer), look again every minute and bring the UFO back when the time is up */
    private val hideCheck = Runnable { applyHidden() }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_OPEN_GAME -> openGame()
            ACTION_UNHIDE -> { HideTimer.clear(this); applyHidden() }
        }
        return START_STICKY
    }

    /** Opens the games in their floating window; the UFO hides until the window closes. */
    private fun openGame() {
        if (!canOverlay(this)) return
        if (HideTimer.left(this) > 0) { applyHidden(); return }
        val g = game ?: GameWindow(this) { applyHidden() }.also { game = it }
        if (g.isShowing) return
        bubble?.visibility = View.GONE
        g.show()
    }

    override fun onCreate() {
        super.onCreate()
        scheduleUfoJob(this)
        // the turn timer ran out: show "Switch turns!", over the photos too (the page shows the popup)
        TurnTimer.onOver = { if (game?.isShowing != true) openGame() }
        try {
            startForeground(1, notification())
        } catch (e: Exception) {
            Log.e(TAG, "Couldn't start the UFO service in the foreground", e)
        }
        if (!canOverlay(this)) {
            Log.w(TAG, "No permission to draw over other apps; UFO button not shown")
            stopSelf()
            return
        }
        try {
            addBubble()
        } catch (e: Exception) {
            Log.e(TAG, "Couldn't add the UFO button window", e)
            bubble = null
            stopSelf()
            return
        }
        applyHidden()
    }

    @Suppress("DEPRECATION")
    private fun notification(): Notification {
        val builder = if (Build.VERSION.SDK_INT >= 26) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(NotificationChannel(CHANNEL, "Space Words button", NotificationManager.IMPORTANCE_MIN))
            Notification.Builder(this, CHANNEL)
        } else {
            Notification.Builder(this).setPriority(Notification.PRIORITY_MIN)
        }
        return builder
            .setContentTitle("Space Words")
            .setContentText("UFO button is ready")
            .setSmallIcon(R.drawable.ic_ufo)
            .setOngoing(true)
            .build()
    }

    @Suppress("DEPRECATION")
    @SuppressLint("ClickableViewAccessibility")
    private fun addBubble() {
        val manager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        wm = manager
        val d = resources.displayMetrics.density
        val dm = resources.displayMetrics
        val size = (88 * d).toInt()
        val prefs = getSharedPreferences("bubble", MODE_PRIVATE)

        val view = ImageView(this).apply {
            setImageResource(R.drawable.ic_ufo)
            contentDescription = "Open Space Words"
            elevation = 10 * d
        }

        val type = if (Build.VERSION.SDK_INT >= 26)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else
            WindowManager.LayoutParams.TYPE_PHONE

        val lp = WindowManager.LayoutParams(
            size, size, type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            // the saved spot may be from the other orientation: keep it on the screen
            x = prefs.getInt("x", dm.widthPixels - size - (24 * d).toInt()).coerceIn(0, maxOf(0, dm.widthPixels - size))
            y = prefs.getInt("y", dm.heightPixels - size - (24 * d).toInt()).coerceIn(0, maxOf(0, dm.heightPixels - size))
        }

        val slop = ViewConfiguration.get(this).scaledTouchSlop
        var downX = 0f; var downY = 0f; var startX = 0; var startY = 0; var dragging = false

        view.setOnTouchListener { v, e ->
            when (e.action) {
                MotionEvent.ACTION_DOWN -> {
                    downX = e.rawX; downY = e.rawY; startX = lp.x; startY = lp.y; dragging = false
                    v.animate().scaleX(0.92f).scaleY(0.92f).setDuration(80).start()
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = e.rawX - downX; val dy = e.rawY - downY
                    if (!dragging && (abs(dx) > slop || abs(dy) > slop)) dragging = true
                    if (dragging) {
                        lp.x = (startX + dx).toInt().coerceIn(0, dm.widthPixels - size)
                        lp.y = (startY + dy).toInt().coerceIn(0, dm.heightPixels - size)
                        manager.updateViewLayout(v, lp)
                    }
                    true
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    v.animate().scaleX(1f).scaleY(1f).setDuration(80).start()
                    if (dragging) {
                        prefs.edit().putInt("x", lp.x).putInt("y", lp.y).apply()
                    } else if (e.action == MotionEvent.ACTION_UP) {
                        openGame()
                    }
                    true
                }
                else -> false
            }
        }

        manager.addView(view, lp)
        bubble = view
        bubbleLp = lp
    }

    /** The frame can be turned to portrait: keep the UFO on the screen (its saved spot may be off it). */
    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        val v = bubble ?: return
        val lp = bubbleLp ?: return
        val dm = resources.displayMetrics
        val x = lp.x.coerceIn(0, maxOf(0, dm.widthPixels - lp.width))
        val y = lp.y.coerceIn(0, maxOf(0, dm.heightPixels - lp.height))
        if (x != lp.x || y != lp.y) {
            lp.x = x; lp.y = y
            try { wm?.updateViewLayout(v, lp) } catch (e: Exception) { Log.w(TAG, "Couldn't move the UFO on screen", e) }
        }
    }

    /** Hidden by a grown-up: no UFO, game closed, check again in a minute. Otherwise show the UFO
     *  (unless the game window is open, which hides it). */
    private fun applyHidden() {
        ui.removeCallbacks(hideCheck)
        val left = HideTimer.left(this)
        if (left > 0) {
            bubble?.visibility = View.GONE
            if (game?.isShowing == true) game?.hide()
            ui.postDelayed(hideCheck, minOf(left, 60_000L))
        } else if (game?.isShowing != true) {
            bubble?.visibility = View.VISIBLE
        }
    }

    override fun onDestroy() {
        ui.removeCallbacks(hideCheck)
        TurnTimer.onOver = null
        game?.hide()
        game = null
        bubble?.let { try { wm?.removeView(it) } catch (e: Exception) { Log.w(TAG, "Couldn't remove the UFO window", e) } }
        bubble = null
        super.onDestroy()
    }
}
