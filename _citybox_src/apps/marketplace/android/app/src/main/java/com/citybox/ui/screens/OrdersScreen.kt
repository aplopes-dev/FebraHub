package com.citybox.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.citybox.data.AppState
import com.citybox.data.Order
import com.citybox.data.OrderStatus
import kotlinx.coroutines.delay
import com.citybox.ui.components.Badge
import com.citybox.ui.components.EmptyState
import com.citybox.ui.components.TrackingTimeline
import com.citybox.ui.components.formatBRL
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.GoogleBlue
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.SurfaceVariant
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.TintInfo
import com.citybox.ui.theme.TintSuccess
import com.citybox.ui.theme.TintWarning
import com.citybox.ui.theme.White

private val WarningBrown = Color(0xFFB45309)

@Composable
fun OrdersScreen(
    appState: AppState,
    onExploreProducts: () -> Unit = {},
    onOrderClick: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val orders by appState.orders.collectAsState()

    LaunchedEffect(Unit) {
        while (true) {
            delay(20_000)
            orders.filter { it.status != OrderStatus.DELIVERED }.forEach { order ->
                appState.advanceOrderStatus(order.id)
            }
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Surface)
    ) {
        if (orders.isEmpty()) {
            EmptyState(
                icon = Icons.Default.ShoppingBag,
                title = "Nenhuma compra ainda",
                subtitle = "Seus pedidos aparecerão aqui após a confirmação",
                actionText = "Explorar produtos",
                onAction = onExploreProducts,
                modifier = Modifier.align(Alignment.Center)
            )
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(
                    horizontal = 16.dp,
                    vertical = 8.dp
                )
            ) {
                items(orders) { order ->
                    OrderCard(order = order, onClick = { onOrderClick(order.id) })
                }
            }
        }
    }
}

@Composable
fun OrderCard(order: Order, onClick: () -> Unit = {}) {
    val (statusBg, statusFg, statusLabel) = orderStatusStyle(order.status)

    Card(
        shape = CardShape,
        colors = CardDefaults.cardColors(containerColor = White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = "Pedido #${order.id}",
                        style = CBFont.Body2SemiBold,
                        color = Black
                    )
                    Text(
                        text = formatBRL(order.total),
                        style = CBFont.Caption1,
                        color = TextSecondary
                    )
                }
                Badge(
                    text = statusLabel,
                    containerColor = statusBg,
                    contentColor = statusFg
                )
            }

            order.items.take(2).forEach { item ->
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    AsyncImage(
                        model = item.product.imageUrl,
                        contentDescription = item.product.name,
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Surface),
                        contentScale = ContentScale.Crop
                    )
                    Column {
                        Text(
                            text = item.product.name,
                            style = CBFont.Caption1,
                            color = Black,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "Qtd: ${item.quantity} · ${formatBRL(item.product.price)}",
                            style = CBFont.Badge,
                            color = TextSecondary
                        )
                    }
                }
            }

            if (order.items.size > 2) {
                Text(
                    text = "+ ${order.items.size - 2} mais itens",
                    style = CBFont.Badge,
                    color = TextSecondary
                )
            }

            HorizontalDivider(color = SurfaceVariant)

            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Schedule,
                    contentDescription = null,
                    tint = TextSecondary,
                    modifier = Modifier.size(12.dp)
                )
                Text(
                    text = order.deliveryDate,
                    style = CBFont.Caption1,
                    color = TextSecondary
                )
            }

            TrackingTimeline(currentStatus = order.status)
        }
    }
}

private fun orderStatusStyle(status: OrderStatus): Triple<Color, Color, String> {
    return when (status) {
        OrderStatus.CONFIRMED -> Triple(TintInfo, GoogleBlue, "Confirmado")
        OrderStatus.PREPARING -> Triple(TintWarning, WarningBrown, "Preparando")
        OrderStatus.SHIPPED -> Triple(TintSuccess, Green, "Saiu para entrega")
        OrderStatus.DELIVERED -> Triple(SurfaceVariant, TextSecondary, "Entregue")
    }
}
