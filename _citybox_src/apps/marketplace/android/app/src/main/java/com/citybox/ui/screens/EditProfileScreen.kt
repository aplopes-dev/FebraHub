package com.citybox.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.White

@Composable
fun EditProfileScreen(
    appState: AppState,
    onBack: () -> Unit,
    onSaved: () -> Unit
) {
    val user by appState.user.collectAsState()
    var name by remember(user) { mutableStateOf(user.name) }
    var email by remember(user) { mutableStateOf(user.email) }
    var phone by remember(user) { mutableStateOf(user.phone) }

    Scaffold(
        topBar = { SimpleAppBar(title = "Editar perfil", onBackClick = onBack, light = true) },
        containerColor = Surface
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = user.avatarInitial.ifEmpty { name.firstOrNull()?.uppercaseChar()?.toString() ?: "?" },
                style = CBFont.H1,
                color = White,
                modifier = Modifier
                    .background(Green, CircleShape)
                    .padding(32.dp)
            )

            ProfileField(value = name, onValueChange = { name = it }, label = "Nome")
            ProfileField(value = email, onValueChange = { email = it }, label = "E-mail", keyboardType = KeyboardType.Email)
            ProfileField(value = phone, onValueChange = { phone = it }, label = "Telefone", keyboardType = KeyboardType.Phone)

            Spacer(modifier = Modifier.height(8.dp))

            PrimaryButton(
                text = "Salvar",
                onClick = {
                    appState.updateProfile(name, email, phone)
                    onSaved()
                }
            )
        }
    }
}

@Composable
private fun ProfileField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    keyboardType: KeyboardType = KeyboardType.Text
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        modifier = Modifier.fillMaxWidth()
    )
}
