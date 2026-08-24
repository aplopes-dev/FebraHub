package com.citybox.data.api

import kotlinx.serialization.Serializable

/**
 * Data classes @Serializable espelhando o contrato do BFF
 * (fonte de verdade: apps/marketplace/web/src/api/types.ts).
 * Envelope padrão: `{ data, meta?, errors?[{code,message,field}] }`, camelCase.
 */

@Serializable
data class ApiEnvelope<T>(
    val data: T? = null,
    val meta: ApiPageMeta? = null,
    val errors: List<ApiErrorItem>? = null,
)

@Serializable
data class ApiErrorItem(
    val code: String? = null,
    val message: String? = null,
    val field: String? = null,
)

@Serializable
data class ApiPageMeta(
    val page: Int? = null,
    val pageSize: Int? = null,
    val total: Int? = null,
)

// ── Auth & usuário ─────────────────────────────────────────────────────────

@Serializable
data class ApiUser(
    val id: String? = null,
    val name: String = "",
    val email: String = "",
    val phone: String = "",
    val avatarUrl: String? = null,
    val avatarInitial: String = "",
    val isPlus: Boolean = false,
    val hasSeenOnboarding: Boolean? = null,
)

@Serializable
data class ApiAuthData(
    val accessToken: String = "",
    val refreshToken: String? = null,
    val expiresIn: Long? = null,
    val user: ApiUser = ApiUser(),
)

@Serializable
data class ApiSessionData(
    val user: ApiUser = ApiUser(),
    val accessToken: String? = null,
    val isAuthenticated: Boolean? = null,
)

@Serializable
data class ApiRefreshData(
    val accessToken: String = "",
    val expiresIn: Long? = null,
)

@Serializable
data class ApiUserWrapper(val user: ApiUser = ApiUser())

@Serializable
data class ApiMessageData(val message: String? = null, val sent: Boolean? = null)

// ── Catálogo ───────────────────────────────────────────────────────────────

@Serializable
data class ApiProduct(
    val id: String = "",
    val name: String = "",
    val imageUrl: String = "",
    val price: Double = 0.0,
    val originalPrice: Double? = null,
    val discountPercent: Int? = null,
    val rating: Double = 0.0,
    val reviewCount: Int = 0,
    val isFreeShipping: Boolean = false,
    val isExpress: Boolean = false,
    val category: String = "",
    val categoryId: String? = null,
    val brand: String? = null,
    val specs: Map<String, String>? = null,
)

@Serializable
data class ApiCategory(
    val id: String = "",
    val name: String = "",
    val icon: String = "",
    val colorHex: String = "",
)

@Serializable
data class ApiHomeSection(
    val id: String = "",
    val title: String = "",
    val productIds: List<String> = emptyList(),
)

@Serializable
data class ApiHomeData(
    val sections: List<ApiHomeSection> = emptyList(),
    val products: List<ApiProduct> = emptyList(),
)

@Serializable
data class ApiCategoriesWrapper(val categories: List<ApiCategory> = emptyList())

@Serializable
data class ApiCategoryProductsData(
    val category: ApiCategory? = null,
    val products: List<ApiProduct> = emptyList(),
)

@Serializable
data class ApiProductsWrapper(val products: List<ApiProduct> = emptyList())

@Serializable
data class ApiProductWrapper(val product: ApiProduct = ApiProduct())

@Serializable
data class ApiSuggestionsData(
    val suggestions: List<String> = emptyList(),
    val brands: List<String> = emptyList(),
)

@Serializable
data class ApiReview(
    val id: String = "",
    val productId: String = "",
    val author: String = "",
    val rating: Int = 0,
    val date: String = "",
    val text: String = "",
    val photoUrls: List<String>? = null,
)

@Serializable
data class ApiReviewsListData(
    val averageRating: Double = 0.0,
    val totalCount: Int = 0,
    val distribution: Map<String, Int>? = null,
    val reviews: List<ApiReview> = emptyList(),
)

@Serializable
data class ApiReviewWrapper(val review: ApiReview = ApiReview())

@Serializable
data class ApiSearchHistoryData(val queries: List<String> = emptyList())

// ── Carrinho / favoritos ───────────────────────────────────────────────────

@Serializable
data class ApiCartItem(
    val productId: String = "",
    val quantity: Int = 0,
    val product: ApiProduct? = null,
)

@Serializable
data class ApiCart(
    val items: List<ApiCartItem> = emptyList(),
    val itemCount: Int = 0,
    val subtotal: Double = 0.0,
)

@Serializable
data class ApiCartWrapper(val cart: ApiCart = ApiCart())

