package com.wickedcrm.sms.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * MMS Deliver Receiver - Required for default SMS app
 */
class MmsDeliverReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        // Forward to main MMS receiver
        val mmsReceiver = MmsReceiver()
        mmsReceiver.onReceive(context, intent)
    }
}
