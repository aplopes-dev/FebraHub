export default {
  page: {
    title: 'Finalizar compra',
  },
  summary: {
    title: 'Resumo',
    subtotalItems: 'Subtotal ({{count}} itens)',
    shippingNamed: 'Frete ({{name}})',
    couponNamed: 'Cupom ({{code}})',
    pixDiscount: 'Desconto Pix (5%)',
    completePayment: 'Complete os dados de pagamento',
    payAmount: 'Pagar R$ {{price}}',
  },
  shipping: {
    title: 'Opções de envio',
    sectionTitle: 'Envio',
    defaultName: 'Entrega padrão',
    defaultEstimate: '5–8 dias úteis',
    options: {
      express: 'Express',
      normal: 'Normal',
      economico: 'Econômico',
    },
    estimates: {
      express: 'Amanhã até 22h',
      normal: '3 a 5 dias úteis',
      economico: '7 a 10 dias úteis',
    },
    freeForCity: 'Frete grátis para {{city}}, {{state}}',
  },
  payment: {
    pixFallback: 'PIX',
    pixLabel: 'PIX · 5% off',
    boletoDisplayName: 'Boleto',
    cardDisplayName: 'Cartão',
    cardFallbackLabel: 'Cartão',
  },
  coupon: {
    title: 'Cupom de desconto',
    codePlaceholder: 'Código',
    viewAvailable: 'Ver cupons disponíveis',
    applied: 'Aplicado ✓',
  },
  card: {
    noneSaved: 'Nenhum cartão salvo',
    add: '+ Adicionar cartão',
  },
  boleto: {
    cpfPlaceholder: 'CPF do pagador',
    previewTitle: 'Prévia do boleto',
    dueHint: 'Vencimento em 3 dias úteis · CityBox Marketplace',
    invalidCpf: 'Informe um CPF válido (11 dígitos)',
    label: 'Boleto · vence em 3 dias úteis',
  },
} as const;
