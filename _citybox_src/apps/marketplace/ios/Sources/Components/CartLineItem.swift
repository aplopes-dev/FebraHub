import SwiftUI

struct CartLineItem: View {
    let item: CartItem
    @Environment(AppState.self) private var appState
    @State private var quantity: Int

    init(item: CartItem) {
        self.item = item
        self._quantity = State(initialValue: item.quantity)
    }

    var body: some View {
        HStack(alignment: .top, spacing: CBSpacing.md) {
            AsyncImage(url: URL(string: item.product.imageURL)) { phase in
                switch phase {
                case .success(let img):
                    img.resizable().aspectRatio(1, contentMode: .fill)
                default:
                    Rectangle().fill(Color.cbSurface)
                }
            }
            .frame(width: 80, height: 80)
            .clipped()
            .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))

            VStack(alignment: .leading, spacing: CBSpacing.xs) {
                Text(item.product.name)
                    .font(CBFont.caption1())
                    .lineLimit(2)
                    .foregroundColor(.cbBlack)

                Text(item.product.price.brlFormatted)
                    .font(CBFont.body1())
                    .foregroundColor(.cbGreen)
                    .fontWeight(.semibold)

                HStack {
                    QuantityStepper(quantity: $quantity)
                        .onChange(of: quantity) { _, newVal in
                            appState.updateQuantity(item.product.id, qty: newVal)
                        }
                    Spacer()
                }
            }

            Button {
                appState.removeFromCart(item.product.id)
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.cbTextSecondary)
                    .padding(6)
            }
        }
        .padding(.vertical, CBSpacing.sm)
    }
}
