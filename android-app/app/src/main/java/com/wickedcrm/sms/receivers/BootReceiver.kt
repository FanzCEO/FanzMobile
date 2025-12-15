package com.wickedcrm.sms.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.wickedcrm.sms.services.SyncService

/**
 * Boot Receiver - Start sync service on device boot
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d(TAG, "Device booted, starting sync service")
            SyncService.start(context)
        }
    }

    companion object {
        private const val TAG = "BootReceiver"
    }
}
