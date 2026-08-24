import SwiftUI

// MARK: - Navigation routes (pós-compra)

enum OrderRoute: Hashable {
    case detail(String)
    case tracking(String)
    case writeReview(String)
    case returnOrder(String)
}

// MARK: - D1 Order Detail

struct OrderDetailView: View {
    let orderId: String
    @Environment(AppState.self) private var appState

    private var order: Order? {
        appState.orders.first { $0.id == orderId }
    }

    var body: some View {
        Group {
            if let order {
                ScrollView {
                    VStack(spacing: CBSpacing.lg) {
                        OrderDetailHeader(order: order)

                        VStack(alignment: .leading, spacing: CBSpacing.sm) {
                            Text("Acompanhamento")
                                .font(CBFont.h3())
                                .foregroundColor(.cbBlack)
                            TrackingTimeline(currentStatus: order.status)
                        }
                        .padding(CBSpacing.lg)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))

                        DetailCard(title: "Itens (\(order.items.count))") {
                            ForEach(order.items) { item in
                                HStack(spacing: CBSpacing.md) {
                                    AsyncImage(url: URL(string: item.product.imageURL)) { phase in
                                        switch phase {
                                        case .success(let img):
                                            img.resizable().aspectRatio(1, contentMode: .fill)
                                        default:
                                            Rectangle().fill(Color.cbSurface)
                                        }
                                    }
                                    .frame(width: 56, height: 56)
                                    .clipped()
                                    .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(item.product.name)
                                            .font(CBFont.body2())
                                            .foregroundColor(.cbBlack)
                                            .lineLimit(2)
                                        Text("Qtd: \(item.quantity) · \(item.product.price.brlFormatted)")
                                            .font(CBFont.caption1())
                                            .foregroundColor(.cbTextSecondary)
                                    }
                                }
                                if item.id != order.items.last?.id { Divider() }
                            }
                        }

                        if let address = order.address {
                            DetailCard(title: "Endereço de entrega") {
                                Text(address.label).font(CBFont.body2()).fontWeight(.semibold)
                                Text(address.formattedLine1).font(CBFont.body2())
                                Text("\(address.neighborhood) · \(address.formattedLine2)")
                                    .font(CBFont.caption1())
                                    .foregroundColor(.cbTextSecondary)
                            }
                        }

                        if let payment = order.paymentMethod {
                            DetailCard(title: "Forma de pagamento") {
                                Text(payment.displayName).font(CBFont.body2())
                                Text("Validade \(payment.expiry)")
                                    .font(CBFont.caption1())
                                    .foregroundColor(.cbTextSecondary)
                            }
                        }

                        DetailCard(title: "Resumo") {
                            SummaryRow(label: "Subtotal", value: order.subtotal.brlFormatted)
                            SummaryRow(
                                label: "Frete",
                                value: order.shipping <= 0 ? "Grátis" : order.shipping.brlFormatted,
                                valueColor: order.shipping <= 0 ? .cbGreen : .cbBlack
                            )
                            if order.discount > 0 {
                                SummaryRow(label: "Desconto", value: "-\(order.discount.brlFormatted)", valueColor: .cbGreen)
                            }
                            Divider()
                            SummaryRow(
                                label: "Total",
                                value: order.total.brlFormatted,
                                valueColor: .cbBlack,
                                labelFont: CBFont.body1(),
                                valueFont: CBFont.h3()
                            )
                        }

                        NavigationLink(value: OrderRoute.tracking(order.id)) {
                            Text("Rastrear pedido")
                                .font(CBFont.body1())
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                                .background(Color.cbBlack)
                                .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)

                        SecondaryButton(title: "Comprar novamente") {
                            appState.buyAgain(orderId)
                            appState.requestTab(2)
                        }

                        HStack(spacing: CBSpacing.sm) {
                            ActionChipButton(title: "Nota fiscal") {
                                // mock
                            }
                            if let productId = order.items.first?.product.id {
                                NavigationLink(value: OrderRoute.writeReview(productId)) {
                                    Text("Avaliar")
                                        .font(CBFont.body2())
                                        .foregroundColor(.cbBlack)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(Color.cbSurfaceVariant)
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                                .buttonStyle(.plain)
                            }
                        }

                        NavigationLink(value: OrderRoute.returnOrder(order.id)) {
                            Text(order.status == .delivered ? "Devolver / reembolso" : "Cancelar pedido")
                                .font(CBFont.body2())
                                .foregroundColor(.cbTextSecondary)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(CBSpacing.lg)
                }
            } else {
                Text("Pedido não encontrado")
                    .font(CBFont.body1())
                    .foregroundColor(.cbTextSecondary)
            }
        }
        .background(Color.cbSurface)
        .navigationTitle("Detalhe do pedido")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
    }
}

