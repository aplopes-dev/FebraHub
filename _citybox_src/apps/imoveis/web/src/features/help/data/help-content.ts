export type HelpModuleId =
  | 'dashboard'
  | 'leads'
  | 'properties'
  | 'transactions'
  | 'finance'
  | 'calendar'
  | 'settings'
  | 'catalog';

export type HelpModule = {
  id: HelpModuleId;
  title: string;
  description: string;
  href: string;
  /** Se definido, o card só aparece quando `canNav(navHref)` é verdadeiro. */
  navHref?: string;
  keywords: readonly string[];
};

export type HelpSupportChannelId = 'whatsapp' | 'phone' | 'status';

export type HelpSupportChannel = {
  id: HelpSupportChannelId;
  title: string;
  description: string;
  detail: string;
};

export const HELP_MODULES: readonly HelpModule[] = [
  {
    id: 'dashboard',
    title: 'Painel',
    description:
      'Resumo do dia: indicadores, lembretes e prévias de leads e imóveis.',
    href: '/',
    navHref: '/',
    keywords: ['painel', 'dashboard', 'kpis', 'resumo', 'lembretes'],
  },
  {
    id: 'leads',
    title: 'Leads',
    description:
      'Lista e funil (kanban) dos contatos. Cadastro, contrato e histórico na ficha.',
    href: '/leads',
    navHref: '/leads',
    keywords: ['leads', 'kanban', 'funil', 'contatos', 'csv', 'contrato'],
  },
  {
    id: 'properties',
    title: 'Imóveis',
    description:
      'Estoque da loja em grade ou lista, com fotos, documentos e vitrine pública.',
    href: '/properties',
    navHref: '/properties',
    keywords: ['imoveis', 'anuncio', 'fotos', 'catalogo', 'estoque'],
  },
  {
    id: 'transactions',
    title: 'Negócios',
    description:
      'Registra venda ou locação depois do contrato assinado, com pagamento e repasse.',
    href: '/transactions',
    navHref: '/transactions',
    keywords: ['negocios', 'venda', 'locacao', 'pagamento', 'repasse'],
  },
  {
    id: 'finance',
    title: 'Financeiro',
    description:
      'Resultado do corretor ou da agência: indicadores, DRE e relatórios.',
    href: '/transactions/finance',
    navHref: '/transactions/finance',
    keywords: ['financeiro', 'dre', 'comissao', 'relatorios', 'caixa'],
  },
  {
    id: 'calendar',
    title: 'Agenda',
    description:
      'Visitas, follow-ups e sincronização com o Google Calendar.',
    href: '/calendar',
    navHref: '/calendar',
    keywords: ['agenda', 'visita', 'google calendar', 'follow-up'],
  },
  {
    id: 'settings',
    title: 'Configurações',
    description:
      'Perfil, equipe, aparência e o que aparece no catálogo público.',
    href: '/settings',
    navHref: '/settings',
    keywords: ['configuracoes', 'perfil', 'equipe', 'whatsapp', 'tema'],
  },
  {
    id: 'catalog',
    title: 'Catálogo público',
    description:
      'Vitrine do corretor na internet: listagem, ficha do imóvel e criação de lead.',
    href: '/settings?section=system',
    keywords: ['catalogo', 'vitrine', 'slug', 'publico', 'whatsapp'],
  },
];

export {
  HELP_FAQS,
  HELP_FAQ_CATEGORY_LABEL,
  visibleHelpFaqs,
  type HelpFaqCategoryId,
  type HelpFaqItem,
} from './faq-data';

export const HELP_SUPPORT_CHANNELS: readonly HelpSupportChannel[] = [
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    description: 'Conversa com o time de suporte da operação.',
    detail: 'Segunda a sexta, 8h–18h (Brasília)',
  },
  {
    id: 'phone',
    title: 'Telefone / SAC',
    description: 'Atendimento por voz para urgências da loja.',
    detail: 'Segunda a sexta, 8h–18h (Brasília)',
  },
  {
    id: 'status',
    title: 'Status dos serviços',
    description: 'Painel, busca e catálogo público.',
    detail: 'Operando normalmente',
  },
];

export function visibleHelpModules(
  modules: readonly HelpModule[],
  canNav: (href: string) => boolean,
): HelpModule[] {
  return modules.filter((module) =>
    module.navHref ? canNav(module.navHref) : true,
  );
}

