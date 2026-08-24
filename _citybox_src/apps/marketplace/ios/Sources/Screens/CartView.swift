import SwiftUI

struct CartView: View {
    @Environment(AppState.self) private var appState

    private var grandTotal: Double {
        appState.orderGrandTotal(for: appState.cartTotal)
    }

    private var shippingLabel: String {
        if let address = appState.selectedAddress {
            return "\(address.city), \(address.state)"
        }
        return "seu endereço"
    }

    var body: some View {
        Group {
            if appState.cart.isEmpty {
                EmptyState(
                    icon: "cart",
                    title: "Seu carrinho está vazio",
                    subtitle: "Adicione produtos para continuar comprando",
                    ctaTitle: "Ver ofertas",
                    ctaAction: { appState.requestTab(0) }
                )
            } else {
                ScrollView {
                    VStack(spacing: CBSpacing.lg) {
                        VStack(alignment: .leading, spacing: 0) {
                            Text("Itens (\(appState.cartCount))")
                                .font(CBFont.h3())
                                .foregroundColor(.cbBlack)
                                .padding(.bottom, CBSpacing.sm)

                            ForEach(appState.cart) { item in
                                CartLineItem(item: item)
                                if item.id != appState.cart.last?.id {
                                    Divider()
                                }
                            }
                        }
                        .padding(CBSpacing.lg)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))

                        CouponFieldSection()

                        HStack(spacing: CBSpacing.sm) {
                            Image(systemName: "shippingbox.fill")
                                .foregroundColor(.cbGreen)
                            Text("Envio para \(shippingLabel) · \(appState.selectedShipping?.name ?? "Express")")
                                .font(CBFont.body2())
                                .foregroundColor(.cbBlack)
                            Spacer()
                            Text(appState.shippingCost <= 0 ? "Grátis" : appState.shippingCost.brlFormatted)
                                .font(CBFont.body2())
                                .foregroundColor(.cbGreen)
                                .fontWeight(.semibold)
                        }
                        .padding(CBSpacing.md)
                        .background(Color.cbTintSuccess)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))

                        VStack(spacing: CBSpacing.sm) {
                            Text("Resumo do pedido")
                                .font(CBFont.h3())
                                .foregroundColor(.cbBlack)
                                .frame(maxWidth: .infinity, alignment: .leading)

                            SummaryRow(label: "Subtotal", value: appState.cartTotal.brlFormatted)
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
                            Divider()
                            SummaryRow(
                                label: "Total",
                                value: grandTotal.brlFormatted,
                                labelFont: CBFont.body1(),
                                valueFont: CBFont.h3()
                            )

                            Text("ou 12x de \((grandTotal / 12).brlFormatted) sem juros")
                                .font(CBFont.caption1())
                                .foregroundColor(.cbTextSecondary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(CBSpacing.lg)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))

                        NavigationLink(destination: CheckoutView()) {
                            Text("Finalizar compra")
                                .font(CBFont.body1())
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                                .background(Color.cbBlack)
                                .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(CBSpacing.lg)
                }
                .background(Color.cbSurface)
            }
        }
        .navigationTitle("Carrinho")
        .navigationBarTitleDisplayMode(.inline)
        .cbDarkNavBar()
        .navigationDestination(for: AccountRoute.self) { route in
            switch route {
            case .coupons:
                CouponsView()
            default:
                EmptyView()
            }
        }
    }
}

struct SummaryRow: View {
    let label: String
    let value: String
    var valueColor: Color = .cbBlack
    var labelFont: Font = CBFont.body2()
    var valueFont: Font = CBFont.body2()

    var body: some View {
        HStack {
            Text(label)
                .font(labelFont)
                .foregroundColor(.cbTextSecondary)
            Spacer()
            Text(value)
                .font(valueFont)
                .foregroundColor(valueColor)
                .fontWeight(valueFont == CBFont.h3() ? .bold : .regular)
        }
    }
}
