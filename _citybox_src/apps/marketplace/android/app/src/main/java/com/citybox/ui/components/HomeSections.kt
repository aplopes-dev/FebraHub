package com.citybox.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.citybox.R
import com.citybox.data.HomeShortcut
import com.citybox.data.Product
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextTertiary
import com.citybox.ui.theme.White

/** Resolve o ícone PNG personalizado da categoria (padronizado com web e iOS). */
private fun categoryIconRes(categoryId: String): Int = when (categoryId) {
    "ofertas" -> R.drawable.cat_ofertas
    "supermercado" -> R.drawable.cat_supermercado
    "moda" -> R.drawable.cat_moda
    "tecnologia" -> R.drawable.cat_tecnologia
    "casa" -> R.drawable.cat_casa
    "beleza" -> R.drawable.cat_beleza
    "esportes" -> R.drawable.cat_esportes
    "cupons" -> R.drawable.cat_cupons
    else -> R.drawable.cat_ofertas
}

private val CategoryIconSize = 64.dp
private val CategoryLabelGap = 4.dp
private val CategoryColumnWidth = 72.dp

@Composable
private fun CategoryIcon(
    categoryId: String,
    modifier: Modifier = Modifier,
) {
    Image(
        painter = painterResource(id = categoryIconRes(categoryId)),
        contentDescription = null,
        contentScale = ContentScale.Fit,
        modifier = modifier.size(CategoryIconSize),
    )
}

@Composable
fun CategoryShortcutsRow(
    shortcuts: List<HomeShortcut>,
    onShortcutClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyRow(
        modifier = modifier.fillMaxWidth(),
        contentPadding = PaddingValues(start = 14.dp, top = 12.dp, end = 14.dp, bottom = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(9.dp)
    ) {
        items(shortcuts) { shortcut ->
            Column(
                modifier = Modifier
                    .width(CategoryColumnWidth)
                    .clickable { onShortcutClick(shortcut.categoryId) },
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(CategoryLabelGap)
            ) {
                CategoryIcon(categoryId = shortcut.categoryId)
                Text(
                    text = shortcut.label,
                    style = CBFont.Badge,
                    color = TextTertiary,
                    textAlign = TextAlign.Center,
                    maxLines = 2
                )
            }
        }
    }
}

@Composable
fun ConsumerWeekBanner(
    onOffersClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(220.dp)
            .clickable(onClick = onOffersClick)
    ) {
        Image(
            painter = painterResource(id = R.drawable.banner_home_hero),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.matchParentSize()
        )
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    brush = Brush.horizontalGradient(
                        colors = listOf(Color.Black.copy(alpha = 0.45f), Color.Black.copy(alpha = 0.1f))
                    )
                )
        )
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .height(96.dp)
                .background(
                    brush = Brush.verticalGradient(
                        colorStops = arrayOf(
                            0f to Color.Transparent,
                            0.55f to Surface.copy(alpha = 0.55f),
                            1f to Surface,
                        )
                    )
                )
        )
        Column(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .padding(horizontal = 28.dp, vertical = 20.dp)
                .fillMaxWidth()
        ) {
            Text(
                text = "SEMANA DO CONSUMIDOR",
                style = CBFont.Badge.copy(
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 1.sp
                ),
                color = White.copy(alpha = 0.7f)
            )
            Text(
                text = "Até 50% OFF",
                style = CBFont.PromoHeadline,
                color = White,
                modifier = Modifier.padding(top = 6.dp, bottom = 4.dp)
            )
            Text(
                text = "Frete grátis com CityBox+",
                style = CBFont.Caption2,
                color = White.copy(alpha = 0.75f),
                modifier = Modifier.padding(bottom = 12.dp)
            )
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(7.dp))
                    .background(White)
                    .clickable(onClick = onOffersClick)
                    .padding(horizontal = 16.dp, vertical = 9.dp)
            ) {
                Text(
                    text = "Ver ofertas",
                    style = CBFont.Caption1.copy(fontWeight = FontWeight.Bold),
                    color = Black
                )
            }
        }
    }
}

@Composable
fun HomeProductSection(
    title: String,
    products: List<Product>,
    favorites: Set<String>,
    onViewAll: () -> Unit,
    onProductClick: (String) -> Unit,
    onFavoriteClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = CardShape,
        colors = CardDefaults.cardColors(containerColor = White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            SectionHeader(
                title = title,
                onAction = onViewAll,
                modifier = Modifier.fillMaxWidth()
            )
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                products.chunked(2).forEach { rowProducts ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        rowProducts.forEach { product ->
                            ProductCard(
                                product = product,
                                isFavorite = product.id in favorites,
                                onFavoriteClick = { onFavoriteClick(product.id) },
                                onClick = { onProductClick(product.id) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                        if (rowProducts.size == 1) {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }
    }
}
