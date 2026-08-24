import type { GlobalSearchHit } from '../types';

/**
 * Páginas e ações do painel indexáveis na busca global (front-only).
 * Filtrar por permissão no caller (`canPath` / `canNav`).
 */
export type SearchablePage = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  /** Tokens extras para match (sem acento / sinônimos). */
  keywords: readonly string[];
};

export const SEARCHABLE_PAGES: readonly SearchablePage[] = [
  {
    id: 'page-dashboard',
    title: 'Painel',
    subtitle: 'Dashboard e visão geral',
    href: '/',
    keywords: ['dashboard', 'inicio', 'home', 'overview', 'resumo'],
  },
  {
    id: 'page-leads',
    title: 'Leads',
    subtitle: 'Lista de contatos',
    href: '/leads',
    keywords: ['contatos', 'crm', 'clientes', 'prospects'],
  },
  {
    id: 'page-leads-new',
    title: 'Novo lead',
    subtitle: 'Cadastrar contato',
    href: '/leads/new',
    keywords: ['criar lead', 'adicionar lead', 'cadastro lead'],
  },
  {
    id: 'page-properties',
    title: 'Imóveis',
    subtitle: 'Catálogo de imóveis',
    href: '/properties',
    keywords: ['propriedades', 'listings', 'estoque', 'casas', 'apartamentos'],
  },
  {
    id: 'page-properties-new',
    title: 'Novo imóvel',
    subtitle: 'Cadastrar imóvel',
    href: '/properties/new',
    keywords: ['criar imovel', 'adicionar imovel', 'cadastro imovel'],
  },
  {
    id: 'page-transactions',
    title: 'Negócios',
    subtitle: 'Vendas e locações',
    href: '/transactions',
    keywords: ['transacoes', 'vendas', 'locacoes', 'comissoes'],
  },
  {
    id: 'page-finance',
    title: 'Financeiro',
    subtitle: 'KPIs, DRE, extrato e relatórios',
    href: '/transactions/finance',
    keywords: [
      'financeiro',
      'dre',
      'caixa',
      'despesas',
      'relatorios',
      'repasses',
      'comissoes',
    ],
  },
  {
    id: 'page-calendar',
    title: 'Agenda',
    subtitle: 'Compromissos e visitas',
    href: '/calendar',
    keywords: ['calendario', 'visitas', 'compromissos', 'schedule'],
  },
  {
    id: 'page-settings',
    title: 'Configurações',
    subtitle: 'Perfil e preferências',
    href: '/settings',
    keywords: ['settings', 'config', 'preferencias'],
  },
  {
    id: 'page-settings-profile',
    title: 'Meu perfil',
    subtitle: 'Configurações · perfil',
    href: '/settings?section=profile',
    keywords: ['perfil', 'dados pessoais', 'foto'],
  },
  {
    id: 'page-settings-privacy',
    title: 'Privacidade e segurança',
    subtitle: 'Configurações · privacidade',
    href: '/settings?section=privacy',
    keywords: ['senha', 'seguranca', 'privacidade'],
  },
  {
    id: 'page-settings-notifications',
    title: 'Notificações',
    subtitle: 'Configurações · alertas',
    href: '/settings?section=notifications',
    keywords: ['alertas', 'email', 'avisos'],
  },
  {
    id: 'page-settings-users',
    title: 'Usuários',
    subtitle: 'Configurações · equipe',
    href: '/settings?section=users',
    keywords: ['equipe', 'permissoes', 'membros', 'time'],
  },
  {
    id: 'page-settings-system',
    title: 'Configurações de sistema',
    subtitle: 'Tema e cor de destaque',
    href: '/settings?section=system',
    keywords: ['sistema', 'tema', 'accent', 'cor'],
  },
  {
    id: 'page-settings-billing',
    title: 'Assinatura e cobrança',
    subtitle: 'Configurações · billing',
    href: '/settings?section=billing',
    keywords: ['assinatura', 'plano', 'cobranca', 'billing'],
  },
  {
    id: 'page-help',
    title: 'Ajuda & Suporte',
    subtitle: 'Central de ajuda, FAQ e chamados',
    href: '/help',
    keywords: ['ajuda', 'help', 'faq', 'manual', 'suporte', 'ticket', 'chamado'],
  },
  {
    id: 'page-help-leads',
    title: 'Ajuda · Leads',
    subtitle: 'Lista, kanban e ficha',
    href: '/help?q=kanban',
    keywords: ['kanban', 'funil', 'contrato', 'csv', 'follow-up', 'ficha'],
  },
  {
    id: 'page-help-finance',
    title: 'Ajuda · Financeiro',
    subtitle: 'KPIs, DRE e relatórios',
    href: '/help?q=dre',
    keywords: ['financeiro', 'dre', 'comissao', 'repasse', 'relatorios'],
  },
  {
    id: 'page-help-ticket',
    title: 'Ajuda · Abrir chamado',
    subtitle: 'Ticket de suporte',
    href: '/help',
    keywords: ['ticket', 'chamado', 'protocolo', 'suporte'],
  },
];

export function hitFromSearchablePage(page: SearchablePage): GlobalSearchHit {
  return {
    id: page.id,
    type: 'nav',
    title: page.title,
    subtitle: page.subtitle,
    href: page.href,
    keywords: [...page.keywords, page.href, page.title],
  };
}
