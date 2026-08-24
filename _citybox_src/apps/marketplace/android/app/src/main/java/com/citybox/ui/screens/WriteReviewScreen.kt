package com.citybox.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.data.Review
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.components.StarColor
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.SurfaceVariant
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.White
import java.util.UUID

@Composable
fun WriteReviewScreen(
    productId: String,
    appState: AppState,
    onBack: () -> Unit,
    onSubmitted: () -> Unit
) {
    val products by appState.products.collectAsState()
    val user by appState.user.collectAsState()
    val product = products.find { it.id == productId }

    var rating by remember { mutableIntStateOf(0) }
    var reviewText by remember { mutableStateOf("") }
    var photosAttached by remember { mutableStateOf(false) }
    var submitted by remember { mutableStateOf(false) }

    Scaffold(
        topBar = { SimpleAppBar(title = "Avaliar produto", onBackClick = onBack, light = true) },
        containerColor = Surface
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

            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text(text = "Sua nota", style = CBFont.Body2, color = TextSecondary)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    (1..5).forEach { star ->
                        Icon(
                            imageVector = if (star <= rating) Icons.Filled.Star else Icons.Filled.StarBorder,
                            contentDescription = "$star estrelas",
                            tint = if (star <= rating) StarColor else TextSecondary,
                            modifier = Modifier
                                .size(28.dp)
                                .clickable { rating = star }
                                .padding(4.dp)
                        )
                    }
                }
            }

            OutlinedTextField(
                value = reviewText,
                onValueChange = { reviewText = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp),
                label = { Text("Conte sua experiência") },
                placeholder = { Text("O que achou do produto?") }
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (photosAttached) SurfaceVariant else White)
                    .clickable { photosAttached = !photosAttached }
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.AddPhotoAlternate,
                    contentDescription = null,
                    tint = if (photosAttached) Green else TextSecondary
                )
                Text(
                    text = if (photosAttached) "2 fotos anexadas (mock)" else "Anexar fotos",
                    style = CBFont.Body2,
                    color = if (photosAttached) Green else Black
                )
            }

            if (submitted) {
                Text(
                    text = "Avaliação enviada! Obrigado ✓",
                    style = CBFont.Body1,
                    color = Green,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            } else {
                PrimaryButton(
                    text = "Enviar avaliação",
                    onClick = {
                        if (rating > 0 && product != null) {
                            appState.addReview(
                                Review(
                                    id = UUID.randomUUID().toString(),
                                    productId = productId,
                                    author = user.name,
                                    rating = rating,
                                    date = "Agora",
                                    text = reviewText.ifBlank { "Ótimo produto!" },
                                    photoUrls = if (photosAttached) listOf("mock://photo1", "mock://photo2") else emptyList()
                                )
                            )
                            submitted = true
                            onSubmitted()
                        }
                    },
                    enabled = rating > 0
                )
            }
        }
    }
}
