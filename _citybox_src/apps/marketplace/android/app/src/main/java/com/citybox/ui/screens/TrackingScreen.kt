package com.citybox.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Map
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.data.OrderStatus
import com.citybox.data.OrderStatusEntry
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.BorderStrong
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.SurfaceVariant
import com.citybox.ui.theme.TextDisabled
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.White

@Composable
fun TrackingScreen(
    orderId: String,
    appState: AppState,
    onBack: () -> Unit
) {
    val orders by appState.orders.collectAsState()
    val order = orders.find { it.id == orderId }

    LaunchedEffect(orderId) { appState.loadTracking(orderId) }

    Scaffold(
        topBar = { SimpleAppBar(title = "Rastreamento", onBackClick = onBack, light = true) },
        containerColor = Surface
    ) { padding ->
        if (order == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Text("Pedido não encontrado", style = CBFont.Body1, color = TextSecondary)
            }
            return@Scaffold
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card(
                shape = CardShape,
                colors = CardDefaults.cardColors(containerColor = White),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = order.trackingCode.ifEmpty { "Aguardando código" },
                        style = CBFont.H3.copy(fontWeight = FontWeight.Bold),
                        color = Black
                    )
                    Text(text = "Transportadora: CityBox Logística", style = CBFont.Body2, color = TextSecondary)
                    Text(text = "Pedido #${order.id}", style = CBFont.Caption1, color = TextSecondary)
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(SurfaceVariant),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.Map,
                        contentDescription = null,
                        tint = TextDisabled,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Mapa de entrega (mock)", style = CBFont.Caption1, color = TextSecondary)
                }
            }

            Card(
                shape = CardShape,
                colors = CardDefaults.cardColors(containerColor = White),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(0.dp)
                ) {
                    Text(text = "Histórico", style = CBFont.H3, color = Black)
                    Spacer(modifier = Modifier.height(12.dp))

                    val history = order.statusHistory.ifEmpty {
                        listOf(OrderStatusEntry(order.status, order.deliveryDate, ""))
                    }

                    history.forEachIndexed { index, entry ->
                        DetailedTrackingStep(
                            entry = entry,
                            isLast = index == history.lastIndex,
                            isActive = index == history.lastIndex
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailedTrackingStep(
    entry: OrderStatusEntry,
    isLast: Boolean,
    isActive: Boolean
) {
    val label = when (entry.status) {
        OrderStatus.CONFIRMED -> "Confirmado"
        OrderStatus.PREPARING -> "Preparando"
        OrderStatus.SHIPPED -> "Saiu para entrega"
        OrderStatus.DELIVERED -> "Entregue"
    }

    Row(modifier = Modifier.fillMaxWidth()) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .background(if (isActive) Green else SurfaceVariant, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                if (!isActive) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        tint = White,
                        modifier = Modifier.size(12.dp)
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(White, CircleShape)
                    )
                }
            }
            if (!isLast) {
                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(48.dp)
                        .background(if (isActive) SurfaceVariant else Green)
                )
            }
        }

        Column(
            modifier = Modifier
                .padding(start = 12.dp, bottom = if (isLast) 0.dp else 16.dp)
                .weight(1f)
        ) {
            Text(
                text = label,
                style = CBFont.Body2SemiBold,
                color = if (isActive) Green else Black
            )
            Text(text = entry.date, style = CBFont.Caption1, color = TextSecondary)
            if (entry.location.isNotEmpty()) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = TextSecondary,
                        modifier = Modifier.size(12.dp)
                    )
                    Text(text = entry.location, style = CBFont.Caption1, color = TextSecondary)
                }
            }
        }
    }
}

