package com.citybox.data

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.citybox.data.api.ApiClient
import com.citybox.data.api.ApiException
import com.citybox.data.api.TokenStore
import com.citybox.data.api.toCartItems
import com.citybox.data.api.toInput
import com.citybox.data.api.toModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.util.UUID

/**
 * Estado global do app em modo dual:
 * - MOCK ([ApiEnvironment.USE_MOCK] = true): comportamento in-memory original (MockData);
 * - LIVE: as operações chamam o BFF via [ApiClient] em coroutines do [viewModelScope]
 *   e projetam as respostas nos mesmos StateFlows consumidos pelas telas.
 */
class AppState(app: Application) : AndroidViewModel(app) {

    private val isLive = ApiEnvironment.isLive
    private val tokenStore = TokenStore(app)
    private val api = ApiClient(tokenStore)

    val products = MutableStateFlow(if (isLive) emptyList() else MockData.products)
    val cart = MutableStateFlow<List<CartItem>>(emptyList())
    val favorites = MutableStateFlow<Set<String>>(emptySet())
    val orders = MutableStateFlow(if (isLive) emptyList() else MockData.orders)
    val searchQuery = MutableStateFlow("")
    val searchHistory = MutableStateFlow<List<String>>(emptyList())
    val searchFilters = MutableStateFlow(SearchFilters())
    val searchCategoryId = MutableStateFlow<String?>(null)
    val isLoggedIn = MutableStateFlow(false)
    val hasSeenOnboarding = MutableStateFlow(tokenStore.hasSeenOnboarding)
    val requestedTab = MutableStateFlow<String?>(null)

    val user = MutableStateFlow(MockData.user)
    val addresses = MutableStateFlow(if (isLive) emptyList() else MockData.addresses)
    val paymentMethods = MutableStateFlow(if (isLive) emptyList() else MockData.paymentMethods)
    val reviews = MutableStateFlow(if (isLive) emptyMap() else MockData.reviews)
    val notifications = MutableStateFlow(if (isLive) emptyList() else MockData.notifications)
    val chatMessages = MutableStateFlow(if (isLive) emptyList() else MockData.chatMessages)
    val tickets = MutableStateFlow(if (isLive) emptyList() else MockData.tickets)
    private var ticketIdCounter = 1000
    val appliedCoupon = MutableStateFlow<Coupon?>(null)
    val selectedAddress = MutableStateFlow(if (isLive) null else MockData.addresses.firstOrNull { it.isDefault })
    val selectedPayment = MutableStateFlow(if (isLive) null else MockData.paymentMethods.firstOrNull { it.isDefault })
    val selectedShipping = MutableStateFlow<ShippingOption?>(MockData.shippingOptions.first())
    val checkoutPaymentType = MutableStateFlow(CheckoutPaymentType.PIX)
    val boletoCpf = MutableStateFlow("")

    // Conteúdo dinâmico (defaults do mock; substituído pelo BFF em LIVE)
    val categories = MutableStateFlow(MockData.categories)
    val homeSections = MutableStateFlow(MockData.homeSections)
    val homeShortcuts = MutableStateFlow(MockData.homeShortcuts)
    val faqItems = MutableStateFlow(MockData.faqItems)
    val availableCoupons = MutableStateFlow(MockData.coupons)
    val shippingOptions = MutableStateFlow(MockData.shippingOptions)
    val searchSuggestions = MutableStateFlow(MockData.searchSuggestions)
    val brands = MutableStateFlow(MockData.brands)
    val staticPages = MutableStateFlow(MockData.staticPageContent)
    val subscriptionRenewalDate = MutableStateFlow(MockData.subscriptionRenewalDate)
    val subscriptionBenefits = MutableStateFlow(MockData.subscriptionBenefits)

    /** ids de produto por categoria em modo LIVE (populado sob demanda). */
    private val liveCategoryProducts = MutableStateFlow<Map<String, List<String>>>(emptyMap())
    private val loadedReviewProducts = mutableSetOf<String>()
    private val loadedStaticPages = mutableSetOf<StaticPageType>()

    private val _cartTotal = MutableStateFlow(0.0)
    val cartTotal: StateFlow<Double> = _cartTotal

    private val _cartCount = MutableStateFlow(0)
    val cartCount: StateFlow<Int> = _cartCount

    val unreadNotificationCount: Int
        get() = notifications.value.count { !it.isRead }

    init {
        if (isLive) {
            viewModelScope.launch { loadPublicContent() }
            viewModelScope.launch { restoreSession() }
            observeLogout()
        }
    }

    // ── Bootstrap LIVE ─────────────────────────────────────────────────────

