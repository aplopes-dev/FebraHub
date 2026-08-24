package com.citybox.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.ErrorRed
import com.citybox.ui.theme.GoogleBlue
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.PillShape
import com.citybox.ui.theme.SurfaceVariant
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.TintError
import com.citybox.ui.theme.TintInfo
import com.citybox.ui.theme.TintSuccess
import com.citybox.ui.theme.TintWarning

enum class BadgeChipStyle {
    Success,
    Info,
    Warning,
    Error,
    Neutral;

    val background: Color
        get() = when (this) {
            Success -> TintSuccess
            Info -> TintInfo
            Warning -> TintWarning
            Error -> TintError
            Neutral -> SurfaceVariant
        }

    val foreground: Color
        get() = when (this) {
            Success -> Green
            Info -> GoogleBlue
            Warning -> Color(0xFFB45309)
            Error -> ErrorRed
            Neutral -> TextSecondary
        }
}

@Composable
fun BadgeChip(
    text: String,
    modifier: Modifier = Modifier,
    style: BadgeChipStyle = BadgeChipStyle.Neutral,
    icon: ImageVector? = null
) {
    Row(
        modifier = modifier
            .wrapContentWidth()
            .background(style.background, PillShape)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(4.dp)
    ) {
        if (icon != null) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = style.foreground,
                modifier = Modifier.size(11.dp)
            )
        }
        Text(
            text = text,
            style = CBFont.Badge,
            color = style.foreground
        )
    }
}
