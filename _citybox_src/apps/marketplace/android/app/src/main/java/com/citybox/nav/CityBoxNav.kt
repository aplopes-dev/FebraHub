package com.citybox.nav

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.citybox.ui.screens.ConfirmationScreen
import androidx.navigation.NavType
import androidx.navigation.navArgument
import com.citybox.data.AppState
import com.citybox.data.MockData
import com.citybox.ui.components.HomeAppBar
import com.citybox.ui.components.SimpleAppBar
import com.citybox.ui.components.bottomNavItems
import com.citybox.ui.components.BottomNavBar
import com.citybox.ui.screens.AccountScreen
import com.citybox.ui.screens.AddressFormScreen
import com.citybox.ui.screens.AddressListScreen
import com.citybox.ui.screens.CardFormScreen
import com.citybox.ui.screens.CartScreen
import com.citybox.ui.screens.CheckoutScreen
import com.citybox.ui.screens.CouponsScreen
import com.citybox.ui.screens.ShippingOptionsScreen
import com.citybox.ui.screens.EditProfileScreen
import com.citybox.ui.screens.FavoritesScreen
import com.citybox.ui.screens.HomeScreen
import com.citybox.ui.screens.OnboardingScreen
import com.citybox.ui.screens.RegisterScreen
import com.citybox.ui.screens.LoginScreen
import com.citybox.ui.screens.OrdersScreen
import com.citybox.ui.screens.OrderDetailScreen
import com.citybox.ui.screens.TrackingScreen
import com.citybox.ui.screens.WriteReviewScreen
import com.citybox.ui.screens.ReturnScreen
import com.citybox.ui.screens.PaymentMethodsScreen
import com.citybox.ui.screens.ProductDetailScreen
import com.citybox.ui.screens.ReviewsScreen
import com.citybox.ui.screens.SearchScreen
import com.citybox.ui.screens.SettingsScreen
import com.citybox.ui.screens.SplashScreen
import com.citybox.ui.screens.ForgotPasswordScreen
import com.citybox.ui.screens.ResetPasswordScreen
import com.citybox.ui.screens.ChatScreen
import com.citybox.ui.screens.HelpScreen
import com.citybox.ui.screens.OpenTicketScreen
import com.citybox.ui.screens.TicketListScreen
import com.citybox.ui.screens.NotificationsScreen
import com.citybox.ui.screens.StaticPageScreen
import com.citybox.ui.screens.SubscriptionScreen
import com.citybox.data.StaticPageType
import com.citybox.ui.theme.Surface

object Routes {
    const val LOGIN = "login"
    const val HOME = "home"
    const val FAVORITES = "favorites"
    const val CART = "cart"
    const val ORDERS = "orders"
    const val ACCOUNT = "account"
    const val SEARCH = "search"
    const val PRODUCT_DETAIL = "product/{productId}"
    const val CHECKOUT = "checkout"
    const val CONFIRMATION = "confirmation/{orderId}"
    const val EDIT_PROFILE = "edit_profile"
    const val ADDRESS_LIST = "address_list"
    const val ADDRESS_LIST_SELECT = "address_list_select"
    const val ADDRESS_FORM = "address_form?addressId={addressId}"
    const val PAYMENT_METHODS = "payment_methods"
    const val CARD_FORM = "card_form"
    const val SETTINGS = "settings"
    const val STATIC_PAGE = "static_page/{pageType}"
    const val SUBSCRIPTION = "subscription"
    const val SHIPPING_OPTIONS = "shipping_options"
    const val COUPONS = "coupons"
    const val ORDER_DETAIL = "order_detail/{orderId}"
    const val TRACKING = "tracking/{orderId}"
    const val WRITE_REVIEW = "write_review/{productId}"
    const val RETURN = "return/{orderId}"
    const val CATEGORY = "category/{categoryId}"
    const val REVIEWS = "reviews/{productId}"
    const val NOTIFICATIONS = "notifications"
    const val HELP = "help"
    const val OPEN_TICKET = "open_ticket"
    const val MY_TICKETS = "my_tickets"
    const val CHAT = "chat"
    const val ONBOARDING = "onboarding"
    const val REGISTER = "register"
    const val FORGOT_PASSWORD = "forgot_password"
    const val RESET_PASSWORD = "redefinir-senha?token={token}"

