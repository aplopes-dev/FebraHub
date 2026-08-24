package com.citybox.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarHalf
import androidx.compose.material.icons.outlined.StarOutline
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.TextSecondary

val StarColor = Color(0xFFF59E0B)

private val ratingTextStyle = TextStyle(
    platformStyle = PlatformTextStyle(includeFontPadding = false),
    lineHeightStyle = LineHeightStyle(
        alignment = LineHeightStyle.Alignment.Center,
        trim = LineHeightStyle.Trim.Both
    )
)

@Composable
fun RatingStars(
    rating: Float,
    reviewCount: Int = 0,
    starSize: Dp = 16.dp,
    compact: Boolean = false,
    modifier: Modifier = Modifier
) {
    val effectiveStarSize = if (compact) 10.dp else starSize

    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(2.dp),
        modifier = modifier
    ) {
        repeat(5) { index ->
            val starValue = index + 1
            when {
                rating >= starValue -> Icon(
                    imageVector = Icons.Filled.Star,
                    contentDescription = null,
                    tint = StarColor,
                    modifier = Modifier.size(effectiveStarSize)
                )
                rating >= starValue - 0.5f -> Icon(
                    imageVector = Icons.Filled.StarHalf,
                    contentDescription = null,
                    tint = StarColor,
                    modifier = Modifier.size(effectiveStarSize)
                )
                else -> Icon(
                    imageVector = Icons.Outlined.StarOutline,
                    contentDescription = null,
                    tint = StarColor,
                    modifier = Modifier.size(effectiveStarSize)
                )
            }
        }
        Text(
            text = "($reviewCount)",
            style = if (compact) {
                CBFont.Caption2.merge(ratingTextStyle)
            } else {
                CBFont.Caption1.merge(ratingTextStyle)
            },
            color = TextSecondary,
            lineHeight = if (compact) 16.sp else 18.sp
        )
    }
}
