import SwiftUI

// MARK: - B1 Edit Profile

struct EditProfileView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""

    var body: some View {
        ScrollView {
            VStack(spacing: CBSpacing.lg) {
                ZStack {
                    Circle().fill(Color.cbGreen).frame(width: 80, height: 80)
                    Text(appState.user.avatarInitial)
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.white)
                }
                .padding(.top, CBSpacing.lg)

                ProfileTextField(label: "Nome", text: $name)
                ProfileTextField(label: "E-mail", text: $email)
                ProfileTextField(label: "Telefone", text: $phone)

                PrimaryButton(title: "Salvar") {
                    appState.updateProfile(name: name, email: email, phone: phone)
                    dismiss()
                }
            }
            .padding(CBSpacing.lg)
        }
        .background(Color.cbSurface)
        .navigationTitle("Editar perfil")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
        .onAppear {
            name = appState.user.name
            email = appState.user.email
            phone = appState.user.phone
        }
    }
}

private struct ProfileTextField: View {
    let label: String
    @Binding var text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(CBFont.caption1()).foregroundColor(.cbTextSecondary)
            TextField(label, text: $text)
                .padding(12)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
        }
    }
}

// MARK: - B2 Address List

struct AddressListView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    var selectionMode = false
    var onSelected: (() -> Void)?

    var body: some View {
        List {
            ForEach(appState.addresses) { address in
                HStack {
                    Button {
                        appState.selectAddress(address.id)
                        if selectionMode { onSelected?() ?? dismiss() }
                    } label: {
                        HStack {
                            Image(systemName: address.isDefault ? "largecircle.fill.circle" : "circle")
                                .foregroundColor(.cbGreen)
                            VStack(alignment: .leading, spacing: 4) {
                                Text(address.label).font(CBFont.body1()).fontWeight(.semibold)
                                Text(address.formattedLine1).font(CBFont.body2())
                                Text(address.formattedLine2).font(CBFont.caption1()).foregroundColor(.cbTextSecondary)
                            }
                        }
                    }
                    .buttonStyle(.plain)

                    if !selectionMode {
                        Spacer()
                        NavigationLink(value: AccountRoute.editAddress(address.id)) {
                            Image(systemName: "pencil")
                        }
                        Button {
                            appState.removeAddress(address.id)
                        } label: {
                            Image(systemName: "trash").foregroundColor(.red)
                        }
                    }
                }
            }
        }
        .listStyle(.plain)
        .navigationTitle(selectionMode ? "Selecionar endereço" : "Endereços")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(value: AccountRoute.addAddress) {
                    Image(systemName: "plus")
                }
            }
        }
    }
}

// MARK: - B3 Address Form

struct AddressFormView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    let addressId: String?

    @State private var label = "Casa"
    @State private var zipCode = ""
    @State private var street = ""
    @State private var number = ""
    @State private var complement = ""
    @State private var neighborhood = ""
    @State private var city = ""
    @State private var state = ""
    @State private var isDefault = false

    private var existing: Address? {
        guard let id = addressId else { return nil }
        return appState.addresses.first { $0.id == id }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: CBSpacing.md) {
                HStack {
                    Button("Casa") { label = "Casa" }.buttonStyle(.bordered)
                    Button("Trabalho") { label = "Trabalho" }.buttonStyle(.bordered)
                }

                ProfileTextField(label: "Apelido", text: $label)
                HStack {
                    ProfileTextField(label: "CEP", text: $zipCode)
                    Button("Buscar") {
                        street = "Rua Exemplo"
                        neighborhood = "Centro"
                        city = "São Paulo"
                        state = "SP"
                    }
                    .font(CBFont.caption1())
                }
                ProfileTextField(label: "Rua", text: $street)
                ProfileTextField(label: "Número", text: $number)
                ProfileTextField(label: "Complemento", text: $complement)
                ProfileTextField(label: "Bairro", text: $neighborhood)
                ProfileTextField(label: "Cidade", text: $city)
                ProfileTextField(label: "UF", text: $state)

                Toggle("Endereço padrão", isOn: $isDefault)

                PrimaryButton(title: "Salvar") {
                    let address = Address(
                        id: existing?.id ?? "addr-\(Date().timeIntervalSince1970)",
                        label: label, zipCode: zipCode, street: street, number: number,
                        complement: complement, neighborhood: neighborhood, city: city,
                        state: state, isDefault: isDefault
                    )
                    if existing != nil { appState.editAddress(address) } else { appState.addAddress(address) }
                    dismiss()
                }
            }
            .padding(CBSpacing.lg)
        }
        .background(Color.cbSurface)
        .navigationTitle(existing == nil ? "Adicionar endereço" : "Editar endereço")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
        .onAppear {
            guard let a = existing else {
                isDefault = appState.addresses.isEmpty
                return
            }
            label = a.label; zipCode = a.zipCode; street = a.street; number = a.number
            complement = a.complement; neighborhood = a.neighborhood; city = a.city
            state = a.state; isDefault = a.isDefault
        }
    }
}

// MARK: - B4 Payment Methods

struct PaymentMethodsView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        List {
            ForEach(appState.paymentMethods) { method in
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(method.displayName).font(CBFont.body1())
                        Text("\(method.holderName) · Val. \(method.expiry)")
                            .font(CBFont.caption1()).foregroundColor(.cbTextSecondary)
                        if method.isDefault {
                            Text("Padrão").font(CBFont.caption2()).foregroundColor(.cbGreen)
                        }
                    }
                    Spacer()
                    Button {
                        appState.removePaymentMethod(method.id)
                    } label: {
                        Image(systemName: "trash").foregroundColor(.red)
                    }
                }
            }
        }
        .listStyle(.plain)
        .navigationTitle("Meus Cartões")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(value: AccountRoute.addCard) {
                    Image(systemName: "plus")
                }
            }
        }
    }
}

