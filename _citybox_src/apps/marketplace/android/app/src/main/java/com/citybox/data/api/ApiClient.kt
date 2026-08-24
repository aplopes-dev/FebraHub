package com.citybox.data.api

import android.content.Context
import android.content.SharedPreferences
import com.citybox.data.ApiEnvironment
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

/** Erro tipado da API (mensagem legível vinda de `errors[].message` quando disponível). */
class ApiException(
    val statusCode: Int,
    val code: String?,
    override val message: String,
) : IOException(message)

/**
 * Persistência de tokens JWT.
 * TODO: migrar para EncryptedSharedPreferences (androidx.security-crypto) quando a dependência
 * for adicionada; hoje o projeto não a possui, então usamos SharedPreferences normal.
 */
class TokenStore(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("citybox_auth", Context.MODE_PRIVATE)

    var accessToken: String?
        get() = prefs.getString(KEY_ACCESS, null)
        set(value) = prefs.edit().putString(KEY_ACCESS, value).apply()

    var refreshToken: String?
        get() = prefs.getString(KEY_REFRESH, null)
        set(value) = prefs.edit().putString(KEY_REFRESH, value).apply()

    var hasSeenOnboarding: Boolean
        get() = prefs.getBoolean(KEY_ONBOARDING, false)
        set(value) = prefs.edit().putBoolean(KEY_ONBOARDING, value).apply()

    fun clear() {
        prefs.edit().remove(KEY_ACCESS).remove(KEY_REFRESH).apply()
    }

    private companion object {
        const val KEY_ACCESS = "access_token"
        const val KEY_REFRESH = "refresh_token"
        const val KEY_ONBOARDING = "has_seen_onboarding"
    }
}

/**
 * Cliente HTTP fino do BFF: OkHttp + kotlinx-serialization.
 * - Envelope `{data, meta?, errors?}` desembrulhado em [request];
 * - `Authorization: Bearer` automático quando `auth = true`;
 * - refresh automático (1x) em 401 via POST /auth/refresh.
 */
