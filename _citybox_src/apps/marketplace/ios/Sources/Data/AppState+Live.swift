import Foundation

/// Valor JSON heterogêneo para bodies simples.
enum AnyJSON: Encodable {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .int(let value): try container.encode(value)
        case .double(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        }
    }
}

// MARK: - Shapes internos de resposta do BFF

private struct CategoriesData: Decodable { let categories: [ApiCategory] }
private struct UserData: Decodable { let user: ApiUser }
private struct OrdersData: Decodable { let orders: [ApiOrder] }
private struct OrderData: Decodable { let order: ApiOrder }
private struct AddressesData: Decodable { let addresses: [ApiAddress] }
private struct AddressData: Decodable { let address: ApiAddress }
private struct PaymentMethodsData: Decodable { let paymentMethods: [ApiPaymentMethod] }
private struct PaymentMethodData: Decodable { let paymentMethod: ApiPaymentMethod }
private struct NotificationsData: Decodable { let notifications: [ApiNotification] }
private struct CouponsData: Decodable { let coupons: [ApiCoupon] }
private struct SearchData: Decodable { let products: [ApiProduct] }
private struct QueriesData: Decodable { let queries: [String] }
private struct ChatMessagesData: Decodable { let messages: [ApiChatMessage] }
private struct ChatSendData: Decodable { let userMessage: ApiChatMessage; let agentMessage: ApiChatMessage }
private struct TicketCreatedData: Decodable { let ticketId: String; let status: String }
private struct TicketsData: Decodable { let tickets: [ApiTicket] }
private struct OrderCreateData: Decodable { let order: ApiOrder; let payment: ApiPaymentResult? }
private struct ShippingOptionsData: Decodable { let options: [ApiShippingOption] }
private struct BuyAgainData: Decodable { let cart: ApiCart }
private struct FavoritesToggleBody: Encodable { let isFavorite: Bool }

// MARK: - Integração live (BFF real)

extension AppState {
    /// Dispara uma operação de sincronização best-effort quando em modo live.
    func liveSync(_ operation: @escaping () async throws -> Void) {
        guard isLive else { return }
        Task { try? await operation() }
    }

    /// Igual a `liveSync`, mas a resposta traz o carrinho canônico do servidor.
    func liveSyncCart(_ operation: @escaping () async throws -> ApiCart) {
        guard isLive else { return }
        Task {
            if let serverCart = try? await operation() {
                self.applyCart(serverCart)
            }
        }
    }

    func applyCart(_ serverCart: ApiCart) {
        cart = serverCart.toModels(catalog: products)
    }

    static func friendlyMessage(_ error: Error) -> String {
        if let apiError = error as? ApiClientError {
            return apiError.errorDescription ?? "Erro inesperado"
        }
        return "Não foi possível completar a operação. Tente novamente."
    }

    // MARK: Bootstrap & sessão

    /// Chamado no início do app (RootView). Restaura sessão do Keychain e carrega catálogo.
    func bootstrap() async {
        guard isLive else { return }
        await restoreSession()
        await loadCatalog()
        if isLoggedIn {
            await loadUserData()
        }
    }

    func restoreSession() async {
        guard await api.hasStoredSession else { return }
        do {
            let session: ApiSessionData = try await api.request("GET", "/auth/session")
            user = session.user.toModel()
            isLoggedIn = true
        } catch {
            // Token inválido/expirado sem refresh possível: mantém deslogado.
        }
    }

    func loadCatalog() async {
        if let home: ApiHomeData = try? await api.request("GET", "/catalog/home", auth: false) {
            if !home.products.isEmpty {
                products = home.products.map { $0.toModel() }
            }
            if !home.sections.isEmpty {
                homeSections = home.sections.map { $0.toModel() }
            }
        }
        if let data: CategoriesData = try? await api.request("GET", "/catalog/categories", auth: false),
           !data.categories.isEmpty {
            categories = data.categories.map { $0.toModel() }
        }
        if let faq: ApiFaqData = try? await api.request("GET", "/support/faq", auth: false),
           !faq.topics.isEmpty {
            faqItems = faq.topics.map { $0.toModel() }
        }
    }

