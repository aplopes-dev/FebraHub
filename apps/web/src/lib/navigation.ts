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

/* ════════════════════════════════════════════════════════════════════════
   NAVEGAÇÃO DO FEBRAHUB — ERP da unidade Febracis Salvador

   Rail (coluna 1) = módulo. Painel (coluna 2) = grupos rotulados de telas.
   Administração fica no rodapé do rail (`FOOTER_NAV_MODULES`), separada do
   trabalho do dia.

   Regras que esta árvore obedece (e que devem valer para o que entrar depois):

   1. Menu lista LUGARES, não ações. "Novo", "Abrir", "Imprimir" são botões na
      tela que os executa — nunca item de menu.
   2. Filtro não é item. Recortes da mesma lista viram aba dentro da tela. A
      exceção é fila de trabalho com dono e prazo (Aprovações, Recebimentos):
      essas são caixas de entrada, não visões.
   3. Um destino, um item. Nenhuma rota aparece duas vezes na árvore.
   4. Todo módulo abre numa visão geral — o painel de indicadores do setor é a
      primeira tela dele, não um item irmão.
   5. Grupos rotulados quando passar de sete itens.
   6. Rótulo curto, sem parêntese explicativo: a explicação vive no
      `description`, que o painel usa como legenda.

   `disabled: true` = tela ainda não portada do `apps/web-legado`. O item
   aparece opaco com "Em breve" — o menu mostra o mapa inteiro do ERP desde já,
   e o que falta fica explícito em vez de invisível.

   `path` do módulo aponta para a primeira tela ABERTA dele. Módulos ainda sem
   nenhuma tela apontam para a própria rota (`/pedagogico`, `/marketing`,
   `/organizacao`), que renderiza o placeholder do módulo.
   ════════════════════════════════════════════════════════════════════════ */

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Menu",
    modules: [
      /* ─────────────────────────────── INÍCIO ─────────────────────────── */
      {
        id: "inicio",
        label: "Início",
        icon: "dashboard",
        path: "/visao-geral",
        description: "O que precisa de atenção hoje.",
        panelGroups: [
          {
            label: "",
            leaves: [
              {
                id: "inicio-visao-geral",
                label: "Visão geral",
                path: "/visao-geral",
                icon: "dashboard",
                description: "Resumo do dia da unidade.",
              },
              {
                id: "inicio-executivo",
                label: "Painel executivo",
                path: "/inicio/executivo",
                icon: "reports",
                description: "Indicadores consolidados da diretoria.",
                disabled: true,
              },
              {
                id: "inicio-metas",
                label: "Metas e indicadores",
                path: "/inicio/metas",
                icon: "target",
                description: "Cadastro e acompanhamento das metas.",
                disabled: true,
              },
              {
                id: "inicio-comunicados",
                label: "Comunicados",
                path: "/inicio/comunicados",
                icon: "bell",
                description: "Avisos enviados para a equipe.",
                disabled: true,
              },
            ],
          },
        ],
      },

      /* ────────────────────────────── COMERCIAL ───────────────────────── */
      {
        id: "comercial",
        label: "Comercial",
        icon: "handshake",
        path: "/comercial",
        description: "Da captação ao fechamento da matrícula.",
        panelGroups: [
          {
            label: "OPERAÇÃO",
            leaves: [
              {
                id: "comercial-visao-geral",
                label: "Visão geral",
                path: "/comercial",
                icon: "reports",
                description: "Placar do mês, o que precisa de atenção e a sala de hoje.",
              },
              {
                id: "comercial-funil",
                label: "Funil de vendas",
                path: "/comercial/funil",
                icon: "pipeline",
                description: "Oportunidades por etapa, em quadro ou lista.",
              },
              {
                id: "comercial-vendas",
                label: "Vendas",
                path: "/comercial/vendas",
                icon: "sales",
                description: "Matrículas fechadas, aprovação e cancelamento.",
              },
              {
                id: "comercial-atendimento",
                label: "Atendimento",
                path: "/comercial/atendimento",
                icon: "chat",
                description: "Conversas de WhatsApp e dos agentes de IA.",
                disabled: true,
              },
            ],
          },
          {
            label: "CARTEIRA",
            leaves: [
              {
                id: "comercial-pessoas",
                label: "Pessoas",
                path: "/clientes",
                icon: "id-card",
                description:
                  "Cadastro único: a mesma ficha para cliente, aluno e lead.",
              },
              {
                id: "comercial-leads",
                label: "Leads",
                path: "/comercial/leads",
                icon: "zap",
                description: "Captação recente, origem e tempo até o primeiro contato.",
              },
            ],
          },
          {
            label: "MERCADO",
            leaves: [
              {
                id: "comercial-territorial",
                label: "Inteligência territorial",
                path: "/comercial/territorial",
                icon: "map-pin",
                description: "Mapa de empresas e conexões do território.",
                disabled: true,
              },
              {
                id: "comercial-eventos",
                label: "Eventos e ingressos",
                path: "/comercial/eventos",
                icon: "calendar",
                description: "Edições, lotes e a operação de sala.",
              },
            ],
          },
        ],
      },

      /* ───────────────────────────── PEDAGÓGICO ───────────────────────── */
      {
        id: "pedagogico",
        label: "Pedagógico",
        icon: "graduation",
        path: "/pedagogico",
        description: "Turmas, alunos e secretaria.",
        panelGroups: [
          {
            label: "DIA A DIA",
            leaves: [
              {
                id: "ped-visao-geral",
                label: "Visão geral",
                path: "/pedagogico",
                icon: "reports",
                description: "Turmas, confirmações e presença em tempo real.",
                disabled: true,
              },
              {
                id: "ped-credenciamento",
                label: "Credenciamento",
                path: "/pedagogico/credenciamento",
                icon: "qr",
                description: "Check-in por QR Code, CPF ou nome.",
                disabled: true,
              },
              {
                id: "ped-presenca",
                label: "Presença",
                path: "/pedagogico/presenca",
                icon: "checklist",
                description: "Registro de presença por dia e sessão.",
                disabled: true,
              },
              {
                id: "ped-solicitacoes",
                label: "Solicitações",
                path: "/pedagogico/solicitacoes",
                icon: "inbox",
                description: "Certificados, declarações e suporte ao aluno.",
                disabled: true,
              },
            ],
          },
          {
            label: "ALUNOS",
            leaves: [
              {
                id: "ped-alunos",
                label: "Alunos e jornada",
                path: "/pedagogico/alunos",
                icon: "customers",
                description: "Lista operacional e status da jornada.",
                disabled: true,
              },
              {
                id: "ped-secretaria",
                label: "Secretaria do aluno",
                path: "/pedagogico/secretaria",
                icon: "document",
                description:
                  "Ficha completa: treinamentos, presença e certificados.",
                disabled: true,
              },
              {
                id: "ped-represados",
                label: "Represados",
                path: "/pedagogico/represados",
                icon: "alert",
                description: "Alunos com validade em risco.",
                disabled: true,
              },
              {
                id: "ped-transferencias",
                label: "Transferências",
                path: "/pedagogico/transferencias",
                icon: "transfer",
                description: "Solicitação, aprovação e histórico de troca de turma.",
                disabled: true,
              },
              {
                id: "ped-cs",
                label: "Customer Success",
                path: "/pedagogico/customer-success",
                icon: "support",
                description: "Alunos que exigem atenção e o que foi feito.",
                disabled: true,
              },
            ],
          },
          {
            label: "TURMAS",
            leaves: [
              {
                id: "ped-turmas",
                label: "Turmas e calendário",
                path: "/pedagogico/turmas",
                icon: "calendar",
                description: "Agenda, abertura e gestão de turmas.",
                disabled: true,
              },
              {
                id: "ped-monitores",
                label: "Monitores",
                path: "/pedagogico/monitores",
                icon: "user",
                description: "Cadastro e escala de monitores por turma.",
                disabled: true,
              },
            ],
          },
          {
            label: "CADASTROS",
            leaves: [
              {
                id: "ped-avaliacoes",
                label: "Avaliações",
                path: "/pedagogico/avaliacoes",
                icon: "star",
                description: "Notas de curso e pesquisas de evento.",
                disabled: true,
              },
            ],
          },
        ],
      },

      /* ─────────────────────────────── LOJA ───────────────────────────── */
      {
        id: "loja",
        label: "Loja",
        icon: "store",
        path: "/catalogo/produtos",
        description: "Balcão, fila e catálogo da loja.",
        panelGroups: [
          {
            label: "CAIXA",
            leaves: [
              {
                id: "loja-balcao",
                label: "Balcão",
                path: "/loja/balcao",
                icon: "pos",
                description: "Venda rápida com split de pagamento.",
                disabled: true,
              },
              {
                id: "loja-entrega",
                label: "Entrega e retirada",
                path: "/loja/entrega",
                icon: "qr",
                description:
                  "Retirada por QR do comprovante ou pelo código de 3 dígitos.",
                disabled: true,
              },
            ],
          },
          {
            label: "OPERAÇÃO",
            leaves: [
              {
                id: "loja-visao-geral",
                label: "Visão geral",
                path: "/loja",
                icon: "reports",
                description: "Vendas do dia, formas de pagamento e recebimento.",
                disabled: true,
              },
              {
                id: "loja-fila",
                label: "Fila de preparação",
                path: "/loja/fila",
                icon: "clock",
                description: "Pagamento, preparo, pronto e retirada em tempo real.",
                disabled: true,
              },
              {
                id: "loja-vendas",
                label: "Vendas da loja",
                path: "/vendas",
                icon: "sales",
                description:
                  "Listagem de vendas do balcão (tela herdada do ERP de origem).",
              },
              {
                id: "loja-pedidos",
                label: "Pedidos",
                path: "/loja/pedidos",
                icon: "receipt",
                description: "Histórico de pedidos da loja.",
                disabled: true,
              },
              {
                id: "loja-operacoes",
                label: "Operações e cardápio",
                path: "/loja/operacoes",
                icon: "menu-book",
                description:
                  "Abrir e encerrar operação, cardápio público e painel de TV.",
                disabled: true,
              },
            ],
          },
          {
            label: "CATÁLOGO",
            leaves: [
              {
                id: "loja-produtos",
                label: "Produtos",
                path: "/catalogo/produtos",
                icon: "products",
                description: "Cadastro, preço e saldo por local.",
              },
              {
                id: "loja-categorias",
                label: "Categorias",
                path: "/catalogo/categorias",
                icon: "folder",
                description: "Categorias do catálogo da loja.",
              },
              {
                id: "loja-precos",
                label: "Tabela de preços",
                path: "/catalogo/lista-de-precos",
                icon: "dollar",
                description: "Listas e tabelas de preço.",
              },
            ],
          },
          {
            label: "FECHAMENTO",
            leaves: [
              {
                id: "loja-metas",
                label: "Metas",
                path: "/loja/metas",
                icon: "target",
                description: "Metas do mês e por curso.",
                disabled: true,
              },
              {
                id: "loja-fechamento",
                label: "Fechamento mensal",
                path: "/loja/fechamento",
                icon: "calculator",
                description:
                  "Faturamento, receitas extras e metas batidas do mês.",
                disabled: true,
              },
              {
                id: "loja-auditoria",
                label: "Auditoria",
                path: "/loja/auditoria",
                icon: "history",
                description: "Trilha de pagamentos, cancelamentos e estornos.",
                disabled: true,
              },
            ],
          },
        ],
      },

      /* ──────────────────────────── SUPRIMENTOS ───────────────────────── */
      {
        id: "suprimentos",
        label: "Suprimentos",
        icon: "warehouse",
        path: "/estoque",
        description: "Compras, estoque e fornecedores.",
        panelGroups: [
          {
            label: "COMPRAS",
            leaves: [
              {
                id: "sup-solicitacoes",
                label: "Solicitações",
                path: "/estoque/compras",
                icon: "clipboard",
                description:
                  "Da solicitação ao pedido — minhas, todas e cotações em abas.",
              },
              {
                id: "sup-aprovacoes",
                label: "Aprovações",
                path: "/suprimentos/aprovacoes",
                icon: "approval",
                description: "Fila de compras aguardando a sua alçada.",
                disabled: true,
              },
              {
                id: "sup-recebimentos",
                label: "Recebimentos",
                path: "/suprimentos/recebimentos",
                icon: "package",
                description: "Entradas aguardadas dos pedidos de compra.",
                disabled: true,
              },
            ],
          },
          {
            label: "ESTOQUE",
            leaves: [
              {
                id: "sup-saldos",
                label: "Saldos e locais",
                path: "/estoque",
                icon: "grid",
                description: "Posição por local — loja e depósito.",
              },
              {
                id: "sup-movimentacoes",
                label: "Movimentações",
                path: "/estoque/movimentacoes",
                icon: "transfer",
                description: "Entradas, saídas e ajustes.",
              },
              {
                id: "sup-transferencias",
                label: "Transferências",
                path: "/estoque/transferencias",
                icon: "arrow-right",
                description: "Movimentação entre loja e depósito.",
              },
            ],
          },
          {
            label: "CADASTROS",
            leaves: [
              {
                id: "sup-fornecedores",
                label: "Fornecedores",
                path: "/estoque/fornecedores",
                icon: "truck",
                description: "Cadastro, situação e histórico de fornecedores.",
              },
              {
                id: "sup-categorias-mov",
                label: "Categorias de movimentação",
                path: "/estoque/categorias-de-movimentacao",
                icon: "tags",
                description: "Classificação das movimentações de estoque.",
              },
            ],
          },
        ],
      },

      /* ───────────────────────────── FINANCEIRO ───────────────────────── */
      {
        id: "financeiro",
        label: "Financeiro",
        icon: "finance",
        path: "/financas/lancamentos",
        description: "Caixa, títulos e apuração.",
        panelGroups: [
          {
            label: "MOVIMENTO",
            leaves: [
              {
                id: "fin-visao-geral",
                label: "Visão geral",
                path: "/financeiro",
                icon: "reports",
                description: "Receita, cobertura e inadimplência.",
                disabled: true,
              },
              {
                id: "fin-lancamentos",
                label: "Contas a pagar e receber",
                path: "/financas/lancamentos",
                icon: "wallet",
                description: "Títulos, baixas e vencimentos.",
              },
              {
                id: "fin-extratos",
                label: "Fluxo de caixa",
                path: "/financas/extratos",
                icon: "statement",
                description: "Entradas e saídas por conta e período.",
              },
              {
                id: "fin-boletos",
                label: "Boletos",
                path: "/financas/boletos",
                icon: "ticket",
                description: "Emissão e acompanhamento de boletos.",
              },
            ],
          },
          {
            label: "CONCILIAÇÃO",
            leaves: [
              {
                id: "fin-conciliacao-banco",
                label: "Conciliação bancária",
                path: "/financas/conciliacao-bancaria",
                icon: "checklist",
                description: "Casamento entre extrato e lançamentos.",
              },
              {
                id: "fin-conciliacao-cartao",
                label: "Cartões e maquininha",
                path: "/financeiro/cartoes",
                icon: "credit-card",
                description: "Bruto, taxas e liquidação das vendas no cartão.",
                disabled: true,
              },
            ],
          },
          {
            label: "APURAÇÃO",
            leaves: [
              {
                id: "fin-resultados",
                label: "DRE e resultados",
                path: "/financas/relatorios-de-resultados",
                icon: "reports",
                description: "Resultado por competência.",
              },
              {
                id: "fin-centro-custo-analise",
                label: "Análise por centro de custo",
                path: "/financas/analise-centro-de-custo",
                icon: "pie-chart",
                description: "Quanto cada centro de custo consome ou gera.",
              },
            ],
          },
          {
            label: "FISCAL",
            leaves: [
              {
                id: "fin-nfse",
                label: "NFS-e",
                path: "/vendas/nfse",
                icon: "receipt",
                description:
                  "Nota fiscal de serviço — a nota do curso e da mentoria.",
              },
            ],
          },
          {
            label: "CADASTROS",
            leaves: [
              {
                id: "fin-contas",
                label: "Contas bancárias",
                path: "/financas/contas-bancarias",
                icon: "landmark",
                description: "Contas da unidade.",
              },
              {
                id: "fin-plano-contas",
                label: "Plano de contas",
                path: "/financas/plano-de-contas",
                icon: "list",
                description: "Estrutura contábil dos lançamentos.",
              },
              {
                id: "fin-centro-custo",
                label: "Centros de custo",
                path: "/financas/centro-de-custo",
                icon: "target",
                description: "Centros de custo da unidade.",
              },
              {
                id: "fin-contratos-cartao",
                label: "Contratos de cartão",
                path: "/financas/contratos-de-cartoes-e-outros",
                icon: "credit-card",
                description: "Taxas e prazos por bandeira e adquirente.",
              },
            ],
          },
        ],
      },

      /* ───────────────────────────── MARKETING ────────────────────────── */
      {
        id: "marketing",
        label: "Marketing",
        icon: "megaphone",
        path: "/marketing",
        description: "Redes sociais, conteúdo e campanhas.",
        panelGroups: [
          {
            label: "",
            leaves: [
              {
                id: "mkt-visao-geral",
                label: "Visão geral",
                path: "/marketing",
                icon: "reports",
                description: "Contas, alcance e fila das redes oficiais.",
                disabled: true,
              },
              {
                id: "mkt-publicar",
                label: "Publicar",
                path: "/marketing/publicar",
                icon: "send",
                description: "Criar e agendar postagens.",
                disabled: true,
              },
              {
                id: "mkt-postagens",
                label: "Postagens e análise",
                path: "/marketing/postagens",
                icon: "image",
                description: "Histórico e desempenho do que saiu.",
                disabled: true,
              },
              {
                id: "mkt-mensagens",
                label: "Mensagens",
                path: "/marketing/mensagens",
                icon: "mail",
                description: "Caixa de entrada das redes.",
                disabled: true,
              },
              {
                id: "mkt-campanhas",
                label: "Campanhas",
                path: "/marketing/campanhas",
                icon: "megaphone",
                description: "Investimento e resultado das campanhas pagas.",
                disabled: true,
              },
            ],
          },
        ],
      },

      /* ──────────────────────────── ORGANIZAÇÃO ───────────────────────── */
      {
        id: "organizacao",
        label: "Organização",
        icon: "sitemap",
        path: "/organizacao",
        description: "Estrutura, processos e memória da unidade.",
        panelGroups: [
          {
            label: "ESTRUTURA",
            leaves: [
              {
                id: "org-organograma",
                label: "Organograma",
                path: "/organizacao",
                icon: "sitemap",
                description: "Setores, cargos, pessoas e agentes de IA.",
                disabled: true,
              },
            ],
          },
          {
            label: "CONHECIMENTO",
            leaves: [
              {
                id: "org-processos",
                label: "Processos e manuais",
                path: "/organizacao/processos",
                icon: "workflow",
                description:
                  "Mapa, procedimentos e versões — tudo na mesma tela, em abas.",
                disabled: true,
              },
              {
                id: "org-memoria",
                label: "Memória institucional",
                path: "/organizacao/memoria",
                icon: "menu-book",
                description: "Busca e respostas com citação da fonte.",
                disabled: true,
              },
            ],
          },
          {
            label: "PROJETO",
            leaves: [
              {
                id: "org-implantacao",
                label: "Implantação do ERP",
                path: "/organizacao/implantacao",
                icon: "rocket",
                description: "Entregas, cronograma e impedimentos.",
                disabled: true,
              },
            ],
          },
        ],
      },
    ],
  },
];

