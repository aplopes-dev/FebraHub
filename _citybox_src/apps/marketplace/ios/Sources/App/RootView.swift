import SwiftUI

struct RootView: View {
    @Environment(AppState.self) private var appState
    @State private var showSplash = true

    var body: some View {
        Group {
            if showSplash {
                SplashView(onFinished: { showSplash = false })
            } else if appState.isLoggedIn {
                MainTabView()
            } else {
                AuthFlowView()
            }
        }
        .task {
            await appState.bootstrap()
        }
    }
}

struct MainTabView: View {
    @Environment(AppState.self) private var appState
    @State private var selectedTab = 0
    @State private var cartStackId = UUID()

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                HomeView(selectedTab: $selectedTab)
            }
            .tabItem { Label("Início", systemImage: "house") }
            .tag(0)

            NavigationStack {
                FavoritesView()
            }
            .tabItem { Label("Favoritos", systemImage: "heart") }
            .tag(1)

            NavigationStack {
                CartView()
            }
            .id(cartStackId)
            .badge(appState.cartCount > 0 ? "\(appState.cartCount)" : nil)
            .tabItem { Label("Carrinho", systemImage: "cart") }
            .tag(2)

            NavigationStack {
                OrdersView()
            }
            .tabItem { Label("Compras", systemImage: "bag") }
            .tag(3)

            NavigationStack {
                AccountView()
            }
            .tabItem { Label("Conta", systemImage: "person") }
            .tag(4)
        }
        .tint(.cbGreen)
        .onChange(of: appState.requestedTab) { _, newTab in
            if let tab = newTab {
                selectedTab = tab
                _ = appState.consumeRequestedTab()
            }
        }
        .onChange(of: appState.cartStackResetToken) { _, _ in
            cartStackId = UUID()
        }
    }
}
