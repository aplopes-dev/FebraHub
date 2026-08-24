import SwiftUI

enum AuthRoute: Hashable {
    case register
    case forgotPassword
    case resetPassword(token: String)
    case staticPage(StaticPageType)
}

// MARK: - A3 Onboarding

struct OnboardingView: View {
    @Environment(AppState.self) private var appState
    var onFinished: () -> Void

    private let slides: [(emoji: String, title: String, subtitle: String)] = [
        ("🛍️", "Compre com praticidade", "Milhares de produtos com entrega rápida na sua região."),
        ("⚡", "Ofertas exclusivas", "Cupons, frete grátis e benefícios CityBox+ todo dia."),
        ("📦", "Acompanhe seus pedidos", "Rastreamento em tempo real do checkout à entrega.")
    ]

    @State private var page = 0

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Spacer()
                Button("Pular") {
                    appState.completeOnboarding()
                    onFinished()
                }
                .font(CBFont.body2())
                .foregroundColor(.white.opacity(0.7))
            }
            .padding(.horizontal, CBSpacing.lg)
            .padding(.top, 56)

            TabView(selection: $page) {
                ForEach(Array(slides.enumerated()), id: \.offset) { index, slide in
                    VStack(spacing: CBSpacing.lg) {
                        Text(slide.emoji).font(.system(size: 72))
                        Text(slide.title)
                            .font(CBFont.h2())
                            .foregroundColor(.white)
                            .multilineTextAlignment(.center)
                        Text(slide.subtitle)
                            .font(CBFont.body1())
                            .foregroundColor(.white.opacity(0.7))
                            .multilineTextAlignment(.center)
                    }
                    .padding(CBSpacing.xl)
                    .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))

            HStack(spacing: CBSpacing.sm) {
                ForEach(0..<slides.count, id: \.self) { index in
                    Circle()
                        .fill(index == page ? Color.cbGreen : Color.white.opacity(0.3))
                        .frame(width: index == page ? 10 : 8, height: index == page ? 10 : 8)
                }
            }
            .padding(.bottom, CBSpacing.lg)

            Button {
                if page < slides.count - 1 {
                    withAnimation { page += 1 }
                } else {
                    appState.completeOnboarding()
                    onFinished()
                }
            } label: {
                Text(page == slides.count - 1 ? "Começar" : "Próximo")
                    .font(CBFont.body1())
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.cbGreen)
                    .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
            }
            .padding(.horizontal, CBSpacing.lg)
            .padding(.bottom, CBSpacing.xl)
        }
        .background(Color(hex: "111111").ignoresSafeArea())
        .preferredColorScheme(.dark)
    }
}

// MARK: - A1 Register

struct RegisterView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var acceptedTerms = false
    @State private var errorMessage: String?
    var onTerms: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: CBSpacing.md) {
                AuthField(placeholder: "Nome completo", text: $name)
                AuthField(placeholder: "E-mail", text: $email, keyboard: .emailAddress)
                AuthField(placeholder: "Telefone", text: $phone, keyboard: .phonePad)
                AuthField(placeholder: "Senha", text: $password, isSecure: true)
                AuthField(placeholder: "Confirmar senha", text: $confirmPassword, isSecure: true)

                Toggle(isOn: $acceptedTerms) {
                    HStack(spacing: 0) {
                        Text("Aceito os ").font(CBFont.caption1())
                        Button("Termos", action: onTerms)
                            .font(CBFont.caption1())
                            .fontWeight(.semibold)
                    }
                }
                .tint(.cbGreen)

                if let errorMessage {
                    Text(errorMessage).font(CBFont.caption1()).foregroundColor(.red)
                }

                PrimaryButton(title: "Criar conta") {
                    guard acceptedTerms else {
                        errorMessage = "Aceite os Termos para continuar"
                        return
                    }
                    Task {
                        errorMessage = await appState.register(
                            name: name, email: email, phone: phone,
                            password: password, confirmPassword: confirmPassword
                        )
                    }
                }

                Button("Já tenho conta") { dismiss() }
                    .font(CBFont.body2())
                    .foregroundColor(.cbGreen)
                    .frame(maxWidth: .infinity)
            }
            .padding(CBSpacing.lg)
        }
        .background(Color(hex: "111111").ignoresSafeArea())
        .navigationTitle("Criar conta")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .preferredColorScheme(.dark)
    }
}

// MARK: - A2 Forgot Password

