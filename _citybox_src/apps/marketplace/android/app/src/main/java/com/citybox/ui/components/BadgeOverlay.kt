package com.citybox.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.ErrorRed
import com.citybox.ui.theme.PillShape
import com.citybox.ui.theme.White

@Composable
fun CountBadge(
    count: Int,
    modifier: Modifier = Modifier,
    backgroundColor: Color = ErrorRed,
    contentColor: Color = White,
    pill: Boolean = false
) {
    if (count <= 0) return

    val label = if (count > 99) "99+" else count.toString()
    val shape = if (pill) PillShape else CircleShape

    Box(
        modifier = modifier
            .defaultMinSize(minWidth = 18.dp, minHeight = 18.dp)
            .background(backgroundColor, shape)
            .padding(horizontal = if (pill) 5.dp else 4.dp, vertical = 2.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            style = CBFont.Badge,
            color = contentColor,
            maxLines = 1,
            softWrap = false
        )
    }
}

@Composable
fun BadgedIcon(
    icon: ImageVector,
    selectedIcon: ImageVector,
    isSelected: Boolean,
    contentDescription: String,
    modifier: Modifier = Modifier,
    iconSize: Dp = 24.dp,
    badgeCount: Int = 0,
    badgeBackgroundColor: Color = ErrorRed,
    badgeContentColor: Color = White,
    navSlot: Boolean = false,
    tint: Color = Color.Unspecified,
) {
    if (navSlot) {
        Box(
            modifier = modifier.size(width = 38.dp, height = 28.dp),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (isSelected) selectedIcon else icon,
                contentDescription = contentDescription,
                modifier = Modifier.size(iconSize),
                tint = tint
            )
            if (badgeCount > 0) {
                CountBadge(
                    count = badgeCount,
                    backgroundColor = badgeBackgroundColor,
                    contentColor = badgeContentColor,
                    modifier = Modifier
                        .align(Alignment.Center)
                        .offset(x = 12.dp, y = (-10).dp)
                )
            }
        }
        return
    }

    val outerModifier = if (badgeCount > 0) {
        Modifier.size(width = iconSize + 12.dp, height = iconSize + 10.dp)
    } else {
        Modifier.size(iconSize)
    }

    Box(
        modifier = modifier.then(outerModifier),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier.size(iconSize),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (isSelected) selectedIcon else icon,
                contentDescription = contentDescription,
                modifier = Modifier.size(iconSize)
            )
            if (badgeCount > 0) {
                CountBadge(
                    count = badgeCount,
                    backgroundColor = badgeBackgroundColor,
                    contentColor = badgeContentColor,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .offset(x = 8.dp, y = (-8).dp)
                )
            }
        }
    }
}