    private suspend fun loadPublicContent() {
        runCatching {
            val home = api.getHome()
            mergeProducts(home.products.map { it.toModel() })
            if (home.sections.isNotEmpty()) homeSections.value = home.sections.map { it.toModel() }
        }
        runCatching {
            val cats = api.listCategories().map { it.toModel() }
            if (cats.isNotEmpty()) {
                categories.value = cats
                homeShortcuts.value = cats.map { HomeShortcut(it.id, it.name, it.icon, it.colorHex) }
            }
        }
        runCatching {
            val faq = api.getFaq().map { it.toModel() }
            if (faq.isNotEmpty()) faqItems.value = faq
        }
        runCatching {
            val data = api.getSuggestions()
            if (data.suggestions.isNotEmpty()) searchSuggestions.value = data.suggestions
            if (data.brands.isNotEmpty()) brands.value = data.brands
        }
    }

    private suspend fun restoreSession() {
        if (tokenStore.accessToken == null && tokenStore.refreshToken == null) return
        runCatching {
            val session = api.getSession()
            user.value = session.user.toModel()
            isLoggedIn.value = true
            loadUserData()
        }.onFailure {
            if (it is ApiException && it.statusCode in listOf(401, 403)) tokenStore.clear()
        }
    }

    private fun loadUserData() {
        viewModelScope.launch { runCatching { syncCart(api.getCart()) } }
        viewModelScope.launch {
            runCatching {
                val fav = api.listFavorites()
                mergeProducts(fav.products.map { it.toModel() })
                favorites.value = fav.productIds.toSet()
            }
        }
        viewModelScope.launch { runCatching { refreshOrders() } }
        viewModelScope.launch { runCatching { refreshAddresses(api.listAddresses().map { it.toModel() }) } }
        viewModelScope.launch {
            runCatching {
                val methods = api.listPaymentMethods().map { it.toModel() }
                paymentMethods.value = methods
                selectedPayment.value = methods.firstOrNull { it.isDefault } ?: methods.firstOrNull()
            }
        }
        viewModelScope.launch {
            runCatching {
                notifications.value = api.listNotifications().notifications.map { it.toModel() }
            }
        }
        viewModelScope.launch { runCatching { chatMessages.value = api.getChatMessages().map { it.toModel() } } }
        viewModelScope.launch { runCatching { tickets.value = api.listTickets().map { it.toModel() } } }
        viewModelScope.launch {
            runCatching {
                val coupons = api.listCoupons().map { it.toModel() }
                if (coupons.isNotEmpty()) availableCoupons.value = coupons
            }
        }
        viewModelScope.launch {
            runCatching {
                val sub = api.getSubscription()
                if (sub.renewalDate.isNotBlank()) subscriptionRenewalDate.value = sub.renewalDate
                if (sub.benefits.isNotEmpty()) subscriptionBenefits.value = sub.benefits
            }
        }
        viewModelScope.launch { runCatching { searchHistory.value = api.getSearchHistory() } }
        viewModelScope.launch {
            runCatching {
                val session = api.getCheckoutSession()
                session.session.paymentType?.let { type ->
                    checkoutPaymentType.value = runCatching { CheckoutPaymentType.valueOf(type) }
                        .getOrDefault(CheckoutPaymentType.PIX)
                }
                session.session.appliedCoupon?.let { appliedCoupon.value = it.toModel() }
            }
        }
        viewModelScope.launch { refreshShippingOptions() }
    }

    private fun observeLogout() {
        viewModelScope.launch {
            var previous = isLoggedIn.value
            isLoggedIn.collect { logged ->
                if (previous && !logged) {
                    // logout disparado pelas telas via isLoggedIn.value = false
                    launchApi { api.logout() }
                    tokenStore.clear()
                    cart.value = emptyList()
                    favorites.value = emptySet()
                    orders.value = emptyList()
                    addresses.value = emptyList()
                    paymentMethods.value = emptyList()
                    notifications.value = emptyList()
                    tickets.value = emptyList()
                    appliedCoupon.value = null
                    updateCartMetrics(emptyList())
                }
                previous = logged
            }
        }
    }

    // ── Helpers LIVE ───────────────────────────────────────────────────────

    private fun launchApi(block: suspend () -> Unit): Job =
        viewModelScope.launch { runCatching { block() } }

    private fun mergeProducts(incoming: List<Product>) {
        if (incoming.isEmpty()) return
        val byId = LinkedHashMap<String, Product>()
        products.value.forEach { byId[it.id] = it }
        incoming.forEach { byId[it.id] = it }
        products.value = byId.values.toList()
    }

    private fun productById(id: String): Product? = products.value.find { it.id == id }

    private fun syncCart(apiCart: com.citybox.data.api.ApiCart) {
        val items = apiCart.toCartItems(::productById)
        mergeProducts(items.map { it.product })
        cart.value = items
        updateCartMetrics(items)
    }

    private suspend fun refreshOrders() {
        orders.value = api.listOrders().map { it.toModel(::productById) }
    }

    private fun refreshAddresses(list: List<Address>) {
        addresses.value = list
        selectedAddress.value = list.firstOrNull { it.isDefault } ?: list.firstOrNull()
    }

