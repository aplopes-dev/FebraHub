import SwiftUI

struct ProductCard: View {
    let product: Product
    @Environment(AppState.self) private var appState

    var body: some View {
        VStack(alignment: .leading, spacing: CBSpacing.xs) {
            ZStack(alignment: .topTrailing) {
                AsyncImage(url: URL(string: product.imageURL)) { phase in
                    switch phase {
                    case .success(let img):
                        img.resizable().aspectRatio(1, contentMode: .fill)
                    case .failure:
                        Rectangle()
                            .fill(Color.cbSurface)
                            .overlay(
                                Image(systemName: "photo")
                                    .foregroundColor(.cbTextDisabled)
                            )
                    default:
                        Rectangle()
                            .fill(Color.cbSurface)
                            .overlay(ProgressView())
                    }
                }
                .frame(height: 160)
                .clipped()

                Button {
                    appState.toggleFavorite(product.id)
                } label: {
                    Image(systemName: appState.favorites.contains(product.id) ? "heart.fill" : "heart")
                        .foregroundColor(appState.favorites.contains(product.id) ? .red : .cbTextSecondary)
                        .padding(8)
                        .background(Color.white.opacity(0.9))
                        .clipShape(Circle())
                }
                .padding(8)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(product.name)
                    .font(CBFont.caption1())
                    .lineLimit(2)
                    .foregroundColor(.cbBlack)

                PriceBlock(
                    price: product.price,
                    originalPrice: product.originalPrice,
                    discountPercent: product.discountPercent,
                    compact: true
                )

                RatingStars(rating: product.rating, count: product.reviewCount, compact: true)

                HStack(spacing: 4) {
                    if product.isFreeShipping {
                        Text("Frete grátis")
                            .font(CBFont.badge())
                            .foregroundColor(.cbGreen)
                    }
                    if product.isExpress {
                        Text("EXPRESS")
                            .font(CBFont.badge())
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.cbTintInfo)
                            .foregroundColor(.cbGoogleBlue)
                            .clipShape(Capsule())
                    }
                }
            }
            .padding(.horizontal, 8)
            .padding(.bottom, 8)
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
        .shadow(color: .black.opacity(0.12), radius: 3, x: 0, y: 1)
    }
}
