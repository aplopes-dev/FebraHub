export default {
  favorites: {
    screenLabel: 'Favoritos Web',
    title: 'Favoritos',
    emptyTitle: 'Nenhum favorito ainda',
    emptyDescription: 'Toque no coração dos produtos para salvá-los aqui.',
    emptyAction: 'Explorar produtos',
  },
  notifications: {
    screenLabel: 'Notificações Web',
    title: 'Notificações',
    markAllRead: 'Marcar todas como lidas',
    items: {
      orderOnTheWay: {
        title: 'Pedido a caminho',
        body: 'Seu pedido CB-001234 saiu para entrega.',
      },
      flashDeal: {
        title: 'Oferta relâmpago',
        body: 'Smartphones com até 30% off hoje!',
      },
      orderDelivered: {
        title: 'Pedido entregue',
        body: 'Seu pedido CB-001100 foi entregue.',
      },
      plusRenewed: {
        title: 'CityBox+ renovado',
        body: 'Sua assinatura foi renovada com sucesso.',
      },
      exclusiveCoupon: {
        title: 'Cupom exclusivo',
        body: 'Use TECH50 e ganhe R$ 50 off.',
      },
    },
    dates: {
      hoursAgo: 'Há {{count}}h',
      yesterday: 'Ontem',
      daysAgo: '{{count}} dias',
      weekAgo: '1 semana',
    },
  },
  help: {
    screenLabel: 'Ajuda Web',
    title: 'Ajuda e Suporte',
    faqTitle: 'Perguntas frequentes',
    openTicket: 'Abrir chamado',
    myTickets: 'Meus chamados',
    chat: 'Falar com atendente',
    faq: {
      trackOrder: {
        question: 'Como rastrear meu pedido?',
        answer: 'Acesse Minhas Compras, toque no pedido e use o botão Rastrear para ver a timeline e o código de rastreio.',
      },
      cancelOrder: {
        question: 'Como cancelar uma compra?',
        answer: 'Pedidos ainda não enviados podem ser cancelados em Detalhe do pedido → Cancelar. Após o envio, solicite devolução.',
      },
      paymentMethods: {
        question: 'Quais formas de pagamento aceitas?',
        answer: 'Aceitamos PIX (5% off), cartão de crédito e boleto bancário. Cartões salvos ficam em Meus Cartões.',
      },
      freeShipping: {
        question: 'Como funciona o frete grátis?',
        answer: 'Clientes CityBox+ têm frete grátis em compras elegíveis. Confira o banner na Home e opções no checkout.',
      },
      useCoupon: {
        question: 'Como usar um cupom?',
        answer: 'Digite o código no Carrinho ou Checkout, ou escolha um cupom disponível em Conta → Cupons.',
      },
      changeAddress: {
        question: 'Como alterar meu endereço?',
        answer: 'Em Conta → Endereços você pode adicionar, editar ou definir o endereço padrão. No checkout, use Alterar.',
      },
      cityboxPlus: {
        question: 'O que é o CityBox+?',
        answer: 'Assinatura com entregas grátis e benefícios exclusivos. Gerencie em Conta → banner CityBox+.',
      },
    },
  },
  ticket: {
    openScreenLabel: 'Abrir chamado Web',
    openTitle: 'Abrir chamado',
    description: 'Descreva sua solicitação. Você receberá o número do ticket ao enviar.',
    subjectLabel: 'Assunto',
    subjectPlaceholder: 'Ex.: Problema com entrega',
    messageLabel: 'Mensagem',
    messagePlaceholder: 'Descreva o que aconteceu...',
    relatedOrderLabel: 'Pedido relacionado (opcional)',
    noOrder: 'Nenhum pedido',
    orderOption: 'Pedido #{{orderId}}',
    submit: 'Enviar chamado',
    successTitle: 'Chamado aberto ✓',
    successBody: 'Seu ticket foi registrado. A equipe responderá em breve.',
    ticketLabel: 'Ticket:',
    statusLabel: 'Status:',
    viewMyTickets: 'Ver meus chamados',
    fillRequired: 'Preencha assunto e mensagem.',
    validationError: 'Verifique os campos e tente novamente.',
    submitFailed: 'Não foi possível abrir o chamado. Tente novamente.',
  },
  tickets: {
    screenLabel: 'Meus chamados Web',
    seed: {
      tkt001: {
        subject: 'Produto chegou danificado',
        message: 'Recebi o produto com a embalagem amassada e o item com arranhões.',
      },
      tkt002: {
        subject: 'Prazo de entrega ultrapassado',
        message: 'Meu pedido está atrasado há 3 dias além do prazo estimado.',
      },
    },
    title: 'Meus chamados',
    loadFailed: 'Não foi possível carregar seus chamados. Tente novamente.',
    empty: 'Nenhum chamado aberto.',
    statusOpen: 'Aberto',
    statusClosed: 'Encerrado',
    orderRef: 'Pedido #{{orderId}}',
  },
  chat: {
    screenLabel: 'Atendimento Web',
    title: 'Atendimento',
    placeholder: 'Digite sua mensagem…',
    agentGreeting: 'Olá! Sou a assistente CityBox. Como posso ajudar?',
    userSample: 'Quero saber sobre meu pedido CB-001234',
    agentReply: 'Seu pedido CB-001234 está a caminho e deve chegar amanhã até 22h. Posso ajudar com mais alguma coisa?',
    autoReply: 'Recebemos sua mensagem! Um atendente responderá em breve.',
  },
  subscriptionBenefits: {
    freeShipping: 'Frete grátis em todas as compras',
    expressPriority: 'Entrega expressa prioritária',
    cashback: 'Cashback de 5% em cada pedido',
    earlyAccess: 'Acesso antecipado a ofertas',
    support24h: 'Suporte prioritário 24h',
  },
  reviews: {
    sample: {
      r1: { author: 'Ana Paula', text: 'Produto excelente, entrega rápida!' },
      r2: { author: 'Carlos M.', text: 'Melhor smartphone que já tive.' },
      r3: { author: 'Juliana R.', text: 'Ótimo, mas poderia ser mais barato.' },
      r4: { author: 'Pedro S.', text: 'Cancelamento de ruído impecável.' },
      r5: { author: 'Marina L.', text: 'Som muito bom, case poderia ser menor.' },
    },
  },
} as const;
