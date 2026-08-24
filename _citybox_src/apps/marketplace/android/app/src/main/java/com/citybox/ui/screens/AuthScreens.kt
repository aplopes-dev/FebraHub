package com.citybox.ui.screens

import androidx.compose.foundation.ExperimentalFoundationApi
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
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
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.citybox.data.AppState
import com.citybox.ui.components.PrimaryButton
import com.citybox.data.StaticPageType
import com.citybox.ui.components.CityBoxLogo
import kotlinx.coroutines.launch
import com.citybox.ui.theme.Black
import com.citybox.ui.theme.CBFont
import com.citybox.ui.theme.ErrorRed
import com.citybox.ui.theme.Green
import com.citybox.ui.theme.White

private data class OnboardingSlide(val emoji: String, val title: String, val subtitle: String)

private val onboardingSlides = listOf(
    OnboardingSlide("🛍️", "Compre com praticidade", "Milhares de produtos com entrega rápida na sua região."),
    OnboardingSlide("⚡", "Ofertas exclusivas", "Cupons, frete grátis e benefícios CityBox+ todo dia."),
    OnboardingSlide("📦", "Acompanhe seus pedidos", "Rastreamento em tempo real do checkout à entrega.")
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun OnboardingScreen(
    appState: AppState,
    onFinished: () -> Unit
) {
    val pagerState = rememberPagerState(pageCount = { onboardingSlides.size })
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Black)
            .padding(horizontal = 26.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 56.dp),
            horizontalArrangement = Arrangement.End
        ) {
            Text(
                text = "Pular",
                style = CBFont.Body2,
                color = White.copy(alpha = 0.7f),
                modifier = Modifier.clickable {
                    appState.completeOnboarding()
                    onFinished()
                }
            )
        }

        HorizontalPager(
            state = pagerState,
            modifier = Modifier.weight(1f)
        ) { page ->
            val slide = onboardingSlides[page]
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(slide.emoji, style = CBFont.H1.copy(fontSize = CBFont.H1.fontSize * 2))
                Spacer(Modifier.height(24.dp))
                Text(slide.title, style = CBFont.H2, color = White, textAlign = TextAlign.Center)
                Spacer(Modifier.height(12.dp))
                Text(
                    slide.subtitle,
                    style = CBFont.Body1,
                    color = White.copy(alpha = 0.7f),
                    textAlign = TextAlign.Center
                )
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.Center
        ) {
            repeat(onboardingSlides.size) { index ->
                Box(
                    modifier = Modifier
                        .padding(horizontal = 4.dp)
                        .size(if (pagerState.currentPage == index) 10.dp else 8.dp)
                        .clip(CircleShape)
                        .background(
                            if (pagerState.currentPage == index) Green else White.copy(alpha = 0.3f)
                        )
                )
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 32.dp)
                .height(50.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(Green)
                .clickable {
                    if (pagerState.currentPage < onboardingSlides.lastIndex) {
                        scope.launch {
                            pagerState.animateScrollToPage(pagerState.currentPage + 1)
                        }
                    } else {
                        appState.completeOnboarding()
                        onFinished()
                    }
                },
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = if (pagerState.currentPage == onboardingSlides.lastIndex) "Começar" else "Próximo",
                style = CBFont.Body1Bold,
                color = White
            )
        }
    }
}

