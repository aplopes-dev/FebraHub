import type { NavIconName } from "@/lib/nav-icons";

export type NavLeaf = {
  id: string;
  label: string;
  path: string;
  icon: NavIconName;
  description?: string;
  /** Item visível no menu, mas opaco e não clicável (ainda não implementado). */
  disabled?: boolean;
};

export type NavLeafGroup = {
  /** Label do grupo no painel (ex.: "GERAL"). Vazio = leaves soltos no topo. */
  label: string;
  leaves: NavLeaf[];
};

export type NavModule = {
  id: string;
  label: string;
  icon: NavIconName;
  /** Rota ao clicar no rail (primeiro leaf ou path próprio). */
  path: string;
  description?: string;
  /** Submenus da coluna 2. Ausente = leaf sem painel. */
  panelGroups?: NavLeafGroup[];
};

export type NavSection = {
  label: string;
  modules: NavModule[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Menu",
    modules: [
      {
        id: "visao-geral",
        label: "Início",
        icon: "dashboard",
        path: "/visao-geral",
        description: "Resumo da operação da loja.",
      },
      {
        id: "vendas",
        label: "Vendas",
        icon: "sales",
        path: "/vendas",
        description: "Acompanhe e gerencie as vendas.",
        panelGroups: [
          {
            label: "",
            leaves: [
              {
                id: "pedidos-venda",
                label: "Pedidos de venda",
                path: "/vendas/pedidos-de-venda",
                icon: "mail",
                description: "Pedidos de venda da loja.",
              },
              {
                id: "vendas-lista",
                label: "Vendas",
                path: "/vendas",
                icon: "arrow-down-left",
                description: "Acompanhe e gerencie as vendas.",
              },
              {
                id: "contratos-vendas",
                label: "Contrato de vendas",
                path: "/vendas/contratos-de-vendas",
                icon: "document",
                description: "Contratos de vendas recorrentes.",
              },
            ],
          },
          {
            label: "SERVIÇOS",
            leaves: [
              {
                id: "ordem-servicos",
                label: "Ordem de serviços",
                path: "/vendas/ordem-de-servicos",
                icon: "clipboard",
                description: "Ordens de serviço.",
              },
            ],
          },
          {
            label: "FISCAL",
            leaves: [
              {
                id: "vendas-nfse",
                label: "NFS-e",
                path: "/vendas/nfse",
                icon: "receipt",
                description: "Emitir nota fiscal de serviço (NFS-e).",
              },
              {
                id: "vendas-nfe",
                label: "NF-e",
                path: "/vendas/nfe",
                icon: "tag",
                description: "Notas fiscais eletrônicas de venda.",
                disabled: true,
              },
              {
                id: "vendas-sat-cfe",
                label: "SAT CF-e",
                path: "/vendas/sat-cfe",
                icon: "tag",
                description: "Cupom fiscal eletrônico SAT.",
                disabled: true,
              },
            ],
          },
          {
            label: "BENEFÍCIOS",
            leaves: [
              {
                id: "promocoes",
                label: "Promoções",
                path: "/vendas/promocoes",
                icon: "star",
                description: "Promoções e benefícios de venda.",
              },
            ],
          },
        ],
      },
      {
        id: "produtos",
        label: "Produtos",
        icon: "products",
        path: "/catalogo/produtos",
        description: "Catálogo de produtos e cadastros auxiliares.",
        panelGroups: [
          {
            label: "",
            leaves: [
              {
                id: "produtos",
                label: "Produtos",
                path: "/catalogo/produtos",
                icon: "boxes",
                description: "Lista e cadastro de produtos.",
              },
              {
                id: "fichas-tecnicas",
                label: "Fichas técnicas",
                path: "/catalogo/fichas-tecnicas",
                icon: "clipboard",
                description: "Fichas técnicas dos produtos.",
              },
              {
                id: "variacoes-opcoes",
                label: "Variações e opções",
                path: "/catalogo/variacoes-e-opcoes",
                icon: "sliders",
                description: "Variações, grades e opções de produto.",
              },
            ],
          },
          {
            label: "GERAL",
            leaves: [
              {
                id: "categorias",
                label: "Categorias",
                path: "/catalogo/categorias",
                icon: "folder",
                description: "Categorias do catálogo.",
              },
              {
                id: "unidade-medida",
                label: "Unidade de medida",
                path: "/catalogo/unidade-de-medida",
                icon: "ruler",
                description: "Unidades de medida.",
              },
              {
                id: "lista-precos",
                label: "Lista de preços",
                path: "/catalogo/lista-de-precos",
                icon: "dollar",
                description: "Listas e tabelas de preço.",
              },
              {
                id: "parametros-fiscais",
                label: "Parâmetros fiscais",
                path: "/catalogo/parametros-fiscais",
                icon: "receipt",
                description: "Configurações fiscais do catálogo.",
              },
            ],
          },
        ],
      },
      {
        id: "estoque",
        label: "Estoque",
        icon: "warehouse",
        path: "/estoque",
        description: "Posição e movimentações de estoque.",
        panelGroups: [
          {
            label: "",
            leaves: [
              {
                id: "estoque-posicao",
                label: "Estoque",
                path: "/estoque",
                icon: "grid",
                description: "Posição atual de estoque.",
              },
              {
                id: "movimentacoes",
                label: "Movimentações",
                path: "/estoque/movimentacoes",
                icon: "products",
                description: "Entradas, saídas e ajustes de estoque.",
              },
              {
                id: "transferencias",
                label: "Transferências",
                path: "/estoque/transferencias",
                icon: "arrow-right",
                description: "Transferências entre locais e lojas.",
              },
              {
                id: "compras",
                label: "Compras",
                path: "/estoque/compras",
                icon: "arrow-left",
                description: "Pedidos e operações de compra.",
              },
            ],
          },
          {
            label: "LOGÍSTICA",
            leaves: [
              {
                id: "transportadoras",
                label: "Transportadoras",
                path: "/estoque/transportadoras",
                icon: "truck",
                description: "Cadastro de transportadoras.",
              },
              {
                id: "fornecedores",
                label: "Fornecedores",
                path: "/estoque/fornecedores",
                icon: "user",
                description: "Cadastro de fornecedores.",
              },
            ],
          },
          {
            label: "COMPRAS",
            leaves: [
              {
                id: "nfe-entrada",
                label: "NF-e de entrada",
                path: "/estoque/nfe-de-entrada",
                icon: "file-input",
                description: "Notas fiscais de entrada.",
                disabled: true,
              },
              {
                id: "facilita-nfe",
                label: "Facilita NF-e",
                path: "/estoque/facilita-nfe",
                icon: "document",
                description: "Facilitador de NF-e de entrada.",
                disabled: true,
              },
            ],
          },
          {
            label: "PRODUÇÃO",
            leaves: [
              {
                id: "producao",
                label: "Produção",
                path: "/estoque/producao",
                icon: "clock",
                description:
                  "Pedido, acompanhamento e finalização da produção.",
              },
            ],
          },
          {
            label: "CONFIGURAÇÕES",
            leaves: [
              {
                id: "categorias-movimentacao",
                label: "Categorias de Movimentação",
                path: "/estoque/categorias-de-movimentacao",
                icon: "tags",
                description: "Categorias de movimentação de estoque.",
              },
            ],
          },
        ],
      },
      {
        id: "clientes",
        label: "Clientes",
        icon: "customers",
        path: "/clientes",
        description: "Cadastro e histórico de clientes.",
        panelGroups: [
          {
            label: "",
            leaves: [
              {
                id: "clientes-lista",
                label: "Clientes",
                path: "/clientes",
                icon: "customers",
                description: "Cadastro e histórico de clientes.",
              },
              {
                id: "clientes-categoria",
                label: "Categoria",
                path: "/clientes/categoria",
                icon: "folder",
                description: "Categorias de clientes.",
              },
            ],
          },
          {
            label: "MARKETING",
            leaves: [
              {
                id: "clientes-campanha",
                label: "Campanha",
                path: "/clientes/campanha",
                icon: "megaphone",
                description: "Campanhas de marketing para clientes.",
                disabled: true,
              },
            ],
          },
        ],
      },
      {
        id: "financas",
        label: "Finanças",
        icon: "finance",
        path: "/financas/extratos",
        description: "Fluxo de caixa e finanças da loja.",
        panelGroups: [
          {
            label: "",
            leaves: [
              {
                id: "financas-extratos",
                label: "Extratos",
                path: "/financas/extratos",
                icon: "statement",
                description: "Extratos financeiros da loja.",
              },
              {
                id: "financas-lancamentos",
                label: "Lançamentos",
                path: "/financas/lancamentos",
                icon: "transfer",
                description: "Lançamentos financeiros.",
              },
              {
                id: "financas-conciliacao",
                label: "Conciliação bancária",
                path: "/financas/conciliacao-bancaria",
                icon: "checklist",
                description: "Conciliação de contas bancárias.",
              },
              {
                id: "financas-relatorios-resultados",
                label: "Relatórios de resultados",
                path: "/financas/relatorios-de-resultados",
                icon: "reports",
                description: "Relatórios de resultados financeiros.",
              },
              {
                id: "financas-analise-centro-custo",
                label: "Análise por centro de custo",
                path: "/financas/analise-centro-de-custo",
                icon: "pie-chart",
                description: "Percentual de gasto ou entrada por centro de custo.",
              },
              {
                id: "financas-boletos",
                label: "Boletos",
                path: "/financas/boletos",
                icon: "ticket",
                description: "Emissão e gestão de boletos.",
              },
            ],
          },
          {
            label: "ORGANIZAÇÃO FINANCEIRA",
            leaves: [
              {
                id: "financas-contratos-cartoes",
                label: "Contratos de cartões e outros",
                path: "/financas/contratos-de-cartoes-e-outros",
                icon: "credit-card",
                description: "Contratos de cartões e meios de pagamento.",
              },
              {
                id: "financas-contas-bancarias",
                label: "Contas bancárias",
                path: "/financas/contas-bancarias",
                icon: "landmark",
                description: "Cadastro de contas bancárias.",
              },
              {
                id: "financas-grupo-financeiro",
                label: "Grupo financeiro",
                path: "/financas/grupo-financeiro",
                icon: "building",
                description: "Grupos financeiros da loja.",
              },
              {
                id: "financas-plano-contas",
                label: "Plano de contas",
                path: "/financas/plano-de-contas",
                icon: "list",
                description: "Plano de contas contábil.",
              },
              {
                id: "financas-centro-custo",
                label: "Centro de custo",
                path: "/financas/centro-de-custo",
                icon: "target",
                description: "Centros de custo.",
              },
            ],
          },
          {
            label: "NOTAS FISCAIS",
            leaves: [
              {
                id: "financas-facilita-nfe",
                label: "Facilita NF-e",
                path: "/financas/facilita-nfe",
                icon: "document",
                description: "Facilitador de NF-e.",
              },
              {
                id: "financas-contabilidade",
                label: "Contabilidade",
                path: "/financas/contabilidade",
                icon: "calculator",
                description: "Integração contábil e notas fiscais.",
              },
            ],
          },
        ],
      },
      {
        id: "relatorios",
        label: "Relatórios",
        icon: "reports",
        path: "/relatorios",
        description: "Relatórios operacionais e gerenciais.",
      },
    ],
  },
];

