package com.wickedcrm.sms.data.repository

import android.content.ContentResolver
import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.provider.Telephony
import android.util.Log
import com.wickedcrm.sms.data.api.WickedCrmApi
import com.wickedcrm.sms.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

/**
 * Message Repository - Handles local SMS database and API sync
 */
class MessageRepository(
    private val api: WickedCrmApi,
    private val context: Context
) {

    private val contentResolver: ContentResolver = context.contentResolver
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)

    // ============== LOCAL SMS DATABASE ==============

    /**
     * Get all conversations from device SMS database
     */
    suspend fun getConversations(): List<Conversation> = withContext(Dispatchers.IO) {
        val conversations = mutableListOf<Conversation>()

        try {
            val cursor = contentResolver.query(
                Telephony.Sms.CONTENT_URI,
                arrayOf(
                    Telephony.Sms.ADDRESS,
                    Telephony.Sms.BODY,
                    Telephony.Sms.DATE,
                    Telephony.Sms.TYPE,
                    Telephony.Sms.READ
                ),
                null,
                null,
                "${Telephony.Sms.DATE} DESC"
            )

            cursor?.use {
                val addressIndex = it.getColumnIndex(Telephony.Sms.ADDRESS)
                val bodyIndex = it.getColumnIndex(Telephony.Sms.BODY)
                val dateIndex = it.getColumnIndex(Telephony.Sms.DATE)
                val typeIndex = it.getColumnIndex(Telephony.Sms.TYPE)
                val readIndex = it.getColumnIndex(Telephony.Sms.READ)

                val seen = mutableSetOf<String>()

                while (it.moveToNext()) {
                    val address = it.getString(addressIndex) ?: continue
                    if (address in seen) continue
                    seen.add(address)

                    val body = it.getString(bodyIndex) ?: ""
                    val date = it.getLong(dateIndex)
                    val type = it.getInt(typeIndex)
                    val read = it.getInt(readIndex) == 1

                    conversations.add(
                        Conversation(
                            phoneNumber = address,
                            lastMessage = body,
                            lastMessageTime = date,
                            isOutgoing = type == Telephony.Sms.MESSAGE_TYPE_SENT,
                            isRead = read,
                            unreadCount = if (read) 0 else getUnreadCount(address)
                        )
                    )
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error reading conversations", e)
        }

        conversations
    }

    /**
     * Get messages for a specific phone number
     */
    suspend fun getMessagesForNumber(phoneNumber: String): List<LocalSmsMessage> = withContext(Dispatchers.IO) {
        val messages = mutableListOf<LocalSmsMessage>()

        try {
            val cursor = contentResolver.query(
                Telephony.Sms.CONTENT_URI,
                arrayOf(
                    Telephony.Sms._ID,
                    Telephony.Sms.ADDRESS,
                    Telephony.Sms.BODY,
                    Telephony.Sms.DATE,
                    Telephony.Sms.TYPE,
                    Telephony.Sms.READ
                ),
                "${Telephony.Sms.ADDRESS} = ?",
                arrayOf(phoneNumber),
                "${Telephony.Sms.DATE} ASC"
            )

            cursor?.use {
                val idIndex = it.getColumnIndex(Telephony.Sms._ID)
                val bodyIndex = it.getColumnIndex(Telephony.Sms.BODY)
                val dateIndex = it.getColumnIndex(Telephony.Sms.DATE)
                val typeIndex = it.getColumnIndex(Telephony.Sms.TYPE)

                while (it.moveToNext()) {
                    val id = it.getLong(idIndex)
                    val body = it.getString(bodyIndex) ?: ""
                    val date = it.getLong(dateIndex)
                    val type = it.getInt(typeIndex)

                    messages.add(
                        LocalSmsMessage(
                            id = id,
                            phoneNumber = phoneNumber,
                            body = body,
                            timestamp = date,
                            isOutgoing = type == Telephony.Sms.MESSAGE_TYPE_SENT
                        )
                    )
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error reading messages for $phoneNumber", e)
        }

        messages
    }

    private fun getUnreadCount(phoneNumber: String): Int {
        return try {
            val cursor = contentResolver.query(
                Telephony.Sms.CONTENT_URI,
                arrayOf(Telephony.Sms._ID),
                "${Telephony.Sms.ADDRESS} = ? AND ${Telephony.Sms.READ} = 0",
                arrayOf(phoneNumber),
                null
            )
            cursor?.count?.also { cursor.close() } ?: 0
        } catch (e: Exception) {
            0
        }
    }

    /**
     * Mark messages as read
     */
    suspend fun markAsRead(phoneNumber: String) = withContext(Dispatchers.IO) {
        try {
            val values = android.content.ContentValues().apply {
                put(Telephony.Sms.READ, 1)
            }
            contentResolver.update(
                Telephony.Sms.CONTENT_URI,
                values,
                "${Telephony.Sms.ADDRESS} = ? AND ${Telephony.Sms.READ} = 0",
                arrayOf(phoneNumber)
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error marking messages as read", e)
        }
    }

    // ============== API OPERATIONS ==============

    /**
     * Get messages from WickedCRM backend
     */
    suspend fun getRemoteMessages(
        skip: Int = 0,
        limit: Int = 100,
        channel: String? = null
    ): Result<List<Message>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getMessages(skip, limit, channel)
            if (response.isSuccessful) {
                Result.success(response.body() ?: emptyList())
            } else {
                Result.failure(Exception("API error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Sync a local message to backend
     */
    suspend fun syncToBackend(message: LocalSmsMessage): Result<Message> = withContext(Dispatchers.IO) {
        try {
            val request = SyncMessageRequest(
                body = message.body,
                channel = "sms",
                direction = if (message.isOutgoing) "outbound" else "inbound",
                externalId = "${message.phoneNumber}_${message.id}",
                contactPhone = message.phoneNumber,
                contactName = null,
                receivedAt = dateFormat.format(Date(message.timestamp))
            )

            val response = api.syncMessage(request)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Sync error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Queue an outgoing message
     */
    suspend fun queueMessage(to: String, body: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.queueOutgoingMessage(
                QueueMessageRequest(to = to, body = body, channel = "sms")
            )
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Queue error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Screen an incoming number
     */
    suspend fun screenNumber(phoneNumber: String, preview: String? = null): Result<ScreeningResult> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.screenIncoming(phoneNumber, preview)
                if (response.isSuccessful) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(Exception("Screen error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    /**
     * Report spam
     */
    suspend fun reportSpam(phoneNumber: String, spamType: String, notes: String? = null): Result<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.reportSpam(
                    ReportSpamRequest(phoneNumber, spamType, notes)
                )
                if (response.isSuccessful) {
                    Result.success(Unit)
                } else {
                    Result.failure(Exception("Report error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    /**
     * Block a number
     */
    suspend fun blockNumber(phoneNumber: String, reason: String? = null): Result<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.blockNumber(BlockNumberRequest(phoneNumber, reason))
                if (response.isSuccessful) {
                    Result.success(Unit)
                } else {
                    Result.failure(Exception("Block error: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    // ============== DATA MANAGEMENT ==============

    /**
     * Delete all user data - local and synced
     */
    suspend fun deleteAllUserData() = withContext(Dispatchers.IO) {
        // Delete from server first
        deleteSyncedData()

        // Delete local SMS messages (requires default SMS app)
        try {
            contentResolver.delete(
                Telephony.Sms.CONTENT_URI,
                null,
                null
            )
            Log.i(TAG, "Deleted all local SMS messages")
        } catch (e: Exception) {
            Log.e(TAG, "Error deleting local messages", e)
            throw e
        }

        // Clear cache
        clearCache()
    }

    /**
     * Delete only synced data from servers
     */
    suspend fun deleteSyncedData() = withContext(Dispatchers.IO) {
        try {
            val response = api.deleteUserData()
            if (!response.isSuccessful) {
                Log.e(TAG, "Server deletion failed: ${response.code()}")
                throw Exception("Server deletion failed: ${response.code()}")
            }
            Log.i(TAG, "Deleted synced data from servers")
        } catch (e: Exception) {
            Log.e(TAG, "Error deleting synced data", e)
            throw e
        }
    }

    /**
     * Delete messages for a specific conversation
     */
    suspend fun deleteConversation(phoneNumber: String) = withContext(Dispatchers.IO) {
        try {
            // Delete from local
            contentResolver.delete(
                Telephony.Sms.CONTENT_URI,
                "${Telephony.Sms.ADDRESS} = ?",
                arrayOf(phoneNumber)
            )

            // Delete from server
            try {
                api.deleteConversation(phoneNumber)
            } catch (e: Exception) {
                Log.w(TAG, "Could not delete from server: ${e.message}")
            }

            Log.i(TAG, "Deleted conversation with $phoneNumber")
        } catch (e: Exception) {
            Log.e(TAG, "Error deleting conversation", e)
            throw e
        }
    }

    /**
     * Delete a specific message
     */
    suspend fun deleteMessage(messageId: Long) = withContext(Dispatchers.IO) {
        try {
            contentResolver.delete(
                Telephony.Sms.CONTENT_URI,
                "${Telephony.Sms._ID} = ?",
                arrayOf(messageId.toString())
            )
            Log.i(TAG, "Deleted message $messageId")
        } catch (e: Exception) {
            Log.e(TAG, "Error deleting message", e)
            throw e
        }
    }

    /**
     * Clear local cache
     */
    suspend fun clearCache() = withContext(Dispatchers.IO) {
        try {
            context.cacheDir.deleteRecursively()
            Log.i(TAG, "Cache cleared")
        } catch (e: Exception) {
            Log.e(TAG, "Error clearing cache", e)
        }
    }

    /**
     * Export user data to Downloads folder
     */
    suspend fun exportUserData() = withContext(Dispatchers.IO) {
        try {
            val messages = mutableListOf<Map<String, Any>>()

            val cursor = contentResolver.query(
                Telephony.Sms.CONTENT_URI,
                arrayOf(
                    Telephony.Sms._ID,
                    Telephony.Sms.ADDRESS,
                    Telephony.Sms.BODY,
                    Telephony.Sms.DATE,
                    Telephony.Sms.TYPE
                ),
                null,
                null,
                "${Telephony.Sms.DATE} DESC"
            )

            cursor?.use {
                val idIndex = it.getColumnIndex(Telephony.Sms._ID)
                val addressIndex = it.getColumnIndex(Telephony.Sms.ADDRESS)
                val bodyIndex = it.getColumnIndex(Telephony.Sms.BODY)
                val dateIndex = it.getColumnIndex(Telephony.Sms.DATE)
                val typeIndex = it.getColumnIndex(Telephony.Sms.TYPE)

                while (it.moveToNext()) {
                    messages.add(mapOf(
                        "id" to it.getLong(idIndex),
                        "phone_number" to (it.getString(addressIndex) ?: ""),
                        "body" to (it.getString(bodyIndex) ?: ""),
                        "timestamp" to it.getLong(dateIndex),
                        "type" to if (it.getInt(typeIndex) == Telephony.Sms.MESSAGE_TYPE_SENT) "sent" else "received"
                    ))
                }
            }

            // Write to Downloads
            val downloadsDir = android.os.Environment.getExternalStoragePublicDirectory(
                android.os.Environment.DIRECTORY_DOWNLOADS
            )
            val exportFile = java.io.File(downloadsDir, "wickedcrm_messages_export_${System.currentTimeMillis()}.json")

            val json = com.google.gson.Gson().toJson(mapOf(
                "exported_at" to dateFormat.format(Date()),
                "message_count" to messages.size,
                "messages" to messages
            ))

            exportFile.writeText(json)
            Log.i(TAG, "Exported ${messages.size} messages to ${exportFile.absolutePath}")
        } catch (e: Exception) {
            Log.e(TAG, "Error exporting data", e)
            throw e
        }
    }

    companion object {
        private const val TAG = "MessageRepository"
    }
}

// Local data models
data class Conversation(
    val phoneNumber: String,
    val lastMessage: String,
    val lastMessageTime: Long,
    val isOutgoing: Boolean,
    val isRead: Boolean,
    val unreadCount: Int,
    val contactName: String? = null
)

data class LocalSmsMessage(
    val id: Long,
    val phoneNumber: String,
    val body: String,
    val timestamp: Long,
    val isOutgoing: Boolean
)
