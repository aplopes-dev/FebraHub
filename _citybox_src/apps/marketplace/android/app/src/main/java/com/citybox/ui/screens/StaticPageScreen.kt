package com.citybox.ui.screens

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.citybox.data.MockData
import com.citybox.data.StaticPageType
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.Surface
import com.citybox.ui.theme.TextSecondary

@Composable
fun StaticPageScreen(
    pageType: StaticPageType,
    onBack: () -> Unit,
    appState: com.citybox.data.AppState? = null
) {
    val pages = appState?.staticPages?.collectAsState()?.value
    val content = if (appState != null) {
        appState.staticPageContent(pageType).ifBlank { pages?.get(pageType) ?: "" }
    } else {
        MockData.staticPageContent[pageType] ?: ""
    }

    Scaffold(
        topBar = { SimpleAppBar(title = pageType.title, onBackClick = onBack, light = true) },
        containerColor = Surface
    ) { padding ->
        Text(
            text = content,
            style = CBFont.Body2,
            color = TextSecondary,
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        )
    }
}
