package com.citybox.ui.screens

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.ui.components.BadgeChip
import com.citybox.ui.components.BadgeChipStyle
import com.citybox.ui.components.CityBoxTextButton
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.components.TrackingTimeline
import com.citybox.ui.components.formatBRL
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.SurfaceVariant
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.TintSuccess
import com.citybox.ui.theme.White

@Composable
fun ConfirmationScreen(
    orderId: String,
    appState: AppState,
    onGoToOrders: () -> Unit,
    onGoHome: () -> Unit
) {
    val orders by appState.orders.collectAsState()
    val order = orders.find { it.id == orderId }

    var animated by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { animated = true }

    val scale by animateFloatAsState(
        targetValue = if (animated) 1f else 0f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ),
        label = "checkScale"
    )

    Scaffold(
        topBar = {
            SimpleAppBar(
                title = "Pedido Confirmado",
                onBackClick = null,
                light = true
            )
        },
        containerColor = Surface
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(24.dp))

            Box(
                modifier = Modifier
                    .size(120.dp)
                    .scale(scale),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .background(TintSuccess, CircleShape)
                )
                Box(
                    modifier = Modifier
                        .size(90.dp)
                        .background(Green, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        tint = White,
                        modifier = Modifier.size(40.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Pronto, é seu! 🎉",
                style = CBFont.H1.copy(fontWeight = FontWeight.ExtraBold),
                color = Black
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Pedido ${order?.id ?: orderId}",
                style = CBFont.Body2,
                color = TextSecondary
            )

            Spacer(modifier = Modifier.height(24.dp))

            if (order != null) {
                Card(
                    shape = CardShape,
                    colors = CardDefaults.cardColors(containerColor = White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Total pago",
                                    style = CBFont.Caption1,
                                    color = TextSecondary
                                )
                                Text(
                                    text = formatBRL(order.total),
                                    style = CBFont.H2.copy(fontWeight = FontWeight.Bold),
                                    color = Black
                                )
                            }
                            BadgeChip(
                                text = "Confirmado",
                                style = BadgeChipStyle.Success
                            )
                        }

                        HorizontalDivider(color = SurfaceVariant)

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Schedule,
                                contentDescription = null,
                                tint = Green,
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = "Previsão: ${order.deliveryDate}",
                                style = CBFont.Body2,
                                color = Black
                            )
                        }

                        if (order.items.isNotEmpty()) {
                            HorizontalDivider(color = SurfaceVariant)

                            Column(
                                verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    text = "${order.items.size} ${if (order.items.size == 1) "item" else "itens"}",
                                    style = CBFont.Caption1,
                                    color = TextSecondary
                                )
                                order.items.forEach { item ->
                                    Text(
                                        text = "• ${item.product.name}",
                                        style = CBFont.Caption1,
                                        color = Black,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }
                }

                TrackingTimeline(
                    currentStatus = order.status,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            PrimaryButton(
                text = "Acompanhar pedido",
                onClick = onGoToOrders
            )

            Spacer(modifier = Modifier.height(12.dp))

            CityBoxTextButton(
                text = "Voltar ao início",
                onClick = onGoHome
            )

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
