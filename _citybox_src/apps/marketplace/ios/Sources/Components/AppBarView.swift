import SwiftUI

// MARK: - System navigation-bar theming helpers

extension View {
    /// Dark brand navigation bar (black background, white title) — used on the
    /// main tab screens (Carrinho, Compras, Conta, Favoritos) per the design system.
    func cbDarkNavBar() -> some View {
        self
            .toolbarBackground(Color(hex: "111111"), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
    }

    /// Light navigation bar — pins deeper white screens (Produto, Checkout,
    /// Confirmação) so they don't inherit a dark bar when pushed from a dark stack.
    func cbLightNavBar() -> some View {
        self
            .toolbarBackground(Color.white, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.light, for: .navigationBar)
    }
}

// MARK: - Variant 1: Home App Bar (brand header)

struct HomeAppBar: View {
    var cartCount: Int = 0
    var notificationCount: Int = 0
    var onSearch: () -> Void = {}
    var onCart: () -> Void = {}
    var onNotifications: () -> Void = {}

    private var locationText: Text {
        Text("Enviar para ")
            + Text("Camila").fontWeight(.bold)
            + Text(" — São Paulo 01310-100")
    }

    var body: some View {
        VStack(spacing: 9) {
            HStack(spacing: 8) {
                CityBoxLogoMark(size: 38)

                // In-header search box
                Button(action: onSearch) {
                    HStack(spacing: 8) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundColor(.black.opacity(0.45))
                        Text("Buscar no CityBox")
                            .font(.system(size: 13))
                            .foregroundColor(.black.opacity(0.45))
                        Spacer(minLength: 0)
                    }
                    .padding(.horizontal, 12)
                    .frame(maxWidth: .infinity)
                    .frame(height: 40)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                // Notifications
                Button(action: onNotifications) {
                    ZStack(alignment: .topTrailing) {
                        Image(systemName: "bell")
                            .font(.system(size: 20))
                            .foregroundColor(.white)
                            .frame(width: 26, height: 26)
                        if notificationCount > 0 {
                            Text("\(notificationCount)")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(hex: "111111"))
                                .padding(.horizontal, 4)
                                .frame(minWidth: 16, minHeight: 16)
                                .background(Color.white)
                                .clipShape(Capsule())
                                .offset(x: 8, y: -7)
                        }
                    }
                }

                // Cart
                Button(action: onCart) {
                    ZStack(alignment: .topTrailing) {
                        Image(systemName: "cart")
                            .font(.system(size: 20))
                            .foregroundColor(.white)
                            .frame(width: 26, height: 26)
                        if cartCount > 0 {
                            Text("\(cartCount)")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(hex: "111111"))
                                .padding(.horizontal, 4)
                                .frame(minWidth: 16, minHeight: 16)
                                .background(Color.white)
                                .clipShape(Capsule())
                                .offset(x: 8, y: -7)
                        }
                    }
                }
            }

            // Location row
            HStack(spacing: 6) {
                Image(systemName: "mappin.and.ellipse")
                    .font(.system(size: 12))
                    .foregroundColor(.white)
                locationText
                    .font(.system(size: 12))
                    .foregroundColor(.white)
                Image(systemName: "chevron.down")
                    .font(.system(size: 10))
                    .foregroundColor(.white)
                Spacer(minLength: 0)
            }
        }
        .padding(.horizontal, 14)
        .padding(.top, 8)
        .padding(.bottom, 10)
        .background(Color(hex: "111111"))
    }
}