    func loadUserData() async {
        if let serverCart: ApiCart = try? await api.request("GET", "/me/cart") {
            applyCart(serverCart)
        }
        if let favs: ApiFavoritesData = try? await api.request("GET", "/me/favorites") {
            favorites = Set(favs.productIds)
            if let favProducts = favs.products, !favProducts.isEmpty {
                mergeProducts(favProducts.map { $0.toModel() })
            }
        }
        if let data: OrdersData = try? await api.request("GET", "/me/orders") {
            orders = data.orders.map { $0.toModel(catalog: products) }
        }
        if let data: AddressesData = try? await api.request("GET", "/me/addresses") {
            addresses = data.addresses.map { $0.toModel() }
            selectedAddress = addresses.first { $0.isDefault } ?? addresses.first
        }
        if let data: PaymentMethodsData = try? await api.request("GET", "/me/payment-methods") {
            paymentMethods = data.paymentMethods.map { $0.toModel() }
            selectedPayment = paymentMethods.first { $0.isDefault } ?? paymentMethods.first
        }
        if let data: NotificationsData = try? await api.request("GET", "/me/notifications") {
            notifications = data.notifications.map { $0.toModel() }
        }
        if let data: CouponsData = try? await api.request("GET", "/me/coupons") {
            availableCoupons = data.coupons.map { $0.toModel() }
        }
        if let data: QueriesData = try? await api.request("GET", "/me/search-history") {
            searchHistory = data.queries
        }
        if let data: TicketsData = try? await api.request("GET", "/me/support/tickets") {
            tickets = data.tickets.map { $0.toModel() }
        }
        if let messages: ChatMessagesData = try? await api.request("GET", "/me/support/chat/messages") {
            if !messages.messages.isEmpty {
                chatMessages = messages.messages.map { $0.toModel() }
            }
        }
        await loadShippingOptions()
    }

    func loadShippingOptions() async {
        guard let addressId = selectedAddress?.id else { return }
        struct Body: Encodable {
            struct Item: Encodable { let productId: String; let quantity: Int }
            let addressId: String
            let items: [Item]
        }
        let body = Body(
            addressId: addressId,
            items: cart.map { .init(productId: $0.product.id, quantity: $0.quantity) }
        )
        if let data: ShippingOptionsData = try? await api.request("POST", "/checkout/shipping-options", body: body),
           !data.options.isEmpty {
            shippingOptions = data.options.map { $0.toModel() }
            if let current = selectedShipping?.id {
                selectedShipping = shippingOptions.first { $0.id == current } ?? shippingOptions.first
            } else {
                selectedShipping = shippingOptions.first
            }
        }
    }

    private func mergeProducts(_ newProducts: [Product]) {
        for product in newProducts where !products.contains(where: { $0.id == product.id }) {
            products.append(product)
        }
    }

    // MARK: Auth live

    func liveLogin(account: String, password: String) async -> String? {
        struct Body: Encodable { let account: String; let password: String }
        do {
            let auth: ApiAuthData = try await api.request(
                "POST", "/auth/login",
                body: Body(account: account, password: password),
                auth: false
            )
            await api.setTokens(access: auth.accessToken, refresh: auth.refreshToken)
            user = auth.user.toModel()
            isLoggedIn = true
            Task { await self.loadUserData() }
            return nil
        } catch {
            return Self.friendlyMessage(error)
        }
    }

    func liveRegister(name: String, email: String, phone: String, password: String) async -> String? {
        struct Body: Encodable {
            let name: String
            let email: String
            let phone: String
            let password: String
        }
        do {
            let auth: ApiAuthData = try await api.request(
                "POST", "/auth/register",
                body: Body(name: name, email: email, phone: phone, password: password),
                auth: false
            )
            await api.setTokens(access: auth.accessToken, refresh: auth.refreshToken)
            user = auth.user.toModel()
            isLoggedIn = true
            Task { await self.loadUserData() }
            return nil
        } catch {
            return Self.friendlyMessage(error)
        }
    }

    func liveLoginGoogle() async -> String? {
        struct Body: Encodable { let idToken: String }
        do {
            let auth: ApiAuthData = try await api.request(
                "POST", "/auth/google",
                body: Body(idToken: "mock-google"),
                auth: false
            )
            await api.setTokens(access: auth.accessToken, refresh: auth.refreshToken)
            user = auth.user.toModel()
            isLoggedIn = true
            Task { await self.loadUserData() }
            return nil
        } catch {
            return Self.friendlyMessage(error)
        }
    }

    func liveResetPassword(token: String, password: String, confirmPassword: String) async -> String? {
        struct Body: Encodable {
            let token: String
            let password: String
            let confirmPassword: String
        }
        do {
            try await api.requestVoid(
                "POST", "/auth/reset-password",
                body: Body(token: token, password: password, confirmPassword: confirmPassword),
                auth: false
            )
            return nil
        } catch {
            return Self.friendlyMessage(error)
        }
    }

    // MARK: Checkout live

