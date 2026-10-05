package com.wordhop.app

import android.annotation.SuppressLint
import android.app.ActivityManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.IBinder
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
 * Runs in its own process (":ufo" in the manifest). The frame's low-memory firmware kills the
 * game's process as soon as another app comes to the front, and with the UFO in that process
 * the button vanished every time "Back to photos" was tapped.
 */
class BubbleService : Service() {

    companion object {
        private const val CHANNEL = "bubble"
        private const val TAG = "SpaceWords"
        const val ACTION_SHOW = "com.wordhop.app.UFO_SHOW"
        const val ACTION_HIDE = "com.wordhop.app.UFO_HIDE"
        private const val CHECK_MS = 5000L
    }

    private var wm: WindowManager? = null
    private var bubble: View? = null
    private val handler = Handler(Looper.getMainLooper())

    /** While hidden, bring the UFO back if the game is no longer in front (e.g. it was killed). */
    private val watchGame = object : Runnable {
        override fun run() {
            if (bubble?.visibility != View.VISIBLE) {
                if (gameInFront()) handler.postDelayed(this, CHECK_MS) else setShown(true)
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SHOW -> setShown(true)
            ACTION_HIDE -> setShown(false)
        }
        return START_STICKY
    }

    private fun setShown(visible: Boolean) {
        val b = bubble ?: return
        b.visibility = if (visible) View.VISIBLE else View.GONE
        handler.removeCallbacks(watchGame)
        if (!visible) handler.postDelayed(watchGame, CHECK_MS * 2)
    }

    /** Is the game's own process (not this ":ufo" one) the app in front? */
    private fun gameInFront(): Boolean {
        val am = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val procs = try { am.runningAppProcesses } catch (e: Exception) { null } ?: return false
        return procs.any {
            it.processName == packageName &&
                it.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
        }
    }

    /**
     * Never let a failure here crash the app: Android restarts a crashed sticky service, and two
     * crashes within a minute get the app marked "bad", after which it won't even start at boot.
     * Log the reason and stop instead.
     */
    override fun onCreate() {
        super.onCreate()
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
        }
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
            x = prefs.getInt("x", dm.widthPixels - size - (24 * d).toInt())
            y = prefs.getInt("y", dm.heightPixels - size - (24 * d).toInt())
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
    }

    private fun openGame() {
        setShown(false)
        startActivity(Intent(this, GameActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    override fun onDestroy() {
        handler.removeCallbacks(watchGame)
        bubble?.let { try { wm?.removeView(it) } catch (e: Exception) { Log.w(TAG, "Couldn't remove the UFO window", e) } }
        bubble = null
        super.onDestroy()
    }
}
