package com.citybox.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.data.CreatedTicket
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.White
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OpenTicketScreen(
    appState: AppState,
    onBackToHelp: () -> Unit
) {
    val orders by appState.orders.collectAsState()

    var subject by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var selectedOrderId by remember { mutableStateOf("") }
    var orderExpanded by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var confirmation by remember { mutableStateOf<CreatedTicket?>(null) }
    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            SimpleAppBar(
                title = "Abrir chamado",
                onBackClick = onBackToHelp,
                light = true
            )
        },
        containerColor = Surface
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (confirmation != null) {
                Card(
                    shape = CardShape,
                    colors = CardDefaults.cardColors(containerColor = White),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "Chamado aberto ✓",
                            style = CBFont.H3,
                            color = Green
                        )
                        Text(
                            text = "Seu ticket foi registrado. A equipe responderá em breve.",
                            style = CBFont.Body2,
                            color = TextSecondary
                        )
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                text = "Ticket: ${confirmation!!.ticketId}",
                                style = CBFont.Body2,
                                color = Black
                            )
                            Text(
                                text = "Status: ${confirmation!!.status}",
                                style = CBFont.Body2,
                                color = Black
                            )
                        }
                    }
                }

                PrimaryButton(
                    text = "Voltar à Ajuda",
                    onClick = onBackToHelp,
                    modifier = Modifier.padding(top = 8.dp)
                )
                return@Column
            }

            Text(
                text = "Descreva sua solicitação. Você receberá o número do ticket ao enviar.",
                style = CBFont.Body2,
                color = TextSecondary
            )

            OutlinedTextField(
                value = subject,
                onValueChange = { subject = it },
                label = { Text("Assunto") },
                placeholder = { Text("Ex.: Problema com entrega") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            OutlinedTextField(
                value = message,
                onValueChange = { message = it },
                label = { Text("Mensagem") },
                placeholder = { Text("Descreva o que aconteceu...") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp),
                minLines = 4
            )

            if (orders.isNotEmpty()) {
                ExposedDropdownMenuBox(
                    expanded = orderExpanded,
                    onExpandedChange = { orderExpanded = it }
                ) {
                    OutlinedTextField(
                        value = selectedOrderId.ifEmpty { "Nenhum pedido" },
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Pedido relacionado (opcional)") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = orderExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = orderExpanded,
                        onDismissRequest = { orderExpanded = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Nenhum pedido") },
                            onClick = {
                                selectedOrderId = ""
                                orderExpanded = false
                            }
                        )
                        orders.forEach { order ->
                            DropdownMenuItem(
                                text = { Text("Pedido #${order.id}") },
                                onClick = {
                                    selectedOrderId = order.id
                                    orderExpanded = false
                                }
                            )
                        }
                    }
                }
            }

            error?.let {
                Text(
                    text = it,
                    style = CBFont.Body2,
                    color = Black,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 4.dp)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            PrimaryButton(
                text = "Enviar chamado",
                onClick = {
                    val trimmedSubject = subject.trim()
                    val trimmedMessage = message.trim()
                    if (trimmedSubject.isEmpty() || trimmedMessage.isEmpty()) {
                        error = "Preencha assunto e mensagem."
                        return@PrimaryButton
                    }
                    error = null
                    scope.launch {
                        val result = appState.createTicket(
                            subject = trimmedSubject,
                            message = trimmedMessage,
                            orderId = selectedOrderId.takeIf { it.isNotEmpty() }
                        )
                        if (result != null) {
                            confirmation = result
                        } else {
                            error = "Não foi possível abrir o chamado. Tente novamente."
                        }
                    }
                },
                enabled = subject.trim().isNotEmpty() && message.trim().isNotEmpty()
            )
        }
    }
}
