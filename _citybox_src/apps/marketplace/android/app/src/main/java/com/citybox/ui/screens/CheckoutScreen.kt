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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Pix
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.data.CheckoutPaymentType
import com.citybox.data.PaymentMethod
import com.citybox.ui.components.BadgeChip
import com.citybox.ui.components.BadgeChipStyle
import com.citybox.ui.components.CityBoxTextButton
import com.citybox.ui.components.PaymentOptionRow
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.components.SummaryRow
import com.citybox.ui.components.formatBRL
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.Border
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.ErrorRed
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.InputShape
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.SurfaceVariant
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.TextTertiary
import com.citybox.ui.theme.White
import kotlinx.coroutines.launch

@Composable
fun CheckoutScreen(
    appState: AppState,
    onConfirm: (String) -> Unit,
    onBack: () -> Unit,
    onChangeAddress: () -> Unit = {},
    onChangeShipping: () -> Unit = {},
    onCoupons: () -> Unit = {},
    onAddCard: () -> Unit = {}
) {
    val cartTotal by appState.cartTotal.collectAsState()
    val cartCount by appState.cartCount.collectAsState()
    val selectedAddress by appState.selectedAddress.collectAsState()
    val selectedShipping by appState.selectedShipping.collectAsState()
    val appliedCoupon by appState.appliedCoupon.collectAsState()
    val checkoutPaymentType by appState.checkoutPaymentType.collectAsState()
    val paymentMethods by appState.paymentMethods.collectAsState()
    val selectedCard by appState.selectedPayment.collectAsState()
    val boletoCpf by appState.boletoCpf.collectAsState()
    var codeInput by remember { mutableStateOf("") }
    var couponError by remember { mutableStateOf<String?>(null) }

    val shippingCost = selectedShipping?.price ?: 0.0
    val couponDiscount = appState.couponDiscountAmount(cartTotal)
    val grandTotal = appState.orderGrandTotal(cartTotal)
    val effectiveTotal = if (checkoutPaymentType == CheckoutPaymentType.PIX) grandTotal * 0.95 else grandTotal
    val pixDiscount = if (checkoutPaymentType == CheckoutPaymentType.PIX) grandTotal * 0.05 else 0.0
    val canConfirm = appState.canConfirmCheckout()
    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = { SimpleAppBar(title = "Finalizar Compra", onBackClick = onBack, light = true) },
        containerColor = Surface
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            CheckoutSection(title = "Endereço de entrega") {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = selectedAddress?.formattedLine1 ?: "Nenhum endereço selecionado",
                            style = CBFont.Body2,
                            color = Black
                        )
                        Text(
                            text = selectedAddress?.formattedLine2 ?: "",
                            style = CBFont.Caption1,
                            color = TextSecondary
                        )
                    }
                    CityBoxTextButton(text = "Alterar", onClick = onChangeAddress)
                }
            }

            CheckoutSection(title = "Envio") {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(onClick = onChangeShipping),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (selectedShipping?.isExpress == true) {
                        BadgeChip(
                            text = "EXPRESS",
                            style = BadgeChipStyle.Info,
                            icon = Icons.Default.Bolt
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = selectedShipping?.name ?: "Express",
                            style = CBFont.Body2,
                            color = Black
                        )
                        Text(
                            text = selectedShipping?.deliveryEstimate ?: "Amanhã até 22h",
                            style = CBFont.Caption1,
                            color = TextSecondary
                        )
                    }
                    CityBoxTextButton(text = "Alterar", onClick = onChangeShipping)
                    Text(
                        text = if (shippingCost <= 0) "Grátis" else formatBRL(shippingCost),
                        style = CBFont.Body2SemiBold,
                        color = if (shippingCost <= 0) Green else Black
                    )
                }
            }

            CheckoutSection(title = "Cupom") {
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
                            placeholder = { Text("Código promocional") },
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

            CheckoutSection(title = "Forma de pagamento") {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    PaymentOptionRow(
                        icon = Icons.Default.Pix,
                        title = "PIX",
                        subtitle = "Aprovação imediata",
                        selected = checkoutPaymentType == CheckoutPaymentType.PIX,
                        onClick = { appState.setCheckoutPaymentType(CheckoutPaymentType.PIX) },
                        discountLabel = "5% off"
                    )
                    PaymentOptionRow(
                        icon = Icons.Default.CreditCard,
                        title = "Cartão de crédito",
                        subtitle = "Em até 12x sem juros",
                        selected = checkoutPaymentType == CheckoutPaymentType.CARD,
                        onClick = { appState.setCheckoutPaymentType(CheckoutPaymentType.CARD) }
                    )
                    PaymentOptionRow(
                        icon = Icons.Default.Description,
                        title = "Boleto bancário",
                        subtitle = "Vence em 3 dias úteis",
                        selected = checkoutPaymentType == CheckoutPaymentType.BOLETO,
                        onClick = { appState.setCheckoutPaymentType(CheckoutPaymentType.BOLETO) }
                    )

                    when (checkoutPaymentType) {
                        CheckoutPaymentType.CARD -> CheckoutCardSelection(
                            methods = paymentMethods,
                            selected = selectedCard,
                            onSelect = { appState.selectPaymentMethod(it) },
                            onAddCard = onAddCard
                        )
                        CheckoutPaymentType.BOLETO -> CheckoutBoletoSection(
                            cpf = boletoCpf,
                            onCpfChange = { appState.setBoletoCpf(it) }
                        )
                        CheckoutPaymentType.PIX -> {}
                    }
                }
            }

            CheckoutSection(title = "Resumo") {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    SummaryRow(
                        label = "Subtotal ($cartCount itens)",
                        value = formatBRL(cartTotal)
                    )
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
                    if (checkoutPaymentType == CheckoutPaymentType.PIX) {
                        SummaryRow(
                            label = "Desconto PIX (5%)",
                            value = "-${formatBRL(pixDiscount)}",
                            valueColor = Green
                        )
                    }
                    HorizontalDivider(color = SurfaceVariant)
                    SummaryRow(
                        label = "Total",
                        value = formatBRL(effectiveTotal),
                        labelStyle = CBFont.Body1,
                        valueStyle = CBFont.H3,
                        valueBold = true
                    )
                }
            }

            PrimaryButton(
                text = "Confirmar pedido",
                onClick = {
                    scope.launch {
                        val order = appState.placeOrder()
                        if (order != null) {
                            onConfirm(order.id)
                        } else {
                            couponError = "Não foi possível confirmar o pedido. Tente novamente."
                        }
                    }
                },
                enabled = canConfirm
            )

            Text(
                text = "Seus dados estão protegidos com criptografia SSL",
                style = CBFont.Badge,
                color = TextTertiary,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp)
            )
        }
    }
}

