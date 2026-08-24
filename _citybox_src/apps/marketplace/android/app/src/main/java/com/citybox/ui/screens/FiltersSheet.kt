package com.citybox.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.citybox.data.MockData
import com.citybox.data.SearchFilters
import com.citybox.data.SortOption
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SecondaryButton
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.SurfaceVariant
import com.citybox.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FiltersSheet(
    initialFilters: SearchFilters,
    onDismiss: () -> Unit,
    onApply: (SearchFilters) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var draft by remember(initialFilters) { mutableStateOf(initialFilters) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(text = "Filtros e ordenação", style = CBFont.H2, color = Black)

            FilterSection(title = "Ordenar por") {
                SortOption.entries.forEach { option ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { draft = draft.copy(sortBy = option) }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = draft.sortBy == option,
                            onClick = { draft = draft.copy(sortBy = option) }
                        )
                        Text(text = option.label, style = CBFont.Body2, color = Black)
                    }
                }
            }

            HorizontalDivider(color = SurfaceVariant)

            FilterSection(title = "Faixa de preço") {
                listOf(
                    null to null to "Todos",
                    null to 250.0 to "Até R$ 250",
                    250.0 to 1000.0 to "R$ 250 a R$ 1.000",
                    1000.0 to null to "Mais de R$ 1.000"
                ).forEach { (range, label) ->
                    val (min, max) = range
                    val selected = draft.minPrice == min && draft.maxPrice == max
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { draft = draft.copy(minPrice = min, maxPrice = max) }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selected,
                            onClick = { draft = draft.copy(minPrice = min, maxPrice = max) }
                        )
                        Text(text = label, style = CBFont.Body2, color = Black)
                    }
                }
            }

            HorizontalDivider(color = SurfaceVariant)

            FilterSection(title = "Marca") {
                (listOf(null to "Todas") + MockData.brands.map { it to it }).forEach { (brand, label) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { draft = draft.copy(brand = brand) }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = draft.brand == brand,
                            onClick = { draft = draft.copy(brand = brand) }
                        )
                        Text(text = label, style = CBFont.Body2, color = Black)
                    }
                }
            }

            HorizontalDivider(color = SurfaceVariant)

            FilterSection(title = "Avaliação mínima") {
                listOf(null to "Qualquer", 4f to "4★ ou mais", 3f to "3★ ou mais").forEach { (rating, label) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { draft = draft.copy(minRating = rating) }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = draft.minRating == rating,
                            onClick = { draft = draft.copy(minRating = rating) }
                        )
                        Text(text = label, style = CBFont.Body2, color = Black)
                    }
                }
            }

            HorizontalDivider(color = SurfaceVariant)

            FilterSection(title = "Envio") {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { draft = draft.copy(freeShippingOnly = !draft.freeShippingOnly) },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = draft.freeShippingOnly,
                        onCheckedChange = { draft = draft.copy(freeShippingOnly = it) }
                    )
                    Text(text = "Frete grátis", style = CBFont.Body2, color = Black)
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { draft = draft.copy(expressOnly = !draft.expressOnly) },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = draft.expressOnly,
                        onCheckedChange = { draft = draft.copy(expressOnly = it) }
                    )
                    Text(text = "EXPRESS", style = CBFont.Body2, color = Black)
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                SecondaryButton(
                    text = "Limpar",
                    onClick = {
                        draft = SearchFilters()
                        onApply(SearchFilters())
                        onDismiss()
                    },
                    modifier = Modifier.weight(1f)
                )
                PrimaryButton(
                    text = "Aplicar",
                    onClick = {
                        onApply(draft)
                        onDismiss()
                    },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun FilterSection(
    title: String,
    content: @Composable () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(text = title, style = CBFont.H3, color = Black)
        content()
    }
}
