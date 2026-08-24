package com.citybox.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocalOffer
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.citybox.data.AppNotification
import com.citybox.data.AppState
import com.citybox.data.NotificationType
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.Border
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.CardShape
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.TintSuccess
import com.citybox.ui.theme.White

@Composable
fun NotificationsScreen(
    appState: AppState,
    onBack: () -> Unit
) {
    val notifications by appState.notifications.collectAsState()
    val hasUnread = notifications.any { !it.isRead }

    Scaffold(
        topBar = {
            SimpleAppBar(title = "Notificações", onBackClick = onBack, light = true)
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
            if (hasUnread) {
                item {
                    Text(
                        text = "Marcar todas como lidas",
                        style = CBFont.Caption2SemiBold,
                        color = Green,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { appState.markAllNotificationsRead() }
                            .padding(bottom = 4.dp)
                    )
                }
            }

            items(notifications, key = { it.id }) { notification ->
                NotificationCard(
                    notification = notification,
                    onClick = { appState.markNotificationRead(notification.id) }
                )
            }
        }
    }
}

@Composable
private fun NotificationCard(
    notification: AppNotification,
    onClick: () -> Unit
) {
    val icon = when (notification.type) {
        NotificationType.ORDER -> Icons.Default.ShoppingBag
        NotificationType.PROMO -> Icons.Default.LocalOffer
        NotificationType.SYSTEM -> Icons.Default.Info
    }

    Card(
        shape = CardShape,
        colors = CardDefaults.cardColors(
            containerColor = if (notification.isRead) White else TintSuccess.copy(alpha = 0.35f)
        ),
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = 1.dp,
                color = if (notification.isRead) Border else Green.copy(alpha = 0.4f),
                shape = CardShape
            )
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(Green.copy(alpha = 0.12f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = Green,
                    modifier = Modifier.size(20.dp)
                )
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = notification.title,
                        style = CBFont.Body1,
                        color = Black,
                        modifier = Modifier.weight(1f)
                    )
                    if (!notification.isRead) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(Green, CircleShape)
                        )
                    }
                }
                Text(text = notification.body, style = CBFont.Body2, color = TextSecondary)
                Text(text = notification.date, style = CBFont.Caption1, color = TextSecondary)
            }
        }
    }
}