@Serializable
data class ApiFavoritesData(
    val productIds: List<String> = emptyList(),
    val products: List<ApiProduct> = emptyList(),
)

@Serializable
data class ApiAppliedCoupon(
    val code: String = "",
    val type: String = "FIXED",
    val value: Double = 0.0,
    val discountAmount: Double = 0.0,
)

@Serializable
data class ApiCoupon(
    val code: String = "",
    val description: String = "",
    val type: String = "FIXED",
    val value: Double = 0.0,
    val expiry: String = "",
    val isApplicable: Boolean? = null,
    val reason: String? = null,
)

@Serializable
data class ApiCouponsWrapper(val coupons: List<ApiCoupon> = emptyList())

@Serializable
data class ApiApplyCouponData(
    val appliedCoupon: ApiAppliedCoupon? = null,
    val cart: ApiCart? = null,
    val preview: ApiCheckoutPreview? = null,
)

// ── Checkout ───────────────────────────────────────────────────────────────

@Serializable
data class ApiCheckoutSession(
    val selectedAddressId: String? = null,
    val shippingOptionId: String? = null,
    val appliedCoupon: ApiAppliedCoupon? = null,
    val paymentType: String? = null,
    val paymentMethodId: String? = null,
    val boletoCpf: String? = null,
    val canConfirm: Boolean? = null,
)

@Serializable
data class ApiCheckoutPreview(
    val subtotal: Double = 0.0,
    val shipping: Double = 0.0,
    val couponDiscount: Double = 0.0,
    val pixDiscount: Double = 0.0,
    val total: Double = 0.0,
    val pixDiscountPercent: Double? = null,
    val canConfirm: Boolean? = null,
    val validationErrors: List<String>? = null,
)

@Serializable
data class ApiCheckoutSessionData(
    val cart: ApiCart = ApiCart(),
    val session: ApiCheckoutSession = ApiCheckoutSession(),
    val preview: ApiCheckoutPreview = ApiCheckoutPreview(),
)

@Serializable
data class ApiShippingOption(
    val id: String = "",
    val name: String = "",
    val deliveryEstimate: String = "",
    val price: Double = 0.0,
    val isExpress: Boolean? = null,
)

@Serializable
data class ApiShippingOptionsData(
    val options: List<ApiShippingOption> = emptyList(),
    val freeShippingMessage: String? = null,
)

@Serializable
data class ApiPaymentInput(
    val type: String,
    val paymentMethodId: String? = null,
    val cpf: String? = null,
)

@Serializable
data class ApiPaymentResult(
    val type: String = "PIX",
    val status: String = "PENDING",
    val paymentMethodId: String? = null,
    val displayName: String? = null,
    val pixCopyPaste: String? = null,
    val digitableLine: String? = null,
    val dueDate: String? = null,
)

@Serializable
data class ApiCreateOrderData(
    val order: ApiOrder = ApiOrder(),
    val payment: ApiPaymentResult? = null,
)

// ── Pedidos ────────────────────────────────────────────────────────────────

@Serializable
data class ApiOrderItem(
    val productId: String = "",
    val product: ApiProduct? = null,
    val quantity: Int = 1,
    val unitPrice: Double = 0.0,
    val subtotal: Double = 0.0,
)

@Serializable
data class ApiOrderStatusEntry(
    val status: String = "CONFIRMED",
    val date: String = "",
    val location: String? = null,
)

@Serializable
data class ApiOrderPaymentMethod(
    val type: String = "PIX",
    val displayName: String = "",
    val label: String? = null,
)

@Serializable
data class ApiOrder(
    val id: String = "",
    val items: List<ApiOrderItem> = emptyList(),
    val status: String = "CONFIRMED",
    val deliveryDate: String = "",
    val address: ApiAddress? = null,
    val paymentMethod: ApiOrderPaymentMethod? = null,
    val subtotal: Double = 0.0,
    val shipping: Double = 0.0,
    val discount: Double = 0.0,
    val pixDiscount: Double? = null,
    val total: Double = 0.0,
    val trackingCode: String? = null,
    val carrier: String? = null,
    val statusHistory: List<ApiOrderStatusEntry> = emptyList(),
    val createdAt: String? = null,
)

@Serializable
data class ApiOrderWrapper(val order: ApiOrder = ApiOrder())

@Serializable
data class ApiOrdersData(val orders: List<ApiOrder> = emptyList())

@Serializable
data class ApiTrackingEntry(
    val status: String = "CONFIRMED",
    val date: String = "",
    val location: String? = null,
    val description: String? = null,
)

