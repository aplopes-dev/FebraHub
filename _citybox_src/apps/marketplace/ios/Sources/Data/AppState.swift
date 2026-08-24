import SwiftUI

@MainActor
@Observable
class AppState {
    private static let onboardingKey = "citybox.hasSeenOnboarding"

    /// Modo de dados resolvido no build (mock vs BFF real).
    let isLive = AppConfig.isLive
    let api = ApiClient.shared

    var products: [Product] = MockData.products
    var homeSections: [HomeSection] = MockData.homeSections
    var categories: [Category] = MockData.categories
    var cart: [CartItem] = []
    var favorites: Set<String> = []
    var orders: [Order] = MockData.orders
    var searchQuery: String = ""
    var searchHistory: [String] = []
    var searchFilters = SearchFilters()
    var searchCategoryId: String?
    var isLoggedIn: Bool = false
    var hasSeenOnboarding: Bool = false

    init() {
        hasSeenOnboarding = UserDefaults.standard.bool(forKey: Self.onboardingKey)
        if isLive {
            // Em live, começa sem dados de usuário; catálogo mock fica como fallback
            // visual até o bootstrap() carregar do BFF.
            orders = []
        }
    }

    var user: User = MockData.user
    var accountPassword: String = MockData.demoPassword
    var addresses: [Address] = MockData.addresses
    var paymentMethods: [PaymentMethod] = MockData.paymentMethods
    var reviews: [String: [Review]] = MockData.reviews
    var notifications: [AppNotification] = MockData.notifications
    var chatMessages: [ChatMessage] = MockData.chatMessages
    var faqItems: [FaqItem] = MockData.faqItems
    var availableCoupons: [Coupon] = MockData.coupons
    var shippingOptions: [ShippingOption] = MockData.shippingOptions
    var tickets: [SupportTicket] = [
        SupportTicket(ticketId: "TKT-0001", status: "OPEN", subject: "Produto não chegou", message: "Meu pedido estava previsto para ontem mas não chegou.", orderId: nil),
        SupportTicket(ticketId: "TKT-0002", status: "CLOSED", subject: "Cobrança duplicada", message: "Fui cobrado duas vezes no cartão.", orderId: nil)
    ]
    private var ticketIdCounter = 0
    var appliedCoupon: Coupon?
    var selectedAddress: Address? = MockData.addresses.first { $0.isDefault }
    var selectedPayment: PaymentMethod? = MockData.paymentMethods.first { $0.isDefault }
    var selectedShipping: ShippingOption? = MockData.shippingOptions.first
    var checkoutPaymentType: CheckoutPaymentType = .pix
    var boletoCpf: String = ""
    var requestedTab: Int?
    var cartStackResetToken = 0
    var lastCheckoutError: String?

    var cartTotal: Double {
        cart.reduce(0) { $0 + $1.product.price * Double($1.quantity) }
    }

    var cartCount: Int {
        cart.reduce(0) { $0 + $1.quantity }
    }

    var unreadNotificationCount: Int {
        notifications.filter { !$0.isRead }.count
    }

    var offerProducts: [Product] {
        productsForHomeSection("daily-deals")
    }

    var bestSellerProducts: [Product] {
        productsForHomeSection("best-sellers")
    }

    func productsForHomeSection(_ sectionId: String) -> [Product] {
        if let section = homeSections.first(where: { $0.id == sectionId }) {
            let resolved = section.productIds.compactMap { id in products.first { $0.id == id } }
            if !resolved.isEmpty { return resolved }
        }
        return MockData.productsForHomeSection(sectionId, from: products)
    }

    var filteredProducts: [Product] {
        filteredAndSortedProducts(query: searchQuery)
    }

    func filteredAndSortedProducts(query: String? = nil) -> [Product] {
        let q = query ?? searchQuery
        let filters = searchFilters
        var pool = products
        if let categoryId = searchCategoryId {
            pool = MockData.productsForCategory(categoryId, from: pool)
        }
        var result = pool.filter { product in
            let matchesQuery = q.isEmpty ||
                product.name.localizedCaseInsensitiveContains(q) ||
                product.category.localizedCaseInsensitiveContains(q)
            let matchesMinPrice = filters.minPrice.map { product.price >= $0 } ?? true
            let matchesMaxPrice = filters.maxPrice.map { product.price <= $0 } ?? true
            let matchesRating = filters.minRating.map { product.rating >= $0 } ?? true
            let matchesShipping = !filters.freeShippingOnly || product.isFreeShipping
            let matchesExpress = !filters.expressOnly || product.isExpress
            let matchesBrand = filters.brand.map { MockData.productBrand(product) == $0 } ?? true
            return matchesQuery && matchesMinPrice && matchesMaxPrice && matchesRating &&
                matchesShipping && matchesExpress && matchesBrand
        }
        switch filters.sortBy {
        case .priceAsc: result.sort { $0.price < $1.price }
        case .priceDesc: result.sort { $0.price > $1.price }
        case .bestSellers: result.sort { $0.reviewCount > $1.reviewCount }
        case .relevance: break
        }
        return result
    }

