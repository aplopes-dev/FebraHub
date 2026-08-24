package com.citybox.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
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
import com.citybox.ui.components.CartLineItem
import com.citybox.ui.components.CityBoxTextButton
import com.citybox.ui.components.EmptyState
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SummaryRow
import com.citybox.ui.components.formatBRL
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.ErrorRed
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.InputShape
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.SurfaceVariant
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.TintSuccess
import com.citybox.ui.theme.White

@Composable
fun CartScreen(
    appState: AppState,
    onCheckout: () -> Unit,
    onCoupons: () -> Unit = {},
    onGoHome: () -> Unit,
    modifier: Modifier = Modifier
) {
    val cart by appState.cart.collectAsState()
    val cartTotal by appState.cartTotal.collectAsState()
    val cartCount by appState.cartCount.collectAsState()
    val selectedAddress by appState.selectedAddress.collectAsState()
    val selectedShipping by appState.selectedShipping.collectAsState()
    val appliedCoupon by appState.appliedCoupon.collectAsState()
    var codeInput by remember { mutableStateOf("") }
    var couponError by remember { mutableStateOf<String?>(null) }

    val shippingCost = selectedShipping?.price ?: 0.0
    val couponDiscount = appState.couponDiscountAmount(cartTotal)
    val grandTotal = appState.orderGrandTotal(cartTotal)
    val shippingLabel = selectedAddress?.let { "${it.city}, ${it.state}" } ?: "seu endereço"

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Surface)
    ) {
        if (cart.isEmpty()) {
            EmptyState(
                icon = Icons.Default.ShoppingCart,
                title = "Seu carrinho está vazio",
                subtitle = "Adicione produtos para continuar comprando",
                actionText = "Ver ofertas",
                onAction = onGoHome,
                modifier = Modifier.align(Alignment.Center)
            )
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Card(
                    shape = CardShape,
                    colors = CardDefaults.cardColors(containerColor = White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Itens ($cartCount)",
                            style = CBFont.H3,
                            color = Black,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        cart.forEachIndexed { index, item ->
                            CartLineItem(
                                item = item,
                                onRemove = { appState.removeFromCart(item.product.id) },
                                onQuantityChange = { appState.updateQuantity(item.product.id, it) }
                            )
                            if (index < cart.lastIndex) {
                                HorizontalDivider(color = SurfaceVariant)
                            }
                        }
                    }
                }

                Card(
                    shape = CardShape,
                    colors = CardDefaults.cardColors(containerColor = White),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(text = "Cupom de desconto", style = CBFont.H3, color = Black)
                        if (appliedCoupon != null) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(text = appliedCoupon!!.code, style = CBFont.Body2, color = Black)
                                    Text(text = appliedCoupon!!.description, style = CBFont.Caption1, color = TextSecondary)
                                }
                                CityBoxTextButton(text = "Remover", onClick = { appState.removeCoupon() })
                            }
                        } else {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                OutlinedTextField(
                                    value = codeInput,
                                    onValueChange = {
                                        codeInput = it
                                        couponError = null
                                    },
                                    modifier = Modifier.weight(1f),
                                    placeholder = { Text("Código") },
                                    shape = InputShape,
                                    singleLine = true
                                )
                                CityBoxTextButton(
                                    text = "Aplicar",
                                    onClick = {
                                        if (appState.applyCoupon(codeInput.trim())) {
                                            codeInput = ""
                                            couponError = null
                                        } else {
                                            couponError = "Cupom inválido"
                                        }
                                    }
                                )
                            }
                            couponError?.let {
                                Text(text = it, style = CBFont.Caption1, color = ErrorRed)
                            }
                        }
                        CityBoxTextButton(text = "Ver cupons disponíveis", onClick = onCoupons)
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(TintSuccess, CardShape)
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.LocalShipping,
                        contentDescription = null,
                        tint = Green,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "Envio para $shippingLabel · ${selectedShipping?.name ?: "Express"}",
                        style = CBFont.Body2,
                        color = Black,
                        modifier = Modifier.weight(1f)
                    )
                    Text(
                        text = if (shippingCost <= 0) "Grátis" else formatBRL(shippingCost),
                        style = CBFont.Body2SemiBold,
                        color = Green
                    )
                }

                Card(
                    shape = CardShape,
                    colors = CardDefaults.cardColors(containerColor = White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "Resumo do pedido",
                            style = CBFont.H3,
                            color = Black
                        )
                        SummaryRow(label = "Subtotal", value = formatBRL(cartTotal))
                        SummaryRow(
                            label = "Frete (${selectedShipping?.name ?: "Express"})",
                            value = if (shippingCost <= 0) "Grátis" else formatBRL(shippingCost),
                            valueColor = if (shippingCost <= 0) Green else Black
                        )
                        if (couponDiscount > 0) {
                            SummaryRow(
                                label = "Cupom (${appliedCoupon?.code ?: ""})",
                                value = "-${formatBRL(couponDiscount)}",
                                valueColor = Green
                            )
                        }
                        HorizontalDivider(color = SurfaceVariant)
                        SummaryRow(
                            label = "Total",
                            value = formatBRL(grandTotal),
                            labelStyle = CBFont.Body1,
                            valueStyle = CBFont.H3,
                            valueBold = true
                        )
                        Text(
                            text = "ou 12x de ${formatBRL(grandTotal / 12)} sem juros",
                            style = CBFont.Caption1,
                            color = TextSecondary
                        )
                    }
                }

                PrimaryButton(
                    text = "Finalizar compra",
                    onClick = onCheckout
                )

                Spacer(modifier = Modifier.size(8.dp))
            }
        }
    }
}
