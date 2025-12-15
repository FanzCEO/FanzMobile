package com.wickedcrm.sms.receivers

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log
import androidx.core.app.NotificationCompat
import com.wickedcrm.sms.MainActivity
import com.wickedcrm.sms.R
import com.wickedcrm.sms.WickedSmsApp
import com.wickedcrm.sms.data.model.SyncMessageRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

/**
 * SMS Broadcast Receiver - Receives all incoming SMS messages
 *
 * This receiver intercepts SMS messages and:
 * 1. Syncs them to WickedCRM backend
 * 2. Runs spam check via verification API
 * 3. Shows notification (or blocks if spam)
 */
class SmsReceiver : BroadcastReceiver() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isEmpty()) return

        // Combine message parts
        val senderNumber = messages[0].originatingAddress ?: return
        val messageBody = messages.joinToString("") { it.messageBody ?: "" }
        val timestamp = messages[0].timestampMillis

        Log.d(TAG, "Received SMS from $senderNumber: ${messageBody.take(50)}...")

        // Process in background
        scope.launch {
            processIncomingSms(context, senderNumber, messageBody, timestamp)
        }
    }

    private suspend fun processIncomingSms(
        context: Context,
        sender: String,
        body: String,
        timestamp: Long
    ) {
        val app = context.applicationContext as WickedSmsApp

        try {
            // 1. Screen the incoming message
            val screenResult = app.api.screenIncoming(sender, body.take(100))

            if (screenResult.isSuccessful) {
                val result = screenResult.body()

                when (result?.action) {
                    "block" -> {
                        Log.d(TAG, "Blocked message from $sender: ${result.reason}")
                        showSpamNotification(context, sender, result.reason)
                        return // Don't process blocked messages
                    }
                    "warn" -> {
                        Log.d(TAG, "Warning for message from $sender: ${result.reason}")
                        showWarningNotification(context, sender, body, result.reason)
                    }
                    else -> {
                        // Allow - show normal notification
                        showMessageNotification(context, sender, body, result?.contactName)
                    }
                }
            } else {
                // API failed, show notification anyway
                showMessageNotification(context, sender, body, null)
            }

            // 2. Sync to backend
            val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
            val syncRequest = SyncMessageRequest(
                body = body,
                channel = "sms",
                direction = "inbound",
                externalId = "${sender}_$timestamp",
                contactPhone = sender,
                contactName = null, // Could look up from contacts
                receivedAt = dateFormat.format(Date(timestamp))
            )

            val syncResponse = app.api.syncMessage(syncRequest)
            if (syncResponse.isSuccessful) {
                Log.d(TAG, "Message synced: ${syncResponse.body()?.id}")
            } else {
                Log.e(TAG, "Sync failed: ${syncResponse.code()}")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error processing SMS", e)
            // Still show notification on error
            showMessageNotification(context, sender, body, null)
        }
    }

    private fun showMessageNotification(
        context: Context,
        sender: String,
        body: String,
        contactName: String?
    ) {
        val notificationManager = context.getSystemService(NotificationManager::class.java)

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("phone_number", sender)
        }

        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val displayName = contactName ?: sender

        val notification = NotificationCompat.Builder(context, WickedSmsApp.CHANNEL_MESSAGES)
            .setSmallIcon(R.drawable.ic_message)
            .setContentTitle(displayName)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(Notification.CATEGORY_MESSAGE)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        notificationManager.notify(sender.hashCode(), notification)
    }

    private fun showWarningNotification(
        context: Context,
        sender: String,
        body: String,
        warningReason: String
    ) {
        val notificationManager = context.getSystemService(NotificationManager::class.java)

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("phone_number", sender)
        }

        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, WickedSmsApp.CHANNEL_SPAM)
            .setSmallIcon(R.drawable.ic_warning)
            .setContentTitle("Potential Spam: $sender")
            .setContentText("$warningReason\n$body")
            .setStyle(NotificationCompat.BigTextStyle().bigText("$warningReason\n\n$body"))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(Notification.CATEGORY_MESSAGE)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setColor(0xFFFF9800.toInt()) // Orange warning color
            .build()

        notificationManager.notify(sender.hashCode(), notification)
    }

    private fun showSpamNotification(
        context: Context,
        sender: String,
        reason: String
    ) {
        val notificationManager = context.getSystemService(NotificationManager::class.java)

        val notification = NotificationCompat.Builder(context, WickedSmsApp.CHANNEL_SPAM)
            .setSmallIcon(R.drawable.ic_block)
            .setContentTitle("Blocked: $sender")
            .setContentText(reason)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setAutoCancel(true)
            .setColor(0xFFF44336.toInt()) // Red blocked color
            .build()

        notificationManager.notify(sender.hashCode(), notification)
    }

    companion object {
        private const val TAG = "SmsReceiver"
    }
}