    func reviewsForProduct(_ productId: String) -> [Review] {
        reviews[productId] ?? []
    }

    func averageRating(for productId: String) -> Float {
        let list = reviewsForProduct(productId)
        guard !list.isEmpty else { return 0 }
        return Float(list.map(\.rating).reduce(0, +)) / Float(list.count)
    }

    func toggleFavorite(_ productId: String) {
        let isFavorite: Bool
        if favorites.contains(productId) {
            favorites.remove(productId)
            isFavorite = false
        } else {
            favorites.insert(productId)
            isFavorite = true
        }
        liveSync { [api] in
            try await api.requestVoid(
                "PUT", "/me/favorites/\(productId)",
                body: ["isFavorite": isFavorite]
            )
        }
    }

    func addToCart(_ product: Product) {
        if let idx = cart.firstIndex(where: { $0.product.id == product.id }) {
            cart[idx].quantity += 1
        } else {
            cart.append(CartItem(product: product, quantity: 1))
        }
        liveSyncCart { [api] in
            try await api.request(
                "POST", "/me/cart/items",
                body: ["productId": AnyJSON.string(product.id), "quantity": AnyJSON.int(1)]
            )
        }
    }

    func removeFromCart(_ productId: String) {
        cart.removeAll { $0.product.id == productId }
        liveSyncCart { [api] in
            try await api.request("DELETE", "/me/cart/items/\(productId)")
        }
    }

    func updateQuantity(_ productId: String, qty: Int) {
        if qty <= 0 {
            removeFromCart(productId)
        } else if let idx = cart.firstIndex(where: { $0.product.id == productId }) {
            cart[idx].quantity = qty
            liveSyncCart { [api] in
                try await api.request(
                    "PATCH", "/me/cart/items/\(productId)",
                    body: ["quantity": qty]
                )
            }
        }
    }

    @discardableResult
    func placeOrder() async -> Order? {
        if isLive {
            return await livePlaceOrder()
        }
        let subtotal = cartTotal
        let shipping = selectedShipping?.price ?? 0
        let couponDiscount: Double = {
            guard let coupon = appliedCoupon else { return 0 }
            switch coupon.type {
            case .percent: return subtotal * coupon.value / 100
            case .fixed: return coupon.value
            }
        }()
        let totalBeforePix = max(subtotal + shipping - couponDiscount, 0)
        let total = checkoutPaymentType == .pix ? totalBeforePix * 0.95 : totalBeforePix
        let order = Order(
            id: "CB-\(Int.random(in: 10000...99999))",
            items: cart,
            total: total,
            status: .confirmed,
            deliveryDate: selectedShipping?.deliveryEstimate ?? "Amanhã até 22h",
            address: selectedAddress,
            paymentMethod: resolveOrderPaymentMethod(),
            subtotal: subtotal,
            shipping: shipping,
            discount: couponDiscount,
            trackingCode: "BR\(Int.random(in: 100_000_000...999_999_999))CB",
            statusHistory: [OrderStatusEntry(status: .confirmed, date: "Agora", location: "São Paulo, SP")]
        )
        orders.insert(order, at: 0)
        cart = []
        appliedCoupon = nil
        return order
    }

    func updateProfile(name: String, email: String, phone: String) {
        user.name = name
        user.email = email
        user.phone = phone
        user.avatarInitial = String(name.prefix(1)).uppercased()
        liveSync { [api] in
            try await api.requestVoid(
                "PATCH", "/me",
                body: ["name": name, "email": email, "phone": phone]
            )
        }
    }

    func completeOnboarding() {
        hasSeenOnboarding = true
        UserDefaults.standard.set(true, forKey: Self.onboardingKey)
    }

    func resetOnboarding() {
        hasSeenOnboarding = false
        UserDefaults.standard.removeObject(forKey: Self.onboardingKey)
    }

