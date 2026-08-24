package com.citybox.data

object MockData {
    val user = User(
        name = "Camila Souza",
        email = "camila@email.com",
        phone = "(11) 98765-4321",
        avatarInitial = "C",
        isPlus = true
    )

    const val DEMO_PASSWORD = "123456"
    const val MOCK_RESET_TOKEN = "mock-reset-token"

    val categories = listOf(
        Category("ofertas", "Ofertas", "🏷️", 0xFFFDE8E8),
        Category("supermercado", "Mercado", "🛒", 0xFFE6F4EA),
        Category("moda", "Moda", "👕", 0xFFEDE9FB),
        Category("tecnologia", "Tecnologia", "📱", 0xFFE7F0FE),
        Category("casa", "Casa", "🛋️", 0xFFFBF1E3),
        Category("beleza", "Beleza", "💄", 0xFFFDE8F3),
        Category("esportes", "Esportes", "⚽", 0xFFE6F4EA),
        Category("cupons", "Cupons", "🎟️", 0xFFFFF4D6)
    )

    val products = listOf(
        Product(
            id = "iphone15pro",
            name = "iPhone 15 Pro Max 256GB",
            imageUrl = "https://picsum.photos/seed/iphone/300/300",
            price = 6999.0,
            originalPrice = 8499.0,
            discountPercent = 18,
            rating = 4.9f,
            reviewCount = 2341,
            isFreeShipping = true,
            isExpress = true,
            category = "Smartphones",
            specs = mapOf(
                "Cor" to "Titânio Natural",
                "Armazenamento" to "256GB",
                "Tela" to "6.7\"",
                "Câmera" to "48MP"
            )
        ),
        Product(
            id = "galaxy-s24-ultra",
            name = "Samsung Galaxy S24 Ultra",
            imageUrl = "https://picsum.photos/seed/samsung/300/300",
            price = 5499.0,
            originalPrice = 6799.0,
            discountPercent = 19,
            rating = 4.8f,
            reviewCount = 1876,
            isFreeShipping = true,
            isExpress = false,
            category = "Smartphones",
            specs = mapOf(
                "Cor" to "Preto",
                "Armazenamento" to "256GB",
                "Tela" to "6.8\"",
                "Câmera" to "200MP"
            )
        ),
        Product(
            id = "ps5",
            name = "PlayStation 5",
            imageUrl = "https://picsum.photos/seed/ps5/300/300",
            price = 3799.0,
            originalPrice = 4499.0,
            discountPercent = 15,
            rating = 4.9f,
            reviewCount = 4523,
            isFreeShipping = true,
            isExpress = false,
            category = "Games",
            specs = mapOf(
                "Cor" to "Branco",
                "Armazenamento" to "825GB SSD",
                "Resolução" to "4K",
                "Leitor" to "Blu-ray"
            )
        ),
        Product(
            id = "macbook-air-m3",
            name = "MacBook Air M3",
            imageUrl = "https://picsum.photos/seed/macbook/300/300",
            price = 9499.0,
            originalPrice = 11999.0,
            discountPercent = 21,
            rating = 4.9f,
            reviewCount = 987,
            isFreeShipping = true,
            isExpress = true,
            category = "Notebooks",
            specs = mapOf(
                "Cor" to "Midnight",
                "Memória" to "8GB",
                "Armazenamento" to "256GB SSD",
                "Tela" to "13.6\""
            )
        ),
        Product(
            id = "airpods-pro",
            name = "AirPods Pro 2ª Geração",
            imageUrl = "https://picsum.photos/seed/airpods/300/300",
            price = 1799.0,
            originalPrice = 2299.0,
            discountPercent = 22,
            rating = 4.7f,
            reviewCount = 3211,
            isFreeShipping = true,
            isExpress = true,
            category = "Áudio",
            specs = mapOf(
                "Cor" to "Branco",
                "Cancelamento" to "Ativo",
                "Autonomia" to "30h",
                "Conexão" to "Bluetooth 5.3"
            )
        ),
        Product(
            id = "smart-tv-samsung",
            name = "Smart TV Samsung 55\" QLED",
            imageUrl = "https://picsum.photos/seed/tv/300/300",
            price = 2699.0,
            originalPrice = 3499.0,
            discountPercent = 23,
            rating = 4.6f,
            reviewCount = 1543,
            isFreeShipping = true,
            isExpress = false,
            category = "TVs",
            specs = mapOf(
                "Tamanho" to "55\"",
                "Resolução" to "4K QLED",
                "HDR" to "Quantum HDR",
                "Sistema" to "Tizen"
            )
        ),
        Product(
            id = "kindle",
            name = "Kindle Paperwhite",
            imageUrl = "https://picsum.photos/seed/kindle/300/300",
            price = 499.0,
            originalPrice = 649.0,
            discountPercent = 23,
            rating = 4.8f,
            reviewCount = 8734,
            isFreeShipping = true,
            isExpress = false,
            category = "E-Readers",
            specs = mapOf(
                "Cor" to "Preto",
                "Armazenamento" to "16GB",
                "Tela" to "6.8\"",
                "Autonomia" to "10 semanas"
            )
        ),
        Product(
            id = "nintendo-switch",
            name = "Nintendo Switch OLED",
            imageUrl = "https://picsum.photos/seed/switch/300/300",
            price = 2299.0,
            originalPrice = 2799.0,
            discountPercent = 18,
            rating = 4.8f,
            reviewCount = 2109,
            isFreeShipping = true,
            isExpress = false,
            category = "Games",
            specs = mapOf(
                "Cor" to "Branco",
                "Tela" to "7\" OLED",
                "Armazenamento" to "64GB",
                "Modos" to "Portátil/TV/Mesa"
            )
        )
    )

