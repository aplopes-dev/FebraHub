import SwiftUI

struct CheckoutView: View {
    @Environment(AppState.self) private var appState
    @State private var confirmedOrder: Order? = nil

    private var grandTotal: Double {
        appState.orderGrandTotal(for: appState.cartTotal)
    }

    var effectiveTotal: Double {
        appState.checkoutPaymentType == .pix ? grandTotal * 0.95 : grandTotal
    }

    var body: some View {
        ScrollView {
            VStack(spacing: CBSpacing.lg) {
                CheckoutSection(title: "Endereço de entrega") {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            if let address = appState.selectedAddress {
                                Text(address.formattedLine1)
                                    .font(CBFont.body2())
                                    .foregroundColor(.cbBlack)
                                Text(address.formattedLine2)
                                    .font(CBFont.caption1())
                                    .foregroundColor(.cbTextSecondary)
                            } else {
                                Text("Nenhum endereço selecionado")
                                    .font(CBFont.body2())
                                    .foregroundColor(.cbTextSecondary)
                            }
                        }
                        Spacer()
                        NavigationLink(value: AccountRoute.addressSelection) {
                            Text("Alterar")
                                .font(CBFont.body2())
                                .foregroundColor(.cbGreen)
                        }
                    }
                }

                CheckoutSection(title: "Envio") {
                    NavigationLink(value: AccountRoute.shippingOptions) {
                        HStack(spacing: CBSpacing.md) {
                            if appState.selectedShipping?.isExpress == true {
                                BadgeChip(text: "EXPRESS", style: .info, icon: "bolt")
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(appState.selectedShipping?.name ?? "Express")
                                    .font(CBFont.body2())
                                    .foregroundColor(.cbBlack)
                                Text(appState.selectedShipping?.deliveryEstimate ?? "Amanhã até 22h")
                                    .font(CBFont.caption1())
                                    .foregroundColor(.cbTextSecondary)
                            }
                            Spacer()
                            Text(appState.shippingCost <= 0 ? "Grátis" : appState.shippingCost.brlFormatted)
                                .font(CBFont.body2())
                                .foregroundColor(appState.shippingCost <= 0 ? .cbGreen : .cbBlack)
                                .fontWeight(.semibold)
                            Image(systemName: "chevron.right")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.cbTextDisabled)
                        }
                    }
                    .buttonStyle(.plain)
                }

                CouponFieldSection()

                CheckoutPaymentDetailsSection()

                CheckoutSection(title: "Resumo") {
                    VStack(spacing: CBSpacing.sm) {
                        SummaryRow(label: "Subtotal (\(appState.cartCount) itens)", value: appState.cartTotal.brlFormatted)
                        SummaryRow(
                            label: "Frete (\(appState.selectedShipping?.name ?? "Express"))",
                            value: appState.shippingCost <= 0 ? "Grátis" : appState.shippingCost.brlFormatted,
                            valueColor: appState.shippingCost <= 0 ? .cbGreen : .cbBlack
                        )
                        let couponDiscount = appState.couponDiscountAmount(for: appState.cartTotal)
                        if couponDiscount > 0 {
                            SummaryRow(
                                label: "Cupom (\(appState.appliedCoupon?.code ?? ""))",
                                value: "-\(couponDiscount.brlFormatted)",
                                valueColor: .cbGreen
                            )
                        }
                        if appState.checkoutPaymentType == .pix {
                            SummaryRow(label: "Desconto PIX (5%)", value: "-\((grandTotal * 0.05).brlFormatted)", valueColor: .cbGreen)
                        }
                        Divider()
                        SummaryRow(
                            label: "Total",
                            value: effectiveTotal.brlFormatted,
                            valueColor: .cbBlack,
                            labelFont: CBFont.body1(),
                            valueFont: CBFont.h3()
                        )
                    }
                }

                PrimaryButton(
                    title: "Confirmar pedido",
                    action: {
                        Task { confirmedOrder = await appState.placeOrder() }
                    },
                    disabled: !appState.canConfirmCheckout
                )

                Text("Seus dados estão protegidos com criptografia SSL")
                    .font(CBFont.caption2())
                    .foregroundColor(.cbTextTertiary)
                    .multilineTextAlignment(.center)
                    .padding(.bottom, CBSpacing.lg)
            }
            .padding(CBSpacing.lg)
        }
        .background(Color.cbSurface)
        .navigationTitle("Finalizar Compra")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
        .navigationDestination(item: $confirmedOrder) { order in
            ConfirmationView(order: order)
        }
        .navigationDestination(for: AccountRoute.self) { route in
            switch route {
            case .addressSelection:
                AddressListView(selectionMode: true)
            case .addAddress:
                AddressFormView(addressId: nil)
            case .editAddress(let id):
                AddressFormView(addressId: id)
            case .shippingOptions:
                ShippingOptionsView()
            case .coupons:
                CouponsView()
            case .addCard:
                CardFormView()
            default:
                EmptyView()
            }
        }
    }
}

struct CheckoutSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: CBSpacing.md) {
            Text(title)
                .font(CBFont.h3())
                .foregroundColor(.cbBlack)
            content()
        }
        .padding(CBSpacing.lg)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
    }
}