    func login(account: String, password: String) async -> String? {
        let trimmedAccount = account.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedPassword = password.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmedAccount.isEmpty || trimmedPassword.isEmpty {
            return "Preencha e-mail e senha"
        }
        if trimmedPassword.count < 4 {
            return "Senha deve ter ao menos 4 caracteres"
        }
        if isLive {
            return await liveLogin(account: trimmedAccount, password: trimmedPassword)
        }
        let demo = MockData.user
        let accountDigits = trimmedAccount.filter(\.isNumber)
        let phoneDigits = demo.phone.filter(\.isNumber)
        let matches = trimmedAccount.caseInsensitiveCompare(demo.email) == .orderedSame ||
            (!accountDigits.isEmpty && phoneDigits.hasSuffix(String(accountDigits.suffix(8))))
        if !matches {
            return "Conta não encontrada"
        }
        if trimmedPassword != accountPassword {
            return "Senha incorreta"
        }
        isLoggedIn = true
        return nil
    }

    func resetPassword(token: String, password: String, confirmPassword: String) async -> String? {
        let trimmedToken = token.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedPassword = password.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedConfirm = confirmPassword.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmedToken.isEmpty || trimmedPassword.isEmpty || trimmedConfirm.isEmpty {
            return "Campo obrigatório"
        }
        if trimmedPassword != trimmedConfirm {
            return "As senhas não coincidem"
        }
        if trimmedPassword.count < 4 {
            return "Senha muito curta"
        }
        if isLive {
            return await liveResetPassword(token: trimmedToken, password: trimmedPassword, confirmPassword: trimmedConfirm)
        }
        if trimmedToken != MockData.mockResetToken {
            return "Token inválido ou expirado"
        }
        accountPassword = trimmedPassword
        return nil
    }

    func loginWithGoogle() async -> String? {
        if isLive {
            return await liveLoginGoogle()
        }
        user.email = "camila@gmail.com"
        isLoggedIn = true
        return nil
    }

    func register(name: String, email: String, phone: String, password: String, confirmPassword: String) async -> String? {
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedPhone = phone.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmedName.isEmpty { return "Informe seu nome" }
        if trimmedEmail.isEmpty || !trimmedEmail.contains("@") { return "E-mail inválido" }
        if trimmedPhone.isEmpty { return "Informe seu telefone" }
        if password.count < 4 { return "Senha deve ter ao menos 4 caracteres" }
        if password != confirmPassword { return "As senhas não coincidem" }
        if isLive {
            return await liveRegister(name: trimmedName, email: trimmedEmail, phone: trimmedPhone, password: password)
        }
        user = User(
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            avatarInitial: String(trimmedName.prefix(1)).uppercased(),
            isPlus: false
        )
        isLoggedIn = true
        return nil
    }

    func logout() {
        isLoggedIn = false
        if isLive {
            cart = []
            orders = []
            favorites = []
            appliedCoupon = nil
            Task { [api] in
                try? await api.requestVoid("POST", "/auth/logout", body: [String: String]())
                await api.clearTokens()
            }
        }
    }

    func addAddress(_ address: Address) {
        if address.isDefault {
            addresses = addresses.map { var a = $0; a.isDefault = false; return a }
        }
        addresses.append(address)
        if address.isDefault { selectedAddress = address }
        liveCreateAddress(address)
    }

    func editAddress(_ address: Address) {
        guard let idx = addresses.firstIndex(where: { $0.id == address.id }) else { return }
        if address.isDefault {
            addresses = addresses.map { var a = $0; a.isDefault = false; return a }
        }
        addresses[idx] = address
        if address.isDefault { selectedAddress = address }
        liveSync { [api] in
            try await api.requestVoid("PUT", "/me/addresses/\(address.id)", body: address.toInput())
        }
    }

    func removeAddress(_ addressId: String) {
        addresses.removeAll { $0.id == addressId }
        if selectedAddress?.id == addressId {
            selectedAddress = addresses.first { $0.isDefault } ?? addresses.first
        }
        liveSync { [api] in
            try await api.requestVoid("DELETE", "/me/addresses/\(addressId)")
        }
    }

    func selectAddress(_ addressId: String) {
        addresses = addresses.map { var a = $0; a.isDefault = (a.id == addressId); return a }
        selectedAddress = addresses.first { $0.id == addressId }
        liveSync { [api] in
            try await api.requestVoid("PATCH", "/me/addresses/\(addressId)/default")
            try await api.requestVoid("PATCH", "/checkout/session", body: ["selectedAddressId": addressId])
        }
    }

