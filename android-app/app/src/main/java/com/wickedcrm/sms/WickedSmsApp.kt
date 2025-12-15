package com.wickedcrm.sms

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.wickedcrm.sms.data.api.WickedCrmApi
import com.wickedcrm.sms.data.repository.MessageRepository
import com.wickedcrm.sms.data.PreferencesManager
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * WickedCRM SMS App - Default SMS replacement with AI integration
 */
class WickedSmsApp : Application() {

    lateinit var api: WickedCrmApi
        private set

    lateinit var messageRepository: MessageRepository
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        PreferencesManager.getInstance(this).applyTheme()
        setupApi()
        setupNotificationChannels()
        messageRepository = MessageRepository(api, this)
    }

    private fun setupApi() {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .addHeader("Authorization", "Bearer ${getApiKey()}")
                    .build()
                chain.proceed(request)
            }
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(getBackendUrl())
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        api = retrofit.create(WickedCrmApi::class.java)
    }

    private fun setupNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)

            // Messages channel
            val messagesChannel = NotificationChannel(
                CHANNEL_MESSAGES,
                "Messages",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Incoming SMS and MMS messages"
                enableVibration(true)
                enableLights(true)
            }

            // Sync channel
            val syncChannel = NotificationChannel(
                CHANNEL_SYNC,
                "Sync Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background sync with WickedCRM"
            }

            // Spam alerts channel
            val spamChannel = NotificationChannel(
                CHANNEL_SPAM,
                "Spam Alerts",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Spam and scam call/message alerts"
            }

            notificationManager.createNotificationChannels(
                listOf(messagesChannel, syncChannel, spamChannel)
            )
        }
    }

    fun getBackendUrl(): String {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        return prefs.getString(KEY_BACKEND_URL, DEFAULT_BACKEND_URL) ?: DEFAULT_BACKEND_URL
    }

    fun setBackendUrl(url: String) {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        prefs.edit().putString(KEY_BACKEND_URL, url).apply()
        setupApi() // Reinitialize API with new URL
    }

    fun getApiKey(): String {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        return prefs.getString(KEY_API_KEY, "") ?: ""
    }

    fun setApiKey(key: String) {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        prefs.edit().putString(KEY_API_KEY, key).apply()
        setupApi()
    }

    companion object {
        lateinit var instance: WickedSmsApp
            private set

        const val PREFS_NAME = "wicked_crm_prefs"
        const val KEY_BACKEND_URL = "backend_url"
        const val KEY_API_KEY = "api_key"
        const val DEFAULT_BACKEND_URL = "http://10.0.2.2:8000" // Android emulator localhost

        const val CHANNEL_MESSAGES = "messages"
        const val CHANNEL_SYNC = "sync"
        const val CHANNEL_SPAM = "spam"
    }
}
