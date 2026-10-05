package com.wordhop.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.speech.tts.TextToSpeech
import android.speech.tts.Voice
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.TextView
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
    private lateinit var closeBtn: View
    private var tts: TextToSpeech? = null
    private var player: MediaPlayer? = null
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
        }

        tts = TextToSpeech(this) { status ->
            ttsReady = status == TextToSpeech.SUCCESS
            runOnUiThread { web.evaluateJavascript("window.__ttsReady && window.__ttsReady()", null) }
        }

        val root = FrameLayout(this)
        root.addView(web, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        closeBtn = closeButton()
        root.addView(closeBtn, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM or Gravity.END
        ).apply { val m = dp(20); setMargins(m, m, m, m) })
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

        /** The "Back to photos" button only shows on the game picker. */
        override fun onPageFinished(view: WebView, url: String) {
            closeBtn.visibility = if (isHome(url)) View.VISIBLE else View.GONE
        }
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

    private fun closeButton(): View = TextView(this).apply {
        text = "\u2190  Back to photos"
        textSize = 18f
        setTextColor(Color.parseColor("#1F2A44"))
        setPadding(dp(20), dp(12), dp(20), dp(12))
        background = GradientDrawable().apply {
            cornerRadius = dp(999).toFloat()
            setColor(Color.WHITE)
            setStroke(dp(3), Color.parseColor("#1F2A44"))
        }
        elevation = dp(6).toFloat()
        setOnClickListener { backToSkylight() }
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
        if (canOverlay(this)) startBubble(this)
        BubbleService.setVisible(false)   // hide the UFO while the game is open
    }

    override fun onPause() {
        super.onPause()
        tts?.stop()
        stopClip()
        BubbleService.setVisible(true)
    }

    /** Back steps up one level: game -> its hub (from <meta name="parent">) -> picker -> photos. */
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (isHome(web.url)) backToSkylight() else web.evaluateJavascript(GO_TO_PARENT_JS, null)
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

    private fun isHome(url: String?) = url == null || url.endsWith("/index.html") || url.endsWith("$HOST/")

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

    private fun finishClip(mp: MediaPlayer, token: Int) {
        if (player === mp) { player = null; mp.release() }
        clipDone(token)
    }

    private fun stopClip() {
        val p = player ?: return
        player = null
        try { p.stop() } catch (e: Exception) {}
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

        /** Media volume as "current/max", so the games can say when the frame is muted. */
        @JavascriptInterface
        fun volume(): String {
            val am = getSystemService(AUDIO_SERVICE) as AudioManager
            return am.getStreamVolume(AudioManager.STREAM_MUSIC).toString() + "/" +
                am.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        }
    }

    inner class TtsBridge {

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
        private val CLIP_KEY = Regex("[a-z0-9_]+")
        private const val GO_TO_PARENT_JS = "(function(){if(window.Speech)Speech.stop();" +
            "var m=document.querySelector('meta[name=parent]');" +
            "location.href=m?m.getAttribute('content'):'index.html';})()"
    }
}
