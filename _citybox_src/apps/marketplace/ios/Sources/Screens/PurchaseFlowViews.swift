import SwiftUI

// MARK: - C2 Shipping Options

struct ShippingOptionsView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    var onSelected: (() -> Void)?

    var body: some View {
        List {
            ForEach(appState.shippingOptions) { option in
                Button {
                    appState.selectShipping(option.id)
                    onSelected?() ?? dismiss()
                } label: {
                    HStack(spacing: CBSpacing.md) {
                        Image(systemName: appState.selectedShipping?.id == option.id ? "largecircle.fill.circle" : "circle")
                            .foregroundColor(.cbGreen)

                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: CBSpacing.sm) {
                                Text(option.name)
                                    .font(CBFont.body1())
                                    .foregroundColor(.cbBlack)
                                if option.isExpress {
                                    BadgeChip(text: "EXPRESS", style: .info, icon: "bolt")
                                }
                            }
                            Text(option.deliveryEstimate)
                                .font(CBFont.caption1())
                                .foregroundColor(.cbTextSecondary)
                        }

                        Spacer()

                        Text(option.price <= 0 ? "Grátis" : option.price.brlFormatted)
                            .font(CBFont.body2())
                            .fontWeight(.semibold)
                            .foregroundColor(option.price <= 0 ? .cbGreen : .cbBlack)
                    }
                }
                .buttonStyle(.plain)
            }
        }
        .background(Color.cbSurface)
        .navigationTitle("Opções de envio")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
    }
}

// MARK: - C3 Coupons

struct CouponsView: View {
    @Environment(AppState.self) private var appState
    @State private var codeInput = ""
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: CBSpacing.lg) {
                VStack(spacing: CBSpacing.sm) {
                    TextField("Inserir código", text: $codeInput)
                        .padding(12)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
                        .onChange(of: codeInput) { _, _ in errorMessage = nil }

                    if let errorMessage {
                        Text(errorMessage)
                            .font(CBFont.caption1())
                            .foregroundColor(.red)
                    }

                    PrimaryButton(
                        title: "Aplicar código",
                        action: {
                            if appState.applyCoupon(codeInput.trimmingCharacters(in: .whitespaces)) {
                                codeInput = ""
                                errorMessage = nil
                            } else {
                                errorMessage = "Cupom inválido ou expirado"
                            }
                        },
                        disabled: codeInput.trimmingCharacters(in: .whitespaces).isEmpty
                    )

                    if let applied = appState.appliedCoupon {
                        HStack {
                            Text("\(applied.code) aplicado")
                                .font(CBFont.body2())
                                .foregroundColor(.cbGreen)
                            Spacer()
                            Button("Remover") {
                                appState.removeCoupon()
                            }
                            .font(CBFont.caption1())
                            .foregroundColor(.red)
                        }
                        .padding(CBSpacing.md)
                        .background(Color.cbTintSuccess)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
                    }
                }

                Text("Disponíveis para você")
                    .font(CBFont.h3())
                    .foregroundColor(.cbBlack)

                ForEach(appState.availableCoupons) { coupon in
                    CouponCard(
                        coupon: coupon,
                        isApplied: appState.appliedCoupon?.code == coupon.code,
                        onApply: {
                            _ = appState.applyCoupon(coupon.code)
                            errorMessage = nil
                        }
                    )
                }
            }
            .padding(CBSpacing.lg)
        }
        .background(Color.cbSurface)
        .navigationTitle("Cupons")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
    }
}

private struct CouponCard: View {
    let coupon: Coupon
    let isApplied: Bool
    let onApply: () -> Void

    var body: some View {
        Button(action: onApply) {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(coupon.code)
                        .font(CBFont.body1())
                        .foregroundColor(.cbBlack)
                    Spacer()
                    Text(isApplied ? "Aplicado ✓" : "Aplicar")
                        .font(CBFont.caption1())
                        .fontWeight(.semibold)
                        .foregroundColor(.cbGreen)
                }
                Text(coupon.description)
                    .font(CBFont.body2())
                    .foregroundColor(.cbTextSecondary)
                Text(discountLabel + " · Válido até \(coupon.expiry)")
                    .font(CBFont.caption1())
                    .foregroundColor(.cbTextSecondary)
            }
            .padding(CBSpacing.lg)
            .background(isApplied ? Color.cbTintSuccess : Color.white)
            .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
            .overlay(
                RoundedRectangle(cornerRadius: CBRadius.card)
                    .strokeBorder(isApplied ? Color.cbGreen : Color.cbBorder, lineWidth: isApplied ? 1.5 : 1)
            )
        }
        .buttonStyle(.plain)
    }

    private var discountLabel: String {
        switch coupon.type {
        case .percent: return "\(Int(coupon.value))% de desconto"
        case .fixed: return coupon.value.brlFormatted + " off"
        }
    }
}

// MARK: - Shared coupon field (Cart / Checkout)

struct CouponFieldSection: View {
    @Environment(AppState.self) private var appState
    @State private var codeInput = ""
    @State private var errorMessage: String?
    var showBrowseLink = true