    fun productDetail(id: String) = "product/$id"
    fun confirmation(orderId: String) = "confirmation/$orderId"
    fun addressForm(addressId: String = "") = "address_form?addressId=$addressId"
    fun staticPage(type: StaticPageType) = "static_page/${type.name}"
    fun orderDetail(orderId: String) = "order_detail/$orderId"
    fun tracking(orderId: String) = "tracking/$orderId"
    fun writeReview(productId: String) = "write_review/$productId"
    fun returnOrder(orderId: String) = "return/$orderId"
    fun category(categoryId: String) = "category/$categoryId"
    fun reviews(productId: String) = "reviews/$productId"
    fun resetPassword(token: String) = "redefinir-senha?token=$token"
}

@Composable
fun CityBoxNav(appState: AppState) {
    var showSplash by remember { mutableStateOf(true) }
    val isLoggedIn by appState.isLoggedIn.collectAsState()
    val hasSeenOnboarding by appState.hasSeenOnboarding.collectAsState()

    if (showSplash) {
        SplashScreen(onFinished = { showSplash = false })
        return
    }

    if (!isLoggedIn) {
        val authNavController = rememberNavController()
        val authStart = if (hasSeenOnboarding) Routes.LOGIN else Routes.ONBOARDING

        NavHost(
            navController = authNavController,
            startDestination = authStart
        ) {
            composable(Routes.ONBOARDING) {
                OnboardingScreen(
                    appState = appState,
                    onFinished = {
                        authNavController.navigate(Routes.LOGIN) {
                            popUpTo(Routes.ONBOARDING) { inclusive = true }
                        }
                    }
                )
            }
            composable(Routes.LOGIN) {
                LoginScreen(
                    appState = appState,
                    onRegister = { authNavController.navigate(Routes.REGISTER) },
                    onForgotPassword = { authNavController.navigate(Routes.FORGOT_PASSWORD) },
                    onStaticPage = { type -> authNavController.navigate(Routes.staticPage(type)) }
                )
            }
            composable(Routes.REGISTER) {
                RegisterScreen(
                    appState = appState,
                    onBack = { authNavController.popBackStack() },
                    onLogin = { authNavController.popBackStack() },
                    onTermsClick = { authNavController.navigate(Routes.staticPage(StaticPageType.TERMS)) }
                )
            }
            composable(Routes.FORGOT_PASSWORD) {
                ForgotPasswordScreen(
                    onBack = { authNavController.popBackStack() },
                    onLogin = {
                        authNavController.navigate(Routes.LOGIN) {
                            popUpTo(Routes.LOGIN) { inclusive = false }
                            launchSingleTop = true
                        }
                    },
                    onResetPassword = {
                        authNavController.navigate(Routes.resetPassword(MockData.MOCK_RESET_TOKEN))
                    }
                )
            }
            composable(
                route = Routes.RESET_PASSWORD,
                arguments = listOf(navArgument("token") { type = NavType.StringType })
            ) { backStackEntry ->
                val token = backStackEntry.arguments?.getString("token") ?: ""
                ResetPasswordScreen(
                    appState = appState,
                    token = token,
                    onBack = { authNavController.popBackStack() },
                    onSuccess = {
                        authNavController.navigate(Routes.LOGIN) {
                            popUpTo(Routes.LOGIN) { inclusive = false }
                            launchSingleTop = true
                        }
                    }
                )
            }
            composable(Routes.STATIC_PAGE) { backStackEntry ->
                val typeName = backStackEntry.arguments?.getString("pageType") ?: StaticPageType.ABOUT.name
                val pageType = StaticPageType.entries.find { it.name == typeName } ?: StaticPageType.ABOUT
                StaticPageScreen(
                    pageType = pageType,
                    onBack = { authNavController.popBackStack() },
                    appState = appState
                )
            }
        }
        return
    }

    MainNav(appState = appState)
}