    private suspend fun refreshShippingOptions() {
        if (!isLive) return
        val addressId = selectedAddress.value?.id ?: return
        val items = cart.value.map {
            com.citybox.data.api.ApiCartItem(productId = it.product.id, quantity = it.quantity)
        }
        if (items.isEmpty()) return
        runCatching {
            val options = api.getShippingOptions(addressId, items).options.map { it.toModel() }
            if (options.isNotEmpty()) {
                shippingOptions.value = options
                if (options.none { it.id == selectedShipping.value?.id }) {
                    selectedShipping.value = options.first()
                }
            }
        }
    }

    private fun errorMessage(e: Throwable): String =
        (e as? ApiException)?.message ?: "Não foi possível conectar ao servidor"

    // ── Conteúdo / catálogo ────────────────────────────────────────────────

    fun offerProducts(): List<Product> = productsForHomeSection("daily-deals")

    fun bestSellerProducts(): List<Product> = productsForHomeSection("best-sellers")

    private fun productsForHomeSection(sectionId: String): List<Product> {
        val catalog = products.value
        val section = homeSections.value.find { it.id == sectionId }
        val resolved = section?.productIds?.mapNotNull { id -> catalog.find { it.id == id } }.orEmpty()
        if (resolved.isNotEmpty()) return resolved
        return when (sectionId) {
            "daily-deals" -> catalog.take(4)
            "best-sellers" -> catalog.reversed().take(4)
            else -> catalog
        }
    }

    fun categoryById(categoryId: String): Category? =
        categories.value.find { it.id == categoryId } ?: MockData.categoryById(categoryId)

    /** Produtos de uma categoria. Em LIVE dispara o fetch sob demanda e resolve pelo cache. */
    fun productsForCategory(categoryId: String, catalog: List<Product> = products.value): List<Product> {
        if (!isLive) return MockData.productsForCategory(categoryId, catalog)
        ensureCategoryProducts(categoryId)
        val ids = liveCategoryProducts.value[categoryId]
        return if (ids != null) {
            ids.mapNotNull { id -> catalog.find { it.id == id } }
        } else {
            MockData.productsForCategory(categoryId, catalog)
        }
    }

    private val loadingCategories = mutableSetOf<String>()

    private fun ensureCategoryProducts(categoryId: String) {
        if (!isLive || liveCategoryProducts.value.containsKey(categoryId)) return
        if (!loadingCategories.add(categoryId)) return
        viewModelScope.launch {
            runCatching {
                val data = api.getCategoryProducts(categoryId)
                val list = data.products.map { it.toModel() }
                mergeProducts(list)
                liveCategoryProducts.value =
                    liveCategoryProducts.value + (categoryId to list.map { it.id })
            }
            loadingCategories.remove(categoryId)
        }
    }

    /** Conteúdo de página estática (LIVE busca em /content/pages/{slug} sob demanda). */
    fun staticPageContent(type: StaticPageType): String {
        if (isLive) ensureStaticPage(type)
        return staticPages.value[type] ?: ""
    }

    private fun ensureStaticPage(type: StaticPageType) {
        if (!loadedStaticPages.add(type)) return
        val slug = when (type) {
            StaticPageType.ABOUT -> "sobre"
            StaticPageType.TERMS -> "termos"
            StaticPageType.PRIVACY -> "privacidade"
        }
        launchApi {
            val page = api.getStaticPage(slug)
            if (page.content.isNotBlank()) {
                staticPages.value = staticPages.value + (type to page.content)
            }
        }
    }

    // ── Favoritos / carrinho ───────────────────────────────────────────────

    fun toggleFavorite(productId: String) {
        val current = favorites.value.toMutableSet()
        val nowFavorite = !current.contains(productId)
        if (nowFavorite) current.add(productId) else current.remove(productId)
        favorites.value = current
        if (isLive) launchApi { api.setFavorite(productId, nowFavorite) }
    }

    fun addToCart(product: Product) {
        val current = cart.value.toMutableList()
        val existing = current.indexOfFirst { it.product.id == product.id }
        if (existing >= 0) {
            current[existing] = current[existing].copy(quantity = current[existing].quantity + 1)
        } else {
            current.add(CartItem(product, 1))
        }
        cart.value = current
        updateCartMetrics(current)
        if (isLive) {
            val quantity = current.first { it.product.id == product.id }.quantity
            launchApi {
                if (quantity == 1) syncCart(api.addCartItem(product.id, 1))
                else syncCart(api.updateCartItem(product.id, quantity))
            }
        }
    }

    fun removeFromCart(productId: String) {
        val current = cart.value.filter { it.product.id != productId }
        cart.value = current
        updateCartMetrics(current)
        if (isLive) launchApi { syncCart(api.removeCartItem(productId)) }
    }

    fun updateQuantity(productId: String, qty: Int) {
        val current = cart.value.toMutableList()
        val idx = current.indexOfFirst { it.product.id == productId }
        if (idx >= 0) {
            if (qty <= 0) current.removeAt(idx)
            else current[idx] = current[idx].copy(quantity = qty)
        }
        cart.value = current
        updateCartMetrics(current)
        if (isLive) {
            launchApi {
                if (qty <= 0) syncCart(api.removeCartItem(productId))
                else syncCart(api.updateCartItem(productId, qty))
            }
        }
    }

