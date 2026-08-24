package com.citybox.ui.theme

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.sp

/** Tipografia espelhando CBFont do iOS (SF Pro → sans-serif do sistema). */
object CBFont {
    private val family = FontFamily.SansSerif

    val Display = style(30, FontWeight.ExtraBold, 36)
    val H1 = style(26, FontWeight.Bold, 32)
    val H2 = style(24, FontWeight.Bold, 30)
    val Section = style(19, FontWeight.SemiBold, 24)
    val H3 = style(18, FontWeight.SemiBold, 24)
    val Body1 = style(16, FontWeight.Medium, 22)
    val Body2 = style(14, FontWeight.Normal, 20)
    val Caption1 = style(13, FontWeight.Normal, 18)
    val Caption2 = style(12, FontWeight.Normal, 16)
    val Badge = style(11, FontWeight.SemiBold, 14)
    val Tab = style(10, FontWeight.Medium, 14)

    val Body1Bold = Body1.copy(fontWeight = FontWeight.Bold)
    val Body1SemiBold = Body1.copy(fontWeight = FontWeight.SemiBold)
    val Body2SemiBold = Body2.copy(fontWeight = FontWeight.SemiBold)
    val Caption2SemiBold = Caption2.copy(fontWeight = FontWeight.SemiBold)
    val PromoHeadline = style(32, FontWeight.ExtraBold, 33)
    val LoginBrand = style(36, FontWeight.ExtraBold, 42)
    val LoginGreeting = style(25, FontWeight.ExtraBold, 30)

    private fun style(size: Int, weight: FontWeight, lineHeight: Int): TextStyle =
        TextStyle(
            fontFamily = family,
            fontSize = size.sp,
            fontWeight = weight,
            lineHeight = lineHeight.sp,
            color = Black
        )
}

@Composable
fun CBText(
    text: String,
    style: TextStyle,
    modifier: Modifier = Modifier,
    color: Color = style.color,
    textAlign: TextAlign? = null,
    maxLines: Int = Int.MAX_VALUE,
    overflow: TextOverflow = TextOverflow.Clip,
    fontWeight: FontWeight? = null
) {
    Text(
        text = text,
        modifier = modifier,
        color = color,
        textAlign = textAlign,
        maxLines = maxLines,
        overflow = overflow,
        style = if (fontWeight != null) style.copy(fontWeight = fontWeight) else style
    )
}
