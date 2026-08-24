package com.citybox.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.data.Coupon
import com.citybox.data.CouponType
import com.citybox.data.MockData
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.Border
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.ErrorRed
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.InputShape
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.TintSuccess
import com.citybox.ui.theme.White

@Composable
fun CouponsScreen(
    appState: AppState,
    onBack: () -> Unit
) {
    val applied by appState.appliedCoupon.collectAsState()
    val availableCoupons by appState.availableCoupons.collectAsState()
    var codeInput by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            SimpleAppBar(title = "Cupons", onBackClick = onBack, light = true)
        },
        containerColor = Surface
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = codeInput,
                        onValueChange = {
                            codeInput = it
                            errorMessage = null
                        },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Inserir código") },
                        shape = InputShape,
                        singleLine = true
                    )
                    if (errorMessage != null) {
                        Text(text = errorMessage!!, style = CBFont.Caption1, color = ErrorRed)
                    }
                    PrimaryButton(
                        text = "Aplicar código",
                        onClick = {
                            if (appState.applyCoupon(codeInput.trim())) {
                                codeInput = ""
                                errorMessage = null
                            } else {
                                errorMessage = "Cupom inválido ou expirado"
                            }
                        },
                        enabled = codeInput.isNotBlank()
                    )
                    if (applied != null) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(TintSuccess, RoundedCornerShape(8.dp))
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "${applied!!.code} aplicado",
                                style = CBFont.Body2,
                                color = Green
                            )
                            Text(
                                text = "Remover",
                                style = CBFont.Caption1,
                                color = ErrorRed,
                                modifier = Modifier.clickable { appState.removeCoupon() }
                            )
                        }
                    }
                }
            }

            item {
                Text(text = "Disponíveis para você", style = CBFont.H3, color = Black)
            }

            items(availableCoupons, key = { it.code }) { coupon ->
                CouponCard(
                    coupon = coupon,
                    isApplied = applied?.code == coupon.code,
                    onApply = {
                        appState.applyCoupon(coupon.code)
                        errorMessage = null
                    }
                )
            }
        }
    }
}

@Composable
private fun CouponCard(
    coupon: Coupon,
    isApplied: Boolean,
    onApply: () -> Unit
) {
    Card(
        shape = CardShape,
        colors = CardDefaults.cardColors(containerColor = if (isApplied) TintSuccess else White),
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = if (isApplied) 1.5.dp else 1.dp,
                color = if (isApplied) Green else Border,
                shape = CardShape
            )
            .clickable(onClick = onApply)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = coupon.code, style = CBFont.Body1, color = Black)
                Text(
                    text = if (isApplied) "Aplicado ✓" else "Aplicar",
                    style = CBFont.Caption2SemiBold,
                    color = Green
                )
            }
            Text(text = coupon.description, style = CBFont.Body2, color = TextSecondary)
            Text(
                text = when (coupon.type) {
                    CouponType.PERCENT -> "${coupon.value.toInt()}% de desconto"
                    CouponType.FIXED -> "R$ ${"%.0f".format(coupon.value)} off"
                } + " · Válido até ${coupon.expiry}",
                style = CBFont.Caption1,
                color = TextSecondary
            )
        }
    }
}
