package com.citybox.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.data.SupportTicket
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.White

@Composable
fun TicketListScreen(
    appState: AppState,
    onBack: () -> Unit,
    onOpenTicket: () -> Unit
) {
    val tickets by appState.tickets.collectAsState()

    Scaffold(
        topBar = { SimpleAppBar(title = "Meus chamados", onBackClick = onBack, light = true) },
        containerColor = Surface
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (tickets.isEmpty()) {
                item {
                    Card(
                        shape = CardShape,
                        colors = CardDefaults.cardColors(containerColor = White),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "Nenhum chamado aberto",
                            style = CBFont.Body2,
                            color = TextSecondary,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp)
                        )
                    }
                }
            } else {
                items(tickets) { ticket ->
                    TicketCard(ticket)
                }
            }

            item {
                Spacer(modifier = Modifier.height(8.dp))
                PrimaryButton(
                    text = "Abrir novo chamado",
                    onClick = onOpenTicket
                )
            }
        }
    }
}

@Composable
private fun TicketCard(ticket: SupportTicket) {
    Card(
        shape = CardShape,
        colors = CardDefaults.cardColors(containerColor = White),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = ticket.subject,
                    style = CBFont.Body1,
                    color = Black,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = if (ticket.status == "OPEN") "Aberto" else "Encerrado",
                    style = CBFont.Caption1,
                    color = if (ticket.status == "OPEN") Green else TextSecondary
                )
            }
            Text(
                text = ticket.message,
                style = CBFont.Body2,
                color = TextSecondary,
                maxLines = 2
            )
            Text(
                text = "#${ticket.ticketId}",
                style = CBFont.Caption1,
                color = TextSecondary
            )
        }
    }
}