    val addresses = listOf(
        Address(
            id = "addr-1",
            label = "Casa",
            zipCode = "01310-100",
            street = "Rua das Flores",
            number = "123",
            complement = "Apto 45",
            neighborhood = "Bela Vista",
            city = "São Paulo",
            state = "SP",
            isDefault = true
        ),
        Address(
            id = "addr-2",
            label = "Trabalho",
            zipCode = "04543-011",
            street = "Av. Brigadeiro Faria Lima",
            number = "3477",
            complement = "Sala 1201",
            neighborhood = "Itaim Bibi",
            city = "São Paulo",
            state = "SP",
            isDefault = false
        ),
        Address(
            id = "addr-3",
            label = "Casa dos pais",
            zipCode = "30130-100",
            street = "Rua da Bahia",
            number = "890",
            neighborhood = "Centro",
            city = "Belo Horizonte",
            state = "MG",
            isDefault = false
        )
    )

    val paymentMethods = listOf(
        PaymentMethod(
            id = "card-1",
            brand = CardBrand.VISA,
            lastFour = "4242",
            expiry = "12/28",
            holderName = "Camila Souza",
            label = "Principal",
            isDefault = true
        ),
        PaymentMethod(
            id = "card-2",
            brand = CardBrand.MASTERCARD,
            lastFour = "8888",
            expiry = "06/27",
            holderName = "Camila Souza",
            label = "Backup",
            isDefault = false
        )
    )

    val reviews = mapOf(
        "iphone15pro" to listOf(
            Review("r1", "iphone15pro", "Ana Paula", 5, "15/03/2024", "Produto excelente, entrega rápida!"),
            Review("r2", "iphone15pro", "Carlos M.", 5, "10/03/2024", "Melhor iPhone que já tive."),
            Review("r3", "iphone15pro", "Juliana R.", 4, "05/03/2024", "Ótimo, mas caro demais.")
        ),
        "airpods-pro" to listOf(
            Review("r4", "airpods-pro", "Pedro S.", 5, "20/02/2024", "Cancelamento de ruído impecável."),
            Review("r5", "airpods-pro", "Marina L.", 4, "18/02/2024", "Som muito bom, case poderia ser menor.")
        )
    )

    val coupons = listOf(
        Coupon("PRIMEIRA10", "10% na primeira compra", CouponType.PERCENT, 10.0, "31/12/2024"),
        Coupon("FRETEGRATIS", "Frete grátis acima de R$ 99", CouponType.FIXED, 15.0, "30/06/2024"),
        Coupon("TECH50", "R$ 50 off em tecnologia", CouponType.FIXED, 50.0, "15/08/2024")
    )