    var body: some View {
        VStack(alignment: .leading, spacing: CBSpacing.sm) {
            Text("Cupom de desconto")
                .font(CBFont.h3())
                .foregroundColor(.cbBlack)

            if let applied = appState.appliedCoupon {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(applied.code)
                            .font(CBFont.body2())
                            .fontWeight(.semibold)
                        Text(applied.description)
                            .font(CBFont.caption1())
                            .foregroundColor(.cbTextSecondary)
                    }
                    Spacer()
                    Button("Remover") { appState.removeCoupon() }
                        .font(CBFont.caption1())
                        .foregroundColor(.red)
                }
            } else {
                HStack(spacing: CBSpacing.sm) {
                    TextField("Código", text: $codeInput)
                        .padding(10)
                        .background(Color.cbSurface)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
                    Button("Aplicar") {
                        if appState.applyCoupon(codeInput.trimmingCharacters(in: .whitespaces)) {
                            codeInput = ""
                            errorMessage = nil
                        } else {
                            errorMessage = "Cupom inválido"
                        }
                    }
                    .font(CBFont.body2())
                    .foregroundColor(.cbGreen)
                }
                if let errorMessage {
                    Text(errorMessage)
                        .font(CBFont.caption1())
                        .foregroundColor(.red)
                }
            }

            if showBrowseLink {
                NavigationLink(value: AccountRoute.coupons) {
                    Text("Ver cupons disponíveis")
                        .font(CBFont.caption1())
                        .foregroundColor(.cbGreen)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(CBSpacing.lg)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
    }
}

// MARK: - C5 Checkout payment details

struct CheckoutPaymentDetailsSection: View {
    @Environment(AppState.self) private var appState

    private let paymentOptions: [PaymentOption] = [
        PaymentOption(id: "pix", title: "PIX", subtitle: "Aprovação imediata", icon: .pix, discountLabel: "5% off"),
        PaymentOption(id: "card", title: "Cartão de crédito", subtitle: "Em até 12x sem juros", icon: .system("creditcard"), discountLabel: nil),
        PaymentOption(id: "boleto", title: "Boleto bancário", subtitle: "Vence em 3 dias úteis", icon: .system("doc.text"), discountLabel: nil)
    ]

    var body: some View {
        CheckoutSection(title: "Forma de pagamento") {
            VStack(spacing: CBSpacing.sm) {
                ForEach(paymentOptions) { option in
                    PaymentOptionRow(
                        option: option,
                        isSelected: paymentType(for: option.id) == appState.checkoutPaymentType,
                        onTap: { appState.setCheckoutPaymentType(paymentType(for: option.id)) }
                    )
                }

                switch appState.checkoutPaymentType {
                case .card:
                    CheckoutCardSelection()
                case .boleto:
                    CheckoutBoletoSection()
                case .pix:
                    EmptyView()
                }
            }
        }
    }

    private func paymentType(for id: String) -> CheckoutPaymentType {
        switch id {
        case "card": return .card
        case "boleto": return .boleto
        default: return .pix
        }
    }
}

private struct CheckoutCardSelection: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        VStack(alignment: .leading, spacing: CBSpacing.sm) {
            if appState.paymentMethods.isEmpty {
                Text("Nenhum cartão salvo")
                    .font(CBFont.caption1())
                    .foregroundColor(.cbTextSecondary)
            } else {
                ForEach(appState.paymentMethods) { method in
                    Button {
                        appState.selectPaymentMethod(method.id)
                    } label: {
                        HStack(spacing: CBSpacing.sm) {
                            Image(systemName: appState.selectedPayment?.id == method.id ? "largecircle.fill.circle" : "circle")
                                .foregroundColor(.cbGreen)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(method.displayName)
                                    .font(CBFont.body2())
                                    .foregroundColor(.cbBlack)
                                Text("\(method.holderName) · Val. \(method.expiry)")
                                    .font(CBFont.caption1())
                                    .foregroundColor(.cbTextSecondary)
                            }
                            Spacer()
                        }
                        .padding(CBSpacing.md)
                        .background(appState.selectedPayment?.id == method.id ? Color.cbTintSuccess : Color.cbSurface)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
                    }
                    .buttonStyle(.plain)
                }
            }

            NavigationLink(value: AccountRoute.addCard) {
                Text("Adicionar cartão")
                    .font(CBFont.body2())
                    .foregroundColor(.cbGreen)
            }
            .buttonStyle(.plain)
        }
        .padding(.top, CBSpacing.sm)
    }
}

private struct CheckoutBoletoSection: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        VStack(alignment: .leading, spacing: CBSpacing.sm) {
            TextField("CPF do pagador", text: Binding(
                get: { appState.boletoCpf },
                set: { appState.setBoletoCpf($0) }
            ))
            .keyboardType(.numberPad)
            .padding(12)
            .background(Color.cbSurface)
            .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))

            if appState.boletoCpf.count == 11 {
                VStack(alignment: .leading, spacing: CBSpacing.sm) {
                    Text("Prévia do boleto")
                        .font(CBFont.body2())
                        .fontWeight(.semibold)
                    Text("||||| 34191.79001 01043.510047 91020.150008 8 00000000000000")
                        .font(CBFont.caption2())
                        .foregroundColor(.cbTextSecondary)
                    Text("Vencimento em 3 dias úteis · CityBox Marketplace")
                        .font(CBFont.caption1())
                        .foregroundColor(.cbTextSecondary)
                }
                .padding(CBSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.cbSurface)
                .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
            } else if !appState.boletoCpf.isEmpty {
                Text("Informe um CPF válido (11 dígitos)")
                    .font(CBFont.caption1())
                    .foregroundColor(.red)
            }
        }
        .padding(.top, CBSpacing.sm)
    }
}
