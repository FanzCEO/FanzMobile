package com.wickedcrm.sms.data

import android.content.Context
import android.content.SharedPreferences
import androidx.appcompat.app.AppCompatDelegate
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class ThemeMode {
    LIGHT, DARK, SYSTEM
}

enum class FontSize {
    SMALL, MEDIUM, LARGE, EXTRA_LARGE
}

data class AccessibilitySettings(
    val fontSize: FontSize = FontSize.MEDIUM,
    val reducedMotion: Boolean = false,
    val highContrast: Boolean = false,
    val screenReaderOptimized: Boolean = false
)

class PreferencesManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(
        PREFS_NAME, Context.MODE_PRIVATE
    )

    private val _themeMode = MutableStateFlow(getThemeMode())
    val themeMode: StateFlow<ThemeMode> = _themeMode.asStateFlow()

    private val _accessibilitySettings = MutableStateFlow(getAccessibilitySettings())
    val accessibilitySettings: StateFlow<AccessibilitySettings> = _accessibilitySettings.asStateFlow()

    fun setThemeMode(mode: ThemeMode) {
        prefs.edit().putString(KEY_THEME_MODE, mode.name).apply()
        _themeMode.value = mode
        applyTheme(mode)
    }

    fun getThemeMode(): ThemeMode {
        val modeString = prefs.getString(KEY_THEME_MODE, ThemeMode.SYSTEM.name)
        return try {
            ThemeMode.valueOf(modeString ?: ThemeMode.SYSTEM.name)
        } catch (e: IllegalArgumentException) {
            ThemeMode.SYSTEM
        }
    }

    fun applyTheme(mode: ThemeMode = getThemeMode()) {
        when (mode) {
            ThemeMode.LIGHT -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
            ThemeMode.DARK -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)
            ThemeMode.SYSTEM -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)
        }
    }

    fun setFontSize(size: FontSize) {
        prefs.edit().putString(KEY_FONT_SIZE, size.name).apply()
        updateAccessibilitySettings()
    }

    fun setReducedMotion(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_REDUCED_MOTION, enabled).apply()
        updateAccessibilitySettings()
    }

    fun setHighContrast(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_HIGH_CONTRAST, enabled).apply()
        updateAccessibilitySettings()
    }

    fun setScreenReaderOptimized(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_SCREEN_READER, enabled).apply()
        updateAccessibilitySettings()
    }

    fun getAccessibilitySettings(): AccessibilitySettings {
        val fontSizeString = prefs.getString(KEY_FONT_SIZE, FontSize.MEDIUM.name)
        val fontSize = try {
            FontSize.valueOf(fontSizeString ?: FontSize.MEDIUM.name)
        } catch (e: IllegalArgumentException) {
            FontSize.MEDIUM
        }

        return AccessibilitySettings(
            fontSize = fontSize,
            reducedMotion = prefs.getBoolean(KEY_REDUCED_MOTION, false),
            highContrast = prefs.getBoolean(KEY_HIGH_CONTRAST, false),
            screenReaderOptimized = prefs.getBoolean(KEY_SCREEN_READER, false)
        )
    }

    private fun updateAccessibilitySettings() {
        _accessibilitySettings.value = getAccessibilitySettings()
    }

    fun resetAccessibilityToDefaults() {
        prefs.edit()
            .putString(KEY_FONT_SIZE, FontSize.MEDIUM.name)
            .putBoolean(KEY_REDUCED_MOTION, false)
            .putBoolean(KEY_HIGH_CONTRAST, false)
            .putBoolean(KEY_SCREEN_READER, false)
            .apply()
        updateAccessibilitySettings()
    }

    fun getFontScale(fontSize: FontSize = getAccessibilitySettings().fontSize): Float {
        return when (fontSize) {
            FontSize.SMALL -> 0.85f
            FontSize.MEDIUM -> 1.0f
            FontSize.LARGE -> 1.15f
            FontSize.EXTRA_LARGE -> 1.3f
        }
    }

    companion object {
        private const val PREFS_NAME = "wickedcrm_preferences"
        private const val KEY_THEME_MODE = "theme_mode"
        private const val KEY_FONT_SIZE = "font_size"
        private const val KEY_REDUCED_MOTION = "reduced_motion"
        private const val KEY_HIGH_CONTRAST = "high_contrast"
        private const val KEY_SCREEN_READER = "screen_reader_optimized"

        @Volatile
        private var INSTANCE: PreferencesManager? = null

        fun getInstance(context: Context): PreferencesManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: PreferencesManager(context.applicationContext).also {
                    INSTANCE = it
                }
            }
        }
    }
}