    val notifications = listOf(
        AppNotification("n1", NotificationType.ORDER, "Pedido a caminho", "Seu pedido CB-001234 saiu para entrega.", "Há 2h", false),
        AppNotification("n2", NotificationType.PROMO, "Oferta relâmpago", "Smartphones com até 30% off hoje!", "Há 5h", false),
        AppNotification("n3", NotificationType.ORDER, "Pedido entregue", "Seu pedido CB-001100 foi entregue.", "Ontem", true),
        AppNotification("n4", NotificationType.SYSTEM, "CityBox+ renovado", "Sua assinatura foi renovada com sucesso.", "3 dias", true),
        AppNotification("n5", NotificationType.PROMO, "Cupom exclusivo", "Use TECH50 e ganhe R$ 50 off.", "1 semana", true)
    )

    val faqItems = listOf(
        FaqItem("Como rastrear meu pedido?", "Acesse Minhas Compras, toque no pedido e use o botão Rastrear para ver a timeline e o código de rastreio."),
        FaqItem("Como cancelar uma compra?", "Pedidos ainda não enviados podem ser cancelados em Detalhe do pedido → Cancelar. Após o envio, solicite devolução."),
        FaqItem("Quais formas de pagamento aceitas?", "Aceitamos PIX (5% off), cartão de crédito e boleto bancário. Cartões salvos ficam em Meus Cartões."),
        FaqItem("Como funciona o frete grátis?", "Clientes CityBox+ têm frete grátis em compras elegíveis. Confira o banner na Home e opções no checkout."),
        FaqItem("Como usar um cupom?", "Digite o código no Carrinho ou Checkout, ou escolha um cupom disponível em Conta → Cupons."),
        FaqItem("Como alterar meu endereço?", "Em Conta → Endereços você pode adicionar, editar ou definir o endereço padrão. No checkout, use Alterar."),
        FaqItem("O que é o CityBox+?", "Assinatura com entregas grátis e benefícios exclusivos. Gerencie em Conta → banner CityBox+.")
    )

    val chatMessages = listOf(
        ChatMessage("c1", "Olá! Sou a assistente CityBox. Como posso ajudar?", true, "09:00"),
        ChatMessage("c2", "Quero saber sobre meu pedido CB-001234", false, "09:01"),
        ChatMessage("c3", "Seu pedido CB-001234 está a caminho e deve chegar amanhã até 22h. Posso ajudar com mais alguma coisa?", true, "09:01")
    )

    val shippingOptions = listOf(
        ShippingOption("express", "Express", "Amanhã até 22h", 0.0, isExpress = true),
        ShippingOption("normal", "Normal", "3 a 5 dias úteis", 12.90),
        ShippingOption("economico", "Econômico", "7 a 10 dias úteis", 7.90)
    )

    val orders = listOf(
        Order(
            id = "CB-001234",
            items = listOf(CartItem(products[0], 1)),
            total = 6999.0,
            status = OrderStatus.SHIPPED,
            deliveryDate = "amanhã até 22h",
            address = addresses[0],
            paymentMethod = paymentMethods[0],
            subtotal = 6999.0,
            shipping = 0.0,
            trackingCode = "BR123456789CB",
            statusHistory = listOf(
                OrderStatusEntry(OrderStatus.CONFIRMED, "12/03 10:30", "São Paulo, SP"),
                OrderStatusEntry(OrderStatus.PREPARING, "12/03 14:00", "Centro de distribuição"),
                OrderStatusEntry(OrderStatus.SHIPPED, "13/03 08:15", "Em trânsito")
            )
        ),
        Order(
            id = "CB-001100",
            items = listOf(CartItem(products[4], 1), CartItem(products[6], 1)),
            total = 2298.0,
            status = OrderStatus.DELIVERED,
            deliveryDate = "entregue",
            address = addresses[0],
            paymentMethod = paymentMethods[0],
            subtotal = 2298.0,
            trackingCode = "BR987654321CB",
            statusHistory = listOf(
                OrderStatusEntry(OrderStatus.CONFIRMED, "08/03 09:00", "São Paulo, SP"),
                OrderStatusEntry(OrderStatus.PREPARING, "08/03 15:30", "Centro de distribuição"),
                OrderStatusEntry(OrderStatus.SHIPPED, "09/03 07:00", "Em trânsito"),
                OrderStatusEntry(OrderStatus.DELIVERED, "10/03 14:22", "Entregue")
            )
        )
    )