export const FOOTER_NAV_MODULES: NavModule[] = [
  {
    id: "settings",
    label: "Ajustes",
    icon: "settings",
    path: "/settings/group",
    description: "Configurações gerais do sistema.",
    panelGroups: [
      {
        label: "",
        leaves: [
          {
            id: "group",
            label: "Dados da empresa",
            path: "/settings/group",
            icon: "building",
            description: "Cadastro do grupo: identificação, logo e preferências.",
          },
          {
            id: "units",
            label: "Matrizes e Filiais",
            path: "/settings/units",
            icon: "map-pin",
            description: "Empresas matrizes do grupo e filiais vinculadas.",
          },
          {
            id: "users-permissions",
            label: "Usuários e Permissões",
            path: "/settings/users-permissions",
            icon: "users",
            description: "Controle de acessos e cargos da equipe.",
          },
        ],
      },
      {
        label: "Cadastros",
        leaves: [
          {
            id: "vehicle-models",
            label: "Modelos de veículo",
            path: "/settings/vehicle-models",
            icon: "car",
            description: "Catálogo de marca, modelo, versão, ano e tipo.",
          },
        ],
      },
    ],
  },
];

export function allNavModules(): NavModule[] {
  return [
    ...NAV_SECTIONS.flatMap((section) => section.modules),
    ...FOOTER_NAV_MODULES,
  ];
}

