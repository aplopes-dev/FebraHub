package com.citybox.data

data class Product(
    val id: String,
    val name: String,
    val imageUrl: String,
    val price: Double,
    val originalPrice: Double,
    val discountPercent: Int,
    val rating: Float,
    val reviewCount: Int,
    val isFreeShipping: Boolean,
    val isExpress: Boolean,
    val category: String,
    val specs: Map<String, String> = emptyMap()
)

data class CartItem(val product: Product, val quantity: Int)

data class User(
    val name: String,
    val email: String,
    val phone: String,
    val avatarInitial: String = "",
    val isPlus: Boolean = false
)

data class Address(
    val id: String,
    val label: String,
    val zipCode: String,
    val street: String,
    val number: String,
    val complement: String = "",
    val neighborhood: String,
    val city: String,
    val state: String,
    val isDefault: Boolean = false
) {
    val formattedLine1: String get() = "$street, $number"
    val formattedLine2: String get() = "$city, $state · CEP $zipCode"
}

enum class CardBrand { VISA, MASTERCARD, ELO, AMEX, UNKNOWN }

enum class CheckoutPaymentType { PIX, CARD, BOLETO }

data class PaymentMethod(
    val id: String,
    val brand: CardBrand,
    val lastFour: String,
    val expiry: String,
    val holderName: String,
    val label: String = "",
    val isDefault: Boolean = false
) {
    val displayName: String
        get() = when (brand) {
            CardBrand.VISA -> "Visa"
            CardBrand.MASTERCARD -> "Mastercard"
            CardBrand.ELO -> "Elo"
            CardBrand.AMEX -> "Amex"
            CardBrand.UNKNOWN -> "Cartão"
        } + " ****$lastFour"
}

data class Review(
    val id: String,
    val productId: String,
    val author: String,
    val rating: Int,
    val date: String,
    val text: String,
    val photoUrls: List<String> = emptyList()
)

data class Category(
    val id: String,
    val name: String,
    val icon: String,
    val colorHex: Long
)

enum class CouponType { PERCENT, FIXED }

data class Coupon(
    val code: String,
    val description: String,
    val type: CouponType,
    val value: Double,
    val expiry: String
)

enum class NotificationType { ORDER, PROMO, SYSTEM }

data class AppNotification(
    val id: String,
    val type: NotificationType,
    val title: String,
    val body: String,
    val date: String,
    val isRead: Boolean = false
)

data class FaqItem(
    val question: String,
    val answer: String
)

data class ChatMessage(
    val id: String,
    val text: String,
    val isAgent: Boolean,
    val time: String
)

data class SupportTicket(
    val ticketId: String,
    val status: String,
    val subject: String,
    val message: String,
    val orderId: String? = null,
    val createdAt: String = "Agora"
)

data class CreatedTicket(
    val ticketId: String,
    val status: String
)

data class ShippingOption(
    val id: String,
    val name: String,
    val deliveryEstimate: String,
    val price: Double,
    val isExpress: Boolean = false
)

data class OrderStatusEntry(
    val status: OrderStatus,
    val date: String,
    val location: String = ""
)

data class Order(
    val id: String,
    val items: List<CartItem>,
    val total: Double,
    val status: OrderStatus,
    val deliveryDate: String,
    val address: Address? = null,
    val paymentMethod: PaymentMethod? = null,
    val subtotal: Double = total,
    val shipping: Double = 0.0,
    val discount: Double = 0.0,
    val trackingCode: String = "",
    val statusHistory: List<OrderStatusEntry> = emptyList()
)

enum class OrderStatus { CONFIRMED, PREPARING, SHIPPED, DELIVERED }

data class HomeShortcut(
    val categoryId: String,
    val label: String,
    val icon: String,
    val backgroundColorHex: Long
)

data class HomeSection(
    val id: String,
    val title: String,
    val productIds: List<String>
)

enum class SortOption(val label: String) {
    RELEVANCE("Relevância"),
    PRICE_ASC("Menor preço"),
    PRICE_DESC("Maior preço"),
    BEST_SELLERS("Mais vendidos")
}

data class SearchFilters(
    val minPrice: Double? = null,
    val maxPrice: Double? = null,
    val minRating: Float? = null,
    val freeShippingOnly: Boolean = false,
    val expressOnly: Boolean = false,
    val brand: String? = null,
    val sortBy: SortOption = SortOption.RELEVANCE
)

enum class StaticPageType(val title: String) {
    ABOUT("Sobre o CityBox"),
    TERMS("Termos de Uso"),
    PRIVACY("Política de Privacidade")
}

object ProductPricing {
    fun installmentCount(price: Double): Int = when {
        price >= 2000 -> 12
        price >= 800 -> 10
        price >= 300 -> 6
        price >= 100 -> 3
        else -> 1
    }

    fun deliveryChipLabel(shipping: ShippingOption?, isExpress: Boolean): String {
        val option = shipping ?: return if (isExpress) "Chega amanhã ✓" else "Consulte o prazo no checkout"
        return when (option.id) {
            "express" -> "Chega amanhã ✓"
            "normal" -> "Chega em ${option.deliveryEstimate.lowercase()}"
            "economico" -> "Chega em ${option.deliveryEstimate.lowercase()}"
            else -> if (isExpress) "Chega amanhã ✓" else option.deliveryEstimate
        }
    }
}
