package com.citybox.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.data.MockData
import com.citybox.data.ShippingOption
import com.citybox.ui.components.BadgeChip
import com.citybox.ui.components.BadgeChipStyle
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.components.formatBRL
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.Border
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.InputShape
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.TintSuccess
import com.citybox.ui.theme.White

@Composable
fun ShippingOptionsScreen(
    appState: AppState,
    onBack: () -> Unit,
    onSelected: () -> Unit = onBack
) {
    val selected by appState.selectedShipping.collectAsState()
    val options by appState.shippingOptions.collectAsState()

    Scaffold(
        topBar = {
            SimpleAppBar(title = "Opções de envio", onBackClick = onBack, light = true)
        },
        containerColor = Surface
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(options, key = { it.id }) { option ->
                ShippingOptionCard(
                    option = option,
                    selected = selected?.id == option.id,
                    onClick = {
                        appState.selectShipping(option.id)
                        onSelected()
                    }
                )
            }
        }
    }
}

@Composable
private fun ShippingOptionCard(
    option: ShippingOption,
    selected: Boolean,
    onClick: () -> Unit
) {
    Card(
        shape = CardShape,
        colors = CardDefaults.cardColors(containerColor = if (selected) TintSuccess else White),
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = if (selected) 1.5.dp else 1.dp,
                color = if (selected) Green else Border,
                shape = CardShape
            )
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier.size(22.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(22.dp)
                        .border(
                            width = 2.dp,
                            color = if (selected) Green else Border,
                            shape = CircleShape
                        )
                )
                if (selected) {
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .background(Green, CircleShape)
                    )
                }
            }

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = option.name, style = CBFont.Body1, color = Black)
                    if (option.isExpress) {
                        BadgeChip(
                            text = "EXPRESS",
                            style = BadgeChipStyle.Info,
                            icon = Icons.Default.Bolt
                        )
                    }
                }
                Text(
                    text = option.deliveryEstimate,
                    style = CBFont.Caption1,
                    color = TextSecondary
                )
            }

            Text(
                text = if (option.price <= 0) "Grátis" else formatBRL(option.price),
                style = CBFont.Body2SemiBold,
                color = if (option.price <= 0) Green else Black
            )
        }
    }
}
