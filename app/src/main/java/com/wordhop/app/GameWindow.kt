package com.wordhop.app

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.media.AudioManager
import android.media.MediaMetadataRetriever
import android.media.MediaPlayer
import android.media.SoundPool
import android.media.audiofx.LoudnessEnhancer
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.speech.tts.TextToSpeech
import android.speech.tts.Voice
import android.util.Log
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * The games, in a full-screen floating window above the Skylight slideshow (like the UFO).
 *
 * Skylight never leaves the screen, so the frame's low-memory firmware has no reason to close it,
 * and "Back to photos" is instant: the window is removed and the slideshow is already there.
 * (As an app in front, the game made the firmware kill Skylight; coming back cold-started it, ~7 s.)
 *
 * Owned by BubbleService in the ":ufo" process. The WebView is created on show() and destroyed on
 * hide() to give the memory back on this low-RAM frame. Her stars stay in the WebView's
 * localStorage (same app data folder as before, so nothing is lost).
 */
class GameWindow(private val ctx: Context, private val onClosed: () -> Unit) {

    private val ui = Handler(Looper.getMainLooper())
    private val wm = ctx.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private val am = ctx.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private val audioPrefs = ctx.getSharedPreferences("audio", Context.MODE_PRIVATE)
    private var root: FrameLayout? = null
    private lateinit var web: WebView
    private var tts: TextToSpeech? = null
    private var player: MediaPlayer? = null
    private var enhancer: LoudnessEnhancer? = null
    /** Silly voices (Roll & Read, Zib the alien): SoundPool can change speed and pitch on Android 5. */
    private var pool: SoundPool? = null
    private var poolStream = 0
    private var sillyToken = -1
    /** The frame's own media volume, put back when the game closes so Skylight is unchanged. */
    private var frameVolume = -1
    @Volatile private var ttsReady = false
    private var lastTouch = 0L

    val isShowing get() = root != null

    /** Closes the game by itself after a while with nobody touching it, so the photos come back.
     *  Nobody is playing, so the turn timer is cancelled too: otherwise it would reopen the game over
     *  the photos later to say "Switch turns!" to an empty room (or leave that popup waiting). */
    private val idleCheck = object : Runnable {
        override fun run() {
            if (!isShowing) return
            if (SystemClock.uptimeMillis() - lastTouch >= IDLE_MS) {
                TurnTimer.stop()
                hide()
            } else ui.postDelayed(this, 30_000)
        }
    }

