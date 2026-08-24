import Foundation

struct Product: Identifiable, Hashable {
    let id: String
    let name: String
    let imageURL: String
    let price: Double
    let originalPrice: Double
    let discountPercent: Int
    let rating: Float
    let reviewCount: Int
    let isFreeShipping: Bool
    let isExpress: Bool
    let category: String
    let specs: [String: String]
}

struct CartItem: Identifiable, Hashable {
    let id = UUID()
    let product: Product
    var quantity: Int
}

struct User: Hashable {
    var name: String
    var email: String
    var phone: String
    var avatarInitial: String
    var isPlus: Bool
}

struct Address: Identifiable, Hashable {
    let id: String
    var label: String
    var zipCode: String
    var street: String
    var number: String
    var complement: String
    var neighborhood: String
    var city: String
    var state: String
    var isDefault: Bool

    var formattedLine1: String { "\(street), \(number)" }
    var formattedLine2: String { "\(city), \(state) · CEP \(zipCode)" }
}

enum CardBrand: String, Hashable {
    case visa, mastercard, elo, amex, unknown

    var displayName: String {
        switch self {
        case .visa: return "Visa"
        case .mastercard: return "Mastercard"
        case .elo: return "Elo"
        case .amex: return "Amex"
        case .unknown: return "Cartão"
        }
    }
}

enum CheckoutPaymentType: Hashable {
    case pix, card, boleto
}

struct PaymentMethod: Identifiable, Hashable {
    let id: String
    var brand: CardBrand
    var lastFour: String
    var expiry: String
    var holderName: String
    var label: String
    var isDefault: Bool

    var displayName: String { "\(brand.displayName) ****\(lastFour)" }
}

struct Review: Identifiable, Hashable {
    let id: String
    let productId: String
    let author: String
    let rating: Int
    let date: String
    let text: String
    var photoURLs: [String]
}

struct Category: Identifiable, Hashable {
    let id: String
    let name: String
    let icon: String
    let colorHex: String
}

enum CouponType: Hashable {
    case percent, fixed
}

struct Coupon: Identifiable, Hashable {
    var id: String { code }
    let code: String
    let description: String
    let type: CouponType
    let value: Double
    let expiry: String
}

enum NotificationType: Hashable {
    case order, promo, system
}

struct AppNotification: Identifiable, Hashable {
    let id: String
    let type: NotificationType
    let title: String
    let body: String
    let date: String
    var isRead: Bool
}

struct FaqItem: Identifiable, Hashable {
    var id: String { question }
    let question: String
    let answer: String
}

struct ChatMessage: Identifiable, Hashable {
    let id: String
    let text: String
    let isAgent: Bool
    let time: String
}

struct SupportTicket: Hashable {
    let ticketId: String
    let status: String
    let subject: String
    let message: String
    var orderId: String?
    var createdAt: String = "Agora"
}

struct CreatedTicket: Hashable {
    let ticketId: String
    let status: String
}

struct ShippingOption: Identifiable, Hashable {
    let id: String
    let name: String
    let deliveryEstimate: String
    let price: Double
    var isExpress: Bool
}

struct OrderStatusEntry: Hashable {
    let status: OrderStatus
    let date: String
    var location: String
}

struct Order: Identifiable, Hashable {
    let id: String
    let items: [CartItem]
    let total: Double
    var status: OrderStatus
    let deliveryDate: String
    var address: Address?
    var paymentMethod: PaymentMethod?
    var subtotal: Double
    var shipping: Double
    var discount: Double
    var trackingCode: String
    var statusHistory: [OrderStatusEntry]
}

enum OrderStatus: String, CaseIterable, Hashable {
    case confirmed = "Confirmado"
    case preparing = "Preparando"
    case shipped = "Saiu para entrega"
    case delivered = "Entregue"
}

enum StaticPageType: String, CaseIterable, Hashable {
    case about, terms, privacy

    var title: String {
        switch self {
        case .about: return "Sobre o CityBox"
        case .terms: return "Termos de Uso"
        case .privacy: return "Política de Privacidade"
        }
    }
}

enum ProductPricing {
    static func installmentCount(for price: Double) -> Int {
        switch price {
        case 2000...: return 12
        case 800..<2000: return 10
        case 300..<800: return 6
        case 100..<300: return 3
        default: return 1
        }
    }

    static func deliveryChipLabel(shipping: ShippingOption?, isExpress: Bool) -> String {
        guard let option = shipping else {
            return isExpress ? "Chega amanhã ✓" : "Consulte o prazo no checkout"
        }
        switch option.id {
        case "express": return "Chega amanhã ✓"
        case "normal", "economico": return "Chega em \(option.deliveryEstimate.lowercased())"
        default: return isExpress ? "Chega amanhã ✓" : option.deliveryEstimate
        }
    }
}

enum SortOption: String, CaseIterable, Hashable {
    case relevance = "Relevância"
    case priceAsc = "Menor preço"
    case priceDesc = "Maior preço"
    case bestSellers = "Mais vendidos"
}

struct SearchFilters: Hashable {
    var minPrice: Double?
    var maxPrice: Double?
    var minRating: Float?
    var freeShippingOnly = false
    var expressOnly = false
    var brand: String?
    var sortBy: SortOption = .relevance
}

struct HomeSection: Identifiable, Hashable {
    let id: String
    let title: String
    let productIds: [String]
}

// MARK: - Price formatting helper

extension Double {
    var brlFormatted: String {
        let fmt = NumberFormatter()
        fmt.numberStyle = .currency
        fmt.locale = Locale(identifier: "pt_BR")
        return fmt.string(from: NSNumber(value: self)) ?? "R$ \(self)"
    }
}
