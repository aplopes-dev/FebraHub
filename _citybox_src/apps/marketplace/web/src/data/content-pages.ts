export type ContentPageSlug =
  | 'sobre'
  | 'trabalhe-conosco'
  | 'sustentabilidade'
  | 'ajuda'
  | 'como-comprar'
  | 'devolucoes'
  | 'termos'
  | 'privacidade';

export type ContentSection = {
  title?: string;
  body: string;
};

export type ContentPage = {
  title: string;
  lead?: string;
  sections: ContentSection[];
};

/** Conteúdo institucional e de ajuda do marketplace (fallback local / mock). */
export const CONTENT_PAGES: Record<ContentPageSlug, ContentPage> = {
  sobre: {
    title: 'CityBox',
    lead:
      'O CityBox é o marketplace da sua cidade: produtos de lojas locais, num só carrinho, com entrega rápida e suporte perto de você.',
    sections: [
      {
        title: 'O que somos',
        body:
          'Conectamos consumidores a lojistas da região para comprar com praticidade — moda, tecnologia, casa, beleza, mercado e muito mais. A ideia é simples: a cidade no bolso, com frete e prazos que fazem sentido no dia a dia.',
      },
      {
        title: 'Como funciona',
        body:
          'Você navega por categorias e ofertas, monta um carrinho único e finaliza o pedido. Acompanhe o status, fale com o suporte e use cupons e benefícios CityBox+ quando disponíveis.',
      },
      {
        title: 'Para lojistas',
        body:
          'Se você tem uma loja na cidade, o CityBox é o canal para vender online com operação integrada (catálogo, pedidos e atendimento). Fale com nosso time comercial pelo “Trabalhe conosco”.',
      },
    ],
  },
  'trabalhe-conosco': {
    title: 'Trabalhe conosco',
    lead: 'Quer ajudar a construir o marketplace da cidade? Estamos sempre abertos a talentos e parceiros.',
    sections: [
      {
        title: 'Oportunidades',
        body:
          'Buscamos pessoas em produto, engenharia, operações, atendimento e crescimento comercial. Valorizamos autonomia, clareza e foco no cliente.',
      },
      {
        title: 'Como se candidatar',
        body:
          'Envie um e-mail para carreiras@citybox.com.br com seu currículo, área de interesse e cidade. Respondemos as candidaturas alinhadas às vagas abertas.',
      },
      {
        title: 'Parcerias e lojistas',
        body:
          'Para cadastrar sua loja ou falar sobre parceria comercial, escreva para parceiros@citybox.com.br com o nome da loja, segmento e contatos.',
      },
    ],
  },
  sustentabilidade: {
    title: 'Sustentabilidade',
    lead: 'Queremos um comércio local mais eficiente — menos deslocamentos desnecessários e mais valor para a cidade.',
    sections: [
      {
        title: 'Entrega inteligente',
        body:
          'Priorizamos rotas e janelas de entrega que reduzem idas e vindas. Quando possível, consolidamos pedidos da mesma região para diminuir o impacto logístico.',
      },
      {
        title: 'Lojas locais',
        body:
          'Fortalecer o comércio da cidade reduz a dependência de longas cadeias de transporte e mantém emprego e renda no território.',
      },
      {
        title: 'Em evolução',
        body:
          'Estamos aprimorando embalagens, opções de retirada e indicadores de impacto. Novidades serão comunicadas por aqui e no app.',
      },
    ],
  },
  ajuda: {
    title: 'Central de ajuda',
    lead: 'Encontre respostas rápidas ou fale com o atendimento pela sua conta.',
    sections: [
      {
        title: 'Pedidos e rastreio',
        body:
          'Em Conta → Compras você vê o status de cada pedido, o rastreio e o histórico. Se algo atrasar, abra um chamado ou fale no chat de atendimento.',
      },
      {
        title: 'Pagamentos e cupons',
        body:
          'Aceitamos os meios disponíveis no checkout. Cupons são aplicados antes de finalizar. Se um cupom não aplicar, confira validade, valor mínimo e categorias elegíveis.',
      },
      {
        title: 'Contato',
        body:
          'Logado, use Conta → Ajuda para FAQ, abrir chamado ou falar no atendimento. Também estamos em suporte@citybox.com.br em dias úteis.',
      },
    ],
  },
  'como-comprar': {
    title: 'Como comprar',
    lead: 'Do catálogo à porta de casa, em poucos passos.',
    sections: [
      {
        title: '1. Busque ou explore',
        body:
          'Use a busca no topo ou as categorias da home. Abra o produto para ver fotos, preço, frete e avaliações.',
      },
      {
        title: '2. Adicione ao carrinho',
        body:
          'Escolha a quantidade e adicione. Você pode misturar itens de lojas diferentes no mesmo carrinho, quando a operação permitir.',
      },
      {
        title: '3. Finalize o pedido',
        body:
          'No checkout, confirme endereço, frete e pagamento. Aplique cupom se tiver. Depois acompanhe tudo em Compras.',
      },
    ],
  },
  devolucoes: {
    title: 'Devoluções',
    lead: 'Seu direito de arrependimento e troca segue o Código de Defesa do Consumidor.',
    sections: [
      {
        title: 'Prazo',
        body:
          'Em regra, você pode solicitar devolução em até 7 dias corridos após o recebimento, para produtos elegíveis e em condições de revenda (conforme a natureza do item).',
      },
      {
        title: 'Como solicitar',
        body:
          'Em Compras, abra o pedido e escolha Devolução. Informe o motivo e siga as instruções de postagem ou coleta. O reembolso ou crédito é processado após a conferência.',
      },
      {
        title: 'Exceções',
        body:
          'Itens perecíveis, personalizados ou de higiene abertos podem ter regras específicas. Em dúvida, consulte a Central de ajuda ou o atendimento.',
      },
    ],
  },
  termos: {
    title: 'Termos de Uso',
    lead: 'Ao usar o CityBox, você concorda com estas condições.',
    sections: [
      {
        body:
          'Os Termos de Uso regem a navegação, compra e uso dos serviços CityBox. Incluem regras de conta, pedidos, pagamentos, frete, cancelamentos e conduta na plataforma.',
      },
      {
        body:
          'Reservamo-nos o direito de atualizar estes termos. Mudanças relevantes serão comunicadas no site ou por e-mail. O uso contínuo após a atualização implica aceite da nova versão.',
      },
      {
        body:
          'Para disputas, aplica-se a legislação brasileira e o foro da comarca do consumidor, nos termos do CDC, quando cabível.',
      },
    ],
  },
  privacidade: {
    title: 'Política de Privacidade',
    lead: 'Seus dados são tratados conforme a LGPD.',
    sections: [
      {
        body:
          'Coletamos dados necessários para conta, pedidos, entrega, pagamento, prevenção a fraudes e melhoria da experiência. Não vendemos seus dados pessoais.',
      },
      {
        body:
          'Você pode solicitar acesso, correção ou exclusão de dados pessoais pelos canais de atendimento, sujeitos às bases legais e obrigações de retenção.',
      },
      {
        body:
          'Usamos medidas técnicas e organizacionais para proteger as informações. Em caso de incidente relevante, seguiremos os procedimentos legais de comunicação.',
      },
    ],
  },
};

export function isContentPageSlug(value: string): value is ContentPageSlug {
  return Object.prototype.hasOwnProperty.call(CONTENT_PAGES, value);
}

/** Compat: tipos antigos da API/mock (about|terms|privacy). */
export const LEGACY_STATIC_TO_SLUG = {
  about: 'sobre',
  terms: 'termos',
  privacy: 'privacidade',
} as const;

export type LegacyStaticPageType = keyof typeof LEGACY_STATIC_TO_SLUG;
