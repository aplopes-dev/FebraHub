import SwiftUI

struct ProductDetailView: View {
    let product: Product
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    @State private var quantity: Int = 1
    @State private var addedToCart = false
    @State private var navigateToCheckout = false
    @State private var showReviews = false

    var isFavorite: Bool {
        appState.favorites.contains(product.id)
    }

    private var installmentCount: Int {
        ProductPricing.installmentCount(for: product.price)
    }

    private var deliveryLabel: String {
        ProductPricing.deliveryChipLabel(shipping: appState.selectedShipping, isExpress: product.isExpress)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Product Image
                AsyncImage(url: URL(string: product.imageURL)) { phase in
                    switch phase {
                    case .success(let img):
                        img.resizable().aspectRatio(1, contentMode: .fit)
                    case .failure:
                        Rectangle()
                            .fill(Color.cbSurface)
                            .aspectRatio(1, contentMode: .fit)
                            .overlay(Image(systemName: "photo").foregroundColor(.cbTextDisabled))
                    default:
                        Rectangle()
                            .fill(Color.cbSurface)
                            .aspectRatio(1, contentMode: .fit)
                            .overlay(ProgressView())
                    }
                }
                .frame(maxWidth: .infinity)

                VStack(alignment: .leading, spacing: CBSpacing.lg) {
                    // Category
                    Text(product.category.uppercased())
                        .font(CBFont.badge())
                        .foregroundColor(.cbTextSecondary)
                        .tracking(1)

                    // Name
                    Text(product.name)
                        .font(CBFont.h1())
                        .foregroundColor(.cbBlack)

                    // Rating
                    HStack {
                        RatingStars(rating: product.rating, count: product.reviewCount)
                        Spacer()
                        Button { showReviews = true } label: {
                            Text("Ver avaliações")
                                .font(CBFont.caption1())
                                .foregroundColor(.cbGreen)
                        }
                        .buttonStyle(.plain)
                    }

                    Divider()

                    // Price
                    PriceBlock(
                        price: product.price,
                        originalPrice: product.originalPrice,
                        discountPercent: product.discountPercent
                    )

                    Text(installmentCount == 1
                         ? "À vista \(product.price.brlFormatted)"
                         : "ou \(installmentCount)x de \((product.price / Double(installmentCount)).brlFormatted) sem juros")
                        .font(CBFont.caption1())
                        .foregroundColor(.cbTextSecondary)

                    // Chips row
                    HStack(spacing: CBSpacing.sm) {
                        if product.isFreeShipping {
                            BadgeChip(text: "Frete grátis", style: .success, icon: "shippingbox")
                        }
                        if product.isExpress {
                            BadgeChip(text: "EXPRESS", style: .info, icon: "bolt")
                        }
                        BadgeChip(text: deliveryLabel, style: .success)
                    }
                    .flexibleLayout()

                    Divider()

                    // Specs
                    if !product.specs.isEmpty {
                        VStack(alignment: .leading, spacing: CBSpacing.sm) {
                            Text("Especificações")
                                .font(CBFont.h3())
                                .foregroundColor(.cbBlack)

                            ForEach(Array(product.specs.sorted(by: { $0.key < $1.key })), id: \.key) { key, value in
                                HStack {
                                    Text(key)
                                        .font(CBFont.body2())
                                        .foregroundColor(.cbTextSecondary)
                                    Spacer()
                                    Text(value)
                                        .font(CBFont.body2())
                                        .foregroundColor(.cbBlack)
                                }
                                .padding(.vertical, 4)
                                Divider()
                            }
                        }
                    }

                    // Trust row
                    HStack(spacing: CBSpacing.md) {
                        TrustItem(icon: "lock.shield", text: "Compra garantida")
                        TrustItem(icon: "arrow.uturn.left", text: "Devolução grátis")
                        TrustItem(icon: "creditcard", text: "Pagamento seguro")
                    }
                    .padding(.vertical, CBSpacing.sm)

                    Divider()

                    // Quantity + Favorite row
                    HStack {
                        Text("Quantidade:")
                            .font(CBFont.body2())
                            .foregroundColor(.cbTextSecondary)

                        QuantityStepper(quantity: $quantity)

                        Spacer()

                        Button {
                            appState.toggleFavorite(product.id)
                        } label: {
                            Image(systemName: isFavorite ? "heart.fill" : "heart")
                                .font(.system(size: 22))
                                .foregroundColor(isFavorite ? .red : .cbTextSecondary)
                                .padding(10)
                                .background(Color.cbSurface)
                                .clipShape(Circle())
                        }
                    }

                    // Add to cart button
                    VStack(spacing: CBSpacing.sm) {
                        PrimaryButton(title: addedToCart ? "Adicionado ✓" : "Adicionar ao Carrinho") {
                            for _ in 0..<quantity {
                                appState.addToCart(product)
                            }
                            addedToCart = true
                            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                                addedToCart = false
                            }
                        }

                        SecondaryButton(title: "Comprar agora") {
                            for _ in 0..<quantity {
                                appState.addToCart(product)
                            }
                            navigateToCheckout = true
                        }

                        Button {
                            appState.requestTab(2)
                        } label: {
                            Text("Ir para o carrinho")
                                .font(CBFont.body2())
                                .foregroundColor(.cbBlack)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(Color.cbSurface)
                                .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(CBSpacing.lg)
            }
        }
        .navigationTitle("")
        .onAppear { appState.loadProductReviews(product.id) }
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
        .navigationDestination(isPresented: $navigateToCheckout) {
            CheckoutView()
        }
        .navigationDestination(isPresented: $showReviews) {
            ReviewsView(productId: product.id)
        }
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    appState.requestTab(2)
                } label: {
                    ZStack(alignment: .topTrailing) {
                        Color.clear
                            .frame(width: 44, height: 36)

                        Image(systemName: "cart")
                            .font(.system(size: 20))
                            .foregroundColor(.cbBlack)
                            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
                            .padding(.leading, 2)
                            .padding(.bottom, 2)

                        if appState.cartCount > 0 {
                            Text(appState.cartCount > 99 ? "99+" : "\(appState.cartCount)")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 4)
                                .frame(minWidth: 16, minHeight: 16)
                                .background(Color.cbGreen)
                                .clipShape(Capsule())
                        }
                    }
                }
            }
        }
    }
}

struct TrustItem: View {
    let icon: String
    let text: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(.cbGreen)
            Text(text)
                .font(CBFont.caption2())
                .foregroundColor(.cbTextSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Flexible Layout for chips

extension View {
    func flexibleLayout() -> some View {
        self
    }
}
