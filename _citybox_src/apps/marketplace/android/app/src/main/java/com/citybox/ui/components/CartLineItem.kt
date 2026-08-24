package com.citybox.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.citybox.data.CartItem
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextSecondary

@Composable
fun CartLineItem(
    item: CartItem,
    onRemove: () -> Unit,
    onQuantityChange: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.Top
    ) {
        AsyncImage(
            model = item.product.imageUrl,
            contentDescription = item.product.name,
            modifier = Modifier
                .size(80.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(Surface),
            contentScale = ContentScale.Crop
        )

        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = item.product.name,
                style = CBFont.Caption1,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                color = Black
            )
            Text(
                text = formatBRL(item.product.price),
                style = CBFont.Body1SemiBold,
                color = Green
            )
            QuantityStepper(
                quantity = item.quantity,
                onQuantityChange = onQuantityChange
            )
        }

        Box(
            modifier = Modifier
                .clickable(onClick = onRemove)
                .padding(6.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Close,
                contentDescription = "Remover",
                tint = TextSecondary,
                modifier = Modifier.size(14.dp)
            )
        }
    }
}
