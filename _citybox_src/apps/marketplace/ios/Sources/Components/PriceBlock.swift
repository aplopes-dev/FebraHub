import SwiftUI

struct PriceBlock: View {
    let price: Double
    let originalPrice: Double
    let discountPercent: Int
    var compact: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(alignment: .center, spacing: CBSpacing.xs) {
                Text(price.brlFormatted)
                    .font(compact ? CBFont.body1() : CBFont.h2())
                    .foregroundColor(.cbBlack)
                    .fontWeight(.bold)

                if discountPercent > 0 {
                    Text("-\(discountPercent)%")
                        .font(CBFont.badge())
                        .foregroundColor(.cbError)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.cbTintError)
                        .clipShape(Capsule())
                }
            }

            if originalPrice > price {
                Text(originalPrice.brlFormatted)
                    .font(CBFont.caption1())
                    .foregroundColor(.cbTextSecondary)
                    .strikethrough(true, color: .cbTextSecondary)
            }
        }
    }
}
