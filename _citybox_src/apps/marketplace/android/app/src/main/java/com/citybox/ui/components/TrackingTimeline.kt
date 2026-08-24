package com.citybox.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.citybox.data.OrderStatus
import com.citybox.ui.theme.BorderStrong
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.SurfaceVariant
import com.citybox.ui.theme.TextDisabled
import com.citybox.ui.theme.White

private val trackingSteps = listOf(
    OrderStatus.CONFIRMED to "Confirmado",
    OrderStatus.PREPARING to "Preparando",
    OrderStatus.SHIPPED to "Saiu para entrega",
    OrderStatus.DELIVERED to "Entregue"
)

@Composable
fun TrackingTimeline(
    currentStatus: OrderStatus,
    modifier: Modifier = Modifier
) {
    val currentIndex = currentStatus.ordinal

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.Top
    ) {
        trackingSteps.forEachIndexed { index, (_, label) ->
            Column(
                modifier = Modifier.width(70.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                val isDone = index <= currentIndex
                Box(
                    modifier = Modifier
                        .size(20.dp)
                        .background(
                            color = if (isDone) Green else SurfaceVariant,
                            shape = CircleShape
                        )
                        .then(
                            if (!isDone) {
                                Modifier.border(1.5.dp, BorderStrong, CircleShape)
                            } else {
                                Modifier
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    when {
                        index < currentIndex -> {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = null,
                                tint = White,
                                modifier = Modifier.size(10.dp)
                            )
                        }
                        index == currentIndex -> {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .background(White, CircleShape)
                            )
                        }
                    }
                }

                Text(
                    text = label,
                    style = CBFont.Tab,
                    color = if (isDone) Green else TextDisabled,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            if (index < trackingSteps.lastIndex) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .padding(top = 9.dp)
                        .height(2.dp)
                        .background(if (index < currentIndex) Green else SurfaceVariant)
                )
            }
        }
    }
}
