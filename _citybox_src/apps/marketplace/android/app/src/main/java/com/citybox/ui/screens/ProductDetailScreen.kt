package com.citybox.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Undo
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.citybox.data.AppState
import com.citybox.data.ProductPricing
import com.citybox.ui.components.BadgeChip
import com.citybox.ui.components.BadgeChipStyle
import com.citybox.ui.components.PriceBlock
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.ProductDetailAppBar
import com.citybox.ui.components.QuantityStepper
import com.citybox.ui.components.RatingStars
import com.citybox.ui.components.SecondaryButton
import com.citybox.ui.components.formatBRL
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.ErrorRed
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.SurfaceVariant
import com.citybox.ui.theme.TextSecondary
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun ProductDetailScreen(
    productId: String,
    appState: AppState,
    onBack: () -> Unit,
    onGoToCart: () -> Unit,
    onBuyNow: () -> Unit = onGoToCart,
    onReviewsClick: () -> Unit = {}
) {
    val products by appState.products.collectAsState()
    val favorites by appState.favorites.collectAsState()
    val cartCount by appState.cartCount.collectAsState()
    val selectedShipping by appState.selectedShipping.collectAsState()
    val product = products.find { it.id == productId } ?: return

    val installmentCount = ProductPricing.installmentCount(product.price)
    val installmentValue = product.price / installmentCount
    val deliveryLabel = ProductPricing.deliveryChipLabel(selectedShipping, product.isExpress)

    var quantity by remember { mutableIntStateOf(1) }
    var addedToCart by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            ProductDetailAppBar(
                onBackClick = onBack,
                cartCount = cartCount,
                onCartClick = onGoToCart
            )
        },
        containerColor = Surface
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
        ) {
            AsyncImage(
                model = product.imageUrl,
                contentDescription = product.name,
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f)
                    .background(SurfaceVariant),
                contentScale = ContentScale.Fit
            )

            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = product.category.uppercase(),
                    style = CBFont.Badge.copy(letterSpacing = 1.sp),
                    color = TextSecondary
                )

                Text(
                    text = product.name,
                    style = CBFont.H1,
                    color = Black
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RatingStars(
                        rating = product.rating,
                        reviewCount = product.reviewCount
                    )
                    Spacer(modifier = Modifier.weight(1f))
                    Text(
                        text = "Ver avaliações",
                        style = CBFont.Caption1,
                        color = Green,
                        modifier = Modifier.clickable(onClick = onReviewsClick)
                    )
                }

                HorizontalDivider(color = SurfaceVariant)

                PriceBlock(
                    price = product.price,
                    originalPrice = product.originalPrice,
                    discountPercent = product.discountPercent
                )

                Text(
                    text = if (installmentCount == 1) {
                        "À vista ${formatBRL(product.price)}"
                    } else {
                        "ou ${installmentCount}x de ${formatBRL(installmentValue)} sem juros"
                    },
                    style = CBFont.Caption1,
                    color = TextSecondary
                )

                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (product.isFreeShipping) {
                        BadgeChip(
                            text = "Frete grátis",
                            style = BadgeChipStyle.Success,
                            icon = Icons.Default.LocalShipping
                        )
                    }
                    if (product.isExpress) {
                        BadgeChip(
                            text = "EXPRESS",
                            style = BadgeChipStyle.Info,
                            icon = Icons.Default.Bolt
                        )
                    }
                    BadgeChip(
                        text = deliveryLabel,
                        style = BadgeChipStyle.Success
                    )
                }

                HorizontalDivider(color = SurfaceVariant)

                if (product.specs.isNotEmpty()) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Especificações",
                            style = CBFont.H3,
                            color = Black
                        )
                        product.specs.entries.sortedBy { it.key }.forEach { (key, value) ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(text = key, style = CBFont.Body2, color = TextSecondary)
                                Text(text = value, style = CBFont.Body2, color = Black)
                            }
                            HorizontalDivider(color = SurfaceVariant)
                        }
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    ProductTrustItem(
                        icon = Icons.Default.Security,
                        text = "Compra garantida",
                        modifier = Modifier.weight(1f)
                    )
                    ProductTrustItem(
                        icon = Icons.AutoMirrored.Filled.Undo,
                        text = "Devolução grátis",
                        modifier = Modifier.weight(1f)
                    )
                    ProductTrustItem(
                        icon = Icons.Default.CreditCard,
                        text = "Pagamento seguro",
                        modifier = Modifier.weight(1f)
                    )
                }

                HorizontalDivider(color = SurfaceVariant)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Quantidade:",
                        style = CBFont.Body2,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.size(8.dp))
                    QuantityStepper(
                        quantity = quantity,
                        onQuantityChange = { quantity = it }
                    )
                    Spacer(modifier = Modifier.weight(1f))
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .background(Surface, CircleShape)
                            .clickable { appState.toggleFavorite(product.id) },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (product.id in favorites) {
                                Icons.Filled.Favorite
                            } else {
                                Icons.Outlined.FavoriteBorder
                            },
                            contentDescription = "Favoritar",
                            tint = if (product.id in favorites) ErrorRed else TextSecondary,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    PrimaryButton(
                        text = if (addedToCart) "Adicionado ✓" else "Adicionar ao Carrinho",
                        onClick = {
                            repeat(quantity) { appState.addToCart(product) }
                            addedToCart = true
                            scope.launch {
                                delay(1500)
                                addedToCart = false
                            }
                        }
                    )

                    SecondaryButton(
                        text = "Comprar agora",
                        onClick = {
                            repeat(quantity) { appState.addToCart(product) }
                            onBuyNow()
                        }
                    )

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(onClick = onGoToCart)
                            .background(Surface, CircleShape)
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Ir para o carrinho",
                            style = CBFont.Body2,
                            color = Black
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ProductTrustItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    text: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = Green,
            modifier = Modifier.size(18.dp)
        )
        Text(
            text = text,
            style = CBFont.Caption2,
            color = TextSecondary,
            textAlign = TextAlign.Center
        )
    }
}
