package com.wordhop.home

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.audiofx.LoudnessEnhancer
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.speech.tts.TextToSpeech
import android.speech.tts.Voice
import android.util.Log
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Space Words on an ordinary Android phone or tablet: the frame app's games (assets/www, shared
 * with the :app module) in a plain full-screen activity. Unlike the frame there is no UFO, no
 * Skylight and no floating window; Back on "Pick a mission" leaves the app.
 *
 * The page talks to the same bridges as on the frame (AndroidAudio, AndroidTTS, AndroidApp), but
 * AndroidApp has no hideFor() (so "Grown-ups (hold)" isn't shown) and no turn timer (speech.js
 * keeps the turn in localStorage instead). The volume control sets how loud the voice is
 * without touching the device's own volume (the volume keys still work as usual).
 */
class MainActivity : Activity() {

    private val ui = Handler(Looper.getMainLooper())
    private lateinit var web: WebView
    private val audioPrefs by lazy { getSharedPreferences("audio", MODE_PRIVATE) }
    private var player: MediaPlayer? = null
    private var enhancer: LoudnessEnhancer? = null
    private var tts: TextToSpeech? = null
    @Volatile private var ttsReady = false
    private var alive = false
    private var lastTouch = 0L

    /** The screen stays on while she plays (reading takes longer than a phone's 30 s timeout),
     *  and is allowed to sleep again after a few minutes without a touch. */
    private val idleCheck = object : Runnable {
        override fun run() {
            if (SystemClock.uptimeMillis() - lastTouch >= AWAKE_MS) window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            else ui.postDelayed(this, 30_000)
        }
    }

