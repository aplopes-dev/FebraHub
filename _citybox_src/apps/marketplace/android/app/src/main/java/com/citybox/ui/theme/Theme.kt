package com.citybox.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = Black,
    onPrimary = White,
    primaryContainer = TintSuccess,
    onPrimaryContainer = Black,
    secondary = Black,
    onSecondary = White,
    secondaryContainer = SurfaceVariant,
    onSecondaryContainer = Black,
    background = White,
    onBackground = Black,
    surface = Surface,
    onSurface = Black,
    surfaceVariant = SurfaceVariant,
    onSurfaceVariant = TextSecondary,
    outline = BorderStrong,
    error = ErrorRed,
    onError = White
)

@Composable
fun CityBoxTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}