/** Módulo pelo id do item de navegação (o rail devolve o id no callback). */
export function findModuleById(id: string): NavModule | undefined {
  return allNavModules().find((module) => module.id === id);
}

export function moduleHasPanel(module: NavModule): boolean {
  return Boolean(module.panelGroups && module.panelGroups.length > 0);
}

export function flattenModuleLeaves(
  module: NavModule,
): NavLeaf[] {
  return module.panelGroups?.flatMap((group) => group.leaves) ?? [];
}

/** Prefere o leaf com path mais específico (evita `/estoque` “roubar” `/estoque/compras`). */
export function matchLeafByPath(
  leaves: NavLeaf[],
  pathname: string,
): NavLeaf | undefined {
  return leaves
    .filter(
      (leaf) =>
        leaf.path === pathname || pathname.startsWith(`${leaf.path}/`),
    )
    .sort((a, b) => b.path.length - a.path.length)[0];
}

export function findModuleByPath(pathname: string): NavModule | undefined {
  const modules = allNavModules();
  const exactLeaf = modules.find((mod) =>
    Boolean(matchLeafByPath(flattenModuleLeaves(mod), pathname)),
  );
  if (exactLeaf) return exactLeaf;

  return modules.find(
    (mod) => mod.path === pathname || pathname.startsWith(`${mod.path}/`),
  );
}

export function findLeafByPath(
  pathname: string,
): { module: NavModule; leaf: NavLeaf } | undefined {
  for (const mod of allNavModules()) {
    const leaf = matchLeafByPath(flattenModuleLeaves(mod), pathname);
    if (leaf) return { module: mod, leaf };
  }

  const foundModule = findModuleByPath(pathname);
  if (!foundModule) return undefined;
  if (!moduleHasPanel(foundModule)) {
    return {
      module: foundModule,
      leaf: {
        id: foundModule.id,
        label: foundModule.label,
        path: foundModule.path,
        icon: foundModule.icon,
        description: foundModule.description,
      },
    };
  }
  return undefined;
}

export function resolvePageMeta(pathname: string): {
  title: string;
  description: string;
} {
  const hit = findLeafByPath(pathname);
  if (hit) {
    return {
      title: hit.leaf.label,
      description: hit.leaf.description ?? hit.module.description ?? "",
    };
  }
  return {
    title: "FebraHub",
    description: "Backoffice do FebraHub",
  };
}
