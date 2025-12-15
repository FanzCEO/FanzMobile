package com.wickedcrm.sms.data.api

import com.wickedcrm.sms.data.model.*
import retrofit2.Response
import retrofit2.http.*

/**
 * WickedCRM Backend API Interface
 */
interface WickedCrmApi {

    // ============== MESSAGES ==============

    @POST("/api/messages/sync")
    suspend fun syncMessage(@Body request: SyncMessageRequest): Response<Message>

    @GET("/api/messages")
    suspend fun getMessages(
        @Query("skip") skip: Int = 0,
        @Query("limit") limit: Int = 100,
        @Query("channel") channel: String? = null,
        @Query("direction") direction: String? = null
    ): Response<List<Message>>

    @GET("/api/messages/outgoing")
    suspend fun getOutgoingMessages(): Response<List<OutgoingMessage>>

    @POST("/api/messages/{messageId}/sent")
    suspend fun markMessageSent(@Path("messageId") messageId: String): Response<StatusResponse>

    @POST("/api/messages/queue")
    suspend fun queueOutgoingMessage(@Body request: QueueMessageRequest): Response<StatusResponse>

    // ============== VERIFICATION ==============

    @POST("/api/verification/lookup")
    suspend fun lookupPhone(@Body request: VerifyPhoneRequest): Response<PhoneLookupResult>

    @GET("/api/verification/spam-check/{phoneNumber}")
    suspend fun quickSpamCheck(@Path("phoneNumber") phoneNumber: String): Response<SpamCheckResult>

    @POST("/api/verification/report-spam")
    suspend fun reportSpam(@Body request: ReportSpamRequest): Response<StatusResponse>

    @POST("/api/verification/block")
    suspend fun blockNumber(@Body request: BlockNumberRequest): Response<StatusResponse>

    @DELETE("/api/verification/block/{phoneNumber}")
    suspend fun unblockNumber(@Path("phoneNumber") phoneNumber: String): Response<StatusResponse>

    @GET("/api/verification/blocked")
    suspend fun getBlockedNumbers(): Response<List<BlockedNumber>>

    @POST("/api/verification/screen")
    suspend fun screenIncoming(
        @Query("phone_number") phoneNumber: String,
        @Query("message_preview") messagePreview: String? = null
    ): Response<ScreeningResult>

    // ============== CONTACTS ==============

    @GET("/api/contacts")
    suspend fun getContacts(
        @Query("skip") skip: Int = 0,
        @Query("limit") limit: Int = 100,
        @Query("search") search: String? = null
    ): Response<List<Contact>>

    @GET("/api/contacts/{contactId}")
    suspend fun getContact(@Path("contactId") contactId: String): Response<Contact>

    // ============== AI PROCESSING ==============

    @POST("/api/messages/{messageId}/process")
    suspend fun processMessage(@Path("messageId") messageId: String): Response<AiProcessResult>

    // ============== DATA MANAGEMENT ==============

    @DELETE("/api/user/data")
    suspend fun deleteUserData(): Response<StatusResponse>

    @DELETE("/api/messages/conversation/{phoneNumber}")
    suspend fun deleteConversation(@Path("phoneNumber") phoneNumber: String): Response<StatusResponse>

    @GET("/api/user/data/export")
    suspend fun requestDataExport(): Response<DataExportResponse>

    // ============== HEALTH ==============

    @GET("/health")
    suspend fun healthCheck(): Response<HealthResponse>
}
