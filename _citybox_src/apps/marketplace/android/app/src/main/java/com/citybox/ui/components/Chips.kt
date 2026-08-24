package com.citybox.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.PillShape
import com.citybox.ui.theme.TintSuccess
import com.citybox.ui.theme.White

@Composable
fun Badge(
    text: String,
    containerColor: Color = Green,
    contentColor: Color = White,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .background(containerColor, PillShape)
            .padding(horizontal = 8.dp, vertical = 3.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            style = CBFont.Badge,
            color = contentColor
        )
    }
}

@Composable
fun Chip(
    text: String,
    containerColor: Color = TintSuccess,
    contentColor: Color = Green,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .background(containerColor, PillShape)
            .padding(horizontal = 10.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            style = CBFont.Caption2SemiBold,
            color = contentColor
        )
    }
}
