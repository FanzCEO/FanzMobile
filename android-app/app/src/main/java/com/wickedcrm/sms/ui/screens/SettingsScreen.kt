package com.wickedcrm.sms.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.wickedcrm.sms.WickedSmsApp
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var showDeleteAllDialog by remember { mutableStateOf(false) }
    var showDeleteSyncedDialog by remember { mutableStateOf(false) }
    var showClearCacheDialog by remember { mutableStateOf(false) }
    var isDeleting by remember { mutableStateOf(false) }
    var deleteSuccess by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(vertical = 8.dp)
        ) {
            item {
                SettingsSectionHeader("Data & Privacy")
            }

            item {
                SettingsItem(
                    icon = Icons.Default.Delete,
                    title = "Delete All My Data",
                    subtitle = "Remove all messages and synced data from this device and servers",
                    onClick = { showDeleteAllDialog = true }
                )
            }

            item {
                SettingsItem(
                    icon = Icons.Default.Lock,
                    title = "Delete Synced Data Only",
                    subtitle = "Remove data from WickedCRM servers but keep local messages",
                    onClick = { showDeleteSyncedDialog = true }
                )
            }

            item {
                SettingsItem(
                    icon = Icons.Default.Refresh,
                    title = "Clear Local Cache",
                    subtitle = "Clear cached data without deleting messages",
                    onClick = { showClearCacheDialog = true }
                )
            }

            item {
                Divider(modifier = Modifier.padding(vertical = 8.dp))
            }

            item {
                SettingsSectionHeader("Account")
            }

            item {
                SettingsItem(
                    icon = Icons.Default.Share,
                    title = "Export My Data",
                    subtitle = "Download a copy of all your data",
                    onClick = {
                        scope.launch {
                            try {
                                WickedSmsApp.instance.messageRepository.exportUserData()
                                deleteSuccess = "Data exported to Downloads folder"
                            } catch (e: Exception) {
                                deleteSuccess = "Export failed: ${e.message}"
                            }
                        }
                    }
                )
            }

            item {
                Divider(modifier = Modifier.padding(vertical = 8.dp))
            }

            item {
                SettingsSectionHeader("About")
            }

            item {
                SettingsItem(
                    icon = Icons.Default.Info,
                    title = "Privacy Policy",
                    subtitle = "View our privacy policy",
                    onClick = { /* Open privacy policy URL */ }
                )
            }

            item {
                SettingsItem(
                    icon = Icons.Default.List,
                    title = "Terms of Service",
                    subtitle = "View terms and conditions",
                    onClick = { /* Open terms URL */ }
                )
            }

            item {
                SettingsItem(
                    icon = Icons.Default.Build,
                    title = "Version",
                    subtitle = "1.0.0",
                    onClick = { }
                )
            }
        }

        // Delete All Data Dialog
        if (showDeleteAllDialog) {
            AlertDialog(
                onDismissRequest = { showDeleteAllDialog = false },
                icon = { Icon(Icons.Default.Warning, contentDescription = null, tint = MaterialTheme.colorScheme.error) },
                title = { Text("Delete All Data?") },
                text = {
                    Text(
                        "This will permanently delete:\n\n" +
                        "• All messages on this device\n" +
                        "• All data synced to WickedCRM servers\n" +
                        "• Your conversation history\n\n" +
                        "This action cannot be undone."
                    )
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            showDeleteAllDialog = false
                            scope.launch {
                                isDeleting = true
                                try {
                                    WickedSmsApp.instance.messageRepository.deleteAllUserData()
                                    deleteSuccess = "All data has been deleted"
                                } catch (e: Exception) {
                                    deleteSuccess = "Error: ${e.message}"
                                }
                                isDeleting = false
                            }
                        },
                        colors = ButtonDefaults.textButtonColors(
                            contentColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Text("Delete Everything")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteAllDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }

        // Delete Synced Data Dialog
        if (showDeleteSyncedDialog) {
            AlertDialog(
                onDismissRequest = { showDeleteSyncedDialog = false },
                icon = { Icon(Icons.Default.Lock, contentDescription = null) },
                title = { Text("Delete Synced Data?") },
                text = {
                    Text(
                        "This will delete all your data from WickedCRM servers.\n\n" +
                        "Your local messages on this device will not be affected.\n\n" +
                        "This action cannot be undone."
                    )
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            showDeleteSyncedDialog = false
                            scope.launch {
                                isDeleting = true
                                try {
                                    WickedSmsApp.instance.messageRepository.deleteSyncedData()
                                    deleteSuccess = "Synced data has been deleted from servers"
                                } catch (e: Exception) {
                                    deleteSuccess = "Error: ${e.message}"
                                }
                                isDeleting = false
                            }
                        },
                        colors = ButtonDefaults.textButtonColors(
                            contentColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Text("Delete from Servers")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteSyncedDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }

        // Clear Cache Dialog
        if (showClearCacheDialog) {
            AlertDialog(
                onDismissRequest = { showClearCacheDialog = false },
                title = { Text("Clear Cache?") },
                text = {
                    Text("This will clear temporary cached data. Your messages will not be deleted.")
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            showClearCacheDialog = false
                            scope.launch {
                                try {
                                    WickedSmsApp.instance.messageRepository.clearCache()
                                    deleteSuccess = "Cache cleared"
                                } catch (e: Exception) {
                                    deleteSuccess = "Error: ${e.message}"
                                }
                            }
                        }
                    ) {
                        Text("Clear")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showClearCacheDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }

        // Success/Error Snackbar
        deleteSuccess?.let { message ->
            Snackbar(
                modifier = Modifier.padding(16.dp),
                action = {
                    TextButton(onClick = { deleteSuccess = null }) {
                        Text("Dismiss")
                    }
                }
            ) {
                Text(message)
            }
        }

        // Loading overlay
        if (isDeleting) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Card {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator()
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Deleting data...")
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsSectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleSmall,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
    )
}

@Composable
fun SettingsItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(24.dp)
            )

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
