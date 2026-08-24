package com.citybox.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.font.FontWeight

val Typography = Typography(
    displayLarge = CBFont.Display,
    headlineLarge = CBFont.H1,
    headlineMedium = CBFont.H2,
    headlineSmall = CBFont.Section,
    titleLarge = CBFont.H3,
    titleMedium = CBFont.Body1,
    titleSmall = CBFont.Body2,
    bodyLarge = CBFont.Body1.copy(fontWeight = FontWeight.Normal),
    bodyMedium = CBFont.Body2,
    bodySmall = CBFont.Caption1,
    labelLarge = CBFont.Caption2,
    labelMedium = CBFont.Badge,
    labelSmall = CBFont.Tab
)
