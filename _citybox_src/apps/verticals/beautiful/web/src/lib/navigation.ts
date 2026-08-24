import type { IconName } from '@citybox/mui/icons';

export type BeautifulNavModule = {
  id: string;
  label: string;
  icon: IconName;
  path: string;
  description?: string;
};

export type BeautifulNavSection = {
  label: string;
  modules: BeautifulNavModule[];
};

export const BEAUTIFUL_NAV_SECTIONS: BeautifulNavSection[] = [
  {
    label: 'MENU',
    modules: [
      {
        id: 'home',
        label: 'Início',
        icon: 'dashboard',
        path: '/',
        description: 'Visão geral do painel.',
      },
      {
        id: 'agenda',
        label: 'Agenda',
        icon: 'clock',
        path: '/agenda',
        description: 'Agendamentos e disponibilidade.',
      },
      {
        id: 'clientes',
        label: 'Clientes',
        icon: 'customers',
        path: '/clientes',
        description: 'Cadastro lean de clientes (nome e telefone).',
      },
      {
        id: 'catalogo',
        label: 'Catálogo',
        icon: 'products',
        path: '/catalogo',
        description: 'Serviços e produtos oferecidos.',
      },
    ],
  },
  {
    label: 'ADMINISTRATIVO',
    modules: [
      {
        id: 'financeiro',
        label: 'Financeiro',
        icon: 'finance',
        path: '/financeiro/fluxo-de-caixa',
        description: 'Fluxo de caixa, transações e configurações.',
      },
      {
        id: 'equipe',
        label: 'Equipe',
        icon: 'users',
        path: '/equipe',
        description: 'Membros, papéis, serviços e horários da loja.',
      },
      {
        id: 'settings',
        label: 'Configurações',
        icon: 'settings',
        path: '/configuracoes',
        description: 'Preferências do app.',
      },
    ],
  },
];

/** Itens soltos no rodapé da sidebar (sem título de grupo). */
export const BEAUTIFUL_FOOTER_MODULES: BeautifulNavModule[] = [
  {
    id: 'plan',
    label: 'Meu plano',
    icon: 'plan',
    path: '/meu-plano',
    description: 'Assinatura e limites.',
  },
];

export type BeautifulSettingsTab = {
  id: string;
  label: string;
  path: string;
};

/** Abas horizontais da área Configurações. */
export const BEAUTIFUL_SETTINGS_TABS: BeautifulSettingsTab[] = [
  {
    id: 'geral',
    label: 'Configuração geral',
    path: '/configuracoes',
  },
  {
    id: 'horario',
    label: 'Horário de Funcionamento',
    path: '/configuracoes/horario-de-funcionamento',
  },
  {
    id: 'aparencia',
    label: 'Aparência e Tema',
    path: '/configuracoes/aparencia',
  },
  {
    id: 'categoria-clientes',
    label: 'Categoria de Clientes',
    path: '/configuracoes/categoria-de-clientes',
  },
  {
    id: 'categoria-agendamento',
    label: 'Categoria de Agendamento',
    path: '/configuracoes/categoria-de-agendamento',
  },
];

export type BeautifulCatalogTab = {
  id: string;
  label: string;
  path: string;
};

/** Abas horizontais da área Catálogo (Serviços e Estoque de Produtos). */
export const BEAUTIFUL_CATALOG_TABS: BeautifulCatalogTab[] = [
  {
    id: 'servicos',
    label: 'Serviços',
    path: '/catalogo',
  },
  {
    id: 'estoque',
    label: 'Estoque de Produtos',
    path: '/catalogo/estoque',
  },
];

export type BeautifulFinanceiroTab = {
  id: string;
  label: string;
  path: string;
};

/** Abas horizontais do Financeiro — espelho da Clínica. */
export const BEAUTIFUL_FINANCEIRO_TABS: BeautifulFinanceiroTab[] = [
  {
    id: 'fluxo-de-caixa',
    label: 'Fluxo de caixa',
    path: '/financeiro/fluxo-de-caixa',
  },
  {
    id: 'transacoes',
    label: 'Transações',
    path: '/financeiro/transacoes',
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    path: '/financeiro/configuracoes',
  },
];

export function allBeautifulModules(): BeautifulNavModule[] {
  return [
    ...BEAUTIFUL_NAV_SECTIONS.flatMap((s) => s.modules),
    ...BEAUTIFUL_FOOTER_MODULES,
  ];
}

export function findModuleByPath(
  pathname: string,
): BeautifulNavModule | undefined {
  const modules = allBeautifulModules();

  if (pathname === '/') {
    return modules.find((m) => m.path === '/');
  }

  return modules
    .filter((m) => m.path !== '/')
    .sort((a, b) => b.path.length - a.path.length)
    .find((m) => pathname === m.path || pathname.startsWith(`${m.path}/`));
}

export function isSettingsTabActive(
  tabPath: string,
  pathname: string,
): boolean {
  if (tabPath === '/configuracoes') {
    return pathname === '/configuracoes';
  }
  return pathname === tabPath || pathname.startsWith(`${tabPath}/`);
}

export function isCatalogTabActive(
  tabPath: string,
  pathname: string,
): boolean {
  if (tabPath === '/catalogo') {
    return pathname === '/catalogo';
  }
  return pathname === tabPath || pathname.startsWith(`${tabPath}/`);
}

export function isFinanceiroTabActive(
  tabPath: string,
  pathname: string,
): boolean {
  return pathname === tabPath || pathname.startsWith(`${tabPath}/`);
}