    @SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        volumeControlStream = AudioManager.STREAM_MUSIC   // the volume keys change the voice's volume
        web = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true          // keeps the stars between sessions
            settings.mediaPlaybackRequiresUserGesture = false
            settings.textZoom = 100                    // a big system font size would break the layouts
            settings.setSupportZoom(false)
            setBackgroundColor(Color.parseColor("#0B1026"))
            webViewClient = AssetClient()
            addJavascriptInterface(TtsBridge(), "AndroidTTS")
            addJavascriptInterface(AudioBridge(), "AndroidAudio")
            addJavascriptInterface(AppBridge(), "AndroidApp")
        }
        setContentView(web)
        alive = true
        web.loadUrl(HOME_URL)
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
        fullScreen()
        touched()
    }

    override fun onPause() {
        stopClip()
        tts?.stop()
        web.evaluateJavascript("window.Speech && Speech.stop()", null)
        web.onPause()
        ui.removeCallbacks(idleCheck)
        super.onPause()
    }

    override fun onDestroy() {
        alive = false
        ui.removeCallbacksAndMessages(null)
        stopClip()
        tts?.shutdown(); tts = null; ttsReady = false
        web.destroy()
        super.onDestroy()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) fullScreen()
    }

    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        if (ev.actionMasked == MotionEvent.ACTION_DOWN) touched()
        return super.dispatchTouchEvent(ev)
    }

    private fun touched() {
        lastTouch = SystemClock.uptimeMillis()
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        ui.removeCallbacks(idleCheck)
        ui.postDelayed(idleCheck, 30_000)
    }

    /** No status or navigation bar while playing; a swipe from the edge shows them for a moment. */
    @Suppress("DEPRECATION")
    private fun fullScreen() {
        window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION)
    }

    /** The Back key (or back gesture) does what the on-screen Back button does. */
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        web.evaluateJavascript(GO_BACK_JS, null)
    }

    inner class AppBridge {
        /** Back on "Pick a mission": leave the app (there are no photos to go back to here). */
        @JavascriptInterface
        fun backToPhotos() { ui.post { if (alive) finish() } }
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
                WebResourceResponse(mime, if (text) "utf-8" else null, assets.open("www/$path"))
            } catch (e: Exception) {
                WebResourceResponse("text/plain", "utf-8", 404, "Not Found", emptyMap(), "".byteInputStream())
            }
        }

        /** Only the games' own pages open; any other link is ignored. */
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = request.url.host != HOST

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
     * Voice clips play natively, as on the frame (speech.js uses AndroidAudio when it's there).
     * rate != 1 is a silly voice (Roll & read, Zib) or the turtle's slow word: faster and higher,
     * or slower and deeper. Android 5 can't change speed, so there it plays at normal speed.
     */
    private fun playClip(key: String, token: Int, rate: Float) {
        stopClip()
        if (!alive) return
        if (!CLIP_KEY.matches(key)) { clipDone(token); return }
        val mp = MediaPlayer()
        try {
            mp.setAudioAttributes(AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_GAME)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build())
            try {
                assets.openFd("www/audio/$key.mp3").use { mp.setDataSource(it.fileDescriptor, it.startOffset, it.length) }
            } catch (e: java.io.FileNotFoundException) {
                // The asset was stored compressed, so it has no file descriptor: play a cached copy.
                mp.setDataSource(cachedClip(key).absolutePath)
            }
            mp.setOnCompletionListener { finishClip(it, token) }
            mp.setOnErrorListener { p, _, _ -> finishClip(p, token); true }
            mp.prepare()
            val l = savedLevel()
            val v = if (l >= 4) 1f else l / 4f
            mp.setVolume(v, v)
            val gain = when (l) { 5 -> 600; 6 -> 1200; else -> 0 }
            if (gain > 0) {
                try {
                    enhancer = LoudnessEnhancer(mp.audioSessionId).apply { setTargetGain(gain); enabled = true }
                } catch (e: Throwable) {
                    Log.w(TAG, "Volume boost isn't available on this device", e)
                }
            }
            player = mp
            if (Build.VERSION.SDK_INT >= 23 && rate !in 0.97f..1.03f) {
                val r = rate.coerceIn(0.5f, 2.0f)
                try { mp.playbackParams = mp.playbackParams.setSpeed(r).setPitch(r) } catch (e: Exception) { Log.w(TAG, "Couldn't change the speed", e) }
            }
            if (!mp.isPlaying) mp.start()
        } catch (e: Exception) {
            Log.w(TAG, "Couldn't play clip $key", e)
            if (player === mp) player = null
            releaseEnhancer()
            mp.release()
            clipDone(token)
        }
    }

    private fun cachedClip(key: String): File {
        val f = File(File(cacheDir, "audio").apply { mkdirs() }, "$key.mp3")
        if (!f.exists() || f.length() == 0L) {
            assets.open("www/audio/$key.mp3").use { input -> f.outputStream().use { input.copyTo(it) } }
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

    private fun stopClip() {
        val p = player ?: return
        player = null
        try { p.stop() } catch (e: Exception) {}
        releaseEnhancer()
        p.release()
    }

    private fun clipDone(token: Int) {
        if (alive) web.evaluateJavascript("window.__clipDone && window.__clipDone($token)", null)
    }

    private fun savedLevel() = audioPrefs.getInt("level", DEFAULT_LEVEL).coerceIn(0, MAX_LEVEL)

    inner class AudioBridge {
        /** Plays audio/<key>.mp3; calls window.__clipDone(token) when it ends or fails. */
        @JavascriptInterface
        fun play(key: String, token: Int) { ui.post { playClip(key, token, 1f) } }

        /** Like play(), faster and higher (rate up to 2.0) or slower and deeper (down to 0.5). */
        @JavascriptInterface
        fun playRate(key: String, token: Int, rate: Float) { ui.post { playClip(key, token, rate) } }

        @JavascriptInterface
        fun stop() { ui.post { stopClip() } }

        /** The game's volume level, 0 (off) to MAX_LEVEL: 1-4 a quarter to full, 5-6 boosted. */
        @JavascriptInterface
        fun level(): Int = savedLevel()

        @JavascriptInterface
        fun setLevel(n: Int) { audioPrefs.edit().putInt("level", n.coerceIn(0, MAX_LEVEL)).apply() }
    }

    /** Text-to-speech is only a fallback for when the recorded clips are missing; speech.js asks. */
    private fun startTts() {
        if (tts != null) return
        tts = TextToSpeech(this) { status ->
            ttsReady = status == TextToSpeech.SUCCESS
            ui.post { if (alive) web.evaluateJavascript("window.__ttsReady && window.__ttsReady()", null) }
        }
    }

    inner class TtsBridge {
        @JavascriptInterface
        fun enable() { ui.post { if (alive) startTts() } }

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
        fun cancel() { tts?.stop() }
    }

    companion object {
        private const val TAG = "SpaceWords"
        const val HOST = "wordhop.local"
        const val HOME_URL = "https://$HOST/index.html"
        const val MAX_LEVEL = 6
        /** Full volume without the boost (the frame starts boosted; phones are loud enough). */
        const val DEFAULT_LEVEL = 4
        /** Let the screen sleep again after this long without a touch. */
        private const val AWAKE_MS = 5 * 60_000L
        private val CLIP_KEY = Regex("[a-z0-9_]+")
        private const val GO_BACK_JS = "(function(){if(window.Turns&&Turns.back())return;" +
            "if(window.goBack){goBack();return;}" +
            "if(window.Speech)Speech.stop();" +
            "var m=document.querySelector('meta[name=parent]');" +
            "if(m)location.href=m.getAttribute('content');else if(window.AndroidApp)AndroidApp.backToPhotos();})()"
    }
}
