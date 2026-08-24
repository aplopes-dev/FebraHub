package com.citybox.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.Border
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.GoogleBlue
import com.citybox.ui.theme.PillShape
import com.citybox.ui.theme.White

@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp),
        enabled = enabled,
        shape = PillShape,
        colors = ButtonDefaults.buttonColors(
            containerColor = Black,
            contentColor = White,
            disabledContainerColor = Black.copy(alpha = 0.4f),
            disabledContentColor = White.copy(alpha = 0.6f)
        )
    ) {
        Text(text = text, style = CBFont.Body1, color = White)
    }
}

@Composable
fun SecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp),
        shape = PillShape,
        border = BorderStroke(1.5.dp, Black),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = Black
        )
    ) {
        Text(text = text, style = CBFont.Body1, color = Black)
    }
}

@Composable
fun CityBoxTextButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    TextButton(
        onClick = onClick,
        modifier = modifier
    ) {
        Text(
            text = text,
            style = CBFont.Body1,
            color = Black
        )
    }
}

@Composable
fun GoogleButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp),
        shape = PillShape,
        border = BorderStroke(1.dp, Border),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = Black
        )
    ) {
        Icon(
            imageVector = Icons.Default.AccountCircle,
            contentDescription = "Google",
            modifier = Modifier.size(20.dp),
            tint = GoogleBlue
        )
        Text(
            text = "  Continuar com Google",
            style = CBFont.Body1,
            color = Black
        )
    }
}
