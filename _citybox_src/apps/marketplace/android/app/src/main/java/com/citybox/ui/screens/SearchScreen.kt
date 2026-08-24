package com.citybox.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.SwapVert
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.data.MockData
import com.citybox.ui.components.EmptyState
import com.citybox.ui.components.ProductCard
import com.citybox.ui.components.SearchField
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.PillShape
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.White
import kotlinx.coroutines.delay

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SearchScreen(
    appState: AppState,
    onProductClick: (String) -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val favorites by appState.favorites.collectAsState()
    val searchQuery by appState.searchQuery.collectAsState()
    val searchHistory by appState.searchHistory.collectAsState()
    val searchFilters by appState.searchFilters.collectAsState()
    val searchCategoryId by appState.searchCategoryId.collectAsState()
    var searchText by remember(searchQuery) { mutableStateOf(searchQuery) }
    var showFilters by remember { mutableStateOf(false) }
    val focusRequester = remember { FocusRequester() }

    val categoryName = searchCategoryId?.let { appState.categoryById(it)?.name }
    val isCategoryMode = searchCategoryId != null

    LaunchedEffect(isCategoryMode) {
        if (!isCategoryMode) {
            focusRequester.requestFocus()
        }
    }

    LaunchedEffect(searchText) {
        appState.searchQuery.value = searchText
        if (searchText.length >= 2) {
            delay(600)
            if (searchText.length >= 2) appState.addSearchHistory(searchText)
        }
    }

    val filtered = appState.filteredAndSortedProducts(searchText)
    val showSuggestions = searchText.isBlank() && !isCategoryMode
    val resultsLabel = if (categoryName != null) {
        "${filtered.size} produtos em $categoryName"
    } else {
        "${filtered.size} produtos encontrados"
    }

    Box(modifier = modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            Column(modifier = Modifier.background(Black).statusBarsPadding()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    SearchField(
                        value = searchText,
                        onValueChange = { searchText = it },
                        placeholder = "Buscar produtos...",
                        modifier = Modifier
                            .weight(1f)
                            .focusRequester(focusRequester)
                    )
                    TextButton(onClick = onBack) {
                        Text(
                            text = "Cancelar",
                            style = CBFont.Body2,
                            color = White
                        )
                    }
                }
            }

            if (showSuggestions) {
                SearchSuggestionsPanel(
                    suggestions = appState.searchSuggestions.collectAsState().value,
                    history = searchHistory,
                    onHistoryClick = { searchText = it },
                    onSuggestionClick = { searchText = it },
                    onClearHistory = { appState.clearSearchHistory() }
                )
            }

            Column(modifier = Modifier.background(White)) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .padding(top = 8.dp, bottom = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = resultsLabel,
                        style = CBFont.Caption1,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.weight(1f))
                    Row(
                        modifier = Modifier
                            .background(Surface, PillShape)
                            .clickable { showFilters = true }
                            .padding(horizontal = 12.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.SwapVert,
                            contentDescription = null,
                            tint = Black,
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            text = searchFilters.sortBy.label,
                            style = CBFont.Caption1,
                            color = Black
                        )
                    }
                    Spacer(modifier = Modifier.size(8.dp))
                    Row(
                        modifier = Modifier
                            .background(Surface, PillShape)
                            .clickable { showFilters = true }
                            .padding(horizontal = 12.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.FilterList,
                            contentDescription = null,
                            tint = Black,
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            text = "Filtrar",
                            style = CBFont.Caption1,
                            color = Black
                        )
                    }
                }
                HorizontalDivider(color = Surface)
            }

            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .background(Surface)
            ) {
                if (filtered.isEmpty() && !showSuggestions) {
                    EmptyState(
                        icon = Icons.Default.Search,
                        title = "Nenhum resultado",
                        subtitle = "Tente buscar por outro termo",
                        modifier = Modifier.align(Alignment.Center)
                    )
                } else if (!showSuggestions) {
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

        if (showFilters) {
            FiltersSheet(
                initialFilters = searchFilters,
                onDismiss = { showFilters = false },
                onApply = { appState.setSearchFilters(it) }
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SearchSuggestionsPanel(
    suggestions: List<String>,
    history: List<String>,
    onHistoryClick: (String) -> Unit,
    onSuggestionClick: (String) -> Unit,
    onClearHistory: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(White)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        if (history.isNotEmpty()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.History,
                    contentDescription = null,
                    tint = TextSecondary,
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = "Buscas recentes",
                    style = CBFont.H3,
                    color = Black,
                    modifier = Modifier
                        .weight(1f)
                        .padding(start = 8.dp)
                )
                TextButton(onClick = onClearHistory) {
                    Text(text = "Limpar", style = CBFont.Caption1, color = Green)
                }
            }
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                history.forEach { term ->
                    Text(
                        text = term,
                        style = CBFont.Caption1,
                        color = Black,
                        modifier = Modifier
                            .background(Surface, PillShape)
                            .clickable { onHistoryClick(term) }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }
        }

        Text(text = "Sugestões", style = CBFont.H3, color = Black)
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            suggestions.forEach { suggestion ->
                Text(
                    text = suggestion,
                    style = CBFont.Caption1,
                    color = Black,
                    modifier = Modifier
                        .background(Surface, PillShape)
                        .clickable { onSuggestionClick(suggestion) }
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                )
            }
        }
    }
}