@Composable
fun RegisterScreen(
    appState: AppState,
    onBack: () -> Unit,
    onLogin: () -> Unit,
    onTermsClick: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var acceptedTerms by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    AuthFormScaffold(title = "Criar conta", onBack = onBack) {
        AuthField(value = name, onValueChange = { name = it }, placeholder = "Nome completo")
        AuthField(value = email, onValueChange = { email = it }, placeholder = "E-mail", keyboardType = KeyboardType.Email)
        AuthField(value = phone, onValueChange = { phone = it }, placeholder = "Telefone", keyboardType = KeyboardType.Phone)
        AuthField(value = password, onValueChange = { password = it }, placeholder = "Senha", isPassword = true)
        AuthField(value = confirmPassword, onValueChange = { confirmPassword = it }, placeholder = "Confirmar senha", isPassword = true)

        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(
                checked = acceptedTerms,
                onCheckedChange = { acceptedTerms = it },
                colors = CheckboxDefaults.colors(checkedColor = Green, checkmarkColor = White)
            )
            Text(
                text = "Aceito os ",
                style = CBFont.Caption1,
                color = White.copy(alpha = 0.7f)
            )
            Text(
                text = "Termos",
                style = CBFont.Caption1.copy(fontWeight = FontWeight.SemiBold),
                color = Green,
                modifier = Modifier.clickable(onClick = onTermsClick)
            )
        }

        if (errorMessage != null) {
            Text(text = errorMessage!!, style = CBFont.Caption1, color = ErrorRed)
        }

        PrimaryButton(
            text = "Criar conta",
            onClick = {
                if (!acceptedTerms) {
                    errorMessage = "Aceite os Termos para continuar"
                    return@PrimaryButton
                }
                scope.launch {
                    errorMessage = appState.register(name, email, phone, password, confirmPassword)
                }
            },
            enabled = name.isNotBlank() && email.isNotBlank() && password.isNotBlank()
        )

        Text(
            text = "Já tenho conta",
            style = CBFont.Body2,
            color = Green,
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onLogin)
                .padding(top = 8.dp),
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun ForgotPasswordScreen(
    onBack: () -> Unit,
    onLogin: () -> Unit,
    onResetPassword: () -> Unit = {}
) {
    var email by remember { mutableStateOf("") }
    var sent by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    AuthFormScaffold(title = "Esqueci minha senha", onBack = onBack) {
        if (sent) {
            Text("E-mail enviado ✓", style = CBFont.H3, color = Green)
            Text(
                "Enviamos um link de redefinição para $email (mock).",
                style = CBFont.Body2,
                color = White.copy(alpha = 0.7f)
            )
            PrimaryButton(text = "Voltar ao login", onClick = onLogin)
            PrimaryButton(text = "Redefinir senha", onClick = onResetPassword)
        } else {
            Text(
                "Informe seu e-mail para receber o link de redefinição.",
                style = CBFont.Body2,
                color = White.copy(alpha = 0.7f)
            )
            AuthField(value = email, onValueChange = { email = it; errorMessage = null }, placeholder = "E-mail", keyboardType = KeyboardType.Email)
            if (errorMessage != null) {
                Text(text = errorMessage!!, style = CBFont.Caption1, color = ErrorRed)
            }
            PrimaryButton(
                text = "Enviar link",
                onClick = {
                    if (email.trim().isEmpty() || !email.contains("@")) {
                        errorMessage = "Informe um e-mail válido"
                    } else {
                        sent = true
                    }
                },
                enabled = email.isNotBlank()
            )
        }
    }
}

@Composable
fun ResetPasswordScreen(
    appState: AppState,
    token: String,
    onBack: () -> Unit,
    onSuccess: () -> Unit
) {
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    AuthFormScaffold(title = "Redefinir senha", onBack = onBack) {
        Text(
            "Escolha uma nova senha para sua conta.",
            style = CBFont.Body2,
            color = White.copy(alpha = 0.7f)
        )
        AuthField(
            value = password,
            onValueChange = { password = it; errorMessage = null },
            placeholder = "Nova senha",
            isPassword = true
        )
        AuthField(
            value = confirmPassword,
            onValueChange = { confirmPassword = it; errorMessage = null },
            placeholder = "Confirmar senha",
            isPassword = true
        )
        if (errorMessage != null) {
            Text(text = errorMessage!!, style = CBFont.Caption1, color = ErrorRed)
        }
        PrimaryButton(
            text = "Salvar nova senha",
            onClick = {
                when {
                    password.isBlank() || confirmPassword.isBlank() ->
                        errorMessage = "Campo obrigatório"
                    password != confirmPassword ->
                        errorMessage = "As senhas não coincidem"
                    password.length < 4 ->
                        errorMessage = "Senha muito curta"
                    else -> scope.launch {
                        val error = appState.resetPassword(token, password)
                        if (error != null) {
                            errorMessage = error
                        } else {
                            onSuccess()
                        }
                    }
                }
            },
            enabled = password.isNotBlank() && confirmPassword.isNotBlank()
        )
    }
}

@Composable
private fun AuthFormScaffold(
    title: String,
    onBack: () -> Unit,
    content: @Composable () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Black)
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 26.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 48.dp, bottom = 24.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("←", style = CBFont.H3, color = White, modifier = Modifier.clickable(onClick = onBack))
            Spacer(Modifier.width(12.dp))
            Text(title, style = CBFont.H3, color = White)
        }
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            content()
        }
        Spacer(Modifier.height(32.dp))
    }
}

@Composable
fun AuthField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    isPassword: Boolean = false
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(White)
            .padding(horizontal = 16.dp),
        contentAlignment = Alignment.CenterStart
    ) {
        if (value.isEmpty()) {
            Text(text = placeholder, style = CBFont.Body1, color = Black.copy(alpha = 0.4f))
        }
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            singleLine = true,
            textStyle = CBFont.Body1.copy(color = Black.copy(alpha = 0.9f)),
            cursorBrush = SolidColor(Green),
            visualTransformation = if (isPassword) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
            keyboardOptions = KeyboardOptions(keyboardType = if (isPassword) KeyboardType.Password else keyboardType),
            modifier = Modifier.fillMaxWidth()
        )
    }
}
