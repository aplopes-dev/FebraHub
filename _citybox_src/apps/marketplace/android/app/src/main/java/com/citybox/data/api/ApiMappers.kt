package com.citybox.data.api

import com.citybox.data.Address
import com.citybox.data.AppNotification
import com.citybox.data.CardBrand
import com.citybox.data.CartItem
import com.citybox.data.Category
import com.citybox.data.ChatMessage
import com.citybox.data.Coupon
import com.citybox.data.CouponType
import com.citybox.data.FaqItem
import com.citybox.data.HomeSection
import com.citybox.data.NotificationType
import com.citybox.data.Order
import com.citybox.data.OrderStatus
import com.citybox.data.OrderStatusEntry
import com.citybox.data.PaymentMethod
import com.citybox.data.Product
import com.citybox.data.Review
import com.citybox.data.ShippingOption
import com.citybox.data.SupportTicket
import com.citybox.data.User

/** Mapeadores DTO da API → models de tela existentes (Models.kt). */

fun ApiProduct.toModel(): Product = Product(
    id = id,
    name = name,
    imageUrl = imageUrl,
    price = price,
    originalPrice = originalPrice ?: price,
    discountPercent = discountPercent ?: 0,
    rating = rating.toFloat(),
    reviewCount = reviewCount,
    isFreeShipping = isFreeShipping,
    isExpress = isExpress,
    category = category,
    specs = specs ?: emptyMap(),
)

fun ApiCategory.toModel(): Category = Category(
    id = id,
    name = name,
    icon = icon,
    colorHex = parseColorHex(colorHex),
)

private fun parseColorHex(value: String): Long {
    val hex = value.removePrefix("#").removePrefix("0x")
    val normalized = if (hex.length == 6) "FF$hex" else hex
    return normalized.toLongOrNull(16) ?: 0xFFEDEDED
}

fun ApiHomeSection.toModel(): HomeSection = HomeSection(id = id, title = title, productIds = productIds)

fun ApiUser.toModel(): User = User(
    name = name,
    email = email,
    phone = phone,
    avatarInitial = avatarInitial.ifBlank { name.firstOrNull()?.uppercaseChar()?.toString() ?: "?" },
    isPlus = isPlus,
)

fun ApiAddress.toModel(): Address = Address(
    id = id,
    label = label,
    zipCode = zipCode,
    street = street,
    number = number,
    complement = complement ?: "",
    neighborhood = neighborhood,
    city = city,
    state = state,
    isDefault = isDefault,
)

fun Address.toInput(): ApiAddressInput = ApiAddressInput(
    label = label,
    zipCode = zipCode,
    street = street,
    number = number,
    complement = complement.ifBlank { null },
    neighborhood = neighborhood,
    city = city,
    state = state,
    isDefault = isDefault,
)

fun ApiPaymentMethod.toModel(): PaymentMethod = PaymentMethod(
    id = id,
    brand = runCatching { CardBrand.valueOf(brand.uppercase()) }.getOrDefault(CardBrand.UNKNOWN),
    lastFour = lastFour,
    expiry = expiry,
    holderName = holderName,
    label = label,
    isDefault = isDefault,
)

fun ApiCoupon.toModel(): Coupon = Coupon(
    code = code,
    description = description,
    type = if (type.equals("PERCENT", ignoreCase = true)) CouponType.PERCENT else CouponType.FIXED,
    value = value,
    expiry = expiry,
)

fun ApiAppliedCoupon.toModel(): Coupon = Coupon(
    code = code,
    description = "Cupom $code",
    type = if (type.equals("PERCENT", ignoreCase = true)) CouponType.PERCENT else CouponType.FIXED,
    value = value,
    expiry = "",
)

fun ApiNotification.toModel(): AppNotification = AppNotification(
    id = id,
    type = runCatching { NotificationType.valueOf(type.uppercase()) }.getOrDefault(NotificationType.SYSTEM),
    title = title,
    body = body,
    date = date,
    isRead = isRead,
)

fun ApiFaqItem.toModel(): FaqItem = FaqItem(question = question, answer = answer)

fun ApiChatMessage.toModel(): ChatMessage = ChatMessage(id = id, text = text, isAgent = isAgent, time = time)

fun ApiShippingOption.toModel(): ShippingOption = ShippingOption(
    id = id,
    name = name,
    deliveryEstimate = deliveryEstimate,
    price = price,
    isExpress = isExpress ?: false,
)

fun ApiReview.toModel(): Review = Review(
    id = id,
    productId = productId,
    author = author,
    rating = rating,
    date = date,
    text = text,
    photoUrls = photoUrls ?: emptyList(),
)

fun ApiTicket.toModel(): SupportTicket = SupportTicket(
    ticketId = ticketId,
    status = status,
    subject = subject ?: "",
    message = message ?: "",
    orderId = orderId,
    createdAt = createdAt ?: "Agora",
)

/**
 * O enum de tela só conhece CONFIRMED/PREPARING/SHIPPED/DELIVERED; estados
 * pós-venda do BFF (CANCELLED, RETURN_REQUESTED, RETURNED) caem no vizinho
 * visual mais próximo para não quebrar as timelines existentes.
 */
fun mapOrderStatus(status: String): OrderStatus = when (status.uppercase()) {
    "PREPARING" -> OrderStatus.PREPARING
    "SHIPPED" -> OrderStatus.SHIPPED
    "DELIVERED", "RETURNED" -> OrderStatus.DELIVERED
    else -> OrderStatus.CONFIRMED
}

fun ApiOrderStatusEntry.toModel(): OrderStatusEntry = OrderStatusEntry(
    status = mapOrderStatus(status),
    date = date,
    location = location ?: "",
)

fun ApiOrder.toModel(resolveProduct: (String) -> Product?): Order {
    val cartItems = items.map { item ->
        val product = item.product?.toModel()
            ?: resolveProduct(item.productId)
            ?: Product(
                id = item.productId,
                name = "Produto ${item.productId}",
                imageUrl = "",
                price = item.unitPrice,
                originalPrice = item.unitPrice,
                discountPercent = 0,
                rating = 0f,
                reviewCount = 0,
                isFreeShipping = false,
                isExpress = false,
                category = "",
            )
        CartItem(product = product, quantity = item.quantity)
    }
    return Order(
        id = id,
        items = cartItems,
        total = total,
        status = mapOrderStatus(status),
        deliveryDate = deliveryDate,
        address = address?.toModel(),
        paymentMethod = paymentMethod?.let {
            PaymentMethod(
                id = it.type.lowercase(),
                brand = CardBrand.UNKNOWN,
                lastFour = "",
                expiry = "",
                holderName = it.displayName,
                label = it.label ?: "",
            )
        },
        subtotal = subtotal,
        shipping = shipping,
        discount = discount,
        trackingCode = trackingCode ?: "",
        statusHistory = statusHistory.map { it.toModel() },
    )
}

fun ApiCart.toCartItems(resolveProduct: (String) -> Product?): List<CartItem> =
    items.mapNotNull { item ->
        val product = item.product?.toModel() ?: resolveProduct(item.productId) ?: return@mapNotNull null
        CartItem(product = product, quantity = item.quantity)
    }
