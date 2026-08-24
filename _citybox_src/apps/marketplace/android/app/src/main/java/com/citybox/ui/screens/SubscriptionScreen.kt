package com.citybox.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.citybox.R
import com.citybox.data.AppState
import com.citybox.data.MockData
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.White

@Composable
fun SubscriptionScreen(
    appState: AppState,
    onBack: () -> Unit
) {
    val user by appState.user.collectAsState()

    Scaffold(
        topBar = { SimpleAppBar(title = "CityBox+", onBackClick = onBack, light = true) },
        containerColor = Surface
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card(
                shape = CardShape,
                colors = CardDefaults.cardColors(containerColor = androidx.compose.ui.graphics.Color.Transparent),
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(modifier = Modifier.fillMaxWidth()) {
                    Image(
                        painter = painterResource(id = R.drawable.banner_citybox_plus),
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.matchParentSize()
                    )
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .background(
                                Brush.horizontalGradient(
                                    listOf(
                                        androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.5f),
                                        androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.6f)
                                    )
                                )
                            )
                    )
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp)
                    ) {
                    Text(text = "✦ CityBox+", style = CBFont.H2, color = White)
                    Text(
                        text = if (user.isPlus) "Plano ativo" else "Sem assinatura",
                        style = CBFont.Body1,
                        color = White.copy(alpha = 0.9f)
                    )
                    Text(
                        text = "Renovação: ${appState.subscriptionRenewalDate.collectAsState().value}",
                        style = CBFont.Caption1,
                        color = White.copy(alpha = 0.8f),
                        modifier = Modifier.padding(top = 8.dp)
                    )
                    }
                }
            }

            Text(text = "Benefícios", style = CBFont.H3, color = Black)

            Card(shape = CardShape, colors = CardDefaults.cardColors(containerColor = White)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    appState.subscriptionBenefits.collectAsState().value.forEach { benefit ->
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Icon(Icons.Default.Check, contentDescription = null, tint = Green)
                            Text(text = benefit, style = CBFont.Body2, color = Black)
                        }
                    }
                }
            }

            Text(
                text = "R$ 19,90/mês · cancele quando quiser",
                style = CBFont.Caption1,
                color = TextSecondary
            )

            PrimaryButton(text = "Cancelar assinatura", onClick = onBack)
        }
    }
}
