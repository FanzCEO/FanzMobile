package com.wickedcrm.sms

import android.os.Bundle
import android.telephony.SmsManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.wickedcrm.sms.ui.theme.WickedSmsTheme
import kotlinx.coroutines.launch

/**
 * Activity for composing new SMS messages
 *
 * Handles intents like:
 * - sms:+1234567890
 * - smsto:+1234567890
 * - ACTION_SEND with text
 */
class ComposeSmsActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Parse phone number from intent
        val phoneNumber = intent?.data?.schemeSpecificPart
            ?: intent?.getStringExtra("address")
            ?: ""

        // Parse pre-filled message body
        val messageBody = intent?.getStringExtra("sms_body")
            ?: intent?.getStringExtra(android.content.Intent.EXTRA_TEXT)
            ?: ""

        setContent {
            WickedSmsTheme {
                ComposeScreen(
                    initialPhoneNumber = phoneNumber,
                    initialMessage = messageBody,
                    onSend = { phone, message ->
                        sendSms(phone, message)
                        finish()
                    },
                    onBack = { finish() }
                )
            }
        }
    }

    private fun sendSms(phoneNumber: String, message: String) {
        try {
            val smsManager = getSystemService(SmsManager::class.java)

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

            // Also sync to backend
            kotlinx.coroutines.GlobalScope.launch {
                try {
                    WickedSmsApp.instance.messageRepository.queueMessage(phoneNumber, message)
                } catch (e: Exception) {
                    // Ignore sync errors
                }
            }
        } catch (e: Exception) {
            // Handle send error
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComposeScreen(
    initialPhoneNumber: String,
    initialMessage: String,
    onSend: (String, String) -> Unit,
    onBack: () -> Unit
) {
    var phoneNumber by remember { mutableStateOf(initialPhoneNumber) }
    var message by remember { mutableStateOf(initialMessage) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("New Message") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            OutlinedTextField(
                value = phoneNumber,
                onValueChange = { phoneNumber = it },
                label = { Text("To") },
                placeholder = { Text("Phone number") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = message,
                onValueChange = { message = it },
                label = { Text("Message") },
                placeholder = { Text("Type your message...") },
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                    if (phoneNumber.isNotBlank() && message.isNotBlank()) {
                        onSend(phoneNumber, message)
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = phoneNumber.isNotBlank() && message.isNotBlank(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Send, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Send")
            }
        }
    }
}
