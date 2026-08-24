import Foundation

// MARK: - DTOs do contrato do BFF (camelCase, espelham web/src/api/types.ts)

struct ApiProduct: Codable {
    let id: String
    let name: String
    let imageUrl: String
    let price: Double
    let originalPrice: Double?
    let discountPercent: Int?
    let rating: Double
    let reviewCount: Int
    let isFreeShipping: Bool
    let isExpress: Bool
    let category: String
    let categoryId: String?
    let brand: String?
    let specs: [String: String]?
}

struct ApiCategory: Codable {
    let id: String
    let name: String
    let icon: String
    let colorHex: String
}

struct ApiHomeSection: Codable {
    let id: String
    let title: String
    let productIds: [String]
}

struct ApiHomeData: Codable {
    let sections: [ApiHomeSection]
    let products: [ApiProduct]
}

struct ApiUser: Codable {
    let id: String?
    let name: String
    let email: String
    let phone: String
    let avatarUrl: String?
    let avatarInitial: String?
    let isPlus: Bool?
    let hasSeenOnboarding: Bool?
}

struct ApiAuthData: Codable {
    let accessToken: String
    let refreshToken: String?
    let expiresIn: Int?
    let user: ApiUser
}

struct ApiSessionData: Codable {
    let user: ApiUser
    let isAuthenticated: Bool?
}

struct ApiCartItem: Codable {
    let productId: String
    let quantity: Int
    let product: ApiProduct?
}

struct ApiCart: Codable {
    let items: [ApiCartItem]
    let itemCount: Int?
    let subtotal: Double?
}

struct ApiFavoritesData: Codable {
    let productIds: [String]
    let products: [ApiProduct]?
}

struct ApiAddress: Codable {
    let id: String
    let label: String
    let zipCode: String
    let street: String
    let number: String
    let complement: String?
    let neighborhood: String
    let city: String
    let state: String
    let isDefault: Bool
}

struct ApiAddressInput: Encodable {
    let label: String
    let zipCode: String
    let street: String
    let number: String
    let complement: String?
    let neighborhood: String
    let city: String
    let state: String
    let isDefault: Bool
}

struct ApiFaqItem: Codable {
    let question: String
    let answer: String
}

struct ApiOrderItem: Codable {
    let productId: String
    let product: ApiProduct?
    let quantity: Int
    let unitPrice: Double?
    let subtotal: Double?
}

struct ApiOrderStatusEntry: Codable {
    let status: String
    let date: String
    let location: String?
}

struct ApiOrderPaymentMethod: Codable {
    let type: String
    let displayName: String
    let label: String?
}

struct ApiOrder: Codable {
    let id: String
    let items: [ApiOrderItem]
    let status: String
    let deliveryDate: String?
    let address: ApiAddress?
    let paymentMethod: ApiOrderPaymentMethod?
    let subtotal: Double
    let shipping: Double
    let discount: Double
    let pixDiscount: Double?
    let total: Double
    let trackingCode: String?
    let carrier: String?
    let statusHistory: [ApiOrderStatusEntry]?
    let createdAt: String?
}

struct ApiTrackingTimelineEntry: Codable {
    let status: String
    let date: String
    let location: String?
    let description: String?
}

struct ApiTracking: Codable {
    let orderId: String
    let trackingCode: String
    let carrier: String
    let currentStatus: String
    let estimatedDelivery: String
    let timeline: [ApiTrackingTimelineEntry]
}

struct ApiNotification: Codable {
    let id: String
    let type: String
    let title: String
    let body: String
    let date: String
    let isRead: Bool
    let deepLink: String?
}

struct ApiChatMessage: Codable {
    let id: String
    let text: String
    let isAgent: Bool
    let time: String
}

struct ApiCoupon: Codable {
    let code: String
    let description: String
    let type: String
    let value: Double
    let expiry: String
    let isApplicable: Bool?
}

struct ApiAppliedCoupon: Codable {
    let code: String
    let type: String
    let value: Double
    let discountAmount: Double?
}

struct ApiPaymentMethod: Codable {
    let id: String
    let brand: String
    let lastFour: String
    let expiry: String
    let holderName: String
    let label: String
    let isDefault: Bool
}

struct ApiShippingOption: Codable {
    let id: String
    let name: String
    let deliveryEstimate: String
    let price: Double
    let isExpress: Bool?
}

struct ApiReview: Codable {
    let id: String
    let productId: String
    let author: String
    let rating: Int
    let date: String
    let text: String
    let photoUrls: [String]?
}

