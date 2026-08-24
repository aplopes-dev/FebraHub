package com.citybox.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.TextTertiary
import com.citybox.ui.theme.White

// MARK: - Home brand header (dark)

@Composable
fun HomeAppBar(
    onSearchClick: () -> Unit,
    cartCount: Int = 0,
    onCartClick: () -> Unit = {},
    notificationCount: Int = 0,
    onNotificationsClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(Black)
            .statusBarsPadding()
            .padding(start = 14.dp, end = 14.dp, top = 8.dp, bottom = 10.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            CityBoxLogo(size = 38.dp)
            Spacer(Modifier.width(8.dp))

            // In-header search box
            Row(
                modifier = Modifier
                    .weight(1f)
                    .height(40.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(White)
                    .clickable { onSearchClick() }
                    .padding(horizontal = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = null,
                    tint = Black.copy(alpha = 0.45f),
                    modifier = Modifier.size(16.dp)
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    "Buscar no CityBox",
                    style = CBFont.Caption1,
                    color = TextTertiary
                )
            }
            Spacer(Modifier.width(8.dp))

            // Notifications
            Box(
                modifier = Modifier
                    .clickable { onNotificationsClick() }
                    .size(26.dp),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Notifications,
                    contentDescription = "Notificações",
                    tint = White,
                    modifier = Modifier.size(20.dp)
                )
                if (notificationCount > 0) {
                    CountBadge(
                        count = notificationCount,
                        backgroundColor = White,
                        contentColor = Black,
                        pill = true,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .offset(x = 8.dp, y = (-7).dp)
                    )
                }
            }
            Spacer(Modifier.width(4.dp))

            // Cart
            Box(
                modifier = Modifier
                    .clickable { onCartClick() }
                    .size(26.dp),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.ShoppingCart,
                    contentDescription = "Carrinho",
                    tint = White,
                    modifier = Modifier.size(20.dp)
                )
                if (cartCount > 0) {
                    CountBadge(
                        count = cartCount,
                        backgroundColor = White,
                        contentColor = Black,
                        pill = true,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .offset(x = 8.dp, y = (-7).dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(9.dp))

        // Location row
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = Icons.Default.LocationOn,
                contentDescription = null,
                tint = White,
                modifier = Modifier.size(14.dp)
            )
            Spacer(Modifier.width(6.dp))
            Text(
                text = buildAnnotatedString {
                    append("Enviar para ")
                    withStyle(SpanStyle(fontWeight = FontWeight.Bold)) { append("Camila") }
                    append(" — São Paulo 01310-100")
                },
                style = CBFont.Caption2,
                color = White
            )
            Spacer(Modifier.width(4.dp))
            Icon(
                imageVector = Icons.Default.KeyboardArrowDown,
                contentDescription = null,
                tint = White,
                modifier = Modifier.size(14.dp)
            )
        }
    }
}

// MARK: - Simple title bar (dark)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SimpleAppBar(
    title: String,
    onBackClick: (() -> Unit)? = null,
    light: Boolean = false,
    modifier: Modifier = Modifier
) {
    val containerColor = if (light) White else Black
    val contentColor = if (light) Black else White

    TopAppBar(
        modifier = modifier,
        title = {
            Text(
                text = title,
                style = CBFont.H3,
                color = contentColor
            )
        },
        navigationIcon = {
            if (onBackClick != null) {
                IconButton(onClick = onBackClick) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Voltar",
                        tint = contentColor
                    )
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = containerColor,
            titleContentColor = contentColor,
            navigationIconContentColor = contentColor
        )
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductDetailAppBar(
    onBackClick: () -> Unit,
    cartCount: Int,
    onCartClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    TopAppBar(
        modifier = modifier,
        navigationIcon = {
            IconButton(onClick = onBackClick) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Voltar",
                    tint = Black
                )
            }
        },
        title = {},
        actions = {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clickable(onClick = onCartClick),
                contentAlignment = Alignment.Center
            ) {
                BadgedIcon(
                    icon = Icons.Default.ShoppingCart,
                    selectedIcon = Icons.Default.ShoppingCart,
                    isSelected = true,
                    contentDescription = "Carrinho",
                    iconSize = 20.dp,
                    badgeCount = cartCount,
                    badgeBackgroundColor = Green,
                    badgeContentColor = White
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = White,
            navigationIconContentColor = Black,
            actionIconContentColor = Black
        )
    )
}

// MARK: - Centered logo bar (dark)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LogoAppBar(modifier: Modifier = Modifier) {
    TopAppBar(
        modifier = modifier,
        title = {
            Box(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.align(Alignment.Center),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CityBoxLogo(size = 24.dp)
                    Spacer(Modifier.width(7.dp))
                    Text("CityBox", style = CBFont.H3, color = White)
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Black
        )
    )
}