@Composable
fun MainNav(appState: AppState) {
    val rootNavController = rememberNavController()

    NavHost(
        navController = rootNavController,
        startDestination = "main"
    ) {
        composable("main") {
            MainScaffold(
                appState = appState,
                onNavigateToProduct = { productId ->
                    rootNavController.navigate(Routes.productDetail(productId))
                },
                onNavigateToCheckout = {
                    rootNavController.navigate(Routes.CHECKOUT)
                },
                onNavigateToSearch = {
                    appState.openSearch()
                    rootNavController.navigate(Routes.SEARCH)
                },
                onNavigateToAccountRoute = { route ->
                    rootNavController.navigate(route)
                },
                onNavigateToCoupons = {
                    rootNavController.navigate(Routes.COUPONS)
                },
                onNavigateToCategory = { categoryId ->
                    if (categoryId == "cupons") {
                        rootNavController.navigate(Routes.COUPONS)
                    } else {
                        appState.openCategorySearch(categoryId)
                        rootNavController.navigate(Routes.SEARCH)
                    }
                },
                onNavigateToOrder = { orderId ->
                    rootNavController.navigate(Routes.orderDetail(orderId))
                },
                onNavigateToNotifications = {
                    rootNavController.navigate(Routes.NOTIFICATIONS)
                }
            )
        }
        composable(Routes.SEARCH) {
            SearchScreen(
                appState = appState,
                onProductClick = { productId ->
                    rootNavController.navigate(Routes.productDetail(productId))
                },
                onBack = {
                    appState.closeSearch()
                    rootNavController.popBackStack()
                }
            )
        }
        composable(Routes.PRODUCT_DETAIL) { backStackEntry ->
            val productId = backStackEntry.arguments?.getString("productId") ?: ""
            ProductDetailScreen(
                productId = productId,
                appState = appState,
                onBack = { rootNavController.popBackStack() },
                onGoToCart = {
                    appState.requestTab(Routes.CART)
                    rootNavController.popBackStack("main", inclusive = false)
                },
                onBuyNow = {
                    rootNavController.navigate(Routes.CHECKOUT)
                },
                onReviewsClick = {
                    rootNavController.navigate(Routes.reviews(productId))
                }
            )
        }
        composable(Routes.CHECKOUT) {
            CheckoutScreen(
                appState = appState,
                onConfirm = { orderId ->
                    rootNavController.navigate(Routes.confirmation(orderId)) {
                        popUpTo(Routes.CHECKOUT) { inclusive = true }
                    }
                },
                onBack = { rootNavController.popBackStack() },
                onChangeAddress = { rootNavController.navigate(Routes.ADDRESS_LIST_SELECT) },
                onChangeShipping = { rootNavController.navigate(Routes.SHIPPING_OPTIONS) },
                onCoupons = { rootNavController.navigate(Routes.COUPONS) },
                onAddCard = { rootNavController.navigate(Routes.CARD_FORM) }
            )
        }
        composable(Routes.CONFIRMATION) { backStackEntry ->
            val orderId = backStackEntry.arguments?.getString("orderId") ?: ""
            ConfirmationScreen(
                orderId = orderId,
                appState = appState,
                onGoToOrders = {
                    appState.requestTab(Routes.ORDERS)
                    rootNavController.navigate(Routes.tracking(orderId)) {
                        popUpTo("main") { inclusive = false }
                        launchSingleTop = true
                    }
                },
                onGoHome = {
                    appState.requestTab(Routes.HOME)
                    rootNavController.navigate("main") {
                        popUpTo("main") { inclusive = true }
                        launchSingleTop = true
                    }
                }
            )
        }
        composable(Routes.EDIT_PROFILE) {
            EditProfileScreen(
                appState = appState,
                onBack = { rootNavController.popBackStack() },
                onSaved = { rootNavController.popBackStack() }
            )
        }
        composable(Routes.ADDRESS_LIST) {
            AddressListScreen(
                appState = appState,
                onBack = { rootNavController.popBackStack() },
                onAddAddress = { rootNavController.navigate(Routes.addressForm()) },
                onEditAddress = { id -> rootNavController.navigate(Routes.addressForm(id)) }
            )
        }
        composable(Routes.ADDRESS_LIST_SELECT) {
            AddressListScreen(
                appState = appState,
                selectionMode = true,
                onBack = { rootNavController.popBackStack() },
                onAddAddress = { rootNavController.navigate(Routes.addressForm()) },
                onEditAddress = { id -> rootNavController.navigate(Routes.addressForm(id)) },
                onSelected = { rootNavController.popBackStack() }
            )
        }
        composable(
            route = Routes.ADDRESS_FORM,
            arguments = listOf(navArgument("addressId") { type = NavType.StringType; defaultValue = "" })
        ) { backStackEntry ->
            val addressId = backStackEntry.arguments?.getString("addressId")?.takeIf { it.isNotEmpty() }
            AddressFormScreen(
                appState = appState,
                addressId = addressId,
                onBack = { rootNavController.popBackStack() },
                onSaved = { rootNavController.popBackStack() }
            )
        }
        composable(Routes.PAYMENT_METHODS) {
            PaymentMethodsScreen(
                appState = appState,
                onBack = { rootNavController.popBackStack() },
                onAddCard = { rootNavController.navigate(Routes.CARD_FORM) }
            )
        }
        composable(Routes.CARD_FORM) {
            CardFormScreen(
                appState = appState,
                onBack = { rootNavController.popBackStack() },
                onSaved = { rootNavController.popBackStack() }
            )
        }
        composable(Routes.SETTINGS) {
            SettingsScreen(
                appState = appState,
                onBack = { rootNavController.popBackStack() }
            )
        }
        composable(Routes.STATIC_PAGE) { backStackEntry ->
            val typeName = backStackEntry.arguments?.getString("pageType") ?: StaticPageType.ABOUT.name
            val pageType = StaticPageType.entries.find { it.name == typeName } ?: StaticPageType.ABOUT
            StaticPageScreen(
                pageType = pageType,
                onBack = { rootNavController.popBackStack() },
                appState = appState
            )
        }
        composable(Routes.SUBSCRIPTION) {
            SubscriptionScreen(
                appState = appState,
                onBack = { rootNavController.popBackStack() }
            )
        }
        composable(Routes.SHIPPING_OPTIONS) {
            ShippingOptionsScreen(
                appState = appState,
                onBack = { rootNavController.popBackStack() }
            )
        }
        composable(Routes.COUPONS) {
            CouponsScreen(
                appState = appState,
                onBack = { rootNavController.popBackStack() }
            )
        }
        composable(Routes.ORDER_DETAIL) { backStackEntry ->
            val orderId = backStackEntry.arguments?.getString("orderId") ?: ""
            OrderDetailScreen(
                orderId = orderId,
                appState = appState,
                onBack = { rootNavController.popBackStack() },
                onTrack = { id -> rootNavController.navigate(Routes.tracking(id)) },
                onReview = { _, productId -> rootNavController.navigate(Routes.writeReview(productId)) },
                onReturn = { id -> rootNavController.navigate(Routes.returnOrder(id)) },
                onBuyAgain = {
                    appState.buyAgain(orderId)
                    appState.requestTab(Routes.CART)
                    rootNavController.navigate("main") {
                        popUpTo("main") { inclusive = true }
                        launchSingleTop = true
                    }
                },
                onInvoice = { /* mock — nota fiscal simulada */ }
            )
        }
        composable(Routes.TRACKING) { backStackEntry ->
            val orderId = backStackEntry.arguments?.getString("orderId") ?: ""
            TrackingScreen(
                orderId = orderId,
                appState = appState,
                onBack = { rootNavController.popBackStack() }
            )
        }
        composable(Routes.WRITE_REVIEW) { backStackEntry ->
            val productId = backStackEntry.arguments?.getString("productId") ?: ""
            WriteReviewScreen(
                productId = productId,
                appState = appState,
                onBack = { rootNavController.popBackStack() },
                onSubmitted = { rootNavController.popBackStack() }
            )
        }
        composable(Routes.RETURN) { backStackEntry ->
            val orderId = backStackEntry.arguments?.getString("orderId") ?: ""
            ReturnScreen(
                orderId = orderId,
                appState = appState,
                onBack = { rootNavController.popBackStack() },
                onSubmitted = { }
            )
        }
        composable(Routes.CATEGORY) { backStackEntry ->
            val categoryId = backStackEntry.arguments?.getString("categoryId") ?: ""
            LaunchedEffect(categoryId) {
                when (categoryId) {
                    "cupons" -> rootNavController.navigate(Routes.COUPONS) {
                        popUpTo(Routes.CATEGORY) { inclusive = true }
                    }
                    else -> {
                        appState.openCategorySearch(categoryId)
                        rootNavController.navigate(Routes.SEARCH) {
                            popUpTo(Routes.CATEGORY) { inclusive = true }
                        }
                    }
                }
            }
        }
        composable(Routes.REVIEWS) { backStackEntry ->
            val productId = backStackEntry.arguments?.getString("productId") ?: ""
            ReviewsScreen(
                productId = productId,
                appState = appState,
                onBack = { rootNavController.popBackStack() },
                onWriteReview = {
                    rootNavController.navigate(Routes.writeReview(productId))
                }
            )
        }
        composable(Routes.NOTIFICATIONS) {
            NotificationsScreen(
                appState = appState,
                onBack = { rootNavController.popBackStack() }
            )
        }
        composable(Routes.HELP) {
            HelpScreen(
                appState = appState,
                onBack = { rootNavController.popBackStack() },
                onOpenTicket = { rootNavController.navigate(Routes.OPEN_TICKET) },
                onMyTickets = { rootNavController.navigate(Routes.MY_TICKETS) },
                onChatClick = { rootNavController.navigate(Routes.CHAT) }
            )
        }
        composable(Routes.OPEN_TICKET) {
            OpenTicketScreen(
                appState = appState,
                onBackToHelp = {
                    rootNavController.popBackStack(Routes.HELP, inclusive = false)
                }
            )
        }
        composable(Routes.MY_TICKETS) {
            TicketListScreen(
                appState = appState,
                onBack = { rootNavController.popBackStack() },
                onOpenTicket = { rootNavController.navigate(Routes.OPEN_TICKET) }
            )
        }
        composable(Routes.CHAT) {
            ChatScreen(
                appState = appState,
                onBack = { rootNavController.popBackStack() }
            )
        }
    }
}

