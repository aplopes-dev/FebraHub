import SwiftUI

struct FavoritesView: View {
    @Environment(AppState.self) private var appState

    private let columns = [
        GridItem(.flexible(), spacing: CBSpacing.md),
        GridItem(.flexible(), spacing: CBSpacing.md)
    ]

    var favoriteProducts: [Product] {
        appState.products.filter { appState.favorites.contains($0.id) }
    }

    var body: some View {
        Group {
            if favoriteProducts.isEmpty {
                EmptyState(
                    icon: "heart",
                    title: "Nenhum favorito ainda",
                    subtitle: "Toque no coração em qualquer produto para salvar aqui",
                    ctaTitle: "Explorar",
                    ctaAction: { appState.requestTab(0) }
                )
            } else {
                ScrollView {
                    LazyVGrid(columns: columns, spacing: CBSpacing.md) {
                        ForEach(favoriteProducts) { product in
                            NavigationLink(value: product) {
                                ProductCard(product: product)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(CBSpacing.lg)
                }
                .background(Color.cbSurface)
            }
        }
        .navigationTitle("Favoritos")
        .navigationBarTitleDisplayMode(.inline)
        .cbDarkNavBar()
        .navigationDestination(for: Product.self) { product in
            ProductDetailView(product: product)
        }
    }
}