    // ── Checkout ───────────────────────────────────────────────────────────

    /** Confirma o pedido. Retorna null em falha (LIVE); em MOCK nunca falha. */
    suspend fun placeOrder(): Order? {
        if (isLive) return placeOrderLive()

        val currentCart = cart.value
        val subtotal = currentCart.sumOf { it.product.price * it.quantity }
        val shipping = selectedShipping.value?.price ?: 0.0
        val couponDiscount = couponDiscountAmount(subtotal)
        val totalBeforePix = (subtotal + shipping - couponDiscount).coerceAtLeast(0.0)
        val total = when (checkoutPaymentType.value) {
            CheckoutPaymentType.PIX -> totalBeforePix * 0.95
            else -> totalBeforePix
        }
        val orderId = "CB-${(100000..999999).random()}"
        val order = Order(
            id = orderId,
            items = currentCart,
            total = total,
            status = OrderStatus.CONFIRMED,
            deliveryDate = selectedShipping.value?.deliveryEstimate ?: "amanhã até 22h",
            address = selectedAddress.value,
            paymentMethod = resolveOrderPaymentMethod(),
            subtotal = subtotal,
            shipping = shipping,
            discount = couponDiscount,
            trackingCode = "BR${(100000000..999999999).random()}CB",
            statusHistory = listOf(
                OrderStatusEntry(OrderStatus.CONFIRMED, "Agora", "São Paulo, SP")
            )
        )
        orders.value = listOf(order) + orders.value
        cart.value = emptyList()
        appliedCoupon.value = null
        updateCartMetrics(emptyList())
        return order
    }

