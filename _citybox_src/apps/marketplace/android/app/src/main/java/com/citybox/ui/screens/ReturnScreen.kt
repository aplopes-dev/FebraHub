package com.citybox.ui.screens

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
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.citybox.data.AppState
import com.citybox.data.CartItem
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.White

private val returnReasons = listOf(
    "Produto com defeito",
    "Veio errado / incompleto",
    "Arrependimento (7 dias)",
    "Não atendeu expectativas",
    "Outro motivo"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReturnScreen(
    orderId: String,
    appState: AppState,
    onBack: () -> Unit,
    onSubmitted: () -> Unit
) {
    val orders by appState.orders.collectAsState()
    val order = orders.find { it.id == orderId }

    var selectedItem by remember(order) { mutableStateOf<CartItem?>(order?.items?.firstOrNull()) }
    var reasonExpanded by remember { mutableStateOf(false) }
    var selectedReason by remember { mutableStateOf(returnReasons.first()) }
    var description by remember { mutableStateOf("") }
    var submitted by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            SimpleAppBar(
                title = if (order?.status == com.citybox.data.OrderStatus.DELIVERED) "Devolução" else "Cancelamento",
                onBackClick = onBack,
                light = true
            )
        },
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
            if (submitted) {
                Card(
                    shape = CardShape,
                    colors = CardDefaults.cardColors(containerColor = White),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(text = "Solicitação enviada ✓", style = CBFont.H3, color = Green)
                        Text(
                            text = "Você receberá instruções por e-mail em até 24h.",
                            style = CBFont.Body2,
                            color = TextSecondary
                        )
                    }
                }
                return@Column
            }

            Text(text = "Selecione o item", style = CBFont.H3, color = Black)

            order.items.forEach { item ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(
                        selected = selectedItem?.product?.id == item.product.id,
                        onClick = { selectedItem = item }
                    )
                    AsyncImage(
                        model = item.product.imageUrl,
                        contentDescription = item.product.name,
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(8.dp)),
                        contentScale = ContentScale.Crop
                    )
                    Column(modifier = Modifier.padding(start = 12.dp)) {
                        Text(
                            text = item.product.name,
                            style = CBFont.Body2,
                            color = Black,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "Qtd: ${item.quantity}",
                            style = CBFont.Caption1,
                            color = TextSecondary
                        )
                    }
                }
            }

            Text(text = "Motivo", style = CBFont.H3, color = Black)

            ExposedDropdownMenuBox(
                expanded = reasonExpanded,
                onExpandedChange = { reasonExpanded = it }
            ) {
                OutlinedTextField(
                    value = selectedReason,
                    onValueChange = {},
                    readOnly = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(),
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = reasonExpanded) }
                )
                ExposedDropdownMenu(
                    expanded = reasonExpanded,
                    onDismissRequest = { reasonExpanded = false }
                ) {
                    returnReasons.forEach { reason ->
                        DropdownMenuItem(
                            text = { Text(reason) },
                            onClick = {
                                selectedReason = reason
                                reasonExpanded = false
                            }
                        )
                    }
                }
            }

            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp),
                label = { Text("Descrição (opcional)") },
                placeholder = { Text("Detalhe o problema...") }
            )

            PrimaryButton(
                text = "Solicitar devolução",
                onClick = {
                    submitted = true
                    val currentOrder = order
                    val item = selectedItem
                    if (currentOrder != null && item != null) {
                        val reasonCode = when (selectedReason) {
                            "Produto com defeito" -> "DEFECT"
                            "Veio errado / incompleto" -> "WRONG_ITEM"
                            "Arrependimento (7 dias)" -> "REGRET_7_DAYS"
                            "Não atendeu expectativas" -> "NOT_AS_EXPECTED"
                            else -> "OTHER"
                        }
                        if (currentOrder.status == com.citybox.data.OrderStatus.DELIVERED) {
                            appState.requestReturn(
                                orderId = currentOrder.id,
                                productId = item.product.id,
                                quantity = item.quantity,
                                reason = reasonCode,
                                description = description.ifBlank { null }
                            )
                        } else {
                            appState.cancelOrder(currentOrder.id, reasonCode, description.ifBlank { null })
                        }
                    }
                    onSubmitted()
                },
                enabled = selectedItem != null
            )
        }
    }
}

