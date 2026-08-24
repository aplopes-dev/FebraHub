package com.citybox.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.ErrorRed
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.White

@Composable
fun SettingsScreen(
    appState: AppState,
    onBack: () -> Unit
) {
    var pushEnabled by remember { mutableStateOf(true) }
    var emailEnabled by remember { mutableStateOf(true) }
    var darkTheme by remember { mutableStateOf(false) }

    Scaffold(
        topBar = { SimpleAppBar(title = "Configurações", onBackClick = onBack, light = true) },
        containerColor = Surface
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            SettingsCard(title = "Notificações") {
                SettingsToggle("Push de pedidos", pushEnabled) { pushEnabled = it }
                SettingsToggle("E-mails promocionais", emailEnabled) { emailEnabled = it }
            }

            SettingsCard(title = "Aparência") {
                SettingsToggle("Tema escuro", darkTheme) { darkTheme = it }
            }

            SettingsCard(title = "Idioma") {
                Text("Português (Brasil)", style = CBFont.Body2, color = Black, modifier = Modifier.padding(vertical = 8.dp))
            }

            PrimaryButton(
                text = "Excluir conta",
                onClick = { appState.isLoggedIn.value = false },
                modifier = Modifier.fillMaxWidth()
            )
            Text(
                text = "Esta ação é irreversível (mock).",
                style = CBFont.Caption2,
                color = TextSecondary
            )
        }
    }
}

@Composable
private fun SettingsCard(title: String, content: @Composable () -> Unit) {
    Card(
        shape = CardShape,
        colors = CardDefaults.cardColors(containerColor = White),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(text = title, style = CBFont.H3, color = Black)
            content()
        }
    }
}

@Composable
private fun SettingsToggle(label: String, checked: Boolean, onChecked: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = label, style = CBFont.Body2, color = Black)
        Switch(checked = checked, onCheckedChange = onChecked)
    }
}
