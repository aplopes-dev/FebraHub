package com.citybox.ui.screens

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.layout
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.data.MockData
import com.citybox.ui.components.CategoryShortcutsRow
import com.citybox.ui.components.ConsumerWeekBanner
import com.citybox.ui.components.HomeProductSection
import com.citybox.ui.theme.Surface

private val homeGridHorizontalPadding = 14.dp

/** Expande o item para borda a borda dentro de uma grid com padding horizontal. */
private fun Modifier.fullBleedHorizontal(bleed: Dp): Modifier = layout { measurable, constraints ->
    val bleedPx = bleed.roundToPx()
    val placeable = measurable.measure(
        constraints.copy(
            minWidth = constraints.maxWidth + bleedPx * 2,
            maxWidth = constraints.maxWidth + bleedPx * 2,
        )
    )
    layout(constraints.maxWidth, placeable.height) {
        placeable.placeRelative(-bleedPx, 0)
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun HomeScreen(
    appState: AppState,
    onProductClick: (String) -> Unit,
    onSearchClick: () -> Unit = {},
    onCouponsClick: () -> Unit = {},
    onCategoryClick: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val favorites by appState.favorites.collectAsState()

    LazyColumn(
        modifier = modifier.background(Surface),
        contentPadding = PaddingValues(
            start = homeGridHorizontalPadding,
            end = homeGridHorizontalPadding,
            bottom = 16.dp,
        ),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            ConsumerWeekBanner(
                onOffersClick = onSearchClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .fullBleedHorizontal(homeGridHorizontalPadding),
            )
        }
        stickyHeader {
            CategoryShortcutsRow(
                shortcuts = appState.homeShortcuts.collectAsState().value,
                onShortcutClick = { categoryId ->
                    when (categoryId) {
                        "cupons" -> onCouponsClick()
                        else -> onCategoryClick(categoryId)
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Surface),
            )
        }
        item {
            HomeProductSection(
                title = "Ofertas do dia",
                products = appState.offerProducts(),
                favorites = favorites,
                onViewAll = onSearchClick,
                onProductClick = onProductClick,
                onFavoriteClick = { appState.toggleFavorite(it) },
            )
        }
        item {
            HomeProductSection(
                title = "Mais vendidos",
                products = appState.bestSellerProducts(),
                favorites = favorites,
                onViewAll = onSearchClick,
                onProductClick = onProductClick,
                onFavoriteClick = { appState.toggleFavorite(it) },
                modifier = Modifier.padding(top = 4.dp),
            )
        }
    }
}
