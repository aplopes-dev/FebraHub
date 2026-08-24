import SwiftUI

struct OrdersView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        Group {
            if appState.orders.isEmpty {
                EmptyState(
                    icon: "bag",
                    title: "Nenhuma compra ainda",
                    subtitle: "Seus pedidos aparecerão aqui após a confirmação",
                    ctaTitle: "Explorar produtos",
                    ctaAction: { appState.requestTab(0) }
                )
            } else {
                List {
                    ForEach(appState.orders) { order in
                        NavigationLink(value: OrderRoute.detail(order.id)) {
                            OrderCard(order: order)
                        }
                        .listRowSeparator(.hidden)
                            .listRowInsets(EdgeInsets(
                                top: CBSpacing.sm,
                                leading: CBSpacing.lg,
                                bottom: CBSpacing.sm,
                                trailing: CBSpacing.lg
                            ))
                            .listRowBackground(Color.cbSurface)
                    }
                }
                .listStyle(.plain)
                .background(Color.cbSurface)
                .scrollContentBackground(.hidden)
            }
        }
        .navigationTitle("Minhas Compras")
        .navigationBarTitleDisplayMode(.inline)
        .cbDarkNavBar()
        .background(Color.cbSurface)
        .navigationDestination(for: OrderRoute.self) { route in
            orderRouteDestination(route)
        }
        .task {
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(20))
                for order in appState.orders where order.status != .delivered {
                    appState.advanceOrderStatus(order.id)
                }
            }
        }
    }
}

struct OrderCard: View {
    let order: Order

    var statusStyle: BadgeChipStyle {
        switch order.status {
        case .confirmed: return .info
        case .preparing: return .warning
        case .shipped: return .success
        case .delivered: return .neutral
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: CBSpacing.md) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Pedido #\(order.id)")
                        .font(CBFont.body2())
                        .foregroundColor(.cbBlack)
                        .fontWeight(.semibold)
                    Text(order.total.brlFormatted)
                        .font(CBFont.caption1())
                        .foregroundColor(.cbTextSecondary)
                }
                Spacer()
                BadgeChip(text: order.status.rawValue, style: statusStyle)
            }

            // Items preview
            ForEach(order.items.prefix(2)) { item in
                HStack(spacing: CBSpacing.sm) {
                    AsyncImage(url: URL(string: item.product.imageURL)) { phase in
                        switch phase {
                        case .success(let img):
                            img.resizable().aspectRatio(1, contentMode: .fill)
                        default:
                            Rectangle().fill(Color.cbSurface)
                        }
                    }
                    .frame(width: 44, height: 44)
                    .clipped()
                    .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))

                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.product.name)
                            .font(CBFont.caption1())
                            .foregroundColor(.cbBlack)
                            .lineLimit(1)
                        Text("Qtd: \(item.quantity) · \(item.product.price.brlFormatted)")
                            .font(CBFont.caption2())
                            .foregroundColor(.cbTextSecondary)
                    }
                }
            }

            if order.items.count > 2 {
                Text("+ \(order.items.count - 2) mais itens")
                    .font(CBFont.caption2())
                    .foregroundColor(.cbTextSecondary)
            }

            Divider()

            // Delivery info
            HStack(spacing: CBSpacing.xs) {
                Image(systemName: "clock")
                    .font(.system(size: 12))
                    .foregroundColor(.cbTextSecondary)
                Text(order.deliveryDate)
                    .font(CBFont.caption1())
                    .foregroundColor(.cbTextSecondary)
            }

            // Tracking timeline
            TrackingTimeline(currentStatus: order.status)
        }
        .padding(CBSpacing.lg)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
        .shadow(color: .black.opacity(0.06), radius: 3, x: 0, y: 1)
    }
}
