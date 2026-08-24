package com.citybox.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.ErrorRed
import com.citybox.ui.theme.PillShape
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.TintError
import java.text.NumberFormat
import java.util.Locale

private val priceTextStyle = TextStyle(
    platformStyle = PlatformTextStyle(includeFontPadding = false),
    lineHeightStyle = LineHeightStyle(
        alignment = LineHeightStyle.Alignment.Center,
        trim = LineHeightStyle.Trim.Both
    )
)

private val cardBadgeStyle = CBFont.Badge.merge(
    priceTextStyle.copy(lineHeight = 16.sp)
)

fun formatBRL(value: Double): String {
    val nf = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))
    return nf.format(value)
}

@Composable
fun PriceBlock(
    price: Double,
    originalPrice: Double,
    discountPercent: Int,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = formatBRL(price),
                style = CBFont.H2.copy(fontWeight = FontWeight.Bold).merge(priceTextStyle),
                color = Black
            )
            if (discountPercent > 0) {
                Text(
                    text = "-$discountPercent%",
                    style = cardBadgeStyle,
                    color = ErrorRed,
                    modifier = Modifier
                        .background(TintError, PillShape)
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }
        }
        if (originalPrice > price) {
            Text(
                text = formatBRL(originalPrice),
                style = CBFont.Caption1.merge(priceTextStyle),
                color = TextSecondary,
                textDecoration = TextDecoration.LineThrough
            )
        }
    }
}

@Composable
fun PriceBlockCompact(
    price: Double,
    originalPrice: Double,
    discountPercent: Int,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = formatBRL(price),
                style = CBFont.Body1Bold.merge(priceTextStyle),
                color = Black,
                lineHeight = 22.sp
            )
            if (discountPercent > 0) {
                Text(
                    text = "-$discountPercent%",
                    style = cardBadgeStyle,
                    color = ErrorRed,
                    modifier = Modifier
                        .background(TintError, PillShape)
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }
        }
        if (originalPrice > price) {
            Text(
                text = formatBRL(originalPrice),
                style = CBFont.Caption1.merge(priceTextStyle),
                color = TextSecondary,
                textDecoration = TextDecoration.LineThrough,
                lineHeight = 18.sp
            )
        }
    }
}