class ApiClient(
    private val tokens: TokenStore,
    private val baseUrl: String = ApiEnvironment.BASE_URL,
) {
    val json: Json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        explicitNulls = false
        isLenient = true
        encodeDefaults = true
    }

    private val http: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(25, TimeUnit.SECONDS)
        .writeTimeout(25, TimeUnit.SECONDS)
        .build()

    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    // ── Núcleo HTTP ────────────────────────────────────────────────────────

    /** Executa a chamada e retorna o corpo cru (string JSON). Lança [ApiException] em erro. */
    private suspend fun executeRaw(
        method: String,
        path: String,
        body: String?,
        auth: Boolean,
        extraHeaders: Map<String, String>,
        allowRefresh: Boolean = true,
    ): String = withContext(Dispatchers.IO) {
        val builder = Request.Builder().url(baseUrl + path)
        extraHeaders.forEach { (k, v) -> builder.header(k, v) }
        if (auth) {
            tokens.accessToken?.let { builder.header("Authorization", "Bearer $it") }
        }
        val requestBody = when {
            body != null -> body.toRequestBody(jsonMedia)
            method == "POST" || method == "PUT" || method == "PATCH" || method == "DELETE" ->
                if (method == "DELETE") null else "{}".toRequestBody(jsonMedia)
            else -> null
        }
        builder.method(method, requestBody)

        val response = try {
            http.newCall(builder.build()).execute()
        } catch (e: IOException) {
            throw ApiException(0, "NETWORK", "Falha de conexão com o servidor (${e.message ?: "rede"})")
        }

        response.use { res ->
            val text = res.body?.string().orEmpty()
            if (res.code == 401 && auth && allowRefresh && tokens.refreshToken != null) {
                if (tryRefresh()) {
                    return@withContext executeRaw(method, path, body, auth, extraHeaders, allowRefresh = false)
                }
            }
            if (!res.isSuccessful) {
                throw ApiException(res.code, extractErrorCode(text), extractErrorMessage(text, res.code))
            }
            text
        }
    }

    private fun tryRefresh(): Boolean {
        val refresh = tokens.refreshToken ?: return false
        return try {
            val payload = """{"refreshToken":${Json.encodeToString(kotlinx.serialization.serializer<String>(), refresh)}}"""
            val req = Request.Builder()
                .url("$baseUrl/auth/refresh")
                .post(payload.toRequestBody(jsonMedia))
                .build()
            http.newCall(req).execute().use { res ->
                if (!res.isSuccessful) {
                    tokens.clear()
                    return false
                }
                val text = res.body?.string().orEmpty()
                val env = json.decodeFromString<ApiEnvelope<ApiRefreshData>>(text)
                val newToken = env.data?.accessToken
                if (newToken.isNullOrBlank()) {
                    tokens.clear()
                    false
                } else {
                    tokens.accessToken = newToken
                    true
                }
            }
        } catch (_: Exception) {
            false
        }
    }

    private fun extractErrorMessage(rawBody: String, statusCode: Int): String {
        val fallback = when (statusCode) {
            401 -> "Sessão expirada. Faça login novamente."
            404 -> "Recurso não encontrado."
            else -> "Erro no servidor (HTTP $statusCode)."
        }
        return try {
            val env = json.decodeFromString<ApiEnvelope<JsonObject>>(rawBody)
            env.errors?.firstOrNull()?.message ?: fallback
        } catch (_: Exception) {
            fallback
        }
    }

    private fun extractErrorCode(rawBody: String): String? = try {
        json.decodeFromString<ApiEnvelope<JsonObject>>(rawBody).errors?.firstOrNull()?.code
    } catch (_: Exception) {
        null
    }

    /** Chamada tipada: desembrulha `data` do envelope. */
    private suspend inline fun <reified T> request(
        method: String,
        path: String,
        body: String? = null,
        auth: Boolean = true,
        headers: Map<String, String> = emptyMap(),
    ): T {
        val raw = executeRaw(method, path, body, auth, headers)
        val env = json.decodeFromString<ApiEnvelope<T>>(raw)
        env.errors?.firstOrNull()?.message?.let { throw ApiException(200, env.errors.firstOrNull()?.code, it) }
        return env.data ?: throw ApiException(200, "EMPTY", "Resposta vazia do servidor")
    }

    /** Chamada sem corpo de resposta relevante. */
    private suspend fun requestUnit(
        method: String,
        path: String,
        body: String? = null,
        auth: Boolean = true,
    ) {
        executeRaw(method, path, body, auth, emptyMap())
    }

    private inline fun <reified T> enc(value: T): String =
        json.encodeToString(kotlinx.serialization.serializer(), value)

    // ── Auth ───────────────────────────────────────────────────────────────

    suspend fun login(account: String, password: String): ApiAuthData {
        val data = request<ApiAuthData>(
            "POST", "/auth/login",
            enc(mapOf("account" to account, "password" to password)),
            auth = false,
        )
        saveTokens(data)
        return data
    }

    suspend fun register(name: String, email: String, phone: String, password: String): ApiAuthData {
        val data = request<ApiAuthData>(
            "POST", "/auth/register",
            enc(mapOf("name" to name, "email" to email, "phone" to phone, "password" to password)),
            auth = false,
        )
        saveTokens(data)
        return data
    }

    suspend fun loginGoogle(): ApiAuthData {
        val data = request<ApiAuthData>(
            "POST", "/auth/google",
            enc(mapOf("idToken" to "mock-google")),
            auth = false,
        )
        saveTokens(data)
        return data
    }

    private fun saveTokens(data: ApiAuthData) {
        if (data.accessToken.isNotBlank()) tokens.accessToken = data.accessToken
        data.refreshToken?.let { tokens.refreshToken = it }
    }

    suspend fun logout() {
        try {
            requestUnit("POST", "/auth/logout", "{}")
        } finally {
            tokens.clear()
        }
    }

    suspend fun getSession(): ApiSessionData = request("GET", "/auth/session")

    suspend fun resetPassword(token: String, password: String, confirmPassword: String): ApiMessageData =
        request(
            "POST", "/auth/reset-password",
            enc(mapOf("token" to token, "password" to password, "confirmPassword" to confirmPassword)),
            auth = false,
        )

    suspend fun forgotPassword(email: String): ApiMessageData =
        request("POST", "/auth/forgot-password", enc(mapOf("email" to email)), auth = false)

    // ── Perfil / conta ─────────────────────────────────────────────────────

    suspend fun updateMe(name: String, email: String, phone: String): ApiUser =
        request<ApiUserWrapper>(
            "PATCH", "/me",
            enc(mapOf("name" to name, "email" to email, "phone" to phone)),
        ).user

    suspend fun getSettings(): ApiSettings = request("GET", "/me/settings")

    suspend fun updateSettings(settings: ApiSettings): ApiSettings =
        request("PATCH", "/me/settings", enc(settings))

    suspend fun getSubscription(): ApiSubscription = request("GET", "/me/subscription")

    // ── Endereços ──────────────────────────────────────────────────────────

    suspend fun listAddresses(): List<ApiAddress> =
        request<ApiAddressesWrapper>("GET", "/me/addresses").addresses

    suspend fun createAddress(input: ApiAddressInput): ApiAddress =
        request<ApiAddressWrapper>("POST", "/me/addresses", enc(input)).address

    suspend fun updateAddress(id: String, input: ApiAddressInput): ApiAddress =
        request<ApiAddressWrapper>("PUT", "/me/addresses/$id", enc(input)).address

    suspend fun deleteAddress(id: String) = requestUnit("DELETE", "/me/addresses/$id")

    suspend fun setDefaultAddress(id: String): ApiAddress =
        request<ApiAddressWrapper>("PATCH", "/me/addresses/$id/default", "{}").address

    suspend fun lookupZip(cep: String): ApiZipLookup =
        request("GET", "/addresses/zip/$cep", auth = false)

    // ── Cartões ────────────────────────────────────────────────────────────

    suspend fun listPaymentMethods(): List<ApiPaymentMethod> =
        request<ApiPaymentMethodsWrapper>("GET", "/me/payment-methods").paymentMethods

    suspend fun createPaymentMethod(input: ApiCardInput): ApiPaymentMethod =
        request<ApiPaymentMethodWrapper>("POST", "/me/payment-methods", enc(input)).paymentMethod

    suspend fun deletePaymentMethod(id: String) = requestUnit("DELETE", "/me/payment-methods/$id")

    suspend fun setDefaultPaymentMethod(id: String) {
        requestUnit("PATCH", "/me/payment-methods/$id/default", "{}")
    }

    // ── Catálogo ───────────────────────────────────────────────────────────

    suspend fun getHome(): ApiHomeData = request("GET", "/catalog/home", auth = false)

    suspend fun listCategories(): List<ApiCategory> =
        request<ApiCategoriesWrapper>("GET", "/catalog/categories", auth = false).categories

    suspend fun getCategoryProducts(categoryId: String): ApiCategoryProductsData =
        request("GET", "/catalog/categories/$categoryId/products", auth = false)

    suspend fun searchProducts(q: String): List<ApiProduct> =
        request<ApiProductsWrapper>(
            "GET", "/catalog/search?q=" + java.net.URLEncoder.encode(q, "UTF-8"),
            auth = false,
        ).products

    suspend fun getProduct(productId: String): ApiProduct =
        request<ApiProductWrapper>("GET", "/catalog/products/$productId", auth = false).product

    suspend fun getSuggestions(): ApiSuggestionsData =
        request("GET", "/catalog/search/suggestions", auth = false)

    suspend fun getReviews(productId: String): ApiReviewsListData =
        request("GET", "/catalog/products/$productId/reviews", auth = false)

    suspend fun createReview(productId: String, rating: Int, text: String): ApiReview =
        request<ApiReviewWrapper>(
            "POST", "/catalog/products/$productId/reviews",
            """{"rating":$rating,"text":${enc(text)}}""",
        ).review

    // ── Histórico de busca ─────────────────────────────────────────────────

    suspend fun getSearchHistory(): List<String> =
        request<ApiSearchHistoryData>("GET", "/me/search-history").queries

    suspend fun addSearchHistory(query: String): List<String> =
        request<ApiSearchHistoryData>(
            "POST", "/me/search-history", enc(mapOf("query" to query)),
        ).queries

    suspend fun clearSearchHistory() = requestUnit("DELETE", "/me/search-history")

    // ── Favoritos ──────────────────────────────────────────────────────────

    suspend fun listFavorites(): ApiFavoritesData = request("GET", "/me/favorites")

    suspend fun setFavorite(productId: String, isFavorite: Boolean) {
        requestUnit("PUT", "/me/favorites/$productId", """{"isFavorite":$isFavorite}""")
    }

    // ── Carrinho ───────────────────────────────────────────────────────────

    suspend fun getCart(): ApiCart = request("GET", "/me/cart")

    suspend fun addCartItem(productId: String, quantity: Int = 1): ApiCart =
        request(
            "POST", "/me/cart/items",
            """{"productId":${enc(productId)},"quantity":$quantity}""",
        )

    suspend fun updateCartItem(productId: String, quantity: Int): ApiCart =
        request("PATCH", "/me/cart/items/$productId", """{"quantity":$quantity}""")

    suspend fun removeCartItem(productId: String): ApiCart =
        request("DELETE", "/me/cart/items/$productId")

    suspend fun applyCartCoupon(code: String): ApiApplyCouponData =
        request("POST", "/me/cart/coupon", enc(mapOf("code" to code)))

    suspend fun removeCoupon() = requestUnit("DELETE", "/checkout/coupons")

    suspend fun listCoupons(): List<ApiCoupon> =
        request<ApiCouponsWrapper>("GET", "/me/coupons").coupons

    // ── Checkout ───────────────────────────────────────────────────────────

    suspend fun getCheckoutSession(): ApiCheckoutSessionData = request("GET", "/checkout/session")

    suspend fun updateCheckoutSession(patchJson: String): ApiCheckoutSessionData =
        request("PATCH", "/checkout/session", patchJson)

    suspend fun getShippingOptions(addressId: String, items: List<ApiCartItem>): ApiShippingOptionsData {
        val itemsJson = items.joinToString(",") {
            """{"productId":${enc(it.productId)},"quantity":${it.quantity}}"""
        }
        return request(
            "POST", "/checkout/shipping-options",
            """{"addressId":${enc(addressId)},"items":[$itemsJson]}""",
        )
    }

    suspend fun checkoutPreview(bodyJson: String): ApiCheckoutPreview =
        request("POST", "/checkout/preview", bodyJson)

    suspend fun createOrder(bodyJson: String, idempotencyKey: String): ApiCreateOrderData =
        request(
            "POST", "/checkout/orders", bodyJson,
            headers = mapOf("Idempotency-Key" to idempotencyKey),
        )

    // ── Pedidos ────────────────────────────────────────────────────────────

    suspend fun listOrders(): List<ApiOrder> =
        request<ApiOrdersData>("GET", "/me/orders").orders

    suspend fun getOrder(orderId: String): ApiOrder =
        request<ApiOrderWrapper>("GET", "/me/orders/$orderId").order

    suspend fun getTracking(orderId: String): ApiTracking =
        request("GET", "/me/orders/$orderId/tracking")

    suspend fun buyAgain(orderId: String): ApiCart =
        request<ApiCartWrapper>("POST", "/me/orders/$orderId/buy-again", "{}").cart

    suspend fun cancelOrder(orderId: String, reason: String, description: String?): ApiOrder =
        request<ApiOrderWrapper>(
            "POST", "/me/orders/$orderId/cancel",
            """{"reason":${enc(reason)},"description":${enc(description ?: "")}}""",
        ).order

    suspend fun createReturn(
        orderId: String,
        productId: String,
        quantity: Int,
        reason: String,
        description: String?,
    ): ApiReturnCreatedData =
        request(
            "POST", "/me/orders/$orderId/returns",
            """{"item":{"productId":${enc(productId)},"quantity":$quantity},""" +
                """"reason":${enc(reason)},"description":${enc(description ?: "")}}""",
        )

    // ── Suporte / engajamento ──────────────────────────────────────────────

    suspend fun getFaq(): List<ApiFaqItem> =
        request<ApiFaqData>("GET", "/support/faq", auth = false).topics

    suspend fun listNotifications(): ApiNotificationsData = request("GET", "/me/notifications")

    suspend fun markNotificationRead(id: String) {
        requestUnit("PATCH", "/me/notifications/$id/read", "{}")
    }

    suspend fun markAllNotificationsRead() {
        requestUnit("POST", "/me/notifications/read-all", "{}")
    }

    suspend fun getChatMessages(): List<ApiChatMessage> =
        request<ApiChatMessagesData>("GET", "/me/support/chat/messages").messages

    suspend fun sendChatMessage(text: String): ApiChatSendData =
        request("POST", "/me/support/chat/messages", enc(mapOf("text" to text)))

    suspend fun listTickets(): List<ApiTicket> =
        request<ApiTicketsData>("GET", "/me/support/tickets").tickets

    suspend fun createTicket(subject: String, message: String, orderId: String?): ApiTicketCreatedData {
        val orderPart = if (orderId.isNullOrBlank()) "" else ""","orderId":${enc(orderId)}"""
        return request(
            "POST", "/me/support/tickets",
            """{"subject":${enc(subject)},"message":${enc(message)}$orderPart}""",
        )
    }

    // ── Conteúdo ───────────────────────────────────────────────────────────

    suspend fun getStaticPage(slug: String): ApiStaticPage =
        request("GET", "/content/pages/$slug", auth = false)

    suspend fun getBanners(): List<ApiBanner> =
        request<ApiBannersData>("GET", "/content/banners", auth = false).banners
}
