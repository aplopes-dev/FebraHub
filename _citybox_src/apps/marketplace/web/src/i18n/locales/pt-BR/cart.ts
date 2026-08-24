export default {
  page: {
    title: 'Carrinho',
  },
  empty: {
    title: 'Seu carrinho está vazio',
    action: 'Ver ofertas',
  },
  summary: {
    title: 'Resumo da compra',
    productsCount: 'Produtos ({{count}})',
    shippingNamed: 'Frete ({{name}})',
    couponNamed: 'Cupom ({{code}})',
    continue: 'Continuar a compra',
    shipping: 'Frete',
  },
  checkout: {
    cta: 'Continuar a compra',
  },
  shippingBanner: 'Envio para {{address}} · {{shipping}}',
  shippingBannerFallbackAddress: 'seu endereço',
} as const;
