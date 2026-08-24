package com.citybox.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.citybox.R

@Composable
fun CityBoxLogo(size: Dp = 32.dp, modifier: Modifier = Modifier) {
    Image(
        painter = painterResource(id = R.drawable.ic_citybox_logo),
        contentDescription = "CityBox",
        modifier = modifier.size(size)
    )
}
