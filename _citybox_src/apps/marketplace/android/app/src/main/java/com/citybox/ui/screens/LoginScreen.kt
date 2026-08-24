package com.citybox.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.ClickableText
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.data.StaticPageType
import com.citybox.ui.components.CityBoxLogo
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.ErrorRed
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.GoogleBlue
import com.citybox.ui.theme.White
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    appState: AppState,
    onRegister: () -> Unit,
    onForgotPassword: () -> Unit,
    onStaticPage: (StaticPageType) -> Unit,
    onGoogleMessage: (String) -> Unit = {}
) {
    var account by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Black)
            .imePadding()
    ) {
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentAlignment = Alignment.TopCenter
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 26.dp)
                    .padding(top = 72.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    CityBoxLogo(size = 68.dp)
                    Spacer(Modifier.width(16.dp))
                    Text("CityBox", style = CBFont.LoginBrand, color = White)
                }
                Spacer(Modifier.height(36.dp))
                Text("Olá!", style = CBFont.LoginGreeting, color = White)
                Spacer(Modifier.height(6.dp))
                Text(
                    text = "Entre com seu e-mail e senha (mock: camila@email.com / 123456).",
                    style = CBFont.Body1,
                    color = White.copy(alpha = 0.7f)
                )
                Spacer(Modifier.height(24.dp))

                AuthField(
                    value = account,
                    onValueChange = { account = it; errorMessage = null },
                    placeholder = "E-mail ou telefone",
                    keyboardType = KeyboardType.Email
                )
                Spacer(Modifier.height(12.dp))
                AuthField(
                    value = password,
                    onValueChange = { password = it; errorMessage = null },
                    placeholder = "Senha",
                    isPassword = true
                )

                if (errorMessage != null) {
                    Spacer(Modifier.height(8.dp))
                    Text(text = errorMessage!!, style = CBFont.Caption1, color = ErrorRed)
                }

                Spacer(Modifier.height(8.dp))
                Text(
                    text = "Esqueci minha senha",
                    style = CBFont.Caption1,
                    color = Green,
                    modifier = Modifier
                        .align(Alignment.End)
                        .clickable(onClick = onForgotPassword)
                )
                Spacer(Modifier.height(16.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(White)
                        .clickable {
                            scope.launch {
                                errorMessage = appState.login(account, password)
                            }
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text("Continuar", style = CBFont.Body1Bold, color = Black)
                }
                Spacer(Modifier.height(12.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(White.copy(alpha = 0.12f))
                        .clickable(onClick = onRegister),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Criar conta", style = CBFont.Body1Bold, color = White)
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    HorizontalDivider(modifier = Modifier.weight(1f), color = White.copy(alpha = 0.2f))
                    Text("  ou  ", style = CBFont.Caption1, color = White.copy(alpha = 0.5f))
                    HorizontalDivider(modifier = Modifier.weight(1f), color = White.copy(alpha = 0.2f))
                }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(White)
                        .clickable {
                            scope.launch {
                                val error = appState.loginWithGoogle()
                                if (error == null) {
                                    onGoogleMessage("Conta Google conectada")
                                } else {
                                    errorMessage = error
                                }
                            }
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("G", style = CBFont.Body1.copy(fontWeight = FontWeight.ExtraBold), color = GoogleBlue)
                        Spacer(Modifier.width(10.dp))
                        Text("Continuar com Google", style = CBFont.Body1SemiBold, color = Black.copy(alpha = 0.8f))
                    }
                }
            }
        }

        val footer = buildAnnotatedString {
            append("Ao continuar, você aceita os ")
            pushStringAnnotation(tag = "terms", annotation = "terms")
            withStyle(SpanStyle(color = Green, fontWeight = FontWeight.SemiBold)) { append("Termos") }
            pop()
            append(" e a ")
            pushStringAnnotation(tag = "privacy", annotation = "privacy")
            withStyle(SpanStyle(color = Green, fontWeight = FontWeight.SemiBold)) { append("Política de privacidade") }
            pop()
            append(" do CityBox.")
        }
        ClickableText(
            text = footer,
            style = CBFont.Badge.copy(color = White.copy(alpha = 0.55f), textAlign = TextAlign.Center),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 26.dp)
                .padding(top = 16.dp, bottom = 28.dp),
            onClick = { offset ->
                footer.getStringAnnotations(start = offset, end = offset).firstOrNull()?.let {
                    when (it.item) {
                        "terms" -> onStaticPage(StaticPageType.TERMS)
                        "privacy" -> onStaticPage(StaticPageType.PRIVACY)
                    }
                }
            }
        )
    }
}