    func addPaymentMethod(_ method: PaymentMethod, number: String? = nil, cvv: String? = nil) {
        if method.isDefault {
            paymentMethods = paymentMethods.map { var m = $0; m.isDefault = false; return m }
        }
        paymentMethods.append(method)
        if method.isDefault { selectedPayment = method }
        liveCreatePaymentMethod(method, number: number, cvv: cvv)
    }

    func removePaymentMethod(_ methodId: String) {
        paymentMethods.removeAll { $0.id == methodId }
        if selectedPayment?.id == methodId {
            selectedPayment = paymentMethods.first { $0.isDefault } ?? paymentMethods.first
        }
        liveSync { [api] in
            try await api.requestVoid("DELETE", "/me/payment-methods/\(methodId)")
        }
    }

    func selectPaymentMethod(_ methodId: String) {
        paymentMethods = paymentMethods.map { var m = $0; m.isDefault = (m.id == methodId); return m }
        selectedPayment = paymentMethods.first { $0.id == methodId }
        liveSync { [api] in
            try await api.requestVoid("PATCH", "/me/payment-methods/\(methodId)/default")
            try await api.requestVoid("PATCH", "/checkout/session", body: ["paymentMethodId": methodId])
        }
    }

    func setCheckoutPaymentType(_ type: CheckoutPaymentType) {
        checkoutPaymentType = type
        if type == .card, selectedPayment == nil {
            if let defaultMethod = paymentMethods.first(where: { $0.isDefault }) ?? paymentMethods.first {
                selectPaymentMethod(defaultMethod.id)
            }
        }
        let typeString = ApiMapping.paymentTypeString(type)
        liveSync { [api] in
            try await api.requestVoid("PATCH", "/checkout/session", body: ["paymentType": typeString])
        }
    }

    func setBoletoCpf(_ cpf: String) {
        boletoCpf = String(cpf.filter(\.isNumber).prefix(11))
    }

    var canConfirmCheckout: Bool {
        switch checkoutPaymentType {
        case .pix: return true
        case .card: return selectedPayment != nil
        case .boleto: return boletoCpf.count == 11
        }
    }

    func resolveOrderPaymentMethod() -> PaymentMethod? {
        switch checkoutPaymentType {
        case .pix:
            return PaymentMethod(
                id: "pix", brand: .unknown, lastFour: "", expiry: "",
                holderName: "Pagamento instantâneo", label: "PIX (5% off)", isDefault: false
            )
        case .card:
            return selectedPayment
        case .boleto:
            return PaymentMethod(
                id: "boleto", brand: .unknown, lastFour: "", expiry: "",
                holderName: "CPF \(formatCpf(boletoCpf))", label: "Boleto · vence em 3 dias úteis", isDefault: false
            )
        }
    }

    private func formatCpf(_ digits: String) -> String {
        guard digits.count == 11 else { return digits }
        let i = digits.startIndex
        let a = digits.index(i, offsetBy: 3)
        let b = digits.index(a, offsetBy: 3)
        let c = digits.index(b, offsetBy: 3)
        return "\(digits[i..<a]).\(digits[a..<b]).\(digits[b..<c])-\(digits[c...])"
    }

    func applyCoupon(_ code: String) -> Bool {
        guard let coupon = availableCoupons.first(where: { $0.code.caseInsensitiveCompare(code) == .orderedSame }) else {
            return false
        }
        appliedCoupon = coupon
        liveSync { [api] in
            try await api.requestVoid("POST", "/me/cart/coupon", body: ["code": coupon.code])
        }
        return true
    }

    func removeCoupon() {
        appliedCoupon = nil
        liveSync { [api] in
            try await api.requestVoid("DELETE", "/checkout/coupons")
        }
    }

    func selectShipping(_ shippingId: String) {
        selectedShipping = shippingOptions.first { $0.id == shippingId }
        liveSync { [api] in
            try await api.requestVoid("PATCH", "/checkout/session", body: ["shippingOptionId": shippingId])
        }
    }

    var shippingCost: Double {
        selectedShipping?.price ?? 0
    }

    func couponDiscountAmount(for subtotal: Double) -> Double {
        guard let coupon = appliedCoupon else { return 0 }
        switch coupon.type {
        case .percent: return subtotal * coupon.value / 100
        case .fixed: return coupon.value
        }
    }

    func orderGrandTotal(for subtotal: Double) -> Double {
        max(subtotal + shippingCost - couponDiscountAmount(for: subtotal), 0)
    }

