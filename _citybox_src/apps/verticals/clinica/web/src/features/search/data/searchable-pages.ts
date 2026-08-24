import type { GlobalSearchHit } from '../types';

/**
 * Páginas e atalhos indexáveis na busca global (front-only).
 * Filtrar por permissão no caller (`canAccessHref`).
 */
export type SearchablePage = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  keywords: readonly string[];
};

export const SEARCHABLE_PAGES: readonly SearchablePage[] = [
  {
    id: 'page-dashboard',
    title: 'Visão geral',
    subtitle: 'Dashboard e KPIs da clínica',
    href: '/',
    keywords: ['dashboard', 'inicio', 'home', 'overview', 'resumo', 'indicadores'],
  },
  {
    id: 'page-relatorios',
    title: 'Relatórios',
    subtitle: 'Dashboard · relatórios',
    href: '/relatorios',
    keywords: ['reports', 'metricas', 'analise'],
  },
  {
    id: 'page-tarefas',
    title: 'Tarefas',
    subtitle: 'Dashboard · tarefas',
    href: '/tarefas',
    keywords: ['tasks', 'pendencias', 'lembretes'],
  },
  {
    id: 'page-financeiro-fluxo',
    title: 'Fluxo de caixa',
    subtitle: 'Financeiro · receitas e despesas',
    href: '/financeiro/fluxo-de-caixa',
    keywords: ['caixa', 'lancamentos', 'receita', 'despesa'],
  },
  {
    id: 'page-financeiro-transacoes',
    title: 'Transações',
    subtitle: 'Financeiro · transações',
    href: '/financeiro/transacoes',
    keywords: ['pagamentos', 'recebimentos'],
  },
  {
    id: 'page-financeiro-comissoes',
    title: 'Comissões',
    subtitle: 'Financeiro · comissões',
    href: '/financeiro/comissoes',
    keywords: ['repasse', 'profissional'],
  },
  {
    id: 'page-financeiro-config',
    title: 'Configurações financeiras',
    subtitle: 'Financeiro · contas e categorias',
    href: '/financeiro/configuracoes',
    keywords: ['contas', 'categorias', 'meios de pagamento'],
  },
  {
    id: 'page-settings-equipe',
    title: 'Equipe',
    subtitle: 'Configurações · usuários e permissões',
    href: '/configuracoes/equipe',
    keywords: ['usuarios', 'permissoes', 'membros', 'time'],
  },
  {
    id: 'page-settings-planos',
    title: 'Planos',
    subtitle: 'Configurações · planos de tratamento',
    href: '/configuracoes/planos',
    keywords: ['tratamentos', 'procedimentos', 'tabela'],
  },
  {
    id: 'page-settings-anamneses',
    title: 'Anamneses',
    subtitle: 'Configurações · modelos de anamnese',
    href: '/configuracoes/anamneses',
    keywords: ['questionario', 'ficha', 'template'],
  },
  {
    id: 'page-settings-contrato',
    title: 'Contratos',
    subtitle: 'Configurações · modelos de contrato',
    href: '/configuracoes/contrato',
    keywords: ['documento', 'termo', 'template'],
  },
  {
    id: 'page-settings-whatsapp',
    title: 'WhatsApp',
    subtitle: 'Configurações · integração WhatsApp',
    href: '/configuracoes/whatsapp',
    keywords: ['mensagens', 'confirmacao', 'lembrete'],
  },
  {
    id: 'page-settings-categoria-paciente',
    title: 'Categoria de paciente',
    subtitle: 'Configurações · categorias de paciente',
    href: '/configuracoes/categoria-paciente',
    keywords: ['cor', 'classificacao'],
  },
  {
    id: 'page-settings-categoria-agendamento',
    title: 'Categoria de agendamento',
    subtitle: 'Configurações · categorias da agenda',
    href: '/configuracoes/categoria-agendamento',
    keywords: ['cor', 'consulta', 'compromisso'],
  },
  {
    id: 'page-marketing-campaigns',
    title: 'Campanhas',
    subtitle: 'Marketing · campanhas',
    href: '/marketing/campaigns',
    keywords: ['comunicacao', 'broadcast', 'formulario'],
  },
  {
    id: 'page-marketing-indicacoes',
    title: 'Indicações',
    subtitle: 'Marketing · indicações',
    href: '/marketing/indicacoes',
    keywords: ['referral', 'indicador'],
  },
  {
    id: 'page-loja-assinatura',
    title: 'Assinatura eletrônica',
    subtitle: 'Loja · assinatura eletrônica',
    href: '/loja/assinatura-eletronica',
    keywords: ['certificado', 'documento', 'icp'],
  },
];

export function hitFromSearchablePage(page: SearchablePage): GlobalSearchHit {
  return {
    id: page.id,
    type: 'page',
    title: page.title,
    subtitle: page.subtitle,
    href: page.href,
    keywords: [...page.keywords, page.href, page.title],
  };
}
