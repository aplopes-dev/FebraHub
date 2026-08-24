package com.citybox.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.citybox.ui.components.CityBoxLogo
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.Green
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun SplashScreen(onFinished: () -> Unit) {
    val logoScale = remember { Animatable(0.55f) }
    val logoAlpha = remember { Animatable(0f) }
    val glowAlpha = remember { Animatable(0f) }
    val glowScale = remember { Animatable(0.75f) }
    val screenAlpha = remember { Animatable(1f) }

    LaunchedEffect(Unit) {
        launch {
            glowAlpha.animateTo(1f, animationSpec = tween(550))
            glowScale.animateTo(1f, animationSpec = tween(550))
        }
        launch {
            logoAlpha.animateTo(1f, animationSpec = tween(420))
            logoScale.animateTo(
                targetValue = 1f,
                animationSpec = spring(
                    dampingRatio = Spring.DampingRatioMediumBouncy,
                    stiffness = Spring.StiffnessMediumLow
                )
            )
        }
        delay(1750)
        screenAlpha.animateTo(0f, animationSpec = tween(380))
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Black)
            .alpha(screenAlpha.value),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .size(260.dp)
                .scale(glowScale.value)
                .alpha(glowAlpha.value)
                .background(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            Green.copy(alpha = 0.32f),
                            Green.copy(alpha = 0.07f),
                            Color.Transparent
                        )
                    ),
                    shape = CircleShape
                )
        )

        CityBoxLogo(
            size = 128.dp,
            modifier = Modifier
                .scale(logoScale.value)
                .alpha(logoAlpha.value)
        )
    }
}
