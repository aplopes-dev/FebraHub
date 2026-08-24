export type HelpFaqCategoryId = 'general' | 'modules' | 'finance' | 'support';

export type HelpFaqCategoryFilter = 'all' | HelpFaqCategoryId;

export type HelpFaqLink = {
  href: string;
  label: string;
};

export type HelpFaqItem = {
  id: string;
  question: string;
  answer: string;
  category: HelpFaqCategoryId;
  tags: readonly string[];
  links?: readonly HelpFaqLink[];
  /** Se definido, o item só aparece quando `canNav(navHref)` é verdadeiro. */
  navHref?: string;
};

export const HELP_FAQ_CATEGORY_ORDER: readonly HelpFaqCategoryId[] = [
  'general',
  'modules',
  'finance',
  'support',
];

export const HELP_FAQ_CATEGORY_LABEL: Record<HelpFaqCategoryId, string> = {
  general: 'Geral e Acesso',
  modules: 'Módulos e Operação',
  finance: 'Financeiro e Planos',
  support: 'Suporte e Problemas',
};

export const HELP_FAQ_CATEGORY_SHORT_LABEL: Record<HelpFaqCategoryId, string> = {
  general: 'Geral',
  modules: 'Módulos',
  finance: 'Financeiro',
  support: 'Suporte',
};