struct ApiReviewsListData: Codable {
    let averageRating: Double
    let totalCount: Int
    let reviews: [ApiReview]
}

struct ApiSubscription: Codable {
    let isActive: Bool
    let planName: String
    let priceMonthly: Double
    let renewalDate: String
    let benefits: [String]
}

struct ApiSettings: Codable {
    let pushOrdersEnabled: Bool
    let pushPromoEnabled: Bool
    let emailPromoEnabled: Bool
    let darkTheme: Bool
    let language: String
}

struct ApiCheckoutSession: Codable {
    let selectedAddressId: String?
    let shippingOptionId: String?
    let appliedCoupon: ApiAppliedCoupon?
    let paymentType: String?
    let paymentMethodId: String?
    let boletoCpf: String?
    let canConfirm: Bool?
}

struct ApiCheckoutPreview: Codable {
    let subtotal: Double
    let shipping: Double
    let couponDiscount: Double
    let pixDiscount: Double
    let total: Double
    let canConfirm: Bool?
    let validationErrors: [String]?
}

struct ApiCheckoutSessionData: Codable {
    let cart: ApiCart
    let session: ApiCheckoutSession
    let preview: ApiCheckoutPreview
}

struct ApiPaymentInput: Encodable {
    let type: String
    let paymentMethodId: String?
    let cpf: String?
}

struct ApiPaymentResult: Codable {
    let type: String
    let status: String
    let paymentMethodId: String?
    let displayName: String?
    let authorizationCode: String?
    let pixQrCodeBase64: String?
    let pixCopyPaste: String?
    let barcode: String?
    let digitableLine: String?
    let dueDate: String?
    let pdfUrl: String?
    let expiresAt: String?
}

struct ApiTicket: Codable {
    let ticketId: String
    let status: String
    let subject: String?
    let message: String?
    let orderId: String?
    let createdAt: String?
}

struct ApiFaqData: Codable {
    let topics: [ApiFaqItem]
}

// MARK: - Helpers de conversão

enum ApiMapping {
    private static let isoFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let isoFormatterNoFraction = ISO8601DateFormatter()

    private static let displayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "pt_BR")
        formatter.dateFormat = "dd/MM/yyyy"
        return formatter
    }()

    /// Converte string ISO8601 em data de exibição "dd/MM/yyyy"; se não for ISO, retorna como veio.
    static func displayDate(_ raw: String?) -> String {
        guard let raw, !raw.isEmpty else { return "" }
        if let date = isoFormatter.date(from: raw) ?? isoFormatterNoFraction.date(from: raw) {
            return displayFormatter.string(from: date)
        }
        return raw
    }

    static func orderStatus(_ raw: String) -> OrderStatus {
        switch raw.uppercased() {
        case "CONFIRMED": return .confirmed
        case "PREPARING": return .preparing
        case "SHIPPED": return .shipped
        case "DELIVERED", "RETURNED": return .delivered
        default: return .confirmed
        }
    }

    static func cardBrand(_ raw: String) -> CardBrand {
        CardBrand(rawValue: raw.lowercased()) ?? .unknown
    }

    static func couponType(_ raw: String) -> CouponType {
        raw.uppercased() == "PERCENT" ? .percent : .fixed
    }

    static func notificationType(_ raw: String) -> NotificationType {
        switch raw.uppercased() {
        case "ORDER": return .order
        case "PROMO": return .promo
        default: return .system
        }
    }

    static func paymentTypeString(_ type: CheckoutPaymentType) -> String {
        switch type {
        case .pix: return "PIX"
        case .card: return "CARD"
        case .boleto: return "BOLETO"
        }
    }
}

// MARK: - Mapeadores DTO → models de tela

extension ApiProduct {
    func toModel() -> Product {
        Product(
            id: id,
            name: name,
            imageURL: imageUrl,
            price: price,
            originalPrice: originalPrice ?? price,
            discountPercent: discountPercent ?? 0,
            rating: Float(rating),
            reviewCount: reviewCount,
            isFreeShipping: isFreeShipping,
            isExpress: isExpress,
            category: category,
            specs: specs ?? [:]
        )
    }
}

extension ApiCategory {
    func toModel() -> Category {
        Category(id: id, name: name, icon: icon, colorHex: colorHex)
    }
}

extension ApiHomeSection {
    func toModel() -> HomeSection {
        HomeSection(id: id, title: title, productIds: productIds)
    }
}

