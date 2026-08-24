package com.citybox.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.citybox.data.Product
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.Border
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.ErrorRed
import com.citybox.ui.theme.GoogleBlue
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.PillShape
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.TintInfo
import com.citybox.ui.theme.White

private val cardTextStyle = TextStyle(
    platformStyle = PlatformTextStyle(includeFontPadding = false),
    lineHeightStyle = LineHeightStyle(
        alignment = LineHeightStyle.Alignment.Center,
        trim = LineHeightStyle.Trim.Both
    )
)

private val cardNameStyle = CBFont.Caption1.merge(cardTextStyle)

private val cardBadgeStyle = CBFont.Badge.merge(
    cardTextStyle.copy(lineHeight = 16.sp)
)

@Composable
private fun ProductCardFreeShippingLabel(modifier: Modifier = Modifier) {
    Text(
        text = "Frete grátis",
        style = cardBadgeStyle,
        color = Green,
        modifier = modifier
    )
}

@Composable
private fun ProductCardExpressLabel(modifier: Modifier = Modifier) {
    Text(
        text = "EXPRESS",
        style = cardBadgeStyle,
        color = GoogleBlue,
        modifier = modifier
            .background(TintInfo, PillShape)
            .padding(horizontal = 6.dp, vertical = 2.dp)
    )
}

@Composable
fun ProductCard(
    product: Product,
    isFavorite: Boolean,
    onFavoriteClick: () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(1.dp)
            .shadow(
                elevation = 3.dp,
                shape = CardShape,
                clip = false,
                ambientColor = Black.copy(alpha = 0.12f),
                spotColor = Black.copy(alpha = 0.12f)
            )
            .clip(CardShape)
            .border(1.dp, Border, CardShape)
            .background(White)
            .clickable { onClick() }
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(160.dp)
                .background(Surface)
        ) {
            AsyncImage(
                model = product.imageUrl,
                contentDescription = product.name,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp),
                contentScale = ContentScale.Crop
            )

            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(8.dp)
                    .clip(CircleShape)
                    .background(White.copy(alpha = 0.9f))
                    .clickable { onFavoriteClick() }
                    .padding(8.dp),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                    contentDescription = "Favorito",
                    tint = if (isFavorite) ErrorRed else TextSecondary,
                    modifier = Modifier.size(18.dp)
                )
            }
        }

        Column(
            modifier = Modifier.padding(start = 8.dp, end = 8.dp, bottom = 8.dp, top = 4.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = product.name,
                style = cardNameStyle,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                color = Black,
                lineHeight = 18.sp
            )

            PriceBlockCompact(
                price = product.price,
                originalPrice = product.originalPrice,
                discountPercent = product.discountPercent
            )

            RatingStars(
                rating = product.rating,
                reviewCount = product.reviewCount,
                compact = true
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (product.isFreeShipping) {
                    ProductCardFreeShippingLabel()
                }
                if (product.isExpress) {
                    ProductCardExpressLabel()
                }
            }
        }
    }
}