private struct OrderDetailHeader: View {
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
        VStack(alignment: .leading, spacing: CBSpacing.sm) {
            HStack {
                Text("Pedido #\(order.id)")
                    .font(CBFont.h3())
                    .fontWeight(.bold)
                Spacer()
                BadgeChip(text: order.status.rawValue, style: statusStyle)
            }
            HStack(spacing: CBSpacing.xs) {
                Image(systemName: "clock")
                    .font(.system(size: 12))
                    .foregroundColor(.cbTextSecondary)
                Text(order.deliveryDate)
                    .font(CBFont.caption1())
                    .foregroundColor(.cbTextSecondary)
            }
            if !order.trackingCode.isEmpty {
                Text("Rastreio: \(order.trackingCode)")
                    .font(CBFont.caption1())
                    .foregroundColor(.cbGreen)
            }
        }
        .padding(CBSpacing.lg)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
    }
}

private struct DetailCard<Content: View>: View {
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

private struct ActionChipButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(CBFont.body2())
                .foregroundColor(.cbBlack)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color.cbSurfaceVariant)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - D2 Tracking

struct TrackingView: View {
    let orderId: String
    @Environment(AppState.self) private var appState

    private var order: Order? {
        appState.orders.first { $0.id == orderId }
    }

    var body: some View {
        Group {
            if let order {
                ScrollView {
                    VStack(spacing: CBSpacing.lg) {
                        VStack(alignment: .leading, spacing: CBSpacing.sm) {
                            Text(order.trackingCode.isEmpty ? "Aguardando código" : order.trackingCode)
                                .font(CBFont.h3())
                                .fontWeight(.bold)
                            Text("Transportadora: CityBox Logística")
                                .font(CBFont.body2())
                                .foregroundColor(.cbTextSecondary)
                            Text("Pedido #\(order.id)")
                                .font(CBFont.caption1())
                                .foregroundColor(.cbTextSecondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(CBSpacing.lg)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))

                        ZStack {
                            RoundedRectangle(cornerRadius: CBRadius.card)
                                .fill(Color.cbSurfaceVariant)
                                .frame(height: 160)
                            VStack(spacing: CBSpacing.sm) {
                                Image(systemName: "map")
                                    .font(.system(size: 40))
                                    .foregroundColor(.cbTextDisabled)
                                Text("Mapa de entrega (mock)")
                                    .font(CBFont.caption1())
                                    .foregroundColor(.cbTextSecondary)
                            }
                        }

                        VStack(alignment: .leading, spacing: CBSpacing.md) {
                            Text("Histórico")
                                .font(CBFont.h3())
                                .foregroundColor(.cbBlack)

                            let history = order.statusHistory.isEmpty
                                ? [OrderStatusEntry(status: order.status, date: order.deliveryDate, location: "")]
                                : order.statusHistory

                            ForEach(Array(history.enumerated()), id: \.offset) { idx, entry in
                                DetailedTrackingStep(
                                    entry: entry,
                                    isLast: idx == history.count - 1,
                                    isActive: idx == history.count - 1
                                )
                            }
                        }
                        .padding(CBSpacing.lg)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
                    }
                    .padding(CBSpacing.lg)
                }
            } else {
                Text("Pedido não encontrado")
                    .font(CBFont.body1())
                    .foregroundColor(.cbTextSecondary)
            }
        }
        .background(Color.cbSurface)
        .navigationTitle("Rastreamento")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
    }
}

