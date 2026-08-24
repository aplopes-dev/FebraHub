package com.citybox.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.SurfaceVariant
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.TintWarning
import com.citybox.ui.theme.White

@Composable
fun ReviewsScreen(
    productId: String,
    appState: AppState,
    onBack: () -> Unit,
    onWriteReview: () -> Unit,
    modifier: Modifier = Modifier
) {
    val products by appState.products.collectAsState()
    val reviews by appState.reviews.collectAsState()
    val product = products.find { it.id == productId }
    val productReviews = reviews[productId].orEmpty()
    val average = if (productReviews.isEmpty()) {
        product?.rating ?: 0f
    } else {
        appState.averageRating(productId)
    }

    Scaffold(
        topBar = { SimpleAppBar(title = "Avaliações", onBackClick = onBack, light = true) },
        containerColor = Surface,
        modifier = modifier
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            product?.let {
                Text(text = it.name, style = CBFont.H3, color = Black)
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = String.format("%.1f", average),
                    style = CBFont.H1,
                    color = TintWarning
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                        repeat(5) { index ->
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = null,
                                tint = if (index < average.toInt()) TintWarning else SurfaceVariant,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                    Text(
                        text = "${productReviews.size} avaliações",
                        style = CBFont.Caption1,
                        color = TextSecondary
                    )
                }
            }

            RatingDistribution(reviews = productReviews)

            HorizontalDivider(color = SurfaceVariant)

            productReviews.forEach { review ->
                ReviewRow(review = review)
                HorizontalDivider(color = SurfaceVariant, modifier = Modifier.padding(vertical = 8.dp))
            }

            if (productReviews.isEmpty()) {
                Text(
                    text = "Seja o primeiro a avaliar este produto.",
                    style = CBFont.Body2,
                    color = TextSecondary
                )
            }

            PrimaryButton(text = "Escrever avaliação", onClick = onWriteReview)
        }
    }
}

@Composable
private fun RatingDistribution(reviews: List<com.citybox.data.Review>) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        (5 downTo 1).forEach { stars ->
            val count = reviews.count { it.rating == stars }
            val fraction = if (reviews.isEmpty()) 0f else count.toFloat() / reviews.size
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(text = "$stars★", style = CBFont.Caption2, color = TextSecondary, modifier = Modifier.width(28.dp))
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(8.dp)
                        .background(SurfaceVariant, CircleShape)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(fraction)
                            .height(8.dp)
                            .background(Green, CircleShape)
                    )
                }
                Text(
                    text = "$count",
                    style = CBFont.Caption2,
                    color = TextSecondary,
                    modifier = Modifier.width(20.dp)
                )
            }
        }
    }
}

@Composable
private fun ReviewRow(review: com.citybox.data.Review) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(Green),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = review.author.firstOrNull()?.uppercaseChar()?.toString() ?: "?",
                    style = CBFont.Body2,
                    color = White
                )
            }
            Spacer(modifier = Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(text = review.author, style = CBFont.Body2, color = Black)
                Text(text = review.date, style = CBFont.Caption2, color = TextSecondary)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                repeat(review.rating) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = null,
                        tint = TintWarning,
                        modifier = Modifier.size(12.dp)
                    )
                }
            }
        }
        Text(text = review.text, style = CBFont.Body2, color = Black)
    }
}
