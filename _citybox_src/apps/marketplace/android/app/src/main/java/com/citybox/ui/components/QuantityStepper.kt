package com.citybox.ui.components

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.BorderStrong
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.InputShape

@Composable
fun QuantityStepper(
    quantity: Int,
    onQuantityChange: (Int) -> Unit,
    min: Int = 1,
    max: Int = 10,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .border(1.dp, BorderStrong, InputShape),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(
            onClick = { if (quantity > min) onQuantityChange(quantity - 1) },
            modifier = Modifier.size(36.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Remove,
                contentDescription = "Diminuir",
                tint = if (quantity > min) Black else Black.copy(alpha = 0.3f),
                modifier = Modifier.size(16.dp)
            )
        }
        Text(
            text = quantity.toString(),
            style = CBFont.Body1SemiBold,
            color = Black,
            textAlign = TextAlign.Center,
            modifier = Modifier.width(32.dp)
        )
        IconButton(
            onClick = { if (quantity < max) onQuantityChange(quantity + 1) },
            modifier = Modifier.size(36.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Add,
                contentDescription = "Aumentar",
                tint = if (quantity < max) Black else Black.copy(alpha = 0.3f),
                modifier = Modifier.size(16.dp)
            )
        }
    }
}
