import Foundation

enum MockData {
    static let user = User(
        name: "Camila Souza",
        email: "camila@email.com",
        phone: "(11) 98765-4321",
        avatarInitial: "C",
        isPlus: true
    )

    static let demoPassword = "123456"
    static let mockResetToken = "mock-reset-token"

    static let categories: [Category] = [
        Category(id: "ofertas", name: "Ofertas", icon: "🏷️", colorHex: "FDE8E8"),
        Category(id: "supermercado", name: "Mercado", icon: "🛒", colorHex: "E6F4EA"),
        Category(id: "moda", name: "Moda", icon: "👕", colorHex: "EDE9FB"),
        Category(id: "tecnologia", name: "Tecnologia", icon: "📱", colorHex: "E7F0FE"),
        Category(id: "casa", name: "Casa", icon: "🛋️", colorHex: "FBF1E3"),
        Category(id: "beleza", name: "Beleza", icon: "💄", colorHex: "FDE8F3"),
        Category(id: "esportes", name: "Esportes", icon: "⚽", colorHex: "E6F4EA"),
        Category(id: "cupons", name: "Cupons", icon: "🎟️", colorHex: "FFF4D6")
    ]

    static let products: [Product] = [
        Product(
            id: "iphone15",
            name: "iPhone 15 Pro Max 256GB Titânio Natural",
            imageURL: "https://picsum.photos/seed/iphone15/400/400",
            price: 6999,
            originalPrice: 8499,
            discountPercent: 18,
            rating: 4.9,
            reviewCount: 2341,
            isFreeShipping: true,
            isExpress: true,
            category: "Smartphones",
            specs: ["Cor": "Titânio Natural", "Armazenamento": "256GB", "Tela": "6.7\""]
        ),
        Product(
            id: "macbook-air",
            name: "MacBook Air M2 13\" 8GB 256GB Meia-Noite",
            imageURL: "https://picsum.photos/seed/macbookair/400/400",
            price: 8499,
            originalPrice: 9999,
            discountPercent: 15,
            rating: 4.8,
            reviewCount: 1876,
            isFreeShipping: true,
            isExpress: false,
            category: "Notebooks",
            specs: ["Chip": "Apple M2", "RAM": "8GB", "SSD": "256GB"]
        ),
        Product(
            id: "samsung-s24",
            name: "Samsung Galaxy S24 Ultra 256GB Titânio Preto",
            imageURL: "https://picsum.photos/seed/samsungs24/400/400",
            price: 5499,
            originalPrice: 6799,
            discountPercent: 19,
            rating: 4.7,
            reviewCount: 987,
            isFreeShipping: true,
            isExpress: true,
            category: "Smartphones",
            specs: ["Cor": "Titânio Preto", "Armazenamento": "256GB", "Tela": "6.8\""]
        ),
        Product(
            id: "airpods-pro",
            name: "AirPods Pro 2ª Geração com MagSafe",
            imageURL: "https://picsum.photos/seed/airpodspro/400/400",
            price: 1799,
            originalPrice: 2199,
            discountPercent: 18,
            rating: 4.9,
            reviewCount: 4512,
            isFreeShipping: true,
            isExpress: true,
            category: "Áudio",
            specs: ["Geração": "2ª", "Conexão": "Bluetooth 5.3", "Case": "MagSafe"]
        ),
        Product(
            id: "ipad-pro",
            name: "iPad Pro M4 11\" WiFi 256GB Preto Espacial",
            imageURL: "https://picsum.photos/seed/ipadpro/400/400",
            price: 7299,
            originalPrice: 8999,
            discountPercent: 19,
            rating: 4.8,
            reviewCount: 654,
            isFreeShipping: true,
            isExpress: false,
            category: "Tablets",
            specs: ["Chip": "Apple M4", "Tela": "11\"", "Armazenamento": "256GB"]
        ),
        Product(
            id: "sony-wh1000xm5",
            name: "Sony WH-1000XM5 Headphone Bluetooth Noise Cancelling",
            imageURL: "https://picsum.photos/seed/sonywh/400/400",
            price: 1699,
            originalPrice: 2299,
            discountPercent: 26,
            rating: 4.8,
            reviewCount: 3201,
            isFreeShipping: true,
            isExpress: false,
            category: "Áudio",
            specs: ["Tipo": "Over-ear", "Conexão": "Bluetooth 5.2", "Bateria": "30h"]
        ),
        Product(
            id: "dell-xps15",
            name: "Dell XPS 15 Intel Core i7 16GB 512GB OLED",
            imageURL: "https://picsum.photos/seed/dellxps/400/400",
            price: 11999,
            originalPrice: 13999,
            discountPercent: 14,
            rating: 4.6,
            reviewCount: 423,
            isFreeShipping: true,
            isExpress: false,
            category: "Notebooks",
            specs: ["Processador": "Intel i7", "RAM": "16GB", "SSD": "512GB"]
        ),
        Product(
            id: "apple-watch-s9",
            name: "Apple Watch Series 9 GPS 45mm Alumínio Estelar",
            imageURL: "https://picsum.photos/seed/applewatch/400/400",
            price: 3299,
            originalPrice: 3999,
            discountPercent: 18,
            rating: 4.7,
            reviewCount: 1543,
            isFreeShipping: true,
            isExpress: true,
            category: "Wearables",
            specs: ["Tamanho": "45mm", "GPS": "Sim", "Material": "Alumínio"]
        )
    ]

