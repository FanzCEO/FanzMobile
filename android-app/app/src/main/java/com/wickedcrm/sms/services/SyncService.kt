package com.wickedcrm.sms.services

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.telephony.SmsManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.wickedcrm.sms.MainActivity
import com.wickedcrm.sms.R
import com.wickedcrm.sms.WickedSmsApp
import kotlinx.coroutines.*

/**
 * Background Sync Service
 *
 * Runs in the foreground to:
 * 1. Poll for outgoing messages from WickedCRM
 * 2. Send queued SMS messages
 * 3. Keep connection alive for real-time sync
 */
class SyncService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var isRunning = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Sync service created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startSync()
            ACTION_STOP -> stopSync()
        }
        return START_STICKY
    }

    private fun startSync() {
        if (isRunning) return

        isRunning = true
        startForeground(NOTIFICATION_ID, createNotification())

        // Start polling loop
        scope.launch {
            while (isRunning) {
                try {
                    pollOutgoingMessages()
                } catch (e: Exception) {
                    Log.e(TAG, "Polling error", e)
                }
                delay(POLL_INTERVAL_MS)
            }
        }

        Log.d(TAG, "Sync service started")
    }

    private fun stopSync() {
        isRunning = false
        scope.cancel()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        Log.d(TAG, "Sync service stopped")
    }

    private suspend fun pollOutgoingMessages() {
        val app = application as WickedSmsApp

        try {
            val response = app.api.getOutgoingMessages()

            if (response.isSuccessful) {
                val messages = response.body() ?: emptyList()

                for (msg in messages) {
                    if (msg.status == "pending") {
                        sendSms(msg.to, msg.body)

                        // Mark as sent
                        app.api.markMessageSent(msg.id)
                        Log.d(TAG, "Sent and marked: ${msg.id}")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to poll outgoing messages", e)
        }
    }

    private fun sendSms(phoneNumber: String, message: String) {
        try {
            val smsManager = getSystemService(SmsManager::class.java)

            // Handle long messages
            if (message.length > 160) {
                val parts = smsManager.divideMessage(message)
                smsManager.sendMultipartTextMessage(
                    phoneNumber,
                    null,
                    parts,
                    null,
                    null
                )
            } else {
                smsManager.sendTextMessage(
                    phoneNumber,
                    null,
                    message,
                    null,
                    null
                )
            }

            Log.d(TAG, "SMS sent to $phoneNumber")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send SMS to $phoneNumber", e)
        }
    }

    private fun createNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, WickedSmsApp.CHANNEL_SYNC)
            .setSmallIcon(R.drawable.ic_sync)
            .setContentTitle("WickedCRM SMS")
            .setContentText("Syncing messages...")
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
        Log.d(TAG, "Sync service destroyed")
    }

    companion object {
        private const val TAG = "SyncService"
        private const val NOTIFICATION_ID = 1001
        private const val POLL_INTERVAL_MS = 5000L // 5 seconds

        const val ACTION_START = "com.wickedcrm.sms.START_SYNC"
        const val ACTION_STOP = "com.wickedcrm.sms.STOP_SYNC"

        fun start(context: Context) {
            val intent = Intent(context, SyncService::class.java).apply {
                action = ACTION_START
            }
            context.startForegroundService(intent)
        }

        fun stop(context: Context) {
            val intent = Intent(context, SyncService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }
}
