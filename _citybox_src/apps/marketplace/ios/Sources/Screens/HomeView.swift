import SwiftUI

struct HomeView: View {
    @Environment(AppState.self) private var appState
    @State private var showSearch = false
    @State private var showCoupons = false
    @State private var showNotifications = false
    var selectedTab: Binding<Int>? = nil

    private let columns = [
        GridItem(.flexible(), spacing: CBSpacing.md),
        GridItem(.flexible(), spacing: CBSpacing.md)
    ]

    var body: some View {
        VStack(spacing: 0) {
            HomeAppBar(
                cartCount: appState.cartCount,
                notificationCount: appState.unreadNotificationCount,
                onSearch: {
                    appState.openSearch()
                    showSearch = true
                },
                onCart: { selectedTab?.wrappedValue = 2 },
                onNotifications: { showNotifications = true }
            )

            ScrollView {
                LazyVStack(alignment: .leading, spacing: CBSpacing.lg, pinnedViews: [.sectionHeaders]) {
                    ConsumerWeekBanner(onOffersTap: {
                        appState.openSearch()
                        showSearch = true
                    })

                    Section {
                        HomeProductSection(
                            title: "Ofertas do dia",
                            products: appState.offerProducts,
                            columns: columns,
                            onViewAll: {
                                appState.openSearch()
                                showSearch = true
                            }
                        ) { product in
                            NavigationLink(value: product) {
                                ProductCard(product: product)
                            }
                            .buttonStyle(.plain)
                        }

                        HomeProductSection(
                            title: "Mais vendidos",
                            products: appState.bestSellerProducts,
                            columns: columns,
                            onViewAll: {
                                appState.openSearch()
                                showSearch = true
                            }
                        ) { product in
                            NavigationLink(value: product) {
                                ProductCard(product: product)
                            }
                            .buttonStyle(.plain)
                        }
                    } header: {
                        CategoryShortcutsRow(
                            shortcuts: MockData.homeShortcuts,
                            onShortcutTap: { categoryId in
                                if categoryId == "cupons" {
                                    showCoupons = true
                                } else {
                                    appState.openSearch(categoryId: categoryId)
                                    showSearch = true
                                }
                            }
                        )
                        .frame(maxWidth: .infinity)
                        .background(Color.cbSurface)
                    }
                }
                .padding(.bottom, CBSpacing.lg)
            }
            .background(Color.cbSurface)
        }
        .navigationBarHidden(true)
        .navigationDestination(for: Product.self) { product in
            ProductDetailView(product: product)
        }
        .navigationDestination(isPresented: $showCoupons) {
            CouponsView()
        }
        .navigationDestination(isPresented: $showNotifications) {
            NotificationsView()
        }
        .sheet(isPresented: $showSearch, onDismiss: { appState.closeSearch() }) {
            SearchView()
        }
    }
}
