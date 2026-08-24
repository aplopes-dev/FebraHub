package com.citybox.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.data.MockData
import com.citybox.ui.components.EmptyState
import com.citybox.ui.components.ProductCard
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextSecondary
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Category

@Composable
fun CategoryScreen(
    categoryId: String,
    appState: AppState,
    onBack: () -> Unit,
    onProductClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val products by appState.products.collectAsState()
    val favorites by appState.favorites.collectAsState()
    val category = appState.categoryById(categoryId)
    val filtered = appState.productsForCategory(categoryId, products)

    Scaffold(
        topBar = {
            SimpleAppBar(
                title = category?.name ?: "Categoria",
                onBackClick = onBack,
                light = true
            )
        },
        containerColor = Surface,
        modifier = modifier
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            category?.let {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(it.colorHex))
                        .padding(20.dp)
                ) {
                    Text(text = it.icon, style = CBFont.H1)
                    Text(text = it.name, style = CBFont.H2, modifier = Modifier.padding(top = 8.dp))
                    Text(
                        text = "${filtered.size} produtos",
                        style = CBFont.Caption1,
                        color = TextSecondary,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }

            if (filtered.isEmpty()) {
                EmptyState(
                    icon = Icons.Default.Category,
                    title = "Nenhum produto",
                    subtitle = "Esta categoria ainda não tem itens",
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filtered, key = { it.id }) { product ->
                        ProductCard(
                            product = product,
                            isFavorite = product.id in favorites,
                            onFavoriteClick = { appState.toggleFavorite(product.id) },
                            onClick = { onProductClick(product.id) }
                        )
                    }
                }
            }
        }
    }
}
