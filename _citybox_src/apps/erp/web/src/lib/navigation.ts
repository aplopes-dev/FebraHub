import type { NavIconName } from "@/lib/nav-icons";

export type ComercioNavLeaf = {
  id: string;
  label: string;
  path: string;
  icon: NavIconName;
  description?: string;
  /** Item visível no menu, mas opaco e não clicável (ainda não implementado). */
  disabled?: boolean;
};

export type ComercioNavLeafGroup = {
  /** Label do grupo no painel (ex.: "GERAL"). Vazio = leaves soltos no topo. */
  label: string;
  leaves: ComercioNavLeaf[];
};

export type ComercioNavModule = {
  id: string;
  label: string;
  icon: NavIconName;
  /** Rota ao clicar no rail (primeiro leaf ou path próprio). */
  path: string;
  description?: string;
  /** Submenus da coluna 2. Ausente = leaf sem painel. */
  panelGroups?: ComercioNavLeafGroup[];
};

export type ComercioNavSection = {
  label: string;
  modules: ComercioNavModule[];
};

export const COMERCIO_NAV_SECTIONS: ComercioNavSection[] = [
  {
    label: "Menu",
    modules: [
      {
        id: "visao-geral",
        label: "Visão Geral",
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
                icon: "receipt",
                description: "Emitir NF-e a partir de um pedido de venda.",
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
  {
    label: "Canais de Venda",
    modules: [
      {
        id: "ponto-de-venda",
        label: "Pontos de venda",
        icon: "pos",
        path: "/ponto-de-venda/cadastros",
        description: "Cadastro e operação de PDVs da loja.",
        panelGroups: [
          {
            label: "",
            leaves: [
              {
                id: "pdv-cadastros",
                label: "Cadastros",
                path: "/ponto-de-venda/cadastros",
                icon: "list",
                description: "Cadastro dos pontos de venda da loja.",
              },
              {
                id: "pdv-caixas",
                label: "Gerenciar Caixas",
                path: "/ponto-de-venda/caixas",
                icon: "wallet",
                description: "Abertura, fechamento e gestão de caixas.",
              },
              {
                id: "pdv-kds",
                label: "KDS",
                path: "/ponto-de-venda/kds",
                icon: "devices",
                description: "Kitchen Display System — filas de produção.",
              },
              // Mesas / Comandas: ocultos até sync ERP + UX (código/rotas
              // placeholder seguem em /ponto-de-venda/{mesas,comandas}).
            ],
          },
          {
            label: "CONFIGURAÇÕES",
            leaves: [
              {
                id: "pdv-modulos",
                label: "Módulos",
                path: "/ponto-de-venda/configuracoes/modulos",
                icon: "grid",
                description:
                  "Quais telas os PDVs desta loja mostram (delivery, consulta de preço, etc.).",
              },
              {
                id: "pdv-alcadas",
                label: "Alçadas",
                path: "/ponto-de-venda/configuracoes/alcadas",
                icon: "sliders",
                description:
                  "Até onde o operador de caixa vai sem supervisor.",
              },
              {
                id: "pdv-config-geral",
                label: "Geral, modos de pedido",
                path: "/ponto-de-venda/configuracoes/geral",
                icon: "sliders",
                description: "Configurações gerais e modos de pedido do PDV.",
              },
              {
                id: "pdv-config-consignado",
                label: "Consignado",
                path: "/ponto-de-venda/configuracoes/consignado",
                icon: "package",
                description: "Regras de venda consignada.",
              },
              {
                id: "pdv-config-crediario",
                label: "Crediário",
                path: "/ponto-de-venda/configuracoes/crediario",
                icon: "credit-card",
                description: "Regras de crediário no PDV.",
              },
              {
                id: "pdv-config-painel-senhas",
                label: "Painel de senhas",
                path: "/ponto-de-venda/configuracoes/painel-de-senhas",
                icon: "ticket",
                description: "Painel de senhas e chamada de clientes.",
              },
              {
                id: "pdv-config-recibos",
                label: "Recibos e notas impressas",
                path: "/ponto-de-venda/configuracoes/recibos-e-notas",
                icon: "receipt",
                description: "Layouts de recibos e notas impressas.",
              },
              {
                id: "pdv-config-troca",
                label: "Troca & Devolução",
                path: "/ponto-de-venda/configuracoes/troca-e-devolucao",
                icon: "transfer",
                description: "Políticas de troca e devolução no PDV.",
              },
            ],
          },
        ],
      },
      {
        id: "dispositivos",
        label: "Dispositivos",
        icon: "devices",
        path: "/dispositivos",
        description: "Dispositivos conectados à loja.",
      },
    ],
  },
];

export const COMERCIO_FOOTER_MODULES: ComercioNavModule[] = [
  {
    id: "meu-plano",
    label: "Meu plano",
    icon: "credit-card",
    path: "/meu-plano",
    description: "Plano e assinatura da loja.",
  },
  {
    id: "configuracoes",
    label: "Configurações",
    icon: "settings",
    path: "/configuracoes/dados-empresa",
    description: "Configurações gerais do ERP Comércio.",
    panelGroups: [
      {
        label: "",
        leaves: [
          {
            id: "dados-empresa",
            label: "Dados da empresa",
            path: "/configuracoes/dados-empresa",
            icon: "building",
            description: "Informações cadastrais e logotipo da empresa.",
          },
          {
            id: "unidades-filiais",
            label: "Unidades e Filiais",
            path: "/configuracoes/unidades-filiais",
            icon: "map-pin",
            description: "Gerenciamento de filiais e unidades físicas.",
          },
          {
            id: "formas-pagamento",
            label: "Formas de pagamento",
            path: "/configuracoes/formas-pagamento",
            icon: "credit-card",
            description: "Configurar bandeiras e meios de pagamento aceitos.",
          },
          {
            id: "usuarios-permissoes",
            label: "Usuários e Permissões",
            path: "/configuracoes/usuarios-permissoes",
            icon: "users",
            description: "Controle de acessos e cargos da equipe.",
          },
          {
            id: "integracoes",
            label: "Integrações",
            path: "/configuracoes/integracoes",
            icon: "zap",
            description: "Conexões com serviços externos e APIs.",
          },
          {
            id: "modelos-etiqueta",
            label: "Modelos de etiqueta",
            path: "/configuracoes/modelos-etiqueta",
            icon: "tag",
            description: "Layouts e tamanhos de etiquetas de gôndola/envio.",
          },
          {
            id: "fiscal",
            label: "Fiscal",
            path: "/configuracoes/fiscal",
            icon: "receipt",
            description: "Parâmetros fiscais, certificados e notas.",
          },
        ],
      },
    ],
  },
];

export function allComercioModules(): ComercioNavModule[] {
  return [
    ...COMERCIO_NAV_SECTIONS.flatMap((section) => section.modules),
    ...COMERCIO_FOOTER_MODULES,
  ];
}

export function moduleHasPanel(module: ComercioNavModule): boolean {
  return Boolean(module.panelGroups && module.panelGroups.length > 0);
}

export function flattenModuleLeaves(
  module: ComercioNavModule,
): ComercioNavLeaf[] {
  return module.panelGroups?.flatMap((group) => group.leaves) ?? [];
}

/** Prefere o leaf com path mais específico (evita `/estoque` “roubar” `/estoque/compras`). */
export function matchLeafByPath(
  leaves: ComercioNavLeaf[],
  pathname: string,
): ComercioNavLeaf | undefined {
  return leaves
    .filter(
      (leaf) =>
        leaf.path === pathname || pathname.startsWith(`${leaf.path}/`),
    )
    .sort((a, b) => b.path.length - a.path.length)[0];
}

export function findModuleByPath(pathname: string): ComercioNavModule | undefined {
  const modules = allComercioModules();
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
): { module: ComercioNavModule; leaf: ComercioNavLeaf } | undefined {
  for (const mod of allComercioModules()) {
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
    title: "ERP Comércio",
    description: "Backoffice de comércio Citybox",
  };
}
