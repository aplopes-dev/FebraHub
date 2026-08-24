package com.citybox.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.Border
import com.citybox.ui.theme.BorderStrong
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.InputShape
import com.citybox.ui.theme.TextSecondary
import com.citybox.ui.theme.TintSuccess
import com.citybox.ui.theme.White

@Composable
fun PaymentOptionRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    discountLabel: String? = null
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(if (selected) TintSuccess else White, InputShape)
            .border(
                width = if (selected) 1.5.dp else 1.dp,
                color = if (selected) Green else Border,
                shape = InputShape
            )
            .clickable { onClick() }
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier.size(22.dp),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .size(22.dp)
                    .border(
                        width = 2.dp,
                        color = if (selected) Green else BorderStrong,
                        shape = CircleShape
                    )
            )
            if (selected) {
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .background(Green, CircleShape)
                )
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        Box(
            modifier = Modifier.width(28.dp),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (selected) Green else TextSecondary,
                modifier = Modifier.size(20.dp)
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = CBFont.Body2,
                color = Black
            )
            if (subtitle.isNotEmpty()) {
                Text(
                    text = subtitle,
                    style = CBFont.Caption2,
                    color = TextSecondary
                )
            }
        }

        if (discountLabel != null) {
            BadgeChip(
                text = discountLabel,
                style = BadgeChipStyle.Success,
                modifier = Modifier.wrapContentWidth()
            )
        }
    }
}