    static let addresses: [Address] = [
        Address(
            id: "addr-1", label: "Casa", zipCode: "01310-100",
            street: "Rua das Flores", number: "123", complement: "Apto 45",
            neighborhood: "Bela Vista", city: "São Paulo", state: "SP", isDefault: true
        ),
        Address(
            id: "addr-2", label: "Trabalho", zipCode: "04543-011",
            street: "Av. Brigadeiro Faria Lima", number: "3477", complement: "Sala 1201",
            neighborhood: "Itaim Bibi", city: "São Paulo", state: "SP", isDefault: false
        ),
        Address(
            id: "addr-3", label: "Casa dos pais", zipCode: "30130-100",
            street: "Rua da Bahia", number: "890", complement: "",
            neighborhood: "Centro", city: "Belo Horizonte", state: "MG", isDefault: false
        )
    ]

    static let paymentMethods: [PaymentMethod] = [
        PaymentMethod(
            id: "card-1", brand: .visa, lastFour: "4242", expiry: "12/28",
            holderName: "Camila Souza", label: "Principal", isDefault: true
        ),
        PaymentMethod(
            id: "card-2", brand: .mastercard, lastFour: "8888", expiry: "06/27",
            holderName: "Camila Souza", label: "Backup", isDefault: false
        )
    ]

    static let reviews: [String: [Review]] = [
        "iphone15": [
            Review(id: "r1", productId: "iphone15", author: "Ana Paula", rating: 5, date: "15/03/2024", text: "Produto excelente, entrega rápida!", photoURLs: []),
            Review(id: "r2", productId: "iphone15", author: "Carlos M.", rating: 5, date: "10/03/2024", text: "Melhor iPhone que já tive.", photoURLs: []),
            Review(id: "r3", productId: "iphone15", author: "Juliana R.", rating: 4, date: "05/03/2024", text: "Ótimo, mas caro demais.", photoURLs: [])
        ],
        "airpods-pro": [
            Review(id: "r4", productId: "airpods-pro", author: "Pedro S.", rating: 5, date: "20/02/2024", text: "Cancelamento de ruído impecável.", photoURLs: []),
            Review(id: "r5", productId: "airpods-pro", author: "Marina L.", rating: 4, date: "18/02/2024", text: "Som muito bom, case poderia ser menor.", photoURLs: [])
        ]
    ]

    static let coupons: [Coupon] = [
        Coupon(code: "PRIMEIRA10", description: "10% na primeira compra", type: .percent, value: 10, expiry: "31/12/2024"),
        Coupon(code: "FRETEGRATIS", description: "Frete grátis acima de R$ 99", type: .fixed, value: 15, expiry: "30/06/2024"),
        Coupon(code: "TECH50", description: "R$ 50 off em tecnologia", type: .fixed, value: 50, expiry: "15/08/2024")
    ]

