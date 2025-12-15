package com.wickedcrm.sms.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * MMS Broadcast Receiver - Receives incoming MMS messages
 */
class MmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "MMS received")
        // MMS handling would go here
        // For now, just log it - full MMS support requires more complex handling
    }

    companion object {
        private const val TAG = "MmsReceiver"
    }
}