// MARK: - B5 Card Form

struct CardFormView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var number = ""
    @State private var holderName = ""
    @State private var expiry = ""
    @State private var cvv = ""

    private var brand: CardBrand {
        if number.hasPrefix("4") { return .visa }
        if number.hasPrefix("5") { return .mastercard }
        if number.hasPrefix("6") { return .elo }
        if number.hasPrefix("3") { return .amex }
        return .unknown
    }

    var body: some View {
        ScrollView {
            VStack(spacing: CBSpacing.md) {
                if !number.isEmpty {
                    Text("Bandeira: \(brand.displayName)").font(CBFont.caption1())
                }
                ProfileTextField(label: "Número do cartão", text: $number)
                ProfileTextField(label: "Nome no cartão", text: $holderName)
                ProfileTextField(label: "Validade (MM/AA)", text: $expiry)
                SecureField("CVV", text: $cvv)
                    .padding(12)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))

                PrimaryButton(title: "Salvar") {
                    let method = PaymentMethod(
                        id: "card-\(Date().timeIntervalSince1970)",
                        brand: brand,
                        lastFour: String(number.suffix(4).isEmpty ? "0000" : number.suffix(4)),
                        expiry: expiry.isEmpty ? "12/28" : expiry,
                        holderName: holderName.isEmpty ? "Titular" : holderName,
                        label: "",
                        isDefault: appState.paymentMethods.isEmpty
                    )
                    appState.addPaymentMethod(method, number: number, cvv: cvv)
                    dismiss()
                }
            }
            .padding(CBSpacing.lg)
        }
        .background(Color.cbSurface)
        .navigationTitle("Adicionar cartão")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
    }
}

// MARK: - B6 Settings

struct SettingsView: View {
    @Environment(AppState.self) private var appState
    @State private var pushEnabled = true
    @State private var emailEnabled = true
    @State private var darkTheme = false

    var body: some View {
        List {
            Section("Notificações") {
                Toggle("Push de pedidos", isOn: $pushEnabled)
                Toggle("E-mails promocionais", isOn: $emailEnabled)
            }
            Section("Aparência") {
                Toggle("Tema escuro", isOn: $darkTheme)
            }
            Section("Idioma") {
                Text("Português (Brasil)")
            }
            Section("Conta") {
                Button("Ver tour de boas-vindas novamente") {
                    appState.resetOnboarding()
                    appState.logout()
                }
            }
            Section {
                Button("Excluir conta", role: .destructive) {
                    appState.logout()
                }
            }
        }
        .navigationTitle("Configurações")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
    }
}

// MARK: - B7 Static Page

struct StaticPageView: View {
    let pageType: StaticPageType

    var body: some View {
        ScrollView {
            Text(MockData.staticPageContent[pageType] ?? "")
                .font(CBFont.body2())
                .foregroundColor(.cbTextSecondary)
                .padding(CBSpacing.lg)
        }
        .background(Color.cbSurface)
        .navigationTitle(pageType.title)
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
    }
}

// MARK: - B8 Subscription

struct SubscriptionView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: CBSpacing.lg) {
                VStack(alignment: .leading, spacing: CBSpacing.sm) {
                    Text("✦ CityBox+")
                        .font(CBFont.h2())
                        .foregroundColor(.white)
                    Text(appState.user.isPlus ? "Plano ativo" : "Sem assinatura")
                        .font(CBFont.body1())
                        .foregroundColor(.white.opacity(0.9))
                    Text("Renovação: \(MockData.subscriptionRenewalDate)")
                        .font(CBFont.caption1())
                        .foregroundColor(.white.opacity(0.8))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(CBSpacing.lg)
                .background(
                    ZStack {
                        Image("banner_citybox_plus")
                            .resizable()
                            .scaledToFill()
                        LinearGradient(
                            colors: [.black.opacity(0.5), .black.opacity(0.6)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    }
                )
                .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))

                Text("Benefícios").font(CBFont.h3())

                VStack(alignment: .leading, spacing: CBSpacing.sm) {
                    ForEach(MockData.subscriptionBenefits, id: \.self) { benefit in
                        HStack(spacing: CBSpacing.sm) {
                            Image(systemName: "checkmark.circle.fill").foregroundColor(.cbGreen)
                            Text(benefit).font(CBFont.body2())
                        }
                    }
                }
                .padding(CBSpacing.lg)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))

                Text("R$ 19,90/mês · cancele quando quiser")
                    .font(CBFont.caption1())
                    .foregroundColor(.cbTextSecondary)

                PrimaryButton(title: "Cancelar assinatura") {}
            }
            .padding(CBSpacing.lg)
        }
        .background(Color.cbSurface)
        .navigationTitle("CityBox+")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
    }
}

// MARK: - Navigation routes

enum AccountRoute: Hashable {
    case editProfile
    case addresses
    case addressSelection
    case addAddress
    case editAddress(String)
    case paymentMethods
    case addCard
    case settings
    case staticPage(StaticPageType)
    case subscription
    case coupons
    case shippingOptions
    case notifications
    case help
    case chat
    case openTicket
    case myTickets
}
