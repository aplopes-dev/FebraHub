import SwiftUI

// MARK: - E1 Category

struct CategoryView: View {
    let categoryId: String
    @Environment(AppState.self) private var appState

    private var category: Category? { MockData.categoryById(categoryId) }
    private var filtered: [Product] { MockData.productsForCategory(categoryId, from: appState.products) }

    private let columns = [
        GridItem(.flexible(), spacing: CBSpacing.md),
        GridItem(.flexible(), spacing: CBSpacing.md)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                if let category {
                    VStack(alignment: .leading, spacing: CBSpacing.sm) {
                        Text(category.icon)
                            .font(.system(size: 40))
                        Text(category.name)
                            .font(CBFont.h2())
                            .foregroundColor(.cbBlack)
                        Text("\(filtered.count) produtos")
                            .font(CBFont.caption1())
                            .foregroundColor(.cbTextSecondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(CBSpacing.lg)
                    .background(Color(hex: category.colorHex))
                }

                if filtered.isEmpty {
                    EmptyState(
                        icon: "square.grid.2x2",
                        title: "Nenhum produto",
                        subtitle: "Esta categoria ainda não tem itens"
                    )
                    .padding(.top, 40)
                } else {
                    LazyVGrid(columns: columns, spacing: CBSpacing.md) {
                        ForEach(filtered) { product in
                            NavigationLink(value: product) {
                                ProductCard(product: product)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(CBSpacing.lg)
                }
            }
        }
        .background(Color.cbSurface)
        .navigationTitle(category?.name ?? "Categoria")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
    }
}

// MARK: - E3 Reviews

struct ReviewsView: View {
    let productId: String
    @Environment(AppState.self) private var appState
    @State private var showWriteReview = false

    private var product: Product? { appState.products.first { $0.id == productId } }
    private var productReviews: [Review] { appState.reviewsForProduct(productId) }
    private var average: Float {
        let list = productReviews
        if list.isEmpty { return product?.rating ?? 0 }
        return appState.averageRating(for: productId)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: CBSpacing.lg) {
                if let product {
                    Text(product.name)
                        .font(CBFont.h3())
                        .foregroundColor(.cbBlack)
                }

                HStack(spacing: CBSpacing.md) {
                    Text(String(format: "%.1f", average))
                        .font(CBFont.h1())
                        .foregroundColor(Color(hex: "F59E0B"))

                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 2) {
                            ForEach(0..<5, id: \.self) { index in
                                Image(systemName: "star.fill")
                                    .font(.system(size: 14))
                                    .foregroundColor(index < Int(average.rounded()) ? Color(hex: "F59E0B") : .cbSurface)
                            }
                        }
                        Text("\(productReviews.count) avaliações")
                            .font(CBFont.caption1())
                            .foregroundColor(.cbTextSecondary)
                    }
                }

                RatingDistributionView(reviews: productReviews)

                Divider()

                if productReviews.isEmpty {
                    Text("Seja o primeiro a avaliar este produto.")
                        .font(CBFont.body2())
                        .foregroundColor(.cbTextSecondary)
                } else {
                    ForEach(productReviews) { review in
                        ReviewRowView(review: review)
                        Divider()
                    }
                }

                PrimaryButton(title: "Escrever avaliação") {
                    showWriteReview = true
                }
            }
            .padding(CBSpacing.lg)
        }
        .background(Color.cbSurface)
        .navigationTitle("Avaliações")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
        .navigationDestination(isPresented: $showWriteReview) {
            WriteReviewView(productId: productId)
        }
    }
}

private struct RatingDistributionView: View {
    let reviews: [Review]

    var body: some View {
        VStack(spacing: 6) {
            ForEach((1...5).reversed(), id: \.self) { stars in
                let count = reviews.filter { $0.rating == stars }.count
                let fraction = reviews.isEmpty ? 0 : CGFloat(count) / CGFloat(reviews.count)
                HStack(spacing: CBSpacing.sm) {
                    Text("\(stars)★")
                        .font(CBFont.caption2())
                        .foregroundColor(.cbTextSecondary)
                        .frame(width: 28, alignment: .leading)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.cbSurface)
                            Capsule()
                                .fill(Color.cbGreen)
                                .frame(width: geo.size.width * fraction)
                        }
                    }
                    .frame(height: 8)
                    Text("\(count)")
                        .font(CBFont.caption2())
                        .foregroundColor(.cbTextSecondary)
                        .frame(width: 20, alignment: .trailing)
                }
            }
        }
    }
}