    @Suppress("DEPRECATION")
    @SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
    fun show() {
        if (isShowing) return
        val frame = object : FrameLayout(ctx) {
            /** The frame's Back key does what the on-screen Back button does. */
            override fun dispatchKeyEvent(event: KeyEvent): Boolean {
                if (event.keyCode == KeyEvent.KEYCODE_BACK) {
                    if (event.action == KeyEvent.ACTION_UP) web.evaluateJavascript(GO_BACK_JS, null)
                    return true
                }
                return super.dispatchKeyEvent(event)
            }
            override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
                lastTouch = SystemClock.uptimeMillis()
                return super.dispatchTouchEvent(ev)
            }
        }
        frame.setBackgroundColor(Color.parseColor("#0B1026"))   // instant feedback while the page loads
        web = WebView(ctx).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true          // keeps her stars between sessions
            settings.mediaPlaybackRequiresUserGesture = false
            setBackgroundColor(Color.parseColor("#0B1026"))
            webViewClient = AssetClient()
            addJavascriptInterface(TtsBridge(), "AndroidTTS")
            addJavascriptInterface(AudioBridge(), "AndroidAudio")
            addJavascriptInterface(AppBridge(), "AndroidApp")
        }
        frame.addView(web, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        frame.systemUiVisibility = (View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_LAYOUT_STABLE)

        val type = if (Build.VERSION.SDK_INT >= 26) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                   else WindowManager.LayoutParams.TYPE_PHONE
        val lp = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT, type,
            // focusable (no FLAG_NOT_FOCUSABLE) so the Back key reaches us
            WindowManager.LayoutParams.FLAG_FULLSCREEN or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            PixelFormat.OPAQUE
        )
        try {
            wm.addView(frame, lp)
        } catch (e: Exception) {
            Log.e(TAG, "Couldn't open the game window", e)
            web.destroy()
            onClosed()
            return
        }
        root = frame
        frame.requestFocus()
        web.loadUrl(HOME_URL)

        frameVolume = am.getStreamVolume(AudioManager.STREAM_MUSIC)
        applyLevel()
        lastTouch = SystemClock.uptimeMillis()
        ui.postDelayed(idleCheck, 30_000)
    }

    /** Back to the photos: remove the window. Skylight is still on screen underneath. */
    fun hide() {
        val r = root ?: return
        root = null
        ui.removeCallbacks(idleCheck)
        stopClip()
        pool?.release(); pool = null
        tts?.shutdown(); tts = null; ttsReady = false
        if (frameVolume >= 0) {
            try { am.setStreamVolume(AudioManager.STREAM_MUSIC, frameVolume, 0) } catch (e: Exception) {}
            frameVolume = -1
        }
        try { wm.removeView(r) } catch (e: Exception) { Log.w(TAG, "Couldn't remove the game window", e) }
        web.destroy()
        onClosed()
    }

    /** "Back" on the "Pick a mission" page returns to the photos; the turn timer (TurnTimer). */
    inner class AppBridge {
        @JavascriptInterface
        fun backToPhotos() { ui.post { hide() } }

        /** grown-ups: hide Space Words for this many hours (the UFO comes back by itself) */
        @JavascriptInterface
        fun hideFor(hours: Int) {
            HideTimer.hide(ctx, hours.coerceIn(1, 48) * 3_600_000L)
            TurnTimer.stop()
            ui.post { hide() }
        }

        @JavascriptInterface
        fun turnStart(ms: Long) = TurnTimer.start(ms.coerceIn(1_000L, 60 * 60_000L))

        @JavascriptInterface
        fun turnStop() = TurnTimer.stop()

        /** Milliseconds left; 0 = off; -1 = time ran out ("Switch turns!" popup still up). */
        @JavascriptInterface
        fun turnLeft(): Long = TurnTimer.left()
    }

    /** Serves https://wordhop.local/<path> from assets/www/<path>. */
    private inner class AssetClient : WebViewClient() {
        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
            val url = request.url
            if (url.host != HOST) return null
            val path = (url.path ?: "/").trimStart('/').ifEmpty { "index.html" }
            return try {
                val mime = mimeFor(path)
                val text = mime.startsWith("text") || mime.endsWith("json") || mime.endsWith("javascript") || path.endsWith(".svg")
                WebResourceResponse(mime, if (text) "utf-8" else null, ctx.assets.open("www/$path"))
            } catch (e: Exception) {
                WebResourceResponse("text/plain", "utf-8", 404, "Not Found", emptyMap(), "".byteInputStream())
            }
        }

        @Deprecated("Deprecated in Java")
        override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean = !url.contains(HOST)
    }

    private fun mimeFor(path: String) = when {
        path.endsWith(".html") -> "text/html"
        path.endsWith(".svg") -> "image/svg+xml"
        path.endsWith(".ttf") -> "font/ttf"
        path.endsWith(".png") -> "image/png"
        path.endsWith(".js") -> "application/javascript"
        path.endsWith(".json") -> "application/json"
        path.endsWith(".mp3") -> "audio/mpeg"
        path.endsWith(".css") -> "text/css"
        else -> "application/octet-stream"
    }



    /*
     * Voice clips are played natively. The frame's old WebView (Chromium 39) hands <audio> to
     * Android's MediaPlayer, which fetches the URL itself and never goes through
     * shouldInterceptRequest, so https://wordhop.local/audio/... can't load and stays silent.
     */
    private fun playClip(key: String, token: Int) {
        stopClip()
        if (!isShowing) return
        if (!CLIP_KEY.matches(key)) { clipDone(token); return }
        val mp = MediaPlayer()
        try {
            mp.setAudioStreamType(AudioManager.STREAM_MUSIC)
            try {
                ctx.assets.openFd("www/audio/$key.mp3").use { mp.setDataSource(it.fileDescriptor, it.startOffset, it.length) }
            } catch (e: java.io.FileNotFoundException) {
                // The asset was stored compressed, so it has no file descriptor: play a cached copy.
                mp.setDataSource(cachedClip(key).absolutePath)
            }
            mp.setOnCompletionListener { finishClip(it, token) }
            mp.setOnErrorListener { p, _, _ -> finishClip(p, token); true }
            mp.prepare()
            val gain = boostGain()
            if (gain > 0) {
                try {
                    enhancer = LoudnessEnhancer(mp.audioSessionId).apply { setTargetGain(gain); enabled = true }
                } catch (e: Throwable) {
                    Log.w("SpaceWords", "Volume boost isn't available on this device", e)
                }
            }
            mp.start()
            player = mp
        } catch (e: Exception) {
            Log.w("SpaceWords", "Couldn't play clip $key", e)
            mp.release()
            clipDone(token)
        }
    }

    private fun cachedClip(key: String): File {
        val f = File(File(ctx.cacheDir, "audio").apply { mkdirs() }, "$key.mp3")
        if (!f.exists() || f.length() == 0L) {
            ctx.assets.open("www/audio/$key.mp3").use { input -> f.outputStream().use { input.copyTo(it) } }
        }
        return f
    }

    private fun releaseEnhancer() {
        enhancer?.let { try { it.release() } catch (e: Exception) {} }
        enhancer = null
    }

    private fun finishClip(mp: MediaPlayer, token: Int) {
        if (player === mp) { player = null; releaseEnhancer(); mp.release() }
        clipDone(token)
    }

    /** Plays audio/<key>.mp3 faster and higher (rate > 1) or slower and deeper (rate < 1). */
    @Suppress("DEPRECATION")
    private fun playSilly(key: String, token: Int, rate: Float) {
        stopClip()
        if (!isShowing) return
        if (!CLIP_KEY.matches(key)) { clipDone(token); return }
        try {
            val sp = pool ?: SoundPool(1, AudioManager.STREAM_MUSIC, 0).also { pool = it }
            val afd = ctx.assets.openFd("www/audio/$key.mp3")
            val mmr = MediaMetadataRetriever()
            val durMs = try {
                mmr.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                mmr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 1000L
            } finally { mmr.release() }
            val r = rate.coerceIn(0.5f, 2.0f)
            sillyToken = token
            sp.setOnLoadCompleteListener { p, sid, status ->
                if (sillyToken != token) { p.unload(sid); return@setOnLoadCompleteListener }
                if (status != 0) { sillyToken = -1; clipDone(token); return@setOnLoadCompleteListener }
                poolStream = p.play(sid, 1f, 1f, 1, 0, r)
                ui.postDelayed({
                    p.unload(sid)
                    if (sillyToken == token) { sillyToken = -1; clipDone(token) }
                }, (durMs / r).toLong() + 150)
            }
            sp.load(afd, 1)
            afd.close()
        } catch (e: Exception) {
            Log.w(TAG, "Couldn't play $key in a silly voice", e)
            sillyToken = -1
            clipDone(token)
        }
    }

    private fun stopClip() {
        if (sillyToken >= 0) { sillyToken = -1; pool?.stop(poolStream) }
        val p = player ?: return
        player = null
        try { p.stop() } catch (e: Exception) {}
        releaseEnhancer()
        p.release()
    }

    private fun clipDone(token: Int) {
        if (isShowing) web.evaluateJavascript("window.__clipDone && window.__clipDone($token)", null)
    }

    inner class AudioBridge {
        /** Plays audio/<key>.mp3; calls window.__clipDone(token) when it ends or fails. */
        @JavascriptInterface
        fun play(key: String, token: Int) { ui.post { playClip(key, token) } }

        /** Like play(), in a silly voice: rate 0.5 (slow, deep) to 2.0 (fast, squeaky). */
        @JavascriptInterface
        fun playRate(key: String, token: Int, rate: Float) {
            ui.post { if (rate in 0.97f..1.03f) playClip(key, token) else playSilly(key, token, rate) }
        }

        @JavascriptInterface
        fun stop() { ui.post { stopClip() } }

        /** The game's volume level, 0 (off) to MAX_LEVEL. */
        @JavascriptInterface
        fun level(): Int = savedLevel()

        @JavascriptInterface
        fun setLevel(n: Int) {
            audioPrefs.edit().putInt("level", n.coerceIn(0, MAX_LEVEL)).apply()
            ui.post { applyLevel() }
        }
    }

    /*
     * Volume levels: 0 is off; 1-4 set the frame's media volume to a quarter, half, three quarters
     * and full; 5 and 6 keep it full and boost the voice clips further (LoudnessEnhancer, +6 and
     * +12 dB) for when the frame's maximum still isn't loud enough.
     */
    private fun savedLevel() = audioPrefs.getInt("level", DEFAULT_LEVEL).coerceIn(0, MAX_LEVEL)

    private fun applyLevel() {
        val max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        val l = savedLevel()
        val v = if (l >= 4) max else (max * l + 3) / 4
        try { am.setStreamVolume(AudioManager.STREAM_MUSIC, v, 0) } catch (e: Exception) {
            Log.w("SpaceWords", "Couldn't set the volume", e)
        }
    }

    private fun boostGain() = when (savedLevel()) { 5 -> 600; 6 -> 1200; else -> 0 }

    /**
     * Text-to-speech is only a fallback for when the recorded clips are missing, so it starts
     * only when speech.js asks. The frame has the Pico engine; binding to it for nothing costs
     * memory on a low-RAM device and adds slow calls to every pause and close.
     */
    private fun startTts() {
        if (tts != null) return
        tts = TextToSpeech(ctx) { status ->
            ttsReady = status == TextToSpeech.SUCCESS
            ui.post { if (isShowing) web.evaluateJavascript("window.__ttsReady && window.__ttsReady()", null) }
        }
    }

    inner class TtsBridge {
        @JavascriptInterface
        fun enable() { ui.post { if (isShowing) startTts() } }


        /** English voices as JSON, best quality first. */
        @JavascriptInterface
        fun voices(): String {
            val t = tts ?: return "[]"
            if (!ttsReady) return "[]"
            val all = try { t.voices ?: emptySet() } catch (e: Exception) { emptySet<Voice>() }
            val list = all
                .filter { it.locale.language == "en" }
                .filter { !it.features.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED) }
                .sortedWith(compareByDescending<Voice> { it.quality }
                    .thenBy { it.isNetworkConnectionRequired }
                    .thenBy { it.locale.toLanguageTag() != "en-US" })
            val arr = JSONArray()
            if (list.isEmpty()) {
                // Some older engines report no Voice objects but can still speak with the default voice.
                arr.put(JSONObject().put("id", "").put("name", "Default voice").put("lang", "en-US").put("localService", true))
            }
            list.forEachIndexed { i, v ->
                val label = (if (v.quality >= Voice.QUALITY_HIGH) "Natural voice " else "Voice ") +
                        (i + 1) + if (v.isNetworkConnectionRequired) " online" else ""
                arr.put(JSONObject()
                    .put("id", v.name)
                    .put("name", label)
                    .put("lang", v.locale.toLanguageTag())
                    .put("localService", !v.isNetworkConnectionRequired))
            }
            return arr.toString()
        }

        @JavascriptInterface
        fun speak(text: String, voiceId: String, rate: Float, pitch: Float, flush: Boolean) {
            val t = tts ?: return
            if (!ttsReady) return
            if (voiceId.isNotEmpty()) {
                try { t.voices?.firstOrNull { it.name == voiceId }?.let { t.voice = it } } catch (e: Exception) {}
            }
            t.setSpeechRate(rate)
            t.setPitch(pitch)
            t.speak(text, if (flush) TextToSpeech.QUEUE_FLUSH else TextToSpeech.QUEUE_ADD, null, "wh" + System.nanoTime())
        }

        @JavascriptInterface
        fun cancel() {
            tts?.stop()
        }
    }

    companion object {
        private const val TAG = "SpaceWords"
        const val HOST = "wordhop.local"
        const val HOME_URL = "https://$HOST/index.html"
        const val MAX_LEVEL = 6
        const val DEFAULT_LEVEL = 5
        /** Close the game after 10 minutes without a touch, so the frame goes back to the photos. */
        private const val IDLE_MS = 10 * 60_000L
        private val CLIP_KEY = Regex("[a-z0-9_]+")
        private const val GO_BACK_JS = "(function(){if(window.Turns&&Turns.back())return;" +
            "if(window.goBack){goBack();return;}" +
            "if(window.Speech)Speech.stop();" +
            "var m=document.querySelector('meta[name=parent]');" +
            "if(m)location.href=m.getAttribute('content');else if(window.AndroidApp)AndroidApp.backToPhotos();})()"
    }
}