    func livePlaceOrder() async -> Order? {
        lastCheckoutError = nil
        struct Body: Encodable {
            let addressId: String?
            let shippingOptionId: String?
            let couponCode: String?
            let payment: ApiPaymentInput
        }
        let payment = ApiPaymentInput(
            type: ApiMapping.paymentTypeString(checkoutPaymentType),
            paymentMethodId: checkoutPaymentType == .card ? selectedPayment?.id : nil,
            cpf: checkoutPaymentType == .boleto ? boletoCpf : nil
        )
        let body = Body(
            addressId: selectedAddress?.id,
            shippingOptionId: selectedShipping?.id,
            couponCode: appliedCoupon?.code,
            payment: payment
        )
        do {
            let data: OrderCreateData = try await api.request(
                "POST", "/checkout/orders",
                body: body,
                headers: ["Idempotency-Key": UUID().uuidString]
            )
            let order = data.order.toModel(catalog: products)
            orders.insert(order, at: 0)
            cart = []
            appliedCoupon = nil
            return order
        } catch {
            lastCheckoutError = Self.friendlyMessage(error)
            return nil
        }
    }

    // MARK: Recursos com reconciliação de resposta

    func liveCreateAddress(_ local: Address) {
        guard isLive else { return }
        Task {
            guard let data: AddressData = try? await self.api.request(
                "POST", "/me/addresses", body: local.toInput()
            ) else { return }
            let created = data.address.toModel()
            if let idx = self.addresses.firstIndex(where: { $0.id == local.id }) {
                self.addresses[idx] = created
            }
            if self.selectedAddress?.id == local.id {
                self.selectedAddress = created
            }
        }
    }

    func liveCreatePaymentMethod(_ local: PaymentMethod, number: String?, cvv: String?) {
        guard isLive else { return }
        struct Body: Encodable {
            let number: String
            let holderName: String
            let expiry: String
            let cvv: String
            let label: String
            let isDefault: Bool
        }
        let body = Body(
            number: number ?? "",
            holderName: local.holderName,
            expiry: local.expiry,
            cvv: cvv ?? "",
            label: local.label,
            isDefault: local.isDefault
        )
        Task {
            guard let data: PaymentMethodData = try? await self.api.request(
                "POST", "/me/payment-methods", body: body
            ) else { return }
            let created = data.paymentMethod.toModel()
            if let idx = self.paymentMethods.firstIndex(where: { $0.id == local.id }) {
                self.paymentMethods[idx] = created
            }
            if self.selectedPayment?.id == local.id {
                self.selectedPayment = created
            }
        }
    }

    func liveCreateTicket(_ local: SupportTicket) {
        guard isLive else { return }
        struct Body: Encodable {
            let subject: String
            let message: String
            let orderId: String?
        }
        Task {
            guard let data: TicketCreatedData = try? await self.api.request(
                "POST", "/me/support/tickets",
                body: Body(subject: local.subject, message: local.message, orderId: local.orderId)
            ) else { return }
            if let idx = self.tickets.firstIndex(where: { $0.ticketId == local.ticketId }) {
                self.tickets[idx] = SupportTicket(
                    ticketId: data.ticketId,
                    status: data.status,
                    subject: local.subject,
                    message: local.message,
                    orderId: local.orderId
                )
            }
        }
    }

    func liveSendChatMessage(_ text: String) {
        let ts = Int(Date().timeIntervalSince1970)
        chatMessages.append(ChatMessage(id: "u-\(ts)", text: text, isAgent: false, time: "Agora"))
        Task {
            guard let data: ChatSendData = try? await self.api.request(
                "POST", "/me/support/chat/messages", body: ["text": text]
            ) else { return }
            // Substitui a mensagem otimista pela oficial e acrescenta a resposta.
            self.chatMessages.removeAll { $0.id == "u-\(ts)" }
            self.chatMessages.append(data.userMessage.toModel())
            self.chatMessages.append(data.agentMessage.toModel())
        }
    }

    func liveRefreshOrder(_ orderId: String) {
        guard isLive else { return }
        Task {
            guard let data: OrderData = try? await self.api.request(
                "GET", "/me/orders/\(orderId)"
            ) else { return }
            let updated = data.order.toModel(catalog: self.products)
            if let idx = self.orders.firstIndex(where: { $0.id == orderId }) {
                self.orders[idx] = updated
            }
        }
    }

    func liveRemoteSearch(_ query: String) {
        guard isLive else { return }
        Task {
            let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
            guard let data: SearchData = try? await self.api.request(
                "GET", "/catalog/search?q=\(encoded)", auth: false
            ) else { return }
            self.mergeSearchResults(data.products.map { $0.toModel() })
        }
    }

    private func mergeSearchResults(_ results: [Product]) {
        for product in results where !products.contains(where: { $0.id == product.id }) {
            products.append(product)
        }
    }

    /// Carrega avaliações do produto sob demanda (tela de detalhe).
    func loadProductReviews(_ productId: String) {
        guard isLive else { return }
        Task {
            guard let data: ApiReviewsListData = try? await self.api.request(
                "GET", "/catalog/products/\(productId)/reviews", auth: false
            ) else { return }
            self.reviews[productId] = data.reviews.map { $0.toModel() }
        }
    }
}
