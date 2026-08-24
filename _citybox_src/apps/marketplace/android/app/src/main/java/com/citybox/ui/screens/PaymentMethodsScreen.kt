package com.citybox.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.White

@Composable
fun PaymentMethodsScreen(
    appState: AppState,
    onBack: () -> Unit,
    onAddCard: () -> Unit
) {
    val methods by appState.paymentMethods.collectAsState()

    Scaffold(
        topBar = { SimpleAppBar(title = "Meus Cartões", onBackClick = onBack, light = true) },
        containerColor = Surface,
        floatingActionButton = {
            FloatingActionButton(onClick = onAddCard, containerColor = Green) {
                Icon(Icons.Default.Add, contentDescription = "Adicionar", tint = White)
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(methods, key = { it.id }) { method ->
                Card(
                    shape = CardShape,
                    colors = CardDefaults.cardColors(containerColor = White),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = method.displayName, style = CBFont.Body1, color = Black)
                            Text(text = "${method.holderName} · Val. ${method.expiry}", style = CBFont.Caption1, color = TextSecondary)
                            if (method.isDefault) {
                                Text(text = "Padrão", style = CBFont.Caption2, color = Green)
                            }
                        }
                        IconButton(onClick = { appState.removePaymentMethod(method.id) }) {
                            Icon(Icons.Default.Delete, contentDescription = "Excluir", tint = androidx.compose.ui.graphics.Color.Red)
                        }
                    }
                }
            }
        }
    }
}