    static let notifications: [AppNotification] = [
        AppNotification(id: "n1", type: .order, title: "Pedido a caminho", body: "Seu pedido CB-001234 saiu para entrega.", date: "Há 2h", isRead: false),
        AppNotification(id: "n2", type: .promo, title: "Oferta relâmpago", body: "Smartphones com até 30% off hoje!", date: "Há 5h", isRead: false),
        AppNotification(id: "n3", type: .order, title: "Pedido entregue", body: "Seu pedido CB-001100 foi entregue.", date: "Ontem", isRead: true),
        AppNotification(id: "n4", type: .system, title: "CityBox+ renovado", body: "Sua assinatura foi renovada com sucesso.", date: "3 dias", isRead: true),
        AppNotification(id: "n5", type: .promo, title: "Cupom exclusivo", body: "Use TECH50 e ganhe R$ 50 off.", date: "1 semana", isRead: true)
    ]

    static let faqItems: [FaqItem] = [
        FaqItem(question: "Como rastrear meu pedido?", answer: "Acesse Minhas Compras, toque no pedido e use o botão Rastrear para ver a timeline e o código de rastreio."),
        FaqItem(question: "Como cancelar uma compra?", answer: "Pedidos ainda não enviados podem ser cancelados em Detalhe do pedido → Cancelar. Após o envio, solicite devolução."),
        FaqItem(question: "Quais formas de pagamento aceitas?", answer: "Aceitamos PIX (5% off), cartão de crédito e boleto bancário. Cartões salvos ficam em Meus Cartões."),
        FaqItem(question: "Como funciona o frete grátis?", answer: "Clientes CityBox+ têm frete grátis em compras elegíveis. Confira o banner na Home e opções no checkout."),
        FaqItem(question: "Como usar um cupom?", answer: "Digite o código no Carrinho ou Checkout, ou escolha um cupom disponível em Conta → Cupons."),
        FaqItem(question: "Como alterar meu endereço?", answer: "Em Conta → Endereços você pode adicionar, editar ou definir o endereço padrão. No checkout, use Alterar."),
        FaqItem(question: "O que é o CityBox+?", answer: "Assinatura com entregas grátis e benefícios exclusivos. Gerencie em Conta → banner CityBox+.")
    ]

    static let chatMessages: [ChatMessage] = [
        ChatMessage(id: "c1", text: "Olá! Sou a assistente CityBox. Como posso ajudar?", isAgent: true, time: "09:00"),
        ChatMessage(id: "c2", text: "Quero saber sobre meu pedido CB-001234", isAgent: false, time: "09:01"),
        ChatMessage(id: "c3", text: "Seu pedido CB-001234 está a caminho e deve chegar amanhã até 22h. Posso ajudar com mais alguma coisa?", isAgent: true, time: "09:01")
    ]

    static let shippingOptions: [ShippingOption] = [
        ShippingOption(id: "express", name: "Express", deliveryEstimate: "Amanhã até 22h", price: 0, isExpress: true),
        ShippingOption(id: "normal", name: "Normal", deliveryEstimate: "3 a 5 dias úteis", price: 12.90, isExpress: false),
        ShippingOption(id: "economico", name: "Econômico", deliveryEstimate: "7 a 10 dias úteis", price: 7.90, isExpress: false)
    ]

    static let orders: [Order] = [
        Order(
            id: "CB-20240315-001",
            items: [CartItem(product: products[0], quantity: 1)],
            total: 6999,
            status: .shipped,
            deliveryDate: "Amanhã até 22h",
            address: addresses[0],
            paymentMethod: paymentMethods[0],
            subtotal: 6999,
            shipping: 0,
            discount: 0,
            trackingCode: "BR123456789CB",
            statusHistory: [
                OrderStatusEntry(status: .confirmed, date: "12/03 10:30", location: "São Paulo, SP"),
                OrderStatusEntry(status: .preparing, date: "12/03 14:00", location: "Centro de distribuição"),
                OrderStatusEntry(status: .shipped, date: "13/03 08:15", location: "Em trânsito")
            ]
        ),
        Order(
            id: "CB-20240310-002",
            items: [
                CartItem(product: products[3], quantity: 1),
                CartItem(product: products[7], quantity: 1)
            ],
            total: 5098,
            status: .delivered,
            deliveryDate: "Entregue em 12/03",
            address: addresses[0],
            paymentMethod: paymentMethods[0],
            subtotal: 5098,
            shipping: 0,
            discount: 0,
            trackingCode: "BR987654321CB",
            statusHistory: [
                OrderStatusEntry(status: .confirmed, date: "08/03 09:00", location: "São Paulo, SP"),
                OrderStatusEntry(status: .preparing, date: "08/03 15:30", location: "Centro de distribuição"),
                OrderStatusEntry(status: .shipped, date: "09/03 07:00", location: "Em trânsito"),
                OrderStatusEntry(status: .delivered, date: "10/03 14:22", location: "Entregue")
            ]
        )
    ]

