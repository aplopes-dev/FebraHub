import SwiftUI

struct ConfirmationView: View {
    let order: Order
    @Environment(AppState.self) private var appState
    @State private var animated = false

    var body: some View {
        ScrollView {
            VStack(spacing: CBSpacing.xxl) {
                Spacer().frame(height: CBSpacing.xxl)

                // Animated checkmark
                ZStack {
                    Circle()
                        .fill(Color.cbTintSuccess)
                        .frame(width: 120, height: 120)

                    Circle()
                        .fill(Color.cbGreen)
                        .frame(width: 90, height: 90)

                    Image(systemName: "checkmark")
                        .font(.system(size: 40, weight: .bold))
                        .foregroundColor(.white)
                }
                .scaleEffect(animated ? 1 : 0)
                .animation(.spring(response: 0.5, dampingFraction: 0.6), value: animated)

                VStack(spacing: CBSpacing.sm) {
                    Text("Pronto, é seu! 🎉")
                        .font(CBFont.h1())
                        .foregroundColor(.cbBlack)
                        .fontWeight(.heavy)

                    Text("Pedido \(order.id)")
                        .font(CBFont.body2())
                        .foregroundColor(.cbTextSecondary)
                }

                // Order summary card
                VStack(spacing: CBSpacing.md) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Total pago")
                                .font(CBFont.caption1())
                                .foregroundColor(.cbTextSecondary)
                            Text(order.total.brlFormatted)
                                .font(CBFont.h2())
                                .foregroundColor(.cbBlack)
                                .fontWeight(.bold)
                        }
                        Spacer()
                        BadgeChip(text: order.status.rawValue, style: .success)
                    }

                    Divider()

                    HStack(spacing: CBSpacing.sm) {
                        Image(systemName: "clock.fill")
                            .foregroundColor(.cbGreen)
                        Text("Previsão: \(order.deliveryDate)")
                            .font(CBFont.body2())
                            .foregroundColor(.cbBlack)
                        Spacer()
                    }

                    if !order.items.isEmpty {
                        Divider()
                        VStack(alignment: .leading, spacing: CBSpacing.xs) {
                            Text("\(order.items.count) \(order.items.count == 1 ? "item" : "itens")")
                                .font(CBFont.caption1())
                                .foregroundColor(.cbTextSecondary)

                            ForEach(order.items) { item in
                                Text("• \(item.product.name)")
                                    .font(CBFont.caption1())
                                    .foregroundColor(.cbBlack)
                                    .lineLimit(1)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .padding(CBSpacing.lg)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
                .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 2)

                // Timeline preview
                TrackingTimeline(currentStatus: order.status)
                    .padding(.horizontal, CBSpacing.lg)

                // Action buttons
                VStack(spacing: CBSpacing.md) {
                    NavigationLink(value: OrderRoute.tracking(order.id)) {
                        Text("Acompanhar pedido")
                            .font(CBFont.body1())
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.cbBlack)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)

                    TextButton(title: "Voltar ao início") {
                        appState.requestTab(0, resetCartStack: true)
                    }
                }

                Spacer().frame(height: CBSpacing.xxl)
            }
            .padding(.horizontal, CBSpacing.lg)
        }
        .background(Color.cbSurface)
        .navigationTitle("Pedido Confirmado")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
        .navigationBarBackButtonHidden(true)
        .navigationDestination(for: OrderRoute.self) { route in
            orderRouteDestination(route)
        }
        .onAppear { animated = true }
    }
}
