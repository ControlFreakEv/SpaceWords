package com.wordhop.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.audiofx.LoudnessEnhancer
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.speech.tts.TextToSpeech
import android.speech.tts.Voice
import android.util.Log
import android.view.View
import android.view.ViewGroup
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
 * Full-screen host for the Space Words games.
 * The game, fonts and pictures are bundled in assets/www and served from https://wordhop.local/,
 * so it runs fully offline. Speech goes through Android's TextToSpeech via the "AndroidTTS" bridge.
 * Works on Android 5.1 (API 22) and up.
 */
class GameActivity : Activity() {

    private lateinit var web: WebView
    private var tts: TextToSpeech? = null
    private var player: MediaPlayer? = null
    private var enhancer: LoudnessEnhancer? = null
    private val am by lazy { getSystemService(AUDIO_SERVICE) as AudioManager }
    private val audioPrefs by lazy { getSharedPreferences("audio", MODE_PRIVATE) }
    /** The frame's own media volume, put back when the game closes so Skylight is unchanged. */
    private var frameVolume = -1
    @Volatile private var ttsReady = false

    @SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        web = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true          // keeps her stars between sessions
            settings.mediaPlaybackRequiresUserGesture = false
            setBackgroundColor(Color.parseColor("#0B1026"))
            webViewClient = AssetClient()
            addJavascriptInterface(TtsBridge(), "AndroidTTS")
            addJavascriptInterface(AudioBridge(), "AndroidAudio")
            addJavascriptInterface(AppBridge(), "AndroidApp")
        }

        val root = FrameLayout(this)
        root.addView(web, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        setContentView(root)
        volumeControlStream = AudioManager.STREAM_MUSIC
        hideSystemBars()
        web.loadUrl(HOME_URL)

        ensureBubble()
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


    @Suppress("DEPRECATION")
    private fun hideSystemBars() {
        window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE)
    }

    private fun ensureBubble() {
        if (canOverlay(this)) {
            startBubble(this)
        } else if (Build.VERSION.SDK_INT >= 23) {
            startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")))
        }
    }

    override fun onResume() {
        super.onResume()
        hideSystemBars()
        if (canOverlay(this)) showBubble(this, false)   // hide the UFO while the game is open (starts it if needed)
        if (frameVolume < 0) frameVolume = am.getStreamVolume(AudioManager.STREAM_MUSIC)
        applyLevel()
    }

    override fun onPause() {
        super.onPause()
        tts?.stop()
        stopClip()
        if (frameVolume >= 0) {
            try { am.setStreamVolume(AudioManager.STREAM_MUSIC, frameVolume, 0) } catch (e: Exception) {}
            frameVolume = -1
        }
        if (canOverlay(this)) showBubble(this, true)
    }

    /**
     * The Back key does exactly what the on-screen Back button does (each page's goBack()):
     * game -> level list -> picker -> "Pick a mission" -> photos.
     */
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        val url = web.url
        if (url == null || !url.contains(HOST)) backToSkylight() else web.evaluateJavascript(GO_BACK_JS, null)
    }

    /** Lets "Back" on the "Pick a mission" page return to the photos. */
    inner class AppBridge {
        @JavascriptInterface
        fun backToPhotos() { runOnUiThread { backToSkylight() } }
    }

    /**
     * Brings the Skylight app back to the front, then closes the game.
     * A bare finish() leaves a black screen for about a minute until skylight.watchdog
     * notices and relaunches Skylight, so we launch it ourselves first.
     */
    private fun backToSkylight() {
        val pm = packageManager
        val launch = pm.getLaunchIntentForPackage(SKYLIGHT_PKG)
            ?: pm.getLeanbackLaunchIntentForPackage(SKYLIGHT_PKG)
            ?: Intent(Intent.ACTION_MAIN).setPackage(SKYLIGHT_PKG)
                .takeIf { it.resolveActivity(pm) != null }
            ?: Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
        try {
            startActivity(launch)
        } catch (e: Exception) {
            // Nothing could be launched; finishing still hands control back to the watchdog.
        }
        finish()
    }


    override fun onDestroy() {
        stopClip()
        tts?.shutdown()
        web.destroy()
        super.onDestroy()
    }

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    /*
     * Voice clips are played natively. The frame's old WebView (Chromium 39) hands <audio> to
     * Android's MediaPlayer, which fetches the URL itself and never goes through
     * shouldInterceptRequest, so https://wordhop.local/audio/... can't load and stays silent.
     */
    private fun playClip(key: String, token: Int) {
        stopClip()
        if (!CLIP_KEY.matches(key)) { clipDone(token); return }
        val mp = MediaPlayer()
        try {
            mp.setAudioStreamType(AudioManager.STREAM_MUSIC)
            try {
                assets.openFd("www/audio/$key.mp3").use { mp.setDataSource(it.fileDescriptor, it.startOffset, it.length) }
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
        web.evaluateJavascript("window.__clipDone && window.__clipDone($token)", null)
    }

    inner class AudioBridge {
        /** Plays audio/<key>.mp3; calls window.__clipDone(token) when it ends or fails. */
        @JavascriptInterface
        fun play(key: String, token: Int) { runOnUiThread { playClip(key, token) } }

        @JavascriptInterface
        fun stop() { runOnUiThread { stopClip() } }

        /** The game's volume level, 0 (off) to MAX_LEVEL. */
        @JavascriptInterface
        fun level(): Int = savedLevel()

        @JavascriptInterface
        fun setLevel(n: Int) {
            audioPrefs.edit().putInt("level", n.coerceIn(0, MAX_LEVEL)).apply()
            runOnUiThread { applyLevel() }
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
        tts = TextToSpeech(this) { status ->
            ttsReady = status == TextToSpeech.SUCCESS
            runOnUiThread { web.evaluateJavascript("window.__ttsReady && window.__ttsReady()", null) }
        }
    }

    inner class TtsBridge {
        @JavascriptInterface
        fun enable() { runOnUiThread { startTts() } }


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
        const val HOST = "wordhop.local"
        const val HOME_URL = "https://$HOST/index.html"
        const val SKYLIGHT_PKG = "com.skylight"
        const val MAX_LEVEL = 6
        const val DEFAULT_LEVEL = 5
        private val CLIP_KEY = Regex("[a-z0-9_]+")
        private const val GO_BACK_JS = "(function(){if(window.goBack){goBack();return;}" +
            "if(window.Speech)Speech.stop();" +
            "var m=document.querySelector('meta[name=parent]');" +
            "if(m)location.href=m.getAttribute('content');else if(window.AndroidApp)AndroidApp.backToPhotos();})()"
    }
}