private struct DetailedTrackingStep: View {
    let entry: OrderStatusEntry
    let isLast: Bool
    let isActive: Bool

    var body: some View {
        HStack(alignment: .top, spacing: CBSpacing.md) {
            VStack(spacing: 0) {
                ZStack {
                    Circle()
                        .fill(isActive ? Color.cbGreen : Color.cbSurfaceVariant)
                        .frame(width: 24, height: 24)
                    if !isActive {
                        Image(systemName: "checkmark")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                    } else {
                        Circle()
                            .fill(Color.white)
                            .frame(width: 8, height: 8)
                    }
                }
                if !isLast {
                    Rectangle()
                        .fill(isActive ? Color.cbSurfaceVariant : Color.cbGreen)
                        .frame(width: 2, height: 48)
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(entry.status.rawValue)
                    .font(CBFont.body2())
                    .fontWeight(.semibold)
                    .foregroundColor(isActive ? .cbGreen : .cbBlack)
                Text(entry.date)
                    .font(CBFont.caption1())
                    .foregroundColor(.cbTextSecondary)
                if !entry.location.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: "location.fill")
                            .font(.system(size: 10))
                            .foregroundColor(.cbTextSecondary)
                        Text(entry.location)
                            .font(CBFont.caption1())
                            .foregroundColor(.cbTextSecondary)
                    }
                }
            }
            .padding(.bottom, isLast ? 0 : CBSpacing.md)
        }
    }
}

// MARK: - D3 Write Review

struct WriteReviewView: View {
    let productId: String
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    @State private var rating = 0
    @State private var reviewText = ""
    @State private var photosAttached = false
    @State private var submitted = false