@Composable
fun MainScaffold(
    appState: AppState,
    onNavigateToProduct: (String) -> Unit,
    onNavigateToCheckout: () -> Unit,
    onNavigateToSearch: () -> Unit,
    onNavigateToAccountRoute: (String) -> Unit,
    onNavigateToCoupons: () -> Unit,
    onNavigateToCategory: (String) -> Unit,
    onNavigateToOrder: (String) -> Unit,
    onNavigateToNotifications: () -> Unit
) {
    val bottomNavController = rememberNavController()
    val cartCount by appState.cartCount.collectAsState()
    val notifications by appState.notifications.collectAsState()
    val unreadCount = notifications.count { !it.isRead }
    val currentEntry by bottomNavController.currentBackStackEntryAsState()
    val currentRoute = currentEntry?.destination?.route ?: Routes.HOME
    val requestedTab by appState.requestedTab.collectAsState()

    LaunchedEffect(requestedTab) {
        requestedTab?.let { route ->
            bottomNavController.navigate(route) {
                popUpTo(bottomNavController.graph.findStartDestination().id) {
                    saveState = true
                }
                launchSingleTop = true
                restoreState = true
            }
            appState.consumeRequestedTab()
        }
    }

    Scaffold(
        containerColor = Surface,
        topBar = {
            when (currentRoute) {
                Routes.HOME -> HomeAppBar(
                    onSearchClick = onNavigateToSearch,
                    cartCount = cartCount,
                    onCartClick = {
                        bottomNavController.navigate(Routes.CART) {
                            popUpTo(bottomNavController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    notificationCount = unreadCount,
                    onNotificationsClick = onNavigateToNotifications
                )
                Routes.FAVORITES -> SimpleAppBar(title = "Favoritos")
                Routes.CART -> SimpleAppBar(title = "Carrinho")
                Routes.ORDERS -> SimpleAppBar(title = "Minhas Compras")
                Routes.ACCOUNT -> SimpleAppBar(title = "Minha Conta")
                else -> {}
            }
        },
        bottomBar = {
            BottomNavBar(
                items = bottomNavItems(cartCount),
                selectedRoute = currentRoute,
                onItemClick = { route ->
                    bottomNavController.navigate(route) {
                        popUpTo(bottomNavController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        }
    ) { innerPadding ->
        NavHost(
            navController = bottomNavController,
            startDestination = Routes.HOME,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Routes.HOME) {
                HomeScreen(
                    appState = appState,
                    onProductClick = onNavigateToProduct,
                    onSearchClick = onNavigateToSearch,
                    onCouponsClick = onNavigateToCoupons,
                    onCategoryClick = onNavigateToCategory,
                    modifier = Modifier.fillMaxSize()
                )
            }
            composable(Routes.FAVORITES) {
                FavoritesScreen(
                    appState = appState,
                    onProductClick = onNavigateToProduct,
                    onGoHome = {
                        bottomNavController.navigate(Routes.HOME) {
                            launchSingleTop = true
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }
            composable(Routes.CART) {
                CartScreen(
                    appState = appState,
                    onCheckout = onNavigateToCheckout,
                    onCoupons = onNavigateToCoupons,
                    onGoHome = {
                        bottomNavController.navigate(Routes.HOME) {
                            launchSingleTop = true
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }
            composable(Routes.ORDERS) {
                OrdersScreen(
                    appState = appState,
                    onExploreProducts = {
                        bottomNavController.navigate(Routes.HOME) {
                            launchSingleTop = true
                        }
                    },
                    onOrderClick = onNavigateToOrder,
                    modifier = Modifier.fillMaxSize()
                )
            }
            composable(Routes.ACCOUNT) {
                AccountScreen(
                    appState = appState,
                    onLogout = {
                        appState.isLoggedIn.value = false
                    },
                    onGoOrders = { appState.requestTab(Routes.ORDERS) },
                    onGoFavorites = { appState.requestTab(Routes.FAVORITES) },
                    onEditProfile = { onNavigateToAccountRoute(Routes.EDIT_PROFILE) },
                    onAddresses = { onNavigateToAccountRoute(Routes.ADDRESS_LIST) },
                    onPaymentMethods = { onNavigateToAccountRoute(Routes.PAYMENT_METHODS) },
                    onNotifications = { onNavigateToAccountRoute(Routes.NOTIFICATIONS) },
                    onHelp = { onNavigateToAccountRoute(Routes.HELP) },
                    onStaticPage = { type -> onNavigateToAccountRoute(Routes.staticPage(type)) },
                    onSubscription = { onNavigateToAccountRoute(Routes.SUBSCRIPTION) },
                    onSettings = { onNavigateToAccountRoute(Routes.SETTINGS) },
                    onCoupons = onNavigateToCoupons,
                    modifier = Modifier.fillMaxSize()
                )
            }
        }
    }
}