    func markNotificationRead(_ id: String) {
        if let idx = notifications.firstIndex(where: { $0.id == id }) {
            notifications[idx].isRead = true
        }
        liveSync { [api] in
            try await api.requestVoid("PATCH", "/me/notifications/\(id)/read")
        }
    }

    func markAllNotificationsRead() {
        notifications = notifications.map { var n = $0; n.isRead = true; return n }
        liveSync { [api] in
            try await api.requestVoid("POST", "/me/notifications/read-all", body: [String: String]())
        }
    }

    func sendChatMessage(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        if isLive {
            liveSendChatMessage(trimmed)
            return
        }
        let ts = Int(Date().timeIntervalSince1970)
        chatMessages.append(ChatMessage(id: "u-\(ts)", text: trimmed, isAgent: false, time: "Agora"))
        chatMessages.append(ChatMessage(id: "a-\(ts)", text: "Recebi sua mensagem! Nossa equipe responderá em breve. (mock)", isAgent: true, time: "Agora"))
    }

    func createTicket(subject: String, message: String, orderId: String? = nil) -> CreatedTicket? {
        let trimmedSubject = subject.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedMessage = message.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedSubject.isEmpty, !trimmedMessage.isEmpty else { return nil }

        ticketIdCounter += 1
        let ticketId = "TKT-\(ticketIdCounter)"
        let ticket = SupportTicket(
            ticketId: ticketId,
            status: "OPEN",
            subject: trimmedSubject,
            message: trimmedMessage,
            orderId: orderId.flatMap { $0.isEmpty ? nil : $0 }
        )
        tickets.append(ticket)
        liveCreateTicket(ticket)
        return CreatedTicket(ticketId: ticketId, status: "OPEN")
    }

    func addReview(_ review: Review) {
        var list = reviews[review.productId] ?? []
        list.insert(review, at: 0)
        reviews[review.productId] = list
        liveSync { [api] in
            try await api.requestVoid(
                "POST", "/catalog/products/\(review.productId)/reviews",
                body: ["rating": AnyJSON.int(review.rating), "text": AnyJSON.string(review.text)]
            )
        }
    }

    func addSearchHistory(_ query: String) {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        searchHistory = [trimmed] + searchHistory.filter { $0.caseInsensitiveCompare(trimmed) != .orderedSame }
        searchHistory = Array(searchHistory.prefix(10))
        searchQuery = trimmed
        liveSync { [api] in
            try await api.requestVoid("POST", "/me/search-history", body: ["query": trimmed])
        }
        liveRemoteSearch(trimmed)
    }

    func clearSearchHistory() {
        searchHistory = []
        liveSync { [api] in
            try await api.requestVoid("DELETE", "/me/search-history")
        }
    }

    func resetSearchFilters() {
        searchFilters = SearchFilters()
    }

    func openSearch(categoryId: String? = nil) {
        searchCategoryId = categoryId
        if categoryId != nil {
            searchQuery = ""
            searchFilters = SearchFilters()
        }
    }

    func closeSearch() {
        searchCategoryId = nil
    }

    func advanceOrderStatus(_ orderId: String) {
        if isLive {
            liveRefreshOrder(orderId)
            return
        }
        let sequence = OrderStatus.allCases
        guard let idx = orders.firstIndex(where: { $0.id == orderId }),
              let currentIdx = sequence.firstIndex(of: orders[idx].status),
              currentIdx < sequence.count - 1 else { return }
        let next = sequence[currentIdx + 1]
        orders[idx].status = next
        orders[idx].statusHistory.append(OrderStatusEntry(status: next, date: "Agora", location: ""))
    }

    func buyAgain(_ orderId: String) {
        guard let order = orders.first(where: { $0.id == orderId }) else { return }
        for item in order.items {
            if let idx = cart.firstIndex(where: { $0.product.id == item.product.id }) {
                cart[idx].quantity += item.quantity
            } else {
                cart.append(item)
            }
        }
        if isLive {
            Task { [api] in
                struct BuyAgainResponse: Decodable { let cart: ApiCart }
                if let data: BuyAgainResponse = try? await api.request(
                    "POST", "/me/orders/\(orderId)/buy-again", body: [String: String]()
                ) {
                    self.applyCart(data.cart)
                }
            }
        }
    }

    func requestTab(_ tab: Int, resetCartStack: Bool = false) {
        requestedTab = tab
        if resetCartStack {
            cartStackResetToken += 1
        }
    }

    func consumeRequestedTab() -> Int? {
        let tab = requestedTab
        requestedTab = nil
        return tab
    }
}
