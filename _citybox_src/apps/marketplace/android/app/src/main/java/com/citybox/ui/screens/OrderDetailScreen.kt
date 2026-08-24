package com.citybox.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.citybox.data.AppState
import com.citybox.data.Order
import com.citybox.data.OrderStatus
import com.citybox.ui.components.Badge
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SecondaryButton
import com.citybox.ui.components.SimpleAppBar
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
import androidx.compose.ui.graphics.Color

private val WarningBrown = Color(0xFFB45309)

@Composable
fun OrderDetailScreen(
    orderId: String,
    appState: AppState,
    onBack: () -> Unit,
    onTrack: (String) -> Unit,
    onReview: (String, String) -> Unit,
    onReturn: (String) -> Unit,
    onBuyAgain: () -> Unit,
    onInvoice: () -> Unit
) {
    val orders by appState.orders.collectAsState()
    val order = orders.find { it.id == orderId }

    Scaffold(
        topBar = { SimpleAppBar(title = "Detalhe do pedido", onBackClick = onBack, light = true) },
        containerColor = Surface
    ) { padding ->
        if (order == null) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
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
            OrderDetailHeader(order)

            Card(
                shape = CardShape,
                colors = CardDefaults.cardColors(containerColor = White),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text("Acompanhamento", style = CBFont.H3, color = Black)
                    TrackingTimeline(currentStatus = order.status)
                }
            }

            DetailSection(title = "Itens (${order.items.size})") {
                order.items.forEach { item ->
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        AsyncImage(
                            model = item.product.imageUrl,
                            contentDescription = item.product.name,
                            modifier = Modifier
                                .size(56.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Surface),
                            contentScale = ContentScale.Crop
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = item.product.name,
                                style = CBFont.Body2,
                                color = Black,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "Qtd: ${item.quantity} · ${formatBRL(item.product.price)}",
                                style = CBFont.Caption1,
                                color = TextSecondary
                            )
                        }
                    }
                    if (item != order.items.last()) HorizontalDivider(color = SurfaceVariant)
                }
            }

            order.address?.let { address ->
                DetailSection(title = "Endereço de entrega") {
                    Text(text = address.label, style = CBFont.Body2SemiBold, color = Black)
                    Text(text = address.formattedLine1, style = CBFont.Body2, color = Black)
                    Text(
                        text = "${address.neighborhood} · ${address.formattedLine2}",
                        style = CBFont.Caption1,
                        color = TextSecondary
                    )
                }
            }

            order.paymentMethod?.let { payment ->
                DetailSection(title = "Forma de pagamento") {
                    Text(text = payment.displayName, style = CBFont.Body2, color = Black)
                    Text(
                        text = "Validade ${payment.expiry}",
                        style = CBFont.Caption1,
                        color = TextSecondary
                    )
                }
            }

            DetailSection(title = "Resumo") {
                SummaryLine("Subtotal", formatBRL(order.subtotal))
                SummaryLine("Frete", if (order.shipping <= 0) "Grátis" else formatBRL(order.shipping))
                if (order.discount > 0) {
                    SummaryLine("Desconto", "-${formatBRL(order.discount)}", valueColor = Green)
                }
                HorizontalDivider(color = SurfaceVariant, modifier = Modifier.padding(vertical = 4.dp))
                SummaryLine("Total", formatBRL(order.total), bold = true)
            }

            PrimaryButton(text = "Rastrear pedido", onClick = { onTrack(order.id) })

            SecondaryButton(text = "Comprar novamente", onClick = onBuyAgain)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                ActionChip(text = "Nota fiscal", onClick = onInvoice, modifier = Modifier.weight(1f))
                ActionChip(
                    text = "Avaliar",
                    onClick = {
                        order.items.firstOrNull()?.let {
                            onReview(order.id, it.product.id)
                        }
                    },
                    modifier = Modifier.weight(1f)
                )
            }

            if (order.status != OrderStatus.DELIVERED) {
                SecondaryButton(
                    text = "Cancelar pedido",
                    onClick = { onReturn(order.id) }
                )
            } else {
                SecondaryButton(
                    text = "Devolver / reembolso",
                    onClick = { onReturn(order.id) }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun OrderDetailHeader(order: Order) {
    val (statusBg, statusFg, statusLabel) = orderStatusStyle(order.status)

    Card(
        shape = CardShape,
        colors = CardDefaults.cardColors(containerColor = White),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Pedido #${order.id}",
                    style = CBFont.H3.copy(fontWeight = FontWeight.Bold),
                    color = Black
                )
                Badge(text = statusLabel, containerColor = statusBg, contentColor = statusFg)
            }
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Schedule,
                    contentDescription = null,
                    tint = TextSecondary,
                    modifier = Modifier.size(14.dp)
                )
                Text(text = order.deliveryDate, style = CBFont.Caption1, color = TextSecondary)
            }
            if (order.trackingCode.isNotEmpty()) {
                Text(
                    text = "Rastreio: ${order.trackingCode}",
                    style = CBFont.Caption1,
                    color = Green
                )
            }
        }
    }
}

@Composable
private fun DetailSection(
    title: String,
    content: @Composable () -> Unit
) {
    Card(
        shape = CardShape,
        colors = CardDefaults.cardColors(containerColor = White),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(text = title, style = CBFont.H3, color = Black)
            content()
        }
    }
}

@Composable
private fun SummaryLine(
    label: String,
    value: String,
    bold: Boolean = false,
    valueColor: Color = Black
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = if (bold) CBFont.Body1 else CBFont.Body2,
            color = TextSecondary
        )
        Text(
            text = value,
            style = if (bold) CBFont.H3.copy(fontWeight = FontWeight.Bold) else CBFont.Body2,
            color = valueColor
        )
    }
}

@Composable
private fun ActionChip(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Text(
        text = text,
        style = CBFont.Body2,
        color = Black,
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(SurfaceVariant)
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp),
        textAlign = androidx.compose.ui.text.style.TextAlign.Center
    )
}

private fun orderStatusStyle(status: OrderStatus): Triple<Color, Color, String> {
    return when (status) {
        OrderStatus.CONFIRMED -> Triple(TintInfo, GoogleBlue, "Confirmado")
        OrderStatus.PREPARING -> Triple(TintWarning, WarningBrown, "Preparando")
        OrderStatus.SHIPPED -> Triple(TintSuccess, Green, "Saiu para entrega")
        OrderStatus.DELIVERED -> Triple(SurfaceVariant, TextSecondary, "Entregue")
    }
}