    private var product: Product? {
        appState.products.first { $0.id == productId }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: CBSpacing.lg) {
                if let product {
                    Text(product.name)
                        .font(CBFont.h3())
                        .foregroundColor(.cbBlack)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                VStack(spacing: CBSpacing.sm) {
                    Text("Sua nota")
                        .font(CBFont.body2())
                        .foregroundColor(.cbTextSecondary)
                    HStack(spacing: CBSpacing.sm) {
                        ForEach(1...5, id: \.self) { star in
                            Button {
                                rating = star
                            } label: {
                                Image(systemName: star <= rating ? "star.fill" : "star")
                                    .font(.system(size: 28))
                                    .foregroundColor(star <= rating ? .yellow : .cbTextSecondary)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Conte sua experiência")
                        .font(CBFont.caption1())
                        .foregroundColor(.cbTextSecondary)
                    TextEditor(text: $reviewText)
                        .frame(height: 120)
                        .padding(8)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
                }

                Button {
                    photosAttached.toggle()
                } label: {
                    HStack(spacing: CBSpacing.md) {
                        Image(systemName: "photo.on.rectangle.angled")
                            .foregroundColor(photosAttached ? .cbGreen : .cbTextSecondary)
                        Text(photosAttached ? "2 fotos anexadas (mock)" : "Anexar fotos")
                            .font(CBFont.body2())
                            .foregroundColor(photosAttached ? .cbGreen : .cbBlack)
                        Spacer()
                    }
                    .padding(CBSpacing.lg)
                    .background(photosAttached ? Color.cbTintSuccess : Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
                }
                .buttonStyle(.plain)

                if submitted {
                    Text("Avaliação enviada! Obrigado ✓")
                        .font(CBFont.body1())
                        .foregroundColor(.cbGreen)
                } else {
                    PrimaryButton(
                        title: "Enviar avaliação",
                        action: submitReview,
                        disabled: rating == 0
                    )
                }
            }
            .padding(CBSpacing.lg)
        }
        .background(Color.cbSurface)
        .navigationTitle("Avaliar produto")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
    }

    private func submitReview() {
        guard rating > 0 else { return }
        let review = Review(
            id: UUID().uuidString,
            productId: productId,
            author: appState.user.name,
            rating: rating,
            date: "Agora",
            text: reviewText.isEmpty ? "Ótimo produto!" : reviewText,
            photoURLs: photosAttached ? ["mock://photo1", "mock://photo2"] : []
        )
        appState.addReview(review)
        submitted = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            dismiss()
        }
    }
}

// MARK: - D4 Return

struct ReturnView: View {
    let orderId: String
    @Environment(AppState.self) private var appState

    private var order: Order? {
        appState.orders.first { $0.id == orderId }
    }

    @State private var selectedItemId: String?
    @State private var selectedReason = "Produto com defeito"
    @State private var description = ""
    @State private var submitted = false

    private let reasons = [
        "Produto com defeito",
        "Veio errado / incompleto",
        "Arrependimento (7 dias)",
        "Não atendeu expectativas",
        "Outro motivo"
    ]

    var body: some View {
        Group {
            if let order {
                ScrollView {
                    VStack(alignment: .leading, spacing: CBSpacing.lg) {
                        if submitted {
                            VStack(spacing: CBSpacing.sm) {
                                Text("Solicitação enviada ✓")
                                    .font(CBFont.h3())
                                    .foregroundColor(.cbGreen)
                                Text("Você receberá instruções por e-mail em até 24h.")
                                    .font(CBFont.body2())
                                    .foregroundColor(.cbTextSecondary)
                                    .multilineTextAlignment(.center)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(CBSpacing.xxl)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
                        } else {
                            Text("Selecione o item")
                                .font(CBFont.h3())
                                .foregroundColor(.cbBlack)

                            ForEach(order.items) { item in
                                Button {
                                    selectedItemId = item.product.id
                                } label: {
                                    HStack {
                                        Image(systemName: selectedItemId == item.product.id ? "largecircle.fill.circle" : "circle")
                                            .foregroundColor(.cbGreen)
                                        AsyncImage(url: URL(string: item.product.imageURL)) { phase in
                                            if case .success(let img) = phase {
                                                img.resizable().aspectRatio(1, contentMode: .fill)
                                            } else {
                                                Rectangle().fill(Color.cbSurface)
                                            }
                                        }
                                        .frame(width: 44, height: 44)
                                        .clipped()
                                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))

                                        VStack(alignment: .leading) {
                                            Text(item.product.name)
                                                .font(CBFont.body2())
                                                .foregroundColor(.cbBlack)
                                                .lineLimit(2)
                                            Text("Qtd: \(item.quantity)")
                                                .font(CBFont.caption1())
                                                .foregroundColor(.cbTextSecondary)
                                        }
                                        Spacer()
                                    }
                                }
                                .buttonStyle(.plain)
                            }

                            Text("Motivo")
                                .font(CBFont.h3())
                                .foregroundColor(.cbBlack)

                            Picker("Motivo", selection: $selectedReason) {
                                ForEach(reasons, id: \.self) { reason in
                                    Text(reason).tag(reason)
                                }
                            }
                            .pickerStyle(.menu)
                            .padding(CBSpacing.md)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))

                            VStack(alignment: .leading, spacing: 4) {
                                Text("Descrição (opcional)")
                                    .font(CBFont.caption1())
                                    .foregroundColor(.cbTextSecondary)
                                TextEditor(text: $description)
                                    .frame(height: 100)
                                    .padding(8)
                                    .background(Color.white)
                                    .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
                            }

                            PrimaryButton(
                                title: "Solicitar devolução",
                                action: { submitted = true },
                                disabled: selectedItemId == nil
                            )
                        }
                    }
                    .padding(CBSpacing.lg)
                }
            } else {
                Text("Pedido não encontrado")
                    .font(CBFont.body1())
                    .foregroundColor(.cbTextSecondary)
            }
        }
        .background(Color.cbSurface)
        .navigationTitle(order?.status == .delivered ? "Devolução" : "Cancelamento")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
        .onAppear {
            selectedItemId = order?.items.first?.product.id
        }
    }
}

@ViewBuilder
func orderRouteDestination(_ route: OrderRoute) -> some View {
    switch route {
    case .detail(let id):
        OrderDetailView(orderId: id)
    case .tracking(let id):
        TrackingView(orderId: id)
    case .writeReview(let productId):
        WriteReviewView(productId: productId)
    case .returnOrder(let id):
        ReturnView(orderId: id)
    }
}
