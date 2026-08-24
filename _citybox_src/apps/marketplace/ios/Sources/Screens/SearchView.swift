import SwiftUI

struct SearchView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    @State private var searchText: String = ""
    @State private var showFilters = false

    private let columns = [
        GridItem(.flexible(), spacing: CBSpacing.md),
        GridItem(.flexible(), spacing: CBSpacing.md)
    ]

    private var isCategoryMode: Bool { appState.searchCategoryId != nil }
    private var categoryName: String? {
        guard let id = appState.searchCategoryId else { return nil }
        return MockData.categoryById(id)?.name
    }

    private var showSuggestions: Bool { searchText.isEmpty && !isCategoryMode }

    private var resultsLabel: String {
        let count = appState.filteredAndSortedProducts(query: searchText).count
        if let categoryName {
            return "\(count) produtos em \(categoryName)"
        }
        return "\(count) produtos encontrados"
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                VStack(spacing: 0) {
                    HStack(spacing: CBSpacing.sm) {
                        SearchField(text: $searchText)

                        Button("Cancelar") {
                            appState.closeSearch()
                            dismiss()
                        }
                        .font(CBFont.body2())
                        .foregroundColor(.white)
                    }
                    .padding(.horizontal, CBSpacing.lg)
                    .padding(.vertical, CBSpacing.md)
                    .background(Color(hex: "111111"))

                    if showSuggestions {
                        searchSuggestionsPanel
                    }

                    VStack(spacing: 0) {
                        HStack {
                            Text(resultsLabel)
                                .font(CBFont.caption1())
                                .foregroundColor(.cbTextSecondary)

                            Spacer()

                            Button { showFilters = true } label: {
                                HStack(spacing: 4) {
                                    Image(systemName: "arrow.up.arrow.down")
                                        .font(.system(size: 13))
                                    Text(appState.searchFilters.sortBy.rawValue)
                                        .font(CBFont.caption1())
                                }
                                .foregroundColor(.cbBlack)
                                .padding(.horizontal, CBSpacing.md)
                                .padding(.vertical, CBSpacing.xs)
                                .background(Color.cbSurface)
                                .clipShape(Capsule())
                            }

                            Button { showFilters = true } label: {
                                HStack(spacing: 4) {
                                    Image(systemName: "line.3.horizontal.decrease.circle")
                                        .font(.system(size: 13))
                                    Text("Filtrar")
                                        .font(CBFont.caption1())
                                }
                                .foregroundColor(.cbBlack)
                                .padding(.horizontal, CBSpacing.md)
                                .padding(.vertical, CBSpacing.xs)
                                .background(Color.cbSurface)
                                .clipShape(Capsule())
                            }
                        }
                        .padding(.horizontal, CBSpacing.lg)
                        .padding(.bottom, CBSpacing.sm)
                        .padding(.top, CBSpacing.sm)

                        Divider()
                    }
                    .background(Color.white)
                }

                if appState.filteredAndSortedProducts(query: searchText).isEmpty && !showSuggestions {
                    EmptyState(
                        icon: "magnifyingglass",
                        title: "Nenhum resultado",
                        subtitle: "Tente buscar por outro termo"
                    )
                } else if !showSuggestions {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: CBSpacing.md) {
                            ForEach(appState.filteredAndSortedProducts(query: searchText)) { product in
                                NavigationLink(value: product) {
                                    ProductCard(product: product)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(CBSpacing.lg)
                    }
                    .background(Color.cbSurface)
                } else {
                    Spacer()
                }
            }
            .navigationDestination(for: Product.self) { product in
                ProductDetailView(product: product)
            }
            .sheet(isPresented: $showFilters) {
                FiltersSheetView(initialFilters: appState.searchFilters) { filters in
                    appState.searchFilters = filters
                }
            }
        }
        .onAppear { searchText = appState.searchQuery }
        .onChange(of: searchText) { _, newValue in
            appState.searchQuery = newValue
            if newValue.count >= 2 { appState.addSearchHistory(newValue) }
        }
    }

    private var searchSuggestionsPanel: some View {
        VStack(alignment: .leading, spacing: CBSpacing.lg) {
            if !appState.searchHistory.isEmpty {
                HStack {
                    Label("Buscas recentes", systemImage: "clock")
                        .font(CBFont.h3())
                        .foregroundColor(.cbBlack)
                    Spacer()
                    Button("Limpar") { appState.clearSearchHistory() }
                        .font(CBFont.caption1())
                        .foregroundColor(.cbGreen)
                }

                FlowLayout(spacing: CBSpacing.sm) {
                    ForEach(appState.searchHistory, id: \.self) { term in
                        Button(term) { searchText = term }
                            .font(CBFont.caption1())
                            .foregroundColor(.cbBlack)
                            .padding(.horizontal, CBSpacing.md)
                            .padding(.vertical, CBSpacing.xs)
                            .background(Color.cbSurface)
                            .clipShape(Capsule())
                    }
                }
            }

            Text("Sugestões")
                .font(CBFont.h3())
                .foregroundColor(.cbBlack)

            FlowLayout(spacing: CBSpacing.sm) {
                ForEach(MockData.searchSuggestions, id: \.self) { suggestion in
                    Button(suggestion) { searchText = suggestion }
                        .font(CBFont.caption1())
                        .foregroundColor(.cbBlack)
                        .padding(.horizontal, CBSpacing.md)
                        .padding(.vertical, CBSpacing.xs)
                        .background(Color.cbSurface)
                        .clipShape(Capsule())
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(CBSpacing.lg)
        .background(Color.white)
    }
}

/// Simple flow layout for suggestion chips.
private struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = arrange(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrange(proposal: proposal, subviews: subviews)
        for (index, frame) in result.frames.enumerated() {
            subviews[index].place(
                at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
                proposal: .unspecified
            )
        }
    }

    private func arrange(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, frames: [CGRect]) {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var frames: [CGRect] = []

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            frames.append(CGRect(origin: CGPoint(x: x, y: y), size: size))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }

        return (CGSize(width: maxWidth, height: y + rowHeight), frames)
    }
}
