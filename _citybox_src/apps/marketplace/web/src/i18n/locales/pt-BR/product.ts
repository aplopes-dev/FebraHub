export default {
  page: {
    screenLabel: 'Produto Web',
    backToList: 'Voltar à lista',
    breadcrumb: 'Tecnologia › Celulares',
    condition: 'Novo | +{{count}} vendidos',
    viewReviews: 'Ver avaliações',
    characteristics: 'Características',
    specs: {
      color: 'Cor',
      colorValue: 'Preto',
      storage: 'Memória interna',
      storageValue: '256 GB',
      screen: 'Tela',
      screenValue: '6.6" Super AMOLED',
    },
  },
  buyPanel: {
    freeShipping: 'Frete grátis',
    expressBy: 'por CityBox',
    expressBrand: 'Express',
    stockAvailable: 'Estoque disponível',
    soldBy: 'Vendido por',
    buyNow: 'Comprar agora',
    addToCart: 'Adicionar ao carrinho',
    addShort: 'Adicionar',
    freeReturn: 'Devolução grátis em 30 dias',
    guaranteedPurchase: 'Compra Garantida',
  },
  delivery: {
    tomorrow: 'Chega amanhã ✓',
    checkCheckout: 'Consulte o prazo no checkout',
    arrivesIn: 'Chega em {{estimate}}',
    expressTomorrow: 'Chega amanhã ✓',
  },
  installments: {
    cash: 'à vista',
    inInstallments: 'em {{count}}x R$ {{price}} sem juros',
  },
  pricing: {
    discountOff: '{{percent}}% OFF',
  },
} as const;