extension ApiUser {
    func toModel() -> User {
        User(
            name: name,
            email: email,
            phone: phone,
            avatarInitial: avatarInitial ?? String(name.prefix(1)).uppercased(),
            isPlus: isPlus ?? false
        )
    }
}

extension ApiAddress {
    func toModel() -> Address {
        Address(
            id: id,
            label: label,
            zipCode: zipCode,
            street: street,
            number: number,
            complement: complement ?? "",
            neighborhood: neighborhood,
            city: city,
            state: state,
            isDefault: isDefault
        )
    }
}

extension Address {
    func toInput() -> ApiAddressInput {
        ApiAddressInput(
            label: label,
            zipCode: zipCode,
            street: street,
            number: number,
            complement: complement.isEmpty ? nil : complement,
            neighborhood: neighborhood,
            city: city,
            state: state,
            isDefault: isDefault
        )
    }
}

extension ApiPaymentMethod {
    func toModel() -> PaymentMethod {
        PaymentMethod(
            id: id,
            brand: ApiMapping.cardBrand(brand),
            lastFour: lastFour,
            expiry: expiry,
            holderName: holderName,
            label: label,
            isDefault: isDefault
        )
    }
}

extension ApiShippingOption {
    func toModel() -> ShippingOption {
        ShippingOption(
            id: id,
            name: name,
            deliveryEstimate: deliveryEstimate,
            price: price,
            isExpress: isExpress ?? false
        )
    }
}

extension ApiCoupon {
    func toModel() -> Coupon {
        Coupon(
            code: code,
            description: description,
            type: ApiMapping.couponType(type),
            value: value,
            expiry: ApiMapping.displayDate(expiry)
        )
    }
}

extension ApiNotification {
    func toModel() -> AppNotification {
        AppNotification(
            id: id,
            type: ApiMapping.notificationType(type),
            title: title,
            body: body,
            date: ApiMapping.displayDate(date),
            isRead: isRead
        )
    }
}

extension ApiChatMessage {
    func toModel() -> ChatMessage {
        ChatMessage(id: id, text: text, isAgent: isAgent, time: time)
    }
}

extension ApiReview {
    func toModel() -> Review {
        Review(
            id: id,
            productId: productId,
            author: author,
            rating: rating,
            date: ApiMapping.displayDate(date),
            text: text,
            photoURLs: photoUrls ?? []
        )
    }
}

extension ApiFaqItem {
    func toModel() -> FaqItem {
        FaqItem(question: question, answer: answer)
    }
}

extension ApiTicket {
    func toModel() -> SupportTicket {
        SupportTicket(
            ticketId: ticketId,
            status: status,
            subject: subject ?? "",
            message: message ?? "",
            orderId: orderId,
            createdAt: ApiMapping.displayDate(createdAt)
        )
    }
}

extension ApiCart {
    /// Resolve os itens em `CartItem`, usando o produto embutido ou o catálogo local.
    func toModels(catalog: [Product]) -> [CartItem] {
        items.compactMap { item in
            let product = item.product?.toModel() ?? catalog.first { $0.id == item.productId }
            guard let product else { return nil }
            return CartItem(product: product, quantity: item.quantity)
        }
    }
}

extension ApiOrderPaymentMethod {
    func toModel() -> PaymentMethod {
        PaymentMethod(
            id: type.lowercased(),
            brand: .unknown,
            lastFour: "",
            expiry: "",
            holderName: displayName,
            label: label ?? displayName,
            isDefault: false
        )
    }
}

extension ApiOrder {
    func toModel(catalog: [Product]) -> Order {
        let cartItems: [CartItem] = items.compactMap { item in
            let product = item.product?.toModel() ?? catalog.first { $0.id == item.productId }
            guard let product else { return nil }
            return CartItem(product: product, quantity: item.quantity)
        }
        let history = (statusHistory ?? []).map {
            OrderStatusEntry(
                status: ApiMapping.orderStatus($0.status),
                date: ApiMapping.displayDate($0.date),
                location: $0.location ?? ""
            )
        }
        return Order(
            id: id,
            items: cartItems,
            total: total,
            status: ApiMapping.orderStatus(status),
            deliveryDate: deliveryDate ?? "",
            address: address?.toModel(),
            paymentMethod: paymentMethod?.toModel(),
            subtotal: subtotal,
            shipping: shipping,
            discount: discount + (pixDiscount ?? 0),
            trackingCode: trackingCode ?? "",
            statusHistory: history
        )
    }
}
