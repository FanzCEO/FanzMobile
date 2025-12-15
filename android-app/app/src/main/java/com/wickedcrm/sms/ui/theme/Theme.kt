package com.wickedcrm.sms.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.animation.core.LocalMotionDurationScale
import androidx.compose.animation.core.MotionDurationScale
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.Density
import androidx.core.view.WindowCompat
import com.wickedcrm.sms.data.PreferencesManager
import com.wickedcrm.sms.data.ThemeMode

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF9C6AFF),
    secondary = Color(0xFF6366F1),
    tertiary = Color(0xFFEC4899),
    background = Color(0xFF0F0F0F),
    surface = Color(0xFF1A1A1A),
    surfaceVariant = Color(0xFF2D2D2D),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White,
    error = Color(0xFFF44336)
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF7C3AED),
    secondary = Color(0xFF4F46E5),
    tertiary = Color(0xFFDB2777),
    background = Color(0xFFFAFAFA),
    surface = Color.White,
    surfaceVariant = Color(0xFFF5F5F5),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onBackground = Color(0xFF1A1A1A),
    onSurface = Color(0xFF1A1A1A),
    error = Color(0xFFDC2626)
)

@Composable
fun WickedSmsTheme(
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val context = LocalContext.current
    val preferencesManager = remember { PreferencesManager.getInstance(context) }
    val themeMode by preferencesManager.themeMode.collectAsState()
    val accessibilitySettings by preferencesManager.accessibilitySettings.collectAsState()

    val darkTheme = when (themeMode) {
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
    }

    val baseColorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val colorScheme = remember(baseColorScheme, accessibilitySettings.highContrast, darkTheme) {
        if (!accessibilitySettings.highContrast) {
            baseColorScheme
        } else {
            baseColorScheme.copy(
                primary = if (darkTheme) Color(0xFF9BD5FF) else Color(0xFF0F62FE),
                onPrimary = Color.Black,
                secondary = if (darkTheme) Color(0xFFFFD166) else Color(0xFF8B5CF6),
                onSecondary = Color.Black,
                background = if (darkTheme) Color.Black else Color.White,
                onBackground = if (darkTheme) Color.White else Color.Black,
                surface = if (darkTheme) Color(0xFF0F0F10) else Color.White,
                surfaceVariant = if (darkTheme) Color(0xFF161616) else Color(0xFFF3F4F6),
                onSurface = if (darkTheme) Color.White else Color(0xFF0F172A),
                outline = if (darkTheme) Color(0xFFB3B3B3) else Color(0xFF111827)
            )
        }
    }

    val baseDensity = LocalDensity.current
    val fontScale = remember(accessibilitySettings.fontSize) {
        preferencesManager.getFontScale(accessibilitySettings.fontSize)
    }
    val density = remember(baseDensity, fontScale) {
        Density(baseDensity.density, fontScale)
    }

    val motionScale = if (accessibilitySettings.reducedMotion) 0f else 1f
    val motionScaleProvider = remember(motionScale) {
        object : MotionDurationScale {
            override val scale: Float
                get() = motionScale
        }
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    CompositionLocalProvider(
        LocalDensity provides density,
        LocalMotionDurationScale provides motionScaleProvider
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            content = content
        )
    }
}