    val homeSections = listOf(
        HomeSection(
            id = "daily-deals",
            title = "Ofertas do dia",
            productIds = listOf("iphone15pro", "galaxy-s24-ultra", "ps5", "macbook-air-m3")
        ),
        HomeSection(
            id = "best-sellers",
            title = "Mais vendidos",
            productIds = listOf("nintendo-switch", "kindle", "smart-tv-samsung", "airpods-pro")
        ),
    )

    fun productsForHomeSection(sectionId: String, catalog: List<Product> = products): List<Product> {
        val section = homeSections.find { it.id == sectionId }
        if (section != null) {
            val resolved = section.productIds.mapNotNull { id -> catalog.find { it.id == id } }
            if (resolved.isNotEmpty()) return resolved
        }
        return when (sectionId) {
            "daily-deals" -> catalog.take(4)
            "best-sellers" -> catalog.reversed().take(4)
            else -> catalog
        }
    }

    val homeShortcuts = categories.map {
        HomeShortcut(it.id, it.name, it.icon, it.colorHex)
    }

    val searchSuggestions = listOf(
        "iPhone", "AirPods", "PlayStation", "MacBook", "TV Samsung", "Kindle"
    )

    val brands = listOf("Apple", "Samsung", "Sony", "Nintendo")

    fun productBrand(product: Product): String = when {
        product.name.contains("iPhone", ignoreCase = true) ||
            product.name.contains("MacBook", ignoreCase = true) ||
            product.name.contains("AirPods", ignoreCase = true) ||
            product.name.contains("Kindle", ignoreCase = true) -> "Apple"
        product.name.contains("Samsung", ignoreCase = true) ||
            product.name.contains("Galaxy", ignoreCase = true) -> "Samsung"
        product.name.contains("PlayStation", ignoreCase = true) -> "Sony"
        product.name.contains("Nintendo", ignoreCase = true) -> "Nintendo"
        else -> "Outros"
    }

    fun productsForCategory(categoryId: String, allProducts: List<Product> = products): List<Product> =
        when (categoryId) {
            "ofertas" -> allProducts.filter { it.discountPercent >= 15 }
            "supermercado" -> allProducts.filter { it.price <= 600 }
            "moda" -> allProducts.filter { it.category == "Áudio" || it.name.contains("AirPods", ignoreCase = true) }
            "tecnologia" -> allProducts.filter {
                it.category in setOf("Smartphones", "Notebooks", "Áudio", "TVs", "E-Readers", "Games")
            }
            "casa" -> allProducts.filter { it.category in setOf("TVs", "E-Readers") }
            "beleza" -> allProducts.filter { it.category == "Áudio" }
            "esportes" -> allProducts.filter { it.category == "Games" }
            else -> allProducts
        }

    fun categoryById(categoryId: String): Category? = categories.find { it.id == categoryId }

    val staticPageContent = mapOf(
        StaticPageType.ABOUT to "O CityBox é o marketplace que conecta você aos melhores produtos com entrega expressa. Fundado em 2020, já entregamos milhões de pedidos com satisfação garantida.",
        StaticPageType.TERMS to "Termos de Uso do CityBox. Ao utilizar nossos serviços, você concorda com as condições de compra, política de devolução em até 7 dias e proteção ao consumidor conforme o CDC.",
        StaticPageType.PRIVACY to "Política de Privacidade. Seus dados são protegidos conforme a LGPD. Coletamos apenas informações necessárias para processar pedidos e melhorar sua experiência."
    )

    val tickets = listOf(
        SupportTicket(
            ticketId = "TKT-0001",
            status = "OPEN",
            subject = "Produto não chegou",
            message = "Meu pedido #CB-0001 estava previsto para ontem mas não chegou.",
            orderId = null
        ),
        SupportTicket(
            ticketId = "TKT-0002",
            status = "CLOSED",
            subject = "Cobrança duplicada",
            message = "Fui cobrado duas vezes no cartão para o pedido #CB-0002.",
            orderId = null
        )
    )

    val subscriptionRenewalDate = "15/07/2024"
    val subscriptionBenefits = listOf(
        "Frete grátis em todas as compras",
        "Entrega expressa prioritária",
        "Cashback de 5% em cada pedido",
        "Acesso antecipado a ofertas",
        "Suporte prioritário 24h"
    )
}