    private suspend fun placeOrderLive(): Order? {
        val addressId = selectedAddress.value?.id
        val shippingId = selectedShipping.value?.id
        val couponCode = appliedCoupon.value?.code
        val paymentType = checkoutPaymentType.value.name
        val paymentMethodId = selectedPayment.value?.id
        val cpf = boletoCpf.value.takeIf { it.isNotBlank() }

        val paymentJson = buildString {
            append("""{"type":"$paymentType"""")
            if (paymentType == "CARD" && paymentMethodId != null) {
                append(""","paymentMethodId":"$paymentMethodId"""")
            }
            if (paymentType == "BOLETO" && cpf != null) append(""","cpf":"$cpf"""")
            append("}")
        }
        val body = buildString {
            append("{")
            addressId?.let { append(""""addressId":"$it",""") }
            shippingId?.let { append(""""shippingOptionId":"$it",""") }
            couponCode?.let { append(""""couponCode":"$it",""") }
            append(""""payment":$paymentJson}""")
        }
        return try {
            val result = api.createOrder(body, UUID.randomUUID().toString())
            val order = result.order.toModel(::productById)
            orders.value = listOf(order) + orders.value
            cart.value = emptyList()
            appliedCoupon.value = null
            updateCartMetrics(emptyList())
            order
        } catch (_: Exception) {
            null
        }
    }

    // ── Perfil / auth ──────────────────────────────────────────────────────

    fun updateProfile(name: String, email: String, phone: String) {
        val current = user.value
        user.value = current.copy(
            name = name,
            email = email,
            phone = phone,
            avatarInitial = name.firstOrNull()?.uppercaseChar()?.toString() ?: current.avatarInitial
        )
        if (isLive) launchApi { user.value = api.updateMe(name, email, phone).toModel() }
    }

    fun completeOnboarding() {
        hasSeenOnboarding.value = true
        tokenStore.hasSeenOnboarding = true
    }

    suspend fun login(account: String, password: String): String? {
        val trimmedAccount = account.trim()
        val trimmedPassword = password.trim()
        if (trimmedAccount.isEmpty() || trimmedPassword.isEmpty()) {
            return "Preencha e-mail e senha"
        }
        if (trimmedPassword.length < 4) {
            return "Senha deve ter ao menos 4 caracteres"
        }
        if (isLive) {
            return try {
                val data = api.login(trimmedAccount, trimmedPassword)
                user.value = data.user.toModel()
                isLoggedIn.value = true
                loadUserData()
                null
            } catch (e: Exception) {
                errorMessage(e)
            }
        }
        val demo = user.value
        val accountDigits = trimmedAccount.filter { it.isDigit() }
        val phoneDigits = demo.phone.filter { it.isDigit() }
        val matches = trimmedAccount.equals(demo.email, ignoreCase = true) ||
            (accountDigits.isNotEmpty() && phoneDigits.endsWith(accountDigits.takeLast(8)))
        if (!matches) {
            return "Conta não encontrada. Use ${demo.email}"
        }
        if (trimmedPassword != MockData.DEMO_PASSWORD) {
            return "Senha incorreta (mock: ${MockData.DEMO_PASSWORD})"
        }
        isLoggedIn.value = true
        return null
    }

    suspend fun loginWithGoogle(): String? {
        if (isLive) {
            return try {
                val data = api.loginGoogle()
                user.value = data.user.toModel()
                isLoggedIn.value = true
                loadUserData()
                null
            } catch (e: Exception) {
                errorMessage(e)
            }
        }
        user.value = user.value.copy(email = "camila@gmail.com")
        isLoggedIn.value = true
        return null
    }

    suspend fun resetPassword(token: String, password: String): String? {
        if (token.isBlank() || password.isBlank()) {
            return "Campo obrigatório"
        }
        if (password.length < 4) {
            return "Senha muito curta"
        }
        if (isLive) {
            return try {
                api.resetPassword(token, password, password)
                null
            } catch (e: Exception) {
                errorMessage(e)
            }
        }
        if (token != MockData.MOCK_RESET_TOKEN) {
            return "Token inválido ou expirado"
        }
        return null
    }

    suspend fun register(name: String, email: String, phone: String, password: String, confirmPassword: String): String? {
        val trimmedName = name.trim()
        val trimmedEmail = email.trim()
        val trimmedPhone = phone.trim()
        when {
            trimmedName.isEmpty() -> return "Informe seu nome"
            trimmedEmail.isEmpty() || !trimmedEmail.contains("@") -> return "E-mail inválido"
            trimmedPhone.isEmpty() -> return "Informe seu telefone"
            password.length < 4 -> return "Senha deve ter ao menos 4 caracteres"
            password != confirmPassword -> return "As senhas não coincidem"
        }
        if (isLive) {
            return try {
                val data = api.register(trimmedName, trimmedEmail, trimmedPhone, password)
                user.value = data.user.toModel()
                isLoggedIn.value = true
                loadUserData()
                null
            } catch (e: Exception) {
                errorMessage(e)
            }
        }
        user.value = User(
            name = trimmedName,
            email = trimmedEmail,
            phone = trimmedPhone,
            avatarInitial = trimmedName.firstOrNull()?.uppercaseChar()?.toString() ?: "?",
            isPlus = false
        )
        isLoggedIn.value = true
        return null
    }

    /** Consulta CEP no BFF (LIVE). Retorna null se indisponível. */
    suspend fun lookupZip(cep: String): Address? {
        if (!isLive) return null
        return try {
            val zip = api.lookupZip(cep.filter { it.isDigit() })
            Address(
                id = "",
                label = "",
                zipCode = zip.zipCode,
                street = zip.street,
                number = "",
                neighborhood = zip.neighborhood,
                city = zip.city,
                state = zip.state,
            )
        } catch (_: Exception) {
            null
        }
    }

    // ── Endereços ──────────────────────────────────────────────────────────

    fun addAddress(address: Address) {
        val list = addresses.value.toMutableList()
        if (address.isDefault) {
            list.replaceAll { it.copy(isDefault = false) }
        }
        list.add(address)
        addresses.value = list
        if (address.isDefault) selectedAddress.value = address
        if (isLive) {
            launchApi {
                api.createAddress(address.toInput())
                refreshAddresses(api.listAddresses().map { it.toModel() })
            }
        }
    }

    fun editAddress(address: Address) {
        val list = addresses.value.toMutableList()
        val idx = list.indexOfFirst { it.id == address.id }
        if (idx >= 0) {
            if (address.isDefault) {
                list.replaceAll { it.copy(isDefault = false) }
            }
            list[idx] = address
            addresses.value = list
            if (address.isDefault) selectedAddress.value = address
            if (isLive) {
                launchApi {
                    api.updateAddress(address.id, address.toInput())
                    refreshAddresses(api.listAddresses().map { it.toModel() })
                }
            }
        }
    }

    fun removeAddress(addressId: String) {
        val list = addresses.value.filter { it.id != addressId }
        addresses.value = list
        if (selectedAddress.value?.id == addressId) {
            selectedAddress.value = list.firstOrNull { it.isDefault } ?: list.firstOrNull()
        }
        if (isLive) launchApi { api.deleteAddress(addressId) }
    }

    fun selectAddress(addressId: String) {
        val list = addresses.value.map {
            it.copy(isDefault = it.id == addressId)
        }
        addresses.value = list
        selectedAddress.value = list.find { it.id == addressId }
        if (isLive) {
            launchApi { api.setDefaultAddress(addressId) }
            launchApi { api.updateCheckoutSession("""{"selectedAddressId":"$addressId"}""") }
            launchApi { refreshShippingOptions() }
        }
    }

    // ── Cartões ────────────────────────────────────────────────────────────

    fun addPaymentMethod(method: PaymentMethod) {
        val list = paymentMethods.value.toMutableList()
        if (method.isDefault) {
            list.replaceAll { it.copy(isDefault = false) }
        }
        list.add(method)
        paymentMethods.value = list
        if (method.isDefault) selectedPayment.value = method
    }

    /** Versão LIVE do cadastro de cartão (dados crus do formulário). */
    fun addCard(number: String, holderName: String, expiry: String, cvv: String, isDefault: Boolean) {
        if (!isLive) return
        launchApi {
            api.createPaymentMethod(
                com.citybox.data.api.ApiCardInput(
                    number = number.filter { it.isDigit() },
                    holderName = holderName,
                    expiry = expiry,
                    cvv = cvv,
                    isDefault = isDefault,
                )
            )
            val methods = api.listPaymentMethods().map { it.toModel() }
            paymentMethods.value = methods
            selectedPayment.value = methods.firstOrNull { it.isDefault } ?: methods.firstOrNull()
        }
    }

    fun removePaymentMethod(methodId: String) {
        val list = paymentMethods.value.filter { it.id != methodId }
        paymentMethods.value = list
        if (selectedPayment.value?.id == methodId) {
            selectedPayment.value = list.firstOrNull { it.isDefault } ?: list.firstOrNull()
        }
        if (isLive) launchApi { api.deletePaymentMethod(methodId) }
    }

    fun selectPaymentMethod(methodId: String) {
        val list = paymentMethods.value.map {
            it.copy(isDefault = it.id == methodId)
        }
        paymentMethods.value = list
        selectedPayment.value = list.find { it.id == methodId }
        if (isLive) {
            launchApi { api.setDefaultPaymentMethod(methodId) }
            launchApi { api.updateCheckoutSession("""{"paymentMethodId":"$methodId"}""") }
        }
    }

    fun setCheckoutPaymentType(type: CheckoutPaymentType) {
        checkoutPaymentType.value = type
        if (type == CheckoutPaymentType.CARD && selectedPayment.value == null) {
            paymentMethods.value.firstOrNull { it.isDefault }?.let { selectPaymentMethod(it.id) }
                ?: paymentMethods.value.firstOrNull()?.let { selectPaymentMethod(it.id) }
        }
        if (isLive) launchApi { api.updateCheckoutSession("""{"paymentType":"${type.name}"}""") }
    }

    fun setBoletoCpf(cpf: String) {
        boletoCpf.value = cpf.filter { it.isDigit() }.take(11)
    }

    fun canConfirmCheckout(): Boolean = when (checkoutPaymentType.value) {
        CheckoutPaymentType.PIX -> true
        CheckoutPaymentType.CARD -> selectedPayment.value != null
        CheckoutPaymentType.BOLETO -> boletoCpf.value.length == 11
    }

    private fun resolveOrderPaymentMethod(): PaymentMethod? = when (checkoutPaymentType.value) {
        CheckoutPaymentType.PIX -> PaymentMethod(
            id = "pix",
            brand = CardBrand.UNKNOWN,
            lastFour = "",
            expiry = "",
            holderName = "Pagamento instantâneo",
            label = "PIX (5% off)"
        )
        CheckoutPaymentType.CARD -> selectedPayment.value
        CheckoutPaymentType.BOLETO -> PaymentMethod(
            id = "boleto",
            brand = CardBrand.UNKNOWN,
            lastFour = "",
            expiry = "",
            holderName = "CPF ${formatCpf(boletoCpf.value)}",
            label = "Boleto · vence em 3 dias úteis"
        )
    }

    private fun formatCpf(digits: String): String {
        if (digits.length != 11) return digits
        return "${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9)}"
    }

    // ── Cupons / frete ─────────────────────────────────────────────────────

    fun applyCoupon(code: String): Boolean {
        val coupon = availableCoupons.value.find { it.code.equals(code, ignoreCase = true) }
            ?: return false
        appliedCoupon.value = coupon
        if (isLive) {
            viewModelScope.launch {
                runCatching { api.applyCartCoupon(coupon.code) }
                    .onSuccess { data -> data.appliedCoupon?.let { appliedCoupon.value = it.toModel() } }
                    .onFailure { appliedCoupon.value = null }
            }
        }
        return true
    }

    fun removeCoupon() {
        appliedCoupon.value = null
        if (isLive) launchApi { api.removeCoupon() }
    }

    fun selectShipping(shippingId: String) {
        selectedShipping.value = shippingOptions.value.find { it.id == shippingId }
            ?: MockData.shippingOptions.find { it.id == shippingId }
        if (isLive) launchApi { api.updateCheckoutSession("""{"shippingOptionId":"$shippingId"}""") }
    }

    fun couponDiscountAmount(subtotal: Double): Double {
        val coupon = appliedCoupon.value ?: return 0.0
        return when (coupon.type) {
            CouponType.PERCENT -> subtotal * coupon.value / 100
            CouponType.FIXED -> coupon.value
        }
    }

    fun orderGrandTotal(subtotal: Double): Double {
        val shipping = selectedShipping.value?.price ?: 0.0
        return (subtotal + shipping - couponDiscountAmount(subtotal)).coerceAtLeast(0.0)
    }

    // ── Notificações / suporte ─────────────────────────────────────────────

    fun markNotificationRead(id: String) {
        notifications.value = notifications.value.map {
            if (it.id == id) it.copy(isRead = true) else it
        }
        if (isLive) launchApi { api.markNotificationRead(id) }
    }

    fun markAllNotificationsRead() {
        notifications.value = notifications.value.map { it.copy(isRead = true) }
        if (isLive) launchApi { api.markAllNotificationsRead() }
    }

    suspend fun createTicket(subject: String, message: String, orderId: String? = null): CreatedTicket? {
        val trimmedSubject = subject.trim()
        val trimmedMessage = message.trim()
        if (trimmedSubject.isEmpty() || trimmedMessage.isEmpty()) return null

        if (isLive) {
            return try {
                val created = api.createTicket(trimmedSubject, trimmedMessage, orderId?.takeIf { it.isNotEmpty() })
                tickets.value = tickets.value + SupportTicket(
                    ticketId = created.ticketId,
                    status = created.status,
                    subject = trimmedSubject,
                    message = trimmedMessage,
                    orderId = orderId?.takeIf { it.isNotEmpty() }
                )
                CreatedTicket(ticketId = created.ticketId, status = created.status)
            } catch (_: Exception) {
                null
            }
        }

        ticketIdCounter += 1
        val ticketId = "TKT-$ticketIdCounter"
        val ticket = SupportTicket(
            ticketId = ticketId,
            status = "OPEN",
            subject = trimmedSubject,
            message = trimmedMessage,
            orderId = orderId?.takeIf { it.isNotEmpty() }
        )
        tickets.value = tickets.value + ticket
        return CreatedTicket(ticketId = ticketId, status = "OPEN")
    }

    fun sendChatMessage(text: String) {
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return
        if (isLive) {
            val optimistic = ChatMessage(
                id = "u-${System.currentTimeMillis()}",
                text = trimmed,
                isAgent = false,
                time = "Agora"
            )
            chatMessages.value = chatMessages.value + optimistic
            launchApi {
                val result = api.sendChatMessage(trimmed)
                val base = chatMessages.value.filter { it.id != optimistic.id }
                val newMessages = listOfNotNull(result.userMessage?.toModel(), result.agentMessage?.toModel())
                chatMessages.value = base + newMessages.ifEmpty { listOf(optimistic) }
            }
            return
        }
        val userMsg = ChatMessage(
            id = "u-${System.currentTimeMillis()}",
            text = trimmed,
            isAgent = false,
            time = "Agora"
        )
        val agentMsg = ChatMessage(
            id = "a-${System.currentTimeMillis()}",
            text = "Recebi sua mensagem! Nossa equipe responderá em breve. (mock)",
            isAgent = true,
            time = "Agora"
        )
        chatMessages.value = chatMessages.value + userMsg + agentMsg
    }

    // ── Reviews ────────────────────────────────────────────────────────────

    fun addReview(review: Review) {
        val current = reviews.value.toMutableMap()
        val productReviews = (current[review.productId] ?: emptyList()).toMutableList()
        productReviews.add(0, review)
        current[review.productId] = productReviews
        reviews.value = current
        if (isLive) launchApi { api.createReview(review.productId, review.rating, review.text) }
    }

    fun reviewsForProduct(productId: String): List<Review> {
        if (isLive) ensureReviews(productId)
        return reviews.value[productId].orEmpty()
    }

    private fun ensureReviews(productId: String) {
        if (!loadedReviewProducts.add(productId)) return
        launchApi {
            val data = api.getReviews(productId)
            if (data.reviews.isNotEmpty()) {
                reviews.value = reviews.value + (productId to data.reviews.map { it.toModel() })
            }
        }
    }

    fun averageRating(productId: String): Float {
        val list = reviewsForProduct(productId)
        if (list.isEmpty()) return 0f
        return list.map { it.rating }.average().toFloat()
    }

    // ── Busca ──────────────────────────────────────────────────────────────

    fun addSearchHistory(query: String) {
        val trimmed = query.trim()
        if (trimmed.isEmpty()) return
        val updated = listOf(trimmed) + searchHistory.value.filter { !it.equals(trimmed, ignoreCase = true) }
        searchHistory.value = updated.take(10)
        searchQuery.value = trimmed
        if (isLive) {
            launchApi { api.addSearchHistory(trimmed) }
            // busca remota: mescla os resultados no catálogo local para o filtro client-side
            launchApi { mergeProducts(api.searchProducts(trimmed).map { it.toModel() }) }
        }
    }

    fun clearSearchHistory() {
        searchHistory.value = emptyList()
        if (isLive) launchApi { api.clearSearchHistory() }
    }

    fun setSearchFilters(filters: SearchFilters) {
        searchFilters.value = filters
    }

    fun resetSearchFilters() {
        searchFilters.value = SearchFilters()
    }

    fun openSearch() {
        searchCategoryId.value = null
    }

    fun openCategorySearch(categoryId: String) {
        searchCategoryId.value = categoryId
        searchQuery.value = ""
        resetSearchFilters()
        if (isLive) ensureCategoryProducts(categoryId)
    }

    fun closeSearch() {
        searchCategoryId.value = null
    }

    fun filteredAndSortedProducts(query: String = searchQuery.value): List<Product> {
        val filters = searchFilters.value
        val categoryId = searchCategoryId.value
        var pool = products.value
        if (categoryId != null) {
            pool = productsForCategory(categoryId, pool)
        }
        var result = pool.filter { product ->
            val matchesQuery = query.isBlank() ||
                product.name.contains(query, ignoreCase = true) ||
                product.category.contains(query, ignoreCase = true)
            val matchesMinPrice = filters.minPrice == null || product.price >= filters.minPrice
            val matchesMaxPrice = filters.maxPrice == null || product.price <= filters.maxPrice
            val matchesRating = filters.minRating == null || product.rating >= filters.minRating
            val matchesShipping = !filters.freeShippingOnly || product.isFreeShipping
            val matchesExpress = !filters.expressOnly || product.isExpress
            val matchesBrand = filters.brand == null || MockData.productBrand(product) == filters.brand
            matchesQuery && matchesMinPrice && matchesMaxPrice && matchesRating &&
                matchesShipping && matchesExpress && matchesBrand
        }
        result = when (filters.sortBy) {
            SortOption.PRICE_ASC -> result.sortedBy { it.price }
            SortOption.PRICE_DESC -> result.sortedByDescending { it.price }
            SortOption.BEST_SELLERS -> result.sortedByDescending { it.reviewCount }
            SortOption.RELEVANCE -> result
        }
        return result
    }

    // ── Pedidos ────────────────────────────────────────────────────────────

    fun advanceOrderStatus(orderId: String) {
        if (isLive) {
            // demo mock não se aplica em LIVE: apenas ressincroniza o pedido do servidor
            launchApi {
                val updated = api.getOrder(orderId).toModel(::productById)
                orders.value = orders.value.map { if (it.id == orderId) updated else it }
            }
            return
        }
        val statusOrder = OrderStatus.entries
        orders.value = orders.value.map { order ->
            if (order.id != orderId) return@map order
            val currentIdx = statusOrder.indexOf(order.status)
            if (currentIdx < 0 || currentIdx >= statusOrder.lastIndex) return@map order
            val nextStatus = statusOrder[currentIdx + 1]
            order.copy(
                status = nextStatus,
                statusHistory = order.statusHistory + OrderStatusEntry(nextStatus, "Agora", "")
            )
        }
    }

    /** Atualiza tracking do pedido a partir de GET /me/orders/{id}/tracking (LIVE). */
    fun loadTracking(orderId: String) {
        if (!isLive) return
        launchApi {
            val tracking = api.getTracking(orderId)
            orders.value = orders.value.map { order ->
                if (order.id != orderId) order
                else order.copy(
                    trackingCode = tracking.trackingCode.ifBlank { order.trackingCode },
                    statusHistory = tracking.timeline
                        .map { OrderStatusEntry(com.citybox.data.api.mapOrderStatus(it.status), it.date, it.location ?: "") }
                        .ifEmpty { order.statusHistory },
                )
            }
        }
    }

    /** Cancela o pedido no BFF (LIVE). Em MOCK apenas mantém o comportamento local. */
    fun cancelOrder(orderId: String, reason: String = "OTHER", description: String? = null) {
        if (!isLive) return
        launchApi {
            val updated = api.cancelOrder(orderId, reason, description).toModel(::productById)
            orders.value = orders.value.map { if (it.id == orderId) updated else it }
        }
    }

    /** Solicita devolução no BFF (LIVE). */
    fun requestReturn(orderId: String, productId: String, quantity: Int, reason: String, description: String?) {
        if (!isLive) return
        launchApi {
            api.createReturn(orderId, productId, quantity, reason, description)
            refreshOrders()
        }
    }

    fun buyAgain(orderId: String) {
        if (isLive) {
            launchApi { syncCart(api.buyAgain(orderId)) }
            return
        }
        val order = orders.value.find { it.id == orderId } ?: return
        val current = cart.value.toMutableList()
        order.items.forEach { item ->
            val existing = current.indexOfFirst { it.product.id == item.product.id }
            if (existing >= 0) {
                current[existing] = current[existing].copy(quantity = current[existing].quantity + item.quantity)
            } else {
                current.add(item)
            }
        }
        cart.value = current
        updateCartMetrics(current)
    }

    private fun updateCartMetrics(items: List<CartItem>) {
        _cartTotal.value = items.sumOf { it.product.price * it.quantity }
        _cartCount.value = items.sumOf { it.quantity }
    }

    fun requestTab(route: String) {
        requestedTab.value = route
    }

    fun consumeRequestedTab(): String? {
        val route = requestedTab.value
        requestedTab.value = null
        return route
    }
}
