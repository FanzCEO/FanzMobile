package com.wickedcrm.sms

import android.Manifest
import android.app.role.RoleManager
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Telephony
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.core.content.ContextCompat
import com.wickedcrm.sms.services.SyncService
import com.wickedcrm.sms.ui.screens.MainScreen
import com.wickedcrm.sms.ui.theme.WickedSmsTheme

class MainActivity : ComponentActivity() {

    private val requiredPermissions = arrayOf(
        Manifest.permission.RECEIVE_SMS,
        Manifest.permission.SEND_SMS,
        Manifest.permission.READ_SMS,
        Manifest.permission.READ_CONTACTS,
        Manifest.permission.READ_PHONE_STATE
    )

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.all { it.value }
        if (allGranted) {
            checkDefaultSmsApp()
        }
    }

    private val defaultSmsLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (isDefaultSmsApp()) {
            startSyncService()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            WickedSmsTheme {
                var showPermissionDialog by remember { mutableStateOf(false) }
                var showDefaultSmsDialog by remember { mutableStateOf(false) }

                LaunchedEffect(Unit) {
                    when {
                        !hasAllPermissions() -> showPermissionDialog = true
                        !isDefaultSmsApp() -> showDefaultSmsDialog = true
                        else -> startSyncService()
                    }
                }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainScreen()
                }

                if (showPermissionDialog) {
                    PermissionDialog(
                        onConfirm = {
                            showPermissionDialog = false
                            requestPermissions()
                        },
                        onDismiss = { showPermissionDialog = false }
                    )
                }

                if (showDefaultSmsDialog) {
                    DefaultSmsDialog(
                        onConfirm = {
                            showDefaultSmsDialog = false
                            requestDefaultSmsApp()
                        },
                        onDismiss = { showDefaultSmsDialog = false }
                    )
                }
            }
        }
    }

    private fun hasAllPermissions(): Boolean {
        return requiredPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun requestPermissions() {
        permissionLauncher.launch(requiredPermissions)
    }

    private fun isDefaultSmsApp(): Boolean {
        return Telephony.Sms.getDefaultSmsPackage(this) == packageName
    }

    private fun checkDefaultSmsApp() {
        if (!isDefaultSmsApp()) {
            requestDefaultSmsApp()
        } else {
            startSyncService()
        }
    }

    private fun requestDefaultSmsApp() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(RoleManager::class.java)
            if (roleManager.isRoleAvailable(RoleManager.ROLE_SMS)) {
                val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_SMS)
                defaultSmsLauncher.launch(intent)
            }
        } else {
            val intent = Intent(Telephony.Sms.Intents.ACTION_CHANGE_DEFAULT).apply {
                putExtra(Telephony.Sms.Intents.EXTRA_PACKAGE_NAME, packageName)
            }
            defaultSmsLauncher.launch(intent)
        }
    }

    private fun startSyncService() {
        SyncService.start(this)
    }
}

@Composable
fun PermissionDialog(
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("SMS Permissions Required") },
        text = {
            Text(
                "WickedCRM SMS needs permission to read, send, and receive SMS messages " +
                "to work as your default messaging app."
            )
        },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text("Grant Permissions")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Later")
            }
        }
    )
}

@Composable
fun DefaultSmsDialog(
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Set as Default SMS App") },
        text = {
            Text(
                "To receive all your messages in WickedCRM, you need to set it as your " +
                "default SMS app. This allows:\n\n" +
                "- Receiving all SMS/MMS messages\n" +
                "- AI-powered spam filtering\n" +
                "- Automatic sync to WickedCRM\n" +
                "- Contact verification"
            )
        },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text("Set as Default")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Not Now")
            }
        }
    )
}
