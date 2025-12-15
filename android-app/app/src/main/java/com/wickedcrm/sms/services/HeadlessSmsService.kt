package com.wickedcrm.sms.services

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.telephony.SmsManager
import android.util.Log

/**
 * Headless SMS Service - Required for default SMS app
 *
 * Handles "respond via message" functionality from the dialer
 * when declining a call with a text message.
 */
class HeadlessSmsService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null) {
            stopSelf()
            return START_NOT_STICKY
        }

        val phoneNumber = intent.dataString?.removePrefix("smsto:")
            ?: intent.dataString?.removePrefix("sms:")

        val message = intent.getStringExtra(Intent.EXTRA_TEXT)
            ?: intent.getStringExtra("sms_body")

        if (phoneNumber != null && message != null) {
            sendSms(phoneNumber, message)
        }

        stopSelf()
        return START_NOT_STICKY
    }

    private fun sendSms(phoneNumber: String, message: String) {
        try {
            val smsManager = getSystemService(SmsManager::class.java)
            smsManager.sendTextMessage(
                phoneNumber,
                null,
                message,
                null,
                null
            )
            Log.d(TAG, "Headless SMS sent to $phoneNumber")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send headless SMS", e)
        }
    }

    companion object {
        private const val TAG = "HeadlessSmsService"
    }
}
