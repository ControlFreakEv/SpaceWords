package com.wordhop.app

import android.app.job.JobInfo
import android.app.job.JobParameters
import android.app.job.JobScheduler
import android.app.job.JobService
import android.content.ComponentName
import android.content.Context
import android.service.notification.NotificationListenerService
import android.util.Log

/*
 * Bringing the UFO back after the frame restarts.
 *
 * This frame refuses to start an app for a broadcast ("Unable to launch app ... process is bad",
 * even for its own Gallery app), so BootReceiver never runs at boot. Starting the app for a
 * *service* works (that is how deploy.ps1 brings the UFO back). So two system services that bind
 * to apps' services by themselves after boot are used to wake the UFO:
 *  - UfoListener: Android binds every enabled notification listener at boot and keeps it bound
 *    (rebinding if the process dies). deploy.ps1 turns it on over adb:
 *    settings secure enabled_notification_listeners. It ignores the notifications themselves.
 *  - UfoJob: a saved (persisted) periodic job; the job scheduler reloads it at boot and runs it
 *    within 15 minutes. Needs no settings, so it is the fallback.
 * Both only start BubbleService, which does nothing if the UFO is already showing.
 */

private const val TAG = "SpaceWords"
private const val JOB_ID = 7301

/** Starts the UFO service if it may draw over other apps; never throws. */
fun wakeUfo(context: Context, why: String) {
    try {
        if (!canOverlay(context)) return
        Log.i(TAG, "UFO woken by $why")
        startBubble(context)
    } catch (e: Exception) {
        Log.w(TAG, "Couldn't wake the UFO ($why)", e)
    }
}

/** Saves the periodic UFO job once (it survives restarts); safe to call often. */
fun scheduleUfoJob(context: Context) {
    try {
        val js = context.getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler
        if (js.allPendingJobs.any { it.id == JOB_ID }) return
        val job = JobInfo.Builder(JOB_ID, ComponentName(context, UfoJob::class.java))
            .setPeriodic(15 * 60 * 1000L)
            .setPersisted(true)
            .build()
        js.schedule(job)
    } catch (e: Exception) {
        Log.w(TAG, "Couldn't save the UFO job", e)
    }
}

class UfoListener : NotificationListenerService() {
    override fun onCreate() {
        super.onCreate()
        wakeUfo(this, "notification listener")
    }
}

class UfoJob : JobService() {
    override fun onStartJob(params: JobParameters?): Boolean {
        wakeUfo(this, "job")
        return false
    }

    override fun onStopJob(params: JobParameters?): Boolean = false
}
