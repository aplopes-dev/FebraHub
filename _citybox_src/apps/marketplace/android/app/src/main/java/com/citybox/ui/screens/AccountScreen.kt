package com.citybox.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Help
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocalOffer
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import com.citybox.R
import com.citybox.data.AppState
import com.citybox.data.StaticPageType
import com.citybox.ui.components.MenuRow
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.BorderStrong
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.ErrorRed
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextDisabled
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.White

@Composable
fun AccountScreen(
    appState: AppState,
    onLogout: () -> Unit,
    onGoOrders: () -> Unit,
    onGoFavorites: () -> Unit,
    onEditProfile: () -> Unit,
    onAddresses: () -> Unit,
    onPaymentMethods: () -> Unit,
    onNotifications: () -> Unit,
    onHelp: () -> Unit,
    onStaticPage: (StaticPageType) -> Unit,
    onSubscription: () -> Unit,
    onSettings: () -> Unit,
    onCoupons: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val favorites by appState.favorites.collectAsState()
    val orders by appState.orders.collectAsState()
    val user by appState.user.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Surface)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp)
            .padding(bottom = 16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .background(Green, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = user.avatarInitial.ifEmpty { user.name.firstOrNull()?.uppercaseChar()?.toString() ?: "?" },
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = White
                )
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = user.name,
                    style = CBFont.H3,
                    color = Black
                )
                Text(
                    text = user.email,
                    style = CBFont.Body2,
                    color = TextSecondary
                )
            }

            OutlinedButton(
                onClick = onEditProfile,
                shape = RoundedCornerShape(999.dp),
                border = BorderStroke(1.dp, Black),
                modifier = Modifier.padding(top = 4.dp)
            ) {
                Text(
                    text = "Editar perfil",
                    style = CBFont.Caption1,
                    color = Black,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            shape = CardShape,
            colors = CardDefaults.cardColors(containerColor = androidx.compose.ui.graphics.Color.Transparent),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onSubscription)
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
                            brush = Brush.horizontalGradient(
                                colors = listOf(
                                    androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.5f),
                                    androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.6f)
                                )
                            )
                        )
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                Text(text = "✦", fontSize = 26.sp, color = White)
                Spacer(modifier = Modifier.size(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "CityBox+ ativo",
                        style = CBFont.Body1.copy(fontWeight = FontWeight.ExtraBold),
                        color = White
                    )
                    Text(
                        text = "Entregas grátis e benefícios exclusivos",
                        style = CBFont.Caption2,
                        color = White.copy(alpha = 0.8f)
                    )
                }
                Text(
                    text = "Gerenciar",
                    style = CBFont.Caption2SemiBold,
                    color = White
                )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        AccountMenuCard {
            MenuRow(
                icon = Icons.Default.ShoppingBag,
                title = "Minhas Compras",
                subtitle = "${orders.size} pedidos",
                onClick = onGoOrders
            )
            AccountDivider()
            MenuRow(
                icon = Icons.Default.Favorite,
                title = "Favoritos",
                subtitle = "${favorites.size} itens",
                onClick = onGoFavorites
            )
            AccountDivider()
            MenuRow(icon = Icons.Default.LocationOn, title = "Endereços", onClick = onAddresses)
            AccountDivider()
            MenuRow(icon = Icons.Default.CreditCard, title = "Meus Cartões", onClick = onPaymentMethods)
            AccountDivider()
            MenuRow(icon = Icons.Default.LocalOffer, title = "Cupons", onClick = onCoupons)
            AccountDivider()
            MenuRow(icon = Icons.Default.Notifications, title = "Notificações", onClick = onNotifications)
            AccountDivider()
            MenuRow(icon = Icons.Default.Help, title = "Ajuda e Suporte", onClick = onHelp)
            AccountDivider()
            MenuRow(icon = Icons.Default.Settings, title = "Configurações", onClick = onSettings)
        }

        Spacer(modifier = Modifier.height(16.dp))

        AccountMenuCard {
            MenuRow(icon = Icons.Default.Info, title = "Sobre o CityBox", onClick = { onStaticPage(StaticPageType.ABOUT) })
            AccountDivider()
            MenuRow(icon = Icons.Default.Description, title = "Termos de Uso", onClick = { onStaticPage(StaticPageType.TERMS) })
            AccountDivider()
            MenuRow(icon = Icons.Default.Lock, title = "Política de Privacidade", onClick = { onStaticPage(StaticPageType.PRIVACY) })
        }

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            shape = CardShape,
            colors = CardDefaults.cardColors(containerColor = White),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
            modifier = Modifier
                .fillMaxWidth()
                .clickable {
                    appState.isLoggedIn.value = false
                    onLogout()
                }
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 14.dp, horizontal = 16.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Logout,
                    contentDescription = null,
                    tint = ErrorRed,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.size(8.dp))
                Text(
                    text = "Sair da conta",
                    style = CBFont.Body2,
                    color = ErrorRed
                )
            }
        }

        Text(
            text = "CityBox v1.0 · © 2024",
            style = CBFont.Caption2,
            color = TextDisabled,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp, bottom = 8.dp),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
    }
}

@Composable
private fun AccountMenuCard(content: @Composable () -> Unit) {
    Card(
        shape = CardShape,
        colors = CardDefaults.cardColors(containerColor = White),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(horizontal = 16.dp)) {
            content()
        }
    }
}

@Composable
private fun AccountDivider() {
    HorizontalDivider(
        color = BorderStrong,
        modifier = Modifier.padding(start = 40.dp)
    )
}
