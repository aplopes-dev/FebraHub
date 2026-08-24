package com.citybox.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.citybox.data.MockData
import com.citybox.ui.components.PrimaryButton
import com.citybox.ui.components.SecondaryButton
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.Border
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.White

@Composable
fun HelpScreen(
    appState: com.citybox.data.AppState,
    onBack: () -> Unit,
    onOpenTicket: () -> Unit,
    onMyTickets: () -> Unit,
    onChatClick: () -> Unit
) {
    var expandedIndices by remember { mutableStateOf(setOf<Int>()) }
    val faqItems = appState.faqItems.collectAsState().value

    Scaffold(
        topBar = {
            SimpleAppBar(title = "Ajuda e Suporte", onBackClick = onBack, light = true)
        },
        containerColor = Surface
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Text(
                    text = "Perguntas frequentes",
                    style = CBFont.H3,
                    color = Black,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
            }

            itemsIndexed(faqItems) { index, item ->
                val isExpanded = index in expandedIndices
                Card(
                    shape = CardShape,
                    colors = CardDefaults.cardColors(containerColor = White),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, Border, CardShape)
                        .clickable {
                            expandedIndices = if (isExpanded) {
                                expandedIndices - index
                            } else {
                                expandedIndices + index
                            }
                        }
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = item.question,
                                style = CBFont.Body1,
                                color = Black,
                                modifier = Modifier.weight(1f)
                            )
                            Icon(
                                imageVector = if (isExpanded) {
                                    Icons.Default.KeyboardArrowUp
                                } else {
                                    Icons.Default.KeyboardArrowDown
                                },
                                contentDescription = null,
                                tint = TextSecondary
                            )
                        }
                        AnimatedVisibility(visible = isExpanded) {
                            Text(
                                text = item.answer,
                                style = CBFont.Body2,
                                color = TextSecondary,
                                modifier = Modifier.padding(top = 12.dp)
                            )
                        }
                    }
                }
            }

            item {
                SecondaryButton(
                    text = "Abrir chamado",
                    onClick = onOpenTicket,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            item {
                SecondaryButton(
                    text = "Meus chamados",
                    onClick = onMyTickets,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            item {
                PrimaryButton(
                    text = "Falar com atendente",
                    onClick = onChatClick
                )
            }
        }
    }
}
