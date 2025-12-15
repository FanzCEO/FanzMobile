package com.wickedcrm.sms.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * SMS Deliver Receiver - Required for default SMS app
 *
 * When the app is set as the default SMS app, this receiver
 * handles SMS_DELIVER broadcasts instead of SMS_RECEIVED.
 */
class SmsDeliverReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        // Forward to main SMS receiver for processing
        val smsReceiver = SmsReceiver()
        smsReceiver.onReceive(context, intent)
    }
}