@Serializable
data class ApiTracking(
    val orderId: String = "",
    val trackingCode: String = "",
    val carrier: String = "",
    val currentStatus: String = "CONFIRMED",
    val estimatedDelivery: String = "",
    val timeline: List<ApiTrackingEntry> = emptyList(),
)

@Serializable
data class ApiReturnCreatedData(
    val returnId: String = "",
    val status: String = "",
    val message: String? = null,
)

// ── Endereços / pagamentos ─────────────────────────────────────────────────

@Serializable
data class ApiAddress(
    val id: String = "",
    val label: String = "",
    val zipCode: String = "",
    val street: String = "",
    val number: String = "",
    val complement: String? = null,
    val neighborhood: String = "",
    val city: String = "",
    val state: String = "",
    val isDefault: Boolean = false,
)

@Serializable
data class ApiAddressInput(
    val label: String,
    val zipCode: String,
    val street: String,
    val number: String,
    val complement: String? = null,
    val neighborhood: String,
    val city: String,
    val state: String,
    val isDefault: Boolean = false,
)

@Serializable
data class ApiAddressesWrapper(val addresses: List<ApiAddress> = emptyList())

@Serializable
data class ApiAddressWrapper(val address: ApiAddress = ApiAddress())

@Serializable
data class ApiZipLookup(
    val zipCode: String = "",
    val street: String = "",
    val neighborhood: String = "",
    val city: String = "",
    val state: String = "",
)

@Serializable
data class ApiPaymentMethod(
    val id: String = "",
    val brand: String = "UNKNOWN",
    val lastFour: String = "",
    val expiry: String = "",
    val holderName: String = "",
    val label: String = "",
    val isDefault: Boolean = false,
)

@Serializable
data class ApiPaymentMethodsWrapper(val paymentMethods: List<ApiPaymentMethod> = emptyList())

@Serializable
data class ApiPaymentMethodWrapper(val paymentMethod: ApiPaymentMethod = ApiPaymentMethod())

@Serializable
data class ApiCardInput(
    val number: String,
    val holderName: String,
    val expiry: String,
    val cvv: String,
    val label: String? = null,
    val isDefault: Boolean = false,
)

// ── Conta / engajamento ────────────────────────────────────────────────────

@Serializable
data class ApiSettings(
    val pushOrdersEnabled: Boolean = true,
    val pushPromoEnabled: Boolean = true,
    val emailPromoEnabled: Boolean = false,
    val darkTheme: Boolean = false,
    val language: String = "pt-BR",
)

@Serializable
data class ApiSubscription(
    val isActive: Boolean = false,
    val planName: String = "",
    val priceMonthly: Double = 0.0,
    val renewalDate: String = "",
    val benefits: List<String> = emptyList(),
)

@Serializable
data class ApiNotification(
    val id: String = "",
    val type: String = "SYSTEM",
    val title: String = "",
    val body: String = "",
    val date: String = "",
    val isRead: Boolean = false,
    val deepLink: String? = null,
)

@Serializable
data class ApiNotificationsData(
    val notifications: List<ApiNotification> = emptyList(),
    val unreadCount: Int = 0,
)

@Serializable
data class ApiFaqItem(val question: String = "", val answer: String = "")

@Serializable
data class ApiFaqData(val topics: List<ApiFaqItem> = emptyList())

@Serializable
data class ApiChatMessage(
    val id: String = "",
    val text: String = "",
    val isAgent: Boolean = false,
    val time: String = "",
)

@Serializable
data class ApiChatMessagesData(val messages: List<ApiChatMessage> = emptyList())

@Serializable
data class ApiChatSendData(
    val userMessage: ApiChatMessage? = null,
    val agentMessage: ApiChatMessage? = null,
)

@Serializable
data class ApiTicket(
    val ticketId: String = "",
    val status: String = "OPEN",
    val subject: String? = null,
    val message: String? = null,
    val orderId: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class ApiTicketsData(val tickets: List<ApiTicket> = emptyList())

@Serializable
data class ApiTicketCreatedData(val ticketId: String = "", val status: String = "OPEN")

// ── Conteúdo ───────────────────────────────────────────────────────────────

@Serializable
data class ApiStaticPage(
    val slug: String = "",
    val title: String = "",
    val content: String = "",
    val updatedAt: String? = null,
)

@Serializable
data class ApiBannerAction(val type: String = "", val query: String? = null)

@Serializable
data class ApiBanner(
    val id: String = "",
    val title: String = "",
    val subtitle: String? = null,
    val imageUrl: String = "",
    val action: ApiBannerAction? = null,
)

@Serializable
data class ApiBannersData(val banners: List<ApiBanner> = emptyList())