export const FOOTER_NAV_MODULES: NavModule[] = [
  {
    id: "administracao",
    label: "Admin",
    icon: "settings",
    path: "/settings/group",
    description: "Acessos, conexões e configuração da unidade.",
    panelGroups: [
      {
        label: "ACESSOS",
        leaves: [
          {
            id: "adm-usuarios",
            label: "Usuários e permissões",
            /* Perfis de acesso NÃO é item de menu: é aba desta tela. Duas
               portas para o mesmo assunto faziam parecer dois cadastros. */
            path: "/settings/users-permissions",
            icon: "users",
            description:
              "Quem entra, com qual perfil e em quais setores — e o que cada perfil pode fazer.",
          },
        ],
      },
      {
        label: "CONEXÕES",
        leaves: [
          {
            id: "adm-fontes",
            label: "Fontes de dados",
            path: "/administracao/integracoes",
            icon: "plug",
            description: "Conexões externas e validade dos tokens.",
            disabled: true,
          },
          {
            id: "adm-whatsapp",
            label: "WhatsApp",
            path: "/administracao/whatsapp",
            icon: "chat",
            description: "Conexão do número e da sessão.",
            disabled: true,
          },
          {
            id: "adm-agentes",
            label: "Agentes de IA",
            path: "/administracao/agentes",
            icon: "bot",
            description: "Pareamento com a plataforma de agentes.",
            disabled: true,
          },
          {
            id: "adm-redes",
            label: "Redes sociais",
            path: "/administracao/redes-sociais",
            icon: "megaphone",
            description: "Chave de integração e perfil usado para publicar.",
            disabled: true,
          },
        ],
      },
      {
        label: "UNIDADE",
        leaves: [
          {
            id: "adm-unidade",
            label: "Dados da unidade",
            path: "/settings/group",
            icon: "building",
            description: "Identificação, logotipo, contato e endereço.",
          },
          {
            id: "adm-fiscal",
            label: "Emitente e cupom fiscal",
            path: "/administracao/fiscal",
            icon: "receipt",
            description: "Certificado, CSC e dados do emitente.",
            disabled: true,
          },
          {
            id: "adm-comunicados",
            label: "Envio de comunicados",
            path: "/administracao/comunicados",
            icon: "bell",
            description: "Avisos para um perfil, setor, pessoa ou todos.",
            disabled: true,
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