private struct ReviewRowView: View {
    let review: Review

    var body: some View {
        VStack(alignment: .leading, spacing: CBSpacing.sm) {
            HStack {
                Circle()
                    .fill(Color.cbGreen)
                    .frame(width: 36, height: 36)
                    .overlay(
                        Text(String(review.author.prefix(1)).uppercased())
                            .font(CBFont.body2())
                            .foregroundColor(.white)
                    )
                VStack(alignment: .leading, spacing: 2) {
                    Text(review.author)
                        .font(CBFont.body2())
                        .foregroundColor(.cbBlack)
                    Text(review.date)
                        .font(CBFont.caption2())
                        .foregroundColor(.cbTextSecondary)
                }
                Spacer()
                HStack(spacing: 2) {
                    ForEach(0..<review.rating, id: \.self) { _ in
                        Image(systemName: "star.fill")
                            .font(.system(size: 10))
                            .foregroundColor(Color(hex: "F59E0B"))
                    }
                }
            }
            Text(review.text)
                .font(CBFont.body2())
                .foregroundColor(.cbBlack)
        }
    }
}

// MARK: - E2 Filters Sheet

struct FiltersSheetView: View {
    @Environment(\.dismiss) private var dismiss
    let initialFilters: SearchFilters
    var onApply: (SearchFilters) -> Void

    @State private var draft: SearchFilters

    init(initialFilters: SearchFilters, onApply: @escaping (SearchFilters) -> Void) {
        self.initialFilters = initialFilters
        self.onApply = onApply
        _draft = State(initialValue: initialFilters)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: CBSpacing.lg) {
                    filterSection("Ordenar por") {
                        ForEach(SortOption.allCases, id: \.self) { option in
                            radioRow(label: option.rawValue, selected: draft.sortBy == option) {
                                draft.sortBy = option
                            }
                        }
                    }

                    Divider()

                    filterSection("Faixa de preço") {
                        priceRow(label: "Todos", min: nil, max: nil)
                        priceRow(label: "Até R$ 250", min: nil, max: 250)
                        priceRow(label: "R$ 250 a R$ 1.000", min: 250, max: 1000)
                        priceRow(label: "Mais de R$ 1.000", min: 1000, max: nil)
                    }

                    Divider()

                    filterSection("Marca") {
                        radioRow(label: "Todas", selected: draft.brand == nil) { draft.brand = nil }
                        ForEach(MockData.brands, id: \.self) { brand in
                            radioRow(label: brand, selected: draft.brand == brand) { draft.brand = brand }
                        }
                    }

                    Divider()

                    filterSection("Avaliação mínima") {
                        ratingRow(label: "Qualquer", value: nil)
                        ratingRow(label: "4★ ou mais", value: 4)
                        ratingRow(label: "3★ ou mais", value: 3)
                    }

                    Divider()

                    filterSection("Envio") {
                        Toggle("Frete grátis", isOn: $draft.freeShippingOnly)
                        Toggle("EXPRESS", isOn: $draft.expressOnly)
                    }

                    HStack(spacing: CBSpacing.sm) {
                        SecondaryButton(title: "Limpar") {
                            draft = SearchFilters()
                            onApply(SearchFilters())
                            dismiss()
                        }
                        PrimaryButton(title: "Aplicar") {
                            onApply(draft)
                            dismiss()
                        }
                    }
                }
                .padding(CBSpacing.lg)
            }
            .navigationTitle("Filtros e ordenação")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fechar") { dismiss() }
                }
            }
        }
    }

    @ViewBuilder
    private func filterSection(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: CBSpacing.sm) {
            Text(title)
                .font(CBFont.h3())
                .foregroundColor(.cbBlack)
            content()
        }
    }

    private func radioRow(label: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Image(systemName: selected ? "largecircle.fill.circle" : "circle")
                    .foregroundColor(.cbGreen)
                Text(label)
                    .font(CBFont.body2())
                    .foregroundColor(.cbBlack)
                Spacer()
            }
        }
        .buttonStyle(.plain)
    }

    private func priceRow(label: String, min: Double?, max: Double?) -> some View {
        radioRow(
            label: label,
            selected: draft.minPrice == min && draft.maxPrice == max
        ) {
            draft.minPrice = min
            draft.maxPrice = max
        }
    }

    private func ratingRow(label: String, value: Float?) -> some View {
        radioRow(label: label, selected: draft.minRating == value) {
            draft.minRating = value
        }
    }
}