@Composable
private fun CheckoutCardSelection(
    methods: List<PaymentMethod>,
    selected: PaymentMethod?,
    onSelect: (String) -> Unit,
    onAddCard: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        if (methods.isEmpty()) {
            Text(
                text = "Nenhum cartão salvo",
                style = CBFont.Caption1,
                color = TextSecondary
            )
        } else {
            methods.forEach { method ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, if (selected?.id == method.id) Green else Border, InputShape)
                        .background(
                            if (selected?.id == method.id) com.citybox.ui.theme.TintSuccess else White,
                            InputShape
                        )
                        .clickable { onSelect(method.id) }
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(
                        selected = selected?.id == method.id,
                        onClick = { onSelect(method.id) }
                    )
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = method.displayName, style = CBFont.Body2, color = Black)
                        Text(
                            text = "${method.holderName} · Val. ${method.expiry}",
                            style = CBFont.Caption1,
                            color = TextSecondary
                        )
                    }
                }
            }
        }
        CityBoxTextButton(text = "Adicionar cartão", onClick = onAddCard)
    }
}

@Composable
private fun CheckoutBoletoSection(
    cpf: String,
    onCpfChange: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        OutlinedTextField(
            value = cpf,
            onValueChange = onCpfChange,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("CPF do pagador") },
            placeholder = { Text("000.000.000-00") },
            shape = InputShape,
            singleLine = true
        )
        if (cpf.length == 11) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceVariant, RoundedCornerShape(8.dp))
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(text = "Prévia do boleto", style = CBFont.Body2SemiBold, color = Black)
                Text(
                    text = "||||| 34191.79001 01043.510047 91020.150008 8 00000000000000",
                    style = CBFont.Caption2,
                    color = TextSecondary
                )
                Text(
                    text = "Vencimento em 3 dias úteis · CityBox Marketplace",
                    style = CBFont.Caption1,
                    color = TextSecondary
                )
            }
        } else if (cpf.isNotEmpty()) {
            Text(
                text = "Informe um CPF válido (11 dígitos)",
                style = CBFont.Caption1,
                color = ErrorRed
            )
        }
    }
}

@Composable
private fun CheckoutSection(
    title: String,
    content: @Composable () -> Unit
) {
    Card(
        shape = CardShape,
        colors = CardDefaults.cardColors(containerColor = White),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = title,
                style = CBFont.H3,
                color = Black
            )
            content()
        }
    }
}
