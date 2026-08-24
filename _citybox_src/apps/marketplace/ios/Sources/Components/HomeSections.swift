import SwiftUI

struct HomeShortcut: Identifiable {
    let categoryId: String
    let label: String
    let icon: String
    let backgroundHex: String
    var id: String { categoryId }
}

private enum CategoryIconStyle {
    static let size: CGFloat = 64
    static let labelSpacing: CGFloat = 4
    static let columnWidth: CGFloat = 72
}

private struct CategoryIconView: View {
    let categoryId: String

    var body: some View {
        Image("cat_\(categoryId)")
            .resizable()
            .scaledToFit()
            .frame(width: CategoryIconStyle.size, height: CategoryIconStyle.size)
    }
}

struct CategoryShortcutsRow: View {
    let shortcuts: [HomeShortcut]
    let onShortcutTap: (String) -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 9) {
                ForEach(shortcuts) { shortcut in
                    Button(action: { onShortcutTap(shortcut.categoryId) }) {
                        VStack(spacing: CategoryIconStyle.labelSpacing) {
                            CategoryIconView(categoryId: shortcut.categoryId)

                            Text(shortcut.label)
                                .font(.system(size: 11))
                                .foregroundColor(Color.cbBlack.opacity(0.7))
                                .multilineTextAlignment(.center)
                                .lineLimit(2)
                                .frame(width: CategoryIconStyle.columnWidth)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 14)
            .padding(.top, CBSpacing.md)
            .padding(.bottom, CBSpacing.lg)
        }
    }
}

struct ConsumerWeekBanner: View {
    let onOffersTap: () -> Void

    var body: some View {
        ZStack(alignment: .leading) {
            Image("banner_home_hero")
                .resizable()
                .scaledToFill()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .overlay(
                    LinearGradient(
                        colors: [Color.black.opacity(0.45), Color.black.opacity(0.1)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )

            VStack(spacing: 0) {
                Spacer(minLength: 0)
                LinearGradient(
                    stops: [
                        .init(color: Color.cbSurface.opacity(0), location: 0),
                        .init(color: Color.cbSurface.opacity(0.55), location: 0.55),
                        .init(color: Color.cbSurface, location: 0.78),
                        .init(color: Color.cbSurface, location: 1),
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 120)
            }

            VStack(alignment: .leading, spacing: 0) {
                Text("SEMANA DO CONSUMIDOR")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundColor(.white.opacity(0.7))
                    .tracking(1.2)

                Text("Até 50% OFF")
                    .font(.system(size: 32, weight: .heavy))
                    .foregroundColor(.white)
                    .padding(.top, 6)
                    .padding(.bottom, 4)

                Text("Frete grátis com CityBox+")
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.75))
                    .padding(.bottom, 14)

                Button(action: onOffersTap) {
                    Text("Ver ofertas")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.cbBlack)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 9)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 7))
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 28)
            .padding(.vertical, CBSpacing.xl)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 220)
        .clipped()
        .contentShape(Rectangle())
        .onTapGesture(perform: onOffersTap)
    }
}

struct HomeProductSection<Content: View>: View {
    let title: String
    let products: [Product]
    let columns: [GridItem]
    var onViewAll: () -> Void
    @ViewBuilder let productContent: (Product) -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: CBSpacing.md) {
            SectionHeader(title: title, action: onViewAll)

            LazyVGrid(columns: columns, spacing: CBSpacing.md) {
                ForEach(products) { product in
                    productContent(product)
                }
            }
        }
        .padding(CBSpacing.lg)
        .cbCard()
        .padding(.horizontal, CBSpacing.md2)
    }
}
