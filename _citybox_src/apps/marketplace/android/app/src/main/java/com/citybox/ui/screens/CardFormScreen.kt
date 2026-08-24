package com.citybox.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.data.CardBrand
import com.citybox.data.PaymentMethod
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.Surface

@Composable
fun CardFormScreen(
    appState: AppState,
    onBack: () -> Unit,
    onSaved: () -> Unit
) {
    var number by remember { mutableStateOf("") }
    var holderName by remember { mutableStateOf("") }
    var expiry by remember { mutableStateOf("") }
    var cvv by remember { mutableStateOf("") }

    val brand = remember(number) {
        when {
            number.startsWith("4") -> CardBrand.VISA
            number.startsWith("5") -> CardBrand.MASTERCARD
            number.startsWith("6") -> CardBrand.ELO
            number.startsWith("3") -> CardBrand.AMEX
            else -> CardBrand.UNKNOWN
        }
    }

    Scaffold(
        topBar = { SimpleAppBar(title = "Adicionar cartão", onBackClick = onBack, light = true) },
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
            if (number.isNotEmpty()) {
                Text(text = "Bandeira: ${brand.name}", style = CBFont.Caption1, color = Black)
            }

            OutlinedTextField(
                value = number,
                onValueChange = { if (it.length <= 19) number = it.filter { c -> c.isDigit() } },
                label = { Text("Número do cartão") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = holderName,
                onValueChange = { holderName = it },
                label = { Text("Nome no cartão") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = expiry,
                onValueChange = { expiry = it },
                label = { Text("Validade (MM/AA)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = cvv,
                onValueChange = { if (it.length <= 4) cvv = it.filter { c -> c.isDigit() } },
                label = { Text("CVV") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                modifier = Modifier.fillMaxWidth()
            )

            PrimaryButton(
                text = "Salvar",
                onClick = {
                    val lastFour = number.takeLast(4).ifEmpty { "0000" }
                    val isDefault = appState.paymentMethods.value.isEmpty()
                    appState.addPaymentMethod(
                        PaymentMethod(
                            id = "card-${System.currentTimeMillis()}",
                            brand = brand,
                            lastFour = lastFour,
                            expiry = expiry.ifEmpty { "12/28" },
                            holderName = holderName.ifEmpty { "Titular" },
                            isDefault = isDefault
                        )
                    )
                    // Em modo LIVE envia os dados crus do cartão ao BFF (no-op em mock)
                    appState.addCard(
                        number = number,
                        holderName = holderName.ifEmpty { "Titular" },
                        expiry = expiry.ifEmpty { "12/28" },
                        cvv = cvv.ifEmpty { "123" },
                        isDefault = isDefault
                    )
                    onSaved()
                }
            )
        }
    }
}