export const HELP_FAQS: readonly HelpFaqItem[] = [
  {
    id: 'faq-login',
    category: 'general',
    question: 'Como entro no painel e troco de loja?',
    answer:
      'O acesso é pela conta da imobiliária. Depois do login, se você tiver mais de uma loja, escolha em Selecionar loja.\n\nNo menu do avatar dá para sair. Em modo de demonstração também é possível trocar de usuário.',
    tags: ['login', 'senha', 'loja', 'acesso', 'sair', 'entrar'],
  },
  {
    id: 'faq-password',
    category: 'general',
    question: 'Como altero ou recupero a senha?',
    answer:
      'Com a sessão aberta, vá em Configurações → Privacidade e atualize a senha.\n\nSe não conseguir entrar, use a recuperação de senha na tela de login do Keycloak. No primeiro acesso a loja pode exigir troca obrigatória da senha provisória.',
    tags: ['senha', 'recuperacao', 'privacidade', 'primeiro acesso'],
    links: [{ href: '/settings?section=privacy', label: 'Abrir Privacidade' }],
  },
  {
    id: 'faq-permissions',
    category: 'general',
    question: 'Por que não vejo Financeiro ou Usuários?',
    answer:
      'Cada cargo vê só o que a loja liberou.\n\n- Assistente: sem Financeiro e sem gestão de equipe\n- Corretor: o próprio portfólio e o resultado pessoal\n- Administrador / dono: agência, usuários e cobrança',
    tags: ['permissao', 'cargo', 'assistente', 'admin', 'acesso'],
  },
  {
    id: 'faq-avatar-menu',
    category: 'general',
    question: 'O que tem no menu do avatar?',
    answer:
      'Tema claro ou escuro, Ajuda & Suporte, Configurações, troca de loja quando houver mais de uma, e Sair.\n\nA busca global (⌘K) e o sino de lembretes ficam no header, ao lado do avatar — não neste menu.',
    tags: ['avatar', 'menu', 'tema', 'header', 'sino', 'busca'],
  },
  {
    id: 'faq-flow',
    category: 'modules',
    question: 'Qual é o fluxo do contato até o fechamento?',
    answer:
      'O contato entra pelo catálogo público (WhatsApp ou formulário) ou pelo cadastro manual e vira um lead.\n\nNo funil ele avança com imóvel, contrato, transação e pagamento. A entrega encerra o atendimento como ganho. Negócios registra a venda ou locação; o Financeiro mostra o resultado.',
    tags: ['fluxo', 'crm', 'funil', 'lead', 'fechamento', 'cadastrar'],
    links: [{ href: '/leads', label: 'Abrir Leads' }],
  },
  {
    id: 'faq-kanban',
    category: 'modules',
    question: 'Como funciona o kanban de leads?',
    answer:
      'Cada coluna é uma etapa. Algumas mudanças exigem imóvel, contrato ou transação.\n\n- Aguardando imóvel: arrastar de volta desvincula o imóvel e reabre o anúncio\n- Imóvel selecionado: só entra com imóvel vinculado\n- Contrato enviado: documento do tipo Contrato (não vale “Outros”)\n- Contrato assinado: o corretor marca na ficha do lead (não é assinatura digital)\n- Pagamento confirmado: não se arrasta — confirme em Negócios\n- Entrega: fecha o lead como ganho',
    tags: ['kanban', 'funil', 'arraste', 'contrato', 'pagamento'],
    navHref: '/leads',
  },
  {
    id: 'faq-export',
    category: 'modules',
    question: 'Como exporto ou importo uma lista de leads?',
    answer:
      'Na lista de Leads use Exportar CSV para baixar o filtro atual (UTF-8 com BOM, abre no Excel).\n\nImportar CSV cria vários contatos de uma vez. A busca e a paginação da lista acontecem no servidor — não é preciso carregar tudo para exportar a página visível.',
    tags: ['exportar', 'importar', 'csv', 'planilha', 'arquivo', 'relatorio'],
    navHref: '/leads',
    links: [{ href: '/leads', label: 'Lista de leads' }],
  },
  {
    id: 'faq-properties',
    category: 'modules',
    question: 'Como cadastro um imóvel e o que vai para a vitrine?',
    answer:
      'No cadastro há Informações básicas, Localização, Catálogo público, Fotos (até 20, JPEG/PNG/WebP/HEIC, máx. 4 MB cada; a primeira é a capa) e Documentos (até 12).\n\nImóveis indisponíveis ficam em cinza, mas a ficha abre. Só imóveis disponíveis, com slug do corretor, entram no catálogo público. Use “Usar como base” para copiar um cadastro.',
    tags: ['imovel', 'fotos', 'vitrine', 'catalogo', 'cadastrar'],
    navHref: '/properties',
  },
  {
    id: 'faq-payment-vs-handover',
    category: 'modules',
    question: 'Qual a diferença entre confirmar pagamento e entrega?',
    answer:
      'Confirmar pagamento fecha a parte financeira e move o funil para Pagamento confirmado.\n\nA entrega encerra o lead como ganho e marca o imóvel como vendido ou ocupado. São dois passos distintos, em Negócios e no kanban.',
    tags: ['pagamento', 'entrega', 'negocio', 'funil'],
    navHref: '/transactions',
  },
  {
    id: 'faq-calendar-google',
    category: 'modules',
    question: 'Como conecto o Google Calendar e emito a agenda?',
    answer:
      'Na Agenda, o banner no topo indica se a conta está conectada. Depois do OAuth, os compromissos daqui podem ir para o calendário externo.\n\nHá visões Dia, Semana e Mês. Um follow-up na ficha do lead cria compromisso automaticamente (9h–10h, fuso da Bahia).',
    tags: ['google', 'calendar', 'agenda', 'sincronizar', 'relatorio', 'visita'],
    navHref: '/calendar',
    links: [{ href: '/calendar', label: 'Abrir Agenda' }],
  },
  {
    id: 'faq-lead-contract-upload',
    category: 'modules',
    question: 'Como anexo um contrato e avanço o funil?',
    answer:
      'Na ficha do lead, aba Documentos, arraste ou escolha o arquivo na seção Contrato (PDF, DOC ou DOCX).\n\nCom um imóvel vinculado, o anexo de contrato avança o negócio para Contrato enviado. Outros arquivos ficam em Outros documentos e não mudam o funil.',
    tags: ['contrato', 'pdf', 'upload', 'documento', 'funil'],
    navHref: '/leads',
    links: [{ href: '/leads', label: 'Abrir Leads' }],
  },
  {
    id: 'faq-finance-scope',
    category: 'finance',
    question: 'O Financeiro mostra o meu resultado ou o da agência?',
    answer:
      'Corretor vê o próprio livro-caixa. Administrador vê o consolidado da agência (DRE, extrato e repasses).\n\nA subnavegação Negócios | Financeiro fica na mesma área de transações. Relatórios filtram por período, status, tipo e corretor.',
    tags: ['dre', 'comissao', 'agencia', 'corretor', 'relatorio', 'faturamento'],
    navHref: '/transactions/finance',
    links: [{ href: '/transactions/finance', label: 'Abrir Financeiro' }],
  },
  {
    id: 'faq-rental-payout',
    category: 'finance',
    question: 'Como registro o repasse de uma locação?',
    answer:
      'No detalhe do negócio de locação há o bloco de repasse ao proprietário.\n\nConfirme o pagamento do negócio antes de tratar o repasse. Um negócio concluído não impede um novo negócio do mesmo cliente em outro imóvel.',
    tags: ['repasse', 'locacao', 'proprietario', 'pagamento'],
    navHref: '/transactions',
  },
  {
    id: 'faq-billing',
    category: 'finance',
    question: 'Onde vejo o plano, a cobrança e um possível upgrade?',
    answer:
      'Em Configurações → Assinatura e cobrança aparece o plano da loja.\n\nUpgrade, faturas e forma de pagamento da assinatura Citybox ficam nessa seção — não no módulo Financeiro do CRM, que trata comissões e DRE da operação imobiliária.',
    tags: ['plano', 'assinatura', 'upgrade', 'fatura', 'cobranca', 'billing'],
    links: [{ href: '/settings?section=billing', label: 'Abrir Assinatura' }],
  },
  {
    id: 'faq-invoices',
    category: 'finance',
    question: 'O sistema emite nota fiscal dos negócios?',
    answer:
      'O painel Imóveis registra venda, locação, comissão e repasse. A emissão de NF-e / NFS-e não é feita nesta central — use o financeiro da operação ou o ERP fiscal da Citybox, se a loja tiver esse módulo.\n\nComprovantes do cliente (contrato, recibo) vão na ficha do lead, em Documentos.',
    tags: ['nota fiscal', 'nfe', 'nfse', 'faturamento', 'recibo'],
  },
  {
    id: 'faq-search',
    category: 'support',
    question: 'A busca do header não acha um lead. O que fazer?',
    answer:
      'A busca global (⌘K) mistura páginas, leads, imóveis e negócios. Digite pelo menos algumas letras do nome.\n\nSe ainda assim não aparecer, abra Leads e use a busca da lista — ela consulta o servidor com a lista completa.',
    tags: ['busca', 'cmdk', 'nao encontra', 'erro'],
  },
  {
    id: 'faq-slow',
    category: 'support',
    question: 'O painel está lento. Como melhorar?',
    answer:
      'Listas grandes (leads, imóveis, negócios) paginam no servidor. Evite deixar várias abas do painel abertas no mesmo navegador.\n\n- Feche o kanban se estiver só na lista\n- Use a busca com debounce (ela já espera você parar de digitar)\n- Prefira Chrome, Edge ou Firefox atualizados\n- Se a lentidão for só no catálogo público, verifique a conexão e a quantidade de fotos do imóvel',
    tags: ['lento', 'lentidao', 'performance', 'navegador'],
  },
  {
    id: 'faq-browser',
    category: 'support',
    question: 'Quais navegadores são compatíveis?',
    answer:
      'Use a versão atual de Chrome, Edge, Firefox ou Safari.\n\nInternet Explorer não é suportado. No iOS, prefira Safari. Desative bloqueadores agressivos se o login ou o upload de fotos falhar.',
    tags: ['navegador', 'chrome', 'safari', 'compatibilidade', 'browser'],
  },
  {
    id: 'faq-ticket',
    category: 'support',
    question: 'Como abro um chamado de suporte?',
    answer:
      'Nesta página, use Abrir ticket de suporte. Informe o assunto e descreva o passo a passo.\n\nVocê pode anexar prints (PNG, JPG, WebP, PDF ou texto, até 4 arquivos de 4 MB). O número de protocolo fica só neste aparelho — o chamado ainda não é enviado à equipe.',
    tags: ['ticket', 'chamado', 'suporte', 'protocolo', 'erro'],
  },
];

export function visibleHelpFaqs(
  faqs: readonly HelpFaqItem[],
  canNav: (href: string) => boolean,
): HelpFaqItem[] {
  return faqs.filter((item) => (item.navHref ? canNav(item.navHref) : true));
}

export function filterFaqsByCategory(
  faqs: readonly HelpFaqItem[],
  category: HelpFaqCategoryFilter,
): HelpFaqItem[] {
  if (category === 'all') return [...faqs];
  return faqs.filter((item) => item.category === category);
}
