package com.wickedcrm.sms.data.model

import com.google.gson.annotations.SerializedName

// ============== MESSAGE MODELS ==============

data class Message(
    val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("contact_id") val contactId: String?,
    val direction: String, // inbound, outbound
    val channel: String, // sms, imessage, whatsapp, etc.
    @SerializedName("external_id") val externalId: String?,
    val body: String,
    @SerializedName("received_at") val receivedAt: String,
    @SerializedName("ai_processed") val aiProcessed: Boolean,
    @SerializedName("ai_result") val aiResult: AiResult?,
    @SerializedName("created_at") val createdAt: String
)

data class AiResult(
    @SerializedName("contact_name") val contactName: String?,
    @SerializedName("phone_number") val phoneNumber: String?,
    @SerializedName("meeting_detected") val meetingDetected: Boolean?,
    @SerializedName("meeting_time") val meetingTime: String?,
    @SerializedName("meeting_location") val meetingLocation: String?,
    val tasks: List<String>?,
    val intent: String?,
    val importance: Int?
)

data class SyncMessageRequest(
    val body: String,
    val channel: String,
    val direction: String,
    @SerializedName("external_id") val externalId: String?,
    @SerializedName("contact_phone") val contactPhone: String?,
    @SerializedName("contact_name") val contactName: String?,
    @SerializedName("received_at") val receivedAt: String?
)

data class OutgoingMessage(
    val id: String,
    val to: String,
    val body: String,
    val channel: String,
    @SerializedName("queued_at") val queuedAt: String,
    val status: String
)

data class QueueMessageRequest(
    val to: String,
    val body: String,
    val channel: String = "sms"
)

// ============== VERIFICATION MODELS ==============

data class VerifyPhoneRequest(
    @SerializedName("phone_number") val phoneNumber: String,
    @SerializedName("check_spam") val checkSpam: Boolean = true,
    @SerializedName("check_carrier") val checkCarrier: Boolean = true,
    @SerializedName("check_caller_id") val checkCallerId: Boolean = true
)

data class PhoneLookupResult(
    @SerializedName("phone_number") val phoneNumber: String,
    val formatted: String?,
    @SerializedName("country_code") val countryCode: String?,
    val carrier: String?,
    @SerializedName("line_type") val lineType: String?,
    @SerializedName("is_valid") val isValid: Boolean,
    @SerializedName("spam_score") val spamScore: Int,
    @SerializedName("spam_type") val spamType: String?,
    @SerializedName("caller_name") val callerName: String?,
    @SerializedName("caller_type") val callerType: String?,
    @SerializedName("is_verified") val isVerified: Boolean,
    @SerializedName("verification_source") val verificationSource: String?,
    @SerializedName("risk_level") val riskLevel: String, // low, medium, high, blocked
    val tags: List<String>,
    val notes: String?,
    @SerializedName("lookup_time") val lookupTime: String
)

data class SpamCheckResult(
    @SerializedName("phone_number") val phoneNumber: String,
    @SerializedName("spam_score") val spamScore: Int,
    @SerializedName("spam_type") val spamType: String?,
    @SerializedName("is_blocked") val isBlocked: Boolean,
    @SerializedName("risk_level") val riskLevel: String,
    val recommendation: String // allow, block
)

data class ReportSpamRequest(
    @SerializedName("phone_number") val phoneNumber: String,
    @SerializedName("spam_type") val spamType: String, // telemarketer, scam, robocall, harassment, other
    val notes: String?
)

data class BlockNumberRequest(
    @SerializedName("phone_number") val phoneNumber: String,
    val reason: String?
)

data class BlockedNumber(
    @SerializedName("phone_number") val phoneNumber: String,
    val reason: String?,
    @SerializedName("blocked_at") val blockedAt: String
)

data class ScreeningResult(
    val action: String, // allow, warn, block
    val reason: String,
    @SerializedName("phone_number") val phoneNumber: String,
    @SerializedName("spam_type") val spamType: String? = null,
    @SerializedName("contact_name") val contactName: String? = null,
    val suggestion: String? = null
)

// ============== CONTACT MODELS ==============

data class Contact(
    val id: String,
    val name: String,
    val phone: String?,
    val email: String?,
    val tags: List<String>,
    val notes: String?,
    @SerializedName("created_at") val createdAt: String
)

// ============== AI PROCESSING ==============

data class AiProcessResult(
    val status: String,
    @SerializedName("message_id") val messageId: String,
    @SerializedName("ai_result") val aiResult: AiResult?
)

// ============== COMMON MODELS ==============

data class StatusResponse(
    val status: String,
    val id: String? = null,
    @SerializedName("phone_number") val phoneNumber: String? = null
)

data class HealthResponse(
    val status: String,
    @SerializedName("ai_configured") val aiConfigured: Boolean
)
