import SwiftUI

struct LoginView: View {
    @Environment(AppState.self) private var appState
    @State private var account = ""
    @State private var password = ""
    @State private var errorMessage: String?

    var onRegister: () -> Void = {}
    var onForgotPassword: () -> Void = {}
    var onStaticPage: (StaticPageType) -> Void = { _ in }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(spacing: 16) {
                        CityBoxLogoMark(size: 68)
                        Text("CityBox")
                            .font(.system(size: 36, weight: .heavy))
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.bottom, 36)

                    Text("Olá!")
                        .font(.system(size: 25, weight: .heavy))
                        .foregroundColor(.white)
                        .padding(.bottom, 6)

                    Text("Digite seu e-mail, telefone ou usuário para entrar na sua conta.")
                        .font(.system(size: 15))
                        .foregroundColor(.white.opacity(0.7))
                        .lineSpacing(4)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.bottom, 24)

                    AuthLoginField(placeholder: "E-mail, telefone ou usuário", text: $account)
                        .padding(.bottom, 12)

                    AuthLoginField(placeholder: "Senha", text: $password, isSecure: true)

                    if let errorMessage {
                        Text(errorMessage)
                            .font(CBFont.caption1())
                            .foregroundColor(.red)
                            .padding(.top, 8)
                    }

                    Button(action: onForgotPassword) {
                        Text("Esqueci minha senha")
                            .font(CBFont.caption1())
                            .foregroundColor(.cbGreen)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                    }
                    .padding(.top, 8)
                    .padding(.bottom, 16)

                    Button {
                        Task {
                            errorMessage = await appState.login(account: account, password: password)
                        }
                    } label: {
                        Text("Continuar")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(Color(hex: "111111"))
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .padding(.bottom, 12)

                    Button(action: onRegister) {
                        Text("Criar conta")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(Color.white.opacity(0.12))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    HStack(spacing: 12) {
                        Rectangle().fill(Color.white.opacity(0.2)).frame(height: 1)
                        Text("ou")
                            .font(.system(size: 13))
                            .foregroundColor(.white.opacity(0.5))
                            .fixedSize()
                        Rectangle().fill(Color.white.opacity(0.2)).frame(height: 1)
                    }
                    .padding(.vertical, 24)

                    Button {
                        Task {
                            errorMessage = await appState.loginWithGoogle()
                        }
                    } label: {
                        HStack(spacing: 10) {
                            Text("G")
                                .font(.system(size: 16, weight: .heavy))
                                .foregroundColor(Color(hex: "4285F4"))
                            Text("Continuar com Google")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(.black.opacity(0.8))
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .strokeBorder(Color.black.opacity(0.18), lineWidth: 1)
                        )
                    }
                }
                .padding(.horizontal, 26)
                .padding(.top, 16)
                .padding(.bottom, 24)
            }

            loginFooter
                .padding(.horizontal, 26)
                .padding(.top, 16)
                .padding(.bottom, 28)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "111111"))
        .toolbar(.hidden, for: .navigationBar)
        .preferredColorScheme(.dark)
    }

    private var loginFooter: some View {
        VStack(spacing: 4) {
            Text("Ao continuar, você aceita os")
                .font(.system(size: 11))
                .foregroundColor(.white.opacity(0.55))

            HStack(spacing: 4) {
                Button("Termos e condições") {
                    onStaticPage(.terms)
                }
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(.cbGreen)

                Text("e a")
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.55))

                Button("Política de privacidade") {
                    onStaticPage(.privacy)
                }
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(.cbGreen)
            }

            Text("do CityBox.")
                .font(.system(size: 11))
                .foregroundColor(.white.opacity(0.55))
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity)
    }
}

private struct AuthLoginField: View {
    let placeholder: String
    @Binding var text: String
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
                    .autocapitalization(.none)
                    .autocorrectionDisabled()
                    .textContentType(.username)
            }
        }
        .font(.system(size: 15))
        .foregroundColor(.black.opacity(0.9))
        .tint(.cbGreen)
        .padding(.horizontal, 16)
        .frame(maxWidth: .infinity, minHeight: 52, maxHeight: 52)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .preferredColorScheme(.light)
    }
}