struct ForgotPasswordView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var sent = false
    @State private var errorMessage: String?
    var onResetPassword: () -> Void = {}

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: CBSpacing.md) {
                if sent {
                    Text("E-mail enviado ✓")
                        .font(CBFont.h3())
                        .foregroundColor(.cbGreen)
                    Text("Enviamos um link de redefinição para \(email) (mock).")
                        .font(CBFont.body2())
                        .foregroundColor(.white.opacity(0.7))
                    PrimaryButton(title: "Voltar ao login") { dismiss() }
                    PrimaryButton(title: "Redefinir senha", action: onResetPassword)
                } else {
                    Text("Informe seu e-mail para receber o link de redefinição.")
                        .font(CBFont.body2())
                        .foregroundColor(.white.opacity(0.7))
                    AuthField(placeholder: "E-mail", text: $email, keyboard: .emailAddress)
                    if let errorMessage {
                        Text(errorMessage).font(CBFont.caption1()).foregroundColor(.red)
                    }
                    PrimaryButton(title: "Enviar link") {
                        if email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || !email.contains("@") {
                            errorMessage = "Informe um e-mail válido"
                        } else {
                            sent = true
                        }
                    }
                }
            }
            .padding(CBSpacing.lg)
        }
        .background(Color(hex: "111111").ignoresSafeArea())
        .navigationTitle("Esqueci minha senha")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .preferredColorScheme(.dark)
    }
}

// MARK: - A2 Reset Password

struct ResetPasswordView: View {
    @Environment(AppState.self) private var appState
    let token: String
    var onSuccess: () -> Void = {}

    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: CBSpacing.md) {
                Text("Escolha uma nova senha para sua conta.")
                    .font(CBFont.body2())
                    .foregroundColor(.white.opacity(0.7))
                AuthField(placeholder: "Nova senha", text: $password, isSecure: true)
                AuthField(placeholder: "Confirmar senha", text: $confirmPassword, isSecure: true)
                if let errorMessage {
                    Text(errorMessage).font(CBFont.caption1()).foregroundColor(.red)
                }
                PrimaryButton(title: "Salvar nova senha") {
                    Task {
                        errorMessage = await appState.resetPassword(
                            token: token,
                            password: password,
                            confirmPassword: confirmPassword
                        )
                        if errorMessage == nil {
                            onSuccess()
                        }
                    }
                }
            }
            .padding(CBSpacing.lg)
        }
        .background(Color(hex: "111111").ignoresSafeArea())
        .navigationTitle("Redefinir senha")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .preferredColorScheme(.dark)
    }
}

private struct AuthField: View {
    let placeholder: String
    @Binding var text: String
    var keyboard: UIKeyboardType = .default
    var isSecure = false

    private var fieldPrompt: Text {
        Text(placeholder).foregroundColor(Color.black.opacity(0.4))
    }

    var body: some View {
        Group {
            if isSecure {
                SecureField("", text: $text, prompt: fieldPrompt)
            } else {
                TextField("", text: $text, prompt: fieldPrompt)
                    .keyboardType(keyboard)
                    .autocapitalization(.none)
                    .autocorrectionDisabled()
            }
        }
        .padding(.horizontal, 16)
        .frame(height: 52)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
        .preferredColorScheme(.light)
    }
}

struct AuthFlowView: View {
    @Environment(AppState.self) private var appState
    @State private var path = NavigationPath()

    var body: some View {
        @Bindable var appState = appState

        Group {
            if !appState.hasSeenOnboarding {
                OnboardingView(onFinished: {})
            } else {
                NavigationStack(path: $path) {
                    LoginView(
                        onRegister: { path.append(AuthRoute.register) },
                        onForgotPassword: { path.append(AuthRoute.forgotPassword) },
                        onStaticPage: { path.append(AuthRoute.staticPage($0)) }
                    )
                    .navigationDestination(for: AuthRoute.self) { route in
                        switch route {
                        case .register:
                            RegisterView(onTerms: { path.append(AuthRoute.staticPage(.terms)) })
                        case .forgotPassword:
                            ForgotPasswordView(
                                onResetPassword: {
                                    path.append(AuthRoute.resetPassword(token: MockData.mockResetToken))
                                }
                            )
                        case .resetPassword(let token):
                            ResetPasswordView(token: token) {
                                path = NavigationPath()
                            }
                        case .staticPage(let type):
                            StaticPageView(pageType: type)
                        }
                    }
                }
            }
        }
        .animation(.easeInOut(duration: 0.25), value: appState.hasSeenOnboarding)
    }
}
