package com.citybox.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.ShoppingBag
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.White

data class BottomNavItem(
    val label: String,
    val icon: ImageVector,
    val selectedIcon: ImageVector,
    val route: String,
    val badge: Int = 0
)

private val bottomNavIconSize = 26.dp

@Composable
fun BottomNavBar(
    items: List<BottomNavItem>,
    selectedRoute: String,
    onItemClick: (String) -> Unit
) {
    Surface(
        color = White,
        shadowElevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(58.dp)
                .padding(horizontal = 4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            items.forEach { item ->
                val selected = selectedRoute == item.route
                val labelColor = if (selected) Green else TextSecondary

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                            onClick = { onItemClick(item.route) }
                        )
                        .padding(vertical = 6.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    BadgedIcon(
                        icon = item.icon,
                        selectedIcon = item.selectedIcon,
                        isSelected = selected,
                        contentDescription = item.label,
                        iconSize = bottomNavIconSize,
                        badgeCount = item.badge,
                        navSlot = true,
                        tint = labelColor
                    )
                    Text(
                        text = item.label,
                        style = CBFont.Tab,
                        color = labelColor
                    )
                }
            }
        }
    }
}

fun bottomNavItems(cartCount: Int): List<BottomNavItem> = listOf(
    BottomNavItem("Início", Icons.Outlined.Home, Icons.Filled.Home, "home"),
    BottomNavItem("Favoritos", Icons.Outlined.FavoriteBorder, Icons.Filled.Favorite, "favorites"),
    BottomNavItem("Carrinho", Icons.Outlined.ShoppingCart, Icons.Filled.ShoppingCart, "cart", cartCount),
    BottomNavItem("Compras", Icons.Outlined.ShoppingBag, Icons.Filled.ShoppingBag, "orders"),
    BottomNavItem("Conta", Icons.Outlined.Person, Icons.Filled.Person, "account")
)
