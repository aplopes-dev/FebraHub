package com.citybox.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.ui.components.EmptyState
import com.citybox.ui.components.ProductCard
import com.citybox.ui.theme.Surface

@Composable
fun FavoritesScreen(
    appState: AppState,
    onProductClick: (String) -> Unit,
    onGoHome: () -> Unit,
    modifier: Modifier = Modifier
) {
    val products by appState.products.collectAsState()
    val favorites by appState.favorites.collectAsState()

    val favoriteProducts = products.filter { it.id in favorites }

    if (favoriteProducts.isEmpty()) {
        Column(
            modifier = modifier
                .fillMaxSize()
                .background(Surface)
                .padding(top = 64.dp),
            verticalArrangement = Arrangement.Center
        ) {
            EmptyState(
                icon = Icons.Default.FavoriteBorder,
                title = "Nenhum favorito ainda",
                subtitle = "Explore produtos e adicione aos favoritos",
                actionText = "Explorar produtos",
                onAction = onGoHome
            )
        }
    } else {
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = modifier.background(Surface),
            contentPadding = PaddingValues(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(favoriteProducts) { product ->
                ProductCard(
                    product = product,
                    isFavorite = true,
                    onFavoriteClick = { appState.toggleFavorite(product.id) },
                    onClick = { onProductClick(product.id) }
                )
            }
        }
    }
}