    static let homeSections: [HomeSection] = [
        HomeSection(
            id: "daily-deals",
            title: "Ofertas do dia",
            productIds: ["iphone15", "macbook-air", "samsung-s24", "airpods-pro"]
        ),
        HomeSection(
            id: "best-sellers",
            title: "Mais vendidos",
            productIds: ["apple-watch-s9", "dell-xps15", "sony-wh1000xm5", "ipad-pro"]
        ),
    ]

    static func productsForHomeSection(_ sectionId: String, from catalog: [Product] = products) -> [Product] {
        if let section = homeSections.first(where: { $0.id == sectionId }) {
            let resolved = section.productIds.compactMap { id in catalog.first { $0.id == id } }
            if !resolved.isEmpty { return resolved }
        }
        switch sectionId {
        case "daily-deals": return Array(catalog.prefix(4))
        case "best-sellers": return Array(catalog.reversed().prefix(4))
        default: return catalog
        }
    }

    static let homeShortcuts: [HomeShortcut] = categories.map {
        HomeShortcut(categoryId: $0.id, label: $0.name, icon: $0.icon, backgroundHex: $0.colorHex)
    }

    static let searchSuggestions = [
        "iPhone", "AirPods", "PlayStation", "MacBook", "TV Samsung", "Kindle"
    ]

    static let brands = ["Apple", "Samsung", "Sony", "Nintendo"]

    static func productBrand(_ product: Product) -> String {
        let name = product.name
        if name.localizedCaseInsensitiveContains("iPhone") ||
            name.localizedCaseInsensitiveContains("MacBook") ||
            name.localizedCaseInsensitiveContains("AirPods") ||
            name.localizedCaseInsensitiveContains("Kindle") {
            return "Apple"
        }
        if name.localizedCaseInsensitiveContains("Samsung") || name.localizedCaseInsensitiveContains("Galaxy") {
            return "Samsung"
        }
        if name.localizedCaseInsensitiveContains("PlayStation") { return "Sony" }
        if name.localizedCaseInsensitiveContains("Nintendo") { return "Nintendo" }
        return "Outros"
    }

    static func productsForCategory(_ categoryId: String, from allProducts: [Product] = products) -> [Product] {
        switch categoryId {
        case "ofertas":
            return allProducts.filter { $0.discountPercent >= 15 }
        case "supermercado":
            return allProducts.filter { $0.price <= 600 }
        case "moda":
            return allProducts.filter {
                $0.category == "Áudio" || $0.name.localizedCaseInsensitiveContains("AirPods")
            }
        case "tecnologia":
            return allProducts.filter {
                ["Smartphones", "Notebooks", "Áudio", "TVs", "E-Readers", "Games"].contains($0.category)
            }
        case "casa":
            return allProducts.filter { ["TVs", "E-Readers"].contains($0.category) }
        case "beleza":
            return allProducts.filter { $0.category == "Áudio" }
        case "esportes":
            return allProducts.filter { $0.category == "Games" }
        default:
            return allProducts
        }
    }

    static func categoryById(_ categoryId: String) -> Category? {
        categories.first { $0.id == categoryId }
    }

    static let staticPageContent: [StaticPageType: String] = [
        .about: "O CityBox é o marketplace que conecta você aos melhores produtos com entrega expressa. Fundado em 2020, já entregamos milhões de pedidos com satisfação garantida.",
        .terms: "Termos de Uso do CityBox. Ao utilizar nossos serviços, você concorda com as condições de compra, política de devolução em até 7 dias e proteção ao consumidor conforme o CDC.",
        .privacy: "Política de Privacidade. Seus dados são protegidos conforme a LGPD. Coletamos apenas informações necessárias para processar pedidos e melhorar sua experiência."
    ]

    static let subscriptionRenewalDate = "15/07/2024"
    static let subscriptionBenefits = [
        "Frete grátis em todas as compras",
        "Entrega expressa prioritária",
        "Cashback de 5% em cada pedido",
        "Acesso antecipado a ofertas",
        "Suporte prioritário 24h"
    ]
}
