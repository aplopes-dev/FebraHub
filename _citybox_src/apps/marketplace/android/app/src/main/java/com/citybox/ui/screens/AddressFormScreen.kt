package com.citybox.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Checkbox
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
import com.citybox.data.Address
import com.citybox.data.AppState
import com.citybox.ui.components.CityBoxTextButton
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.Surface

@Composable
fun AddressFormScreen(
    appState: AppState,
    addressId: String?,
    onBack: () -> Unit,
    onSaved: () -> Unit
) {
    val addresses by appState.addresses.collectAsState()
    val existing = addressId?.let { id -> addresses.find { it.id == id } }

    var label by remember(existing) { mutableStateOf(existing?.label ?: "Casa") }
    var zipCode by remember(existing) { mutableStateOf(existing?.zipCode ?: "") }
    var street by remember(existing) { mutableStateOf(existing?.street ?: "") }
    var number by remember(existing) { mutableStateOf(existing?.number ?: "") }
    var complement by remember(existing) { mutableStateOf(existing?.complement ?: "") }
    var neighborhood by remember(existing) { mutableStateOf(existing?.neighborhood ?: "") }
    var city by remember(existing) { mutableStateOf(existing?.city ?: "") }
    var state by remember(existing) { mutableStateOf(existing?.state ?: "") }
    var isDefault by remember(existing) { mutableStateOf(existing?.isDefault ?: addresses.isEmpty()) }

    Scaffold(
        topBar = {
            SimpleAppBar(
                title = if (existing != null) "Editar endereço" else "Adicionar endereço",
                onBackClick = onBack,
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
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                CityBoxTextButton(text = "Casa", onClick = { label = "Casa" })
                CityBoxTextButton(text = "Trabalho", onClick = { label = "Trabalho" })
            }

            FormField(label, { label = it }, "Apelido")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                FormField(zipCode, { zipCode = it }, "CEP", Modifier.weight(1f), KeyboardType.Number)
                CityBoxTextButton(
                    text = "Buscar",
                    onClick = {
                        if (zipCode.length >= 5) {
                            street = "Rua Exemplo"
                            neighborhood = "Centro"
                            city = "São Paulo"
                            state = "SP"
                        }
                    },
                    modifier = Modifier.align(Alignment.CenterVertically)
                )
            }
            FormField(street, { street = it }, "Rua")
            FormField(number, { number = it }, "Número", keyboardType = KeyboardType.Number)
            FormField(complement, { complement = it }, "Complemento")
            FormField(neighborhood, { neighborhood = it }, "Bairro")
            FormField(city, { city = it }, "Cidade")
            FormField(state, { state = it }, "UF")

            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked = isDefault, onCheckedChange = { isDefault = it })
                Text("Endereço padrão", style = CBFont.Body2, color = Black)
            }

            PrimaryButton(
                text = "Salvar",
                onClick = {
                    val address = Address(
                        id = existing?.id ?: "addr-${System.currentTimeMillis()}",
                        label = label,
                        zipCode = zipCode,
                        street = street,
                        number = number,
                        complement = complement,
                        neighborhood = neighborhood,
                        city = city,
                        state = state,
                        isDefault = isDefault
                    )
                    if (existing != null) appState.editAddress(address) else appState.addAddress(address)
                    onSaved()
                }
            )
        }
    }
}

@Composable
private fun FormField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier.fillMaxWidth(),
    keyboardType: KeyboardType = KeyboardType.Text
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        modifier = modifier
    )
}
