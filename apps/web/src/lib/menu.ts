import {
  Bell, BookOpen, Bot, LayoutDashboard, MessageCircle,
  Plug, Receipt, Settings2, ShieldCheck, ShoppingCart, Users, Wallet, Workflow,
  type LucideIcon,
} from "lucide-react";
import { HUBS, PAGINA_INTEGRACOES } from "@/lib/hubs";

/* ============ MENU DUAL (rail + submenu) ============
   Primário = ícone no rail. Filhos = links no painel de submenu.
   Ativo: entre todos os filhos visíveis, vence o href mais longo. */

export interface ContextoMenu {
  admin: boolean;
  setores: readonly string[];
  pode: (...permissoes: string[]) => boolean;
}

export interface ItemMenu {
  id: string;
  label: string;
  href: string;
  Icone?: LucideIcon;
  titulo?: string;
  desc?: string;
  visivel: (ctx: ContextoMenu) => boolean;
}

/** Grupo do rail (ícone) com filhos no submenu. */
export interface MenuPrimario {
  id: string;
  label: string;
  Icone: LucideIcon;
  filhos: readonly ItemMenu[];
  visivel: (ctx: ContextoMenu) => boolean;
}

const comPermissao = (...permissoes: string[]) => (ctx: ContextoMenu) => ctx.pode(...permissoes);
const doSetor = (setor: string) => (ctx: ContextoMenu) =>
  ctx.admin || ctx.setores.includes(setor);

function filhosHub(key: string, nome: string, Icone: LucideIcon, desc: string): ItemMenu[] {
  const base: ItemMenu[] = [
    {
      id: `${key}-resumo`,
      label: "Resumo",
      href: `/${key}`,
      Icone,
      titulo: nome,
      desc,
      visivel: doSetor(key),
    },
  ];

  if (key === "loja") {
    base.push(
      {
        id: "loja-produtos",
        label: "Produtos e Estoque",
        href: "/loja/produtos",
        titulo: "Catálogo da Loja",
        desc: "Produtos, categorias e estoque operacional (Loja / Depósito)",
        visivel: (ctx: ContextoMenu) => doSetor("loja")(ctx) || ctx.pode("loja.produtos.ver"),
      },
      {
        id: "loja-dashboard",
        label: "Dashboard",
        href: "/loja/dashboard",
        titulo: "Dashboard da Loja",
        desc: "Faturamento, mais vendidos, PIX × cartão, canal e tempos médios",
        visivel: (ctx: ContextoMenu) => doSetor("loja")(ctx) || ctx.pode("loja.pedidos.ver"),
      },
      {
        id: "loja-balcao",
        label: "Balcão (PDV)",
        href: "/loja/balcao",
        titulo: "Venda no balcão",
        desc: "Venda rápida com split de pagamento — mesma fila e estoque",
        visivel: (ctx: ContextoMenu) => ctx.pode("loja.pedidos.operar"),
      },
      {
        id: "loja-fila",
        label: "Fila de preparação",
        href: "/loja/fila",
        titulo: "Fila da Loja",
        desc: "Pagamento, fila, preparação, pronto e retirada em tempo real",
        visivel: (ctx: ContextoMenu) => doSetor("loja")(ctx) || ctx.pode("loja.pedidos.ver"),
      },
      {
        id: "loja-auditoria",
        label: "Auditoria",
        href: "/loja/auditoria",
        titulo: "Auditoria da Loja",
        desc: "Trilha de pagamentos, cancelamentos, estornos e configurações",
        visivel: (ctx: ContextoMenu) => ctx.pode("loja.pedidos.gerenciar"),
      },
      {
        id: "loja-operacoes",
        label: "Operações e cardápio",
        href: "/loja/operacoes",
        titulo: "Operações da Loja",
        desc: "Eventos, cardápio digital público e painel/TV",
        visivel: (ctx: ContextoMenu) => doSetor("loja")(ctx) || ctx.pode("loja.pedidos.ver"),
      },
      {
        id: "loja-cardapio",
        label: "Abrir cardápio",
        href: "/loja/cardapio",
        titulo: "Cardápio digital",
        desc: "Abre o cardápio público da operação ativa (para conferir/testar)",
        visivel: (ctx: ContextoMenu) => doSetor("loja")(ctx) || ctx.pode("loja.pedidos.ver"),
      },
      {
        id: "loja-tv",
        label: "Painel / TV",
        href: "/loja/tv",
        titulo: "Painel público (TV)",
        desc: "Fila em tela cheia — só número e status, legível à distância",
        visivel: (ctx: ContextoMenu) => doSetor("loja")(ctx) || ctx.pode("loja.pedidos.ver"),
      },
      {
        id: "loja-metas-mes",
        label: "Metas mensais",
        href: "/loja/cadastros/metas-mes",
        titulo: "Metas mensais da loja",
        desc: "Mínima, básica e máster por mês — substitui a planilha de metas",
        visivel: doSetor("loja"),
      },
      {
        id: "loja-metas-curso",
        label: "Metas por curso",
        href: "/loja/cadastros/metas-curso",
        titulo: "Metas por curso",
        desc: "Meta de produtos e curso por mês",
        visivel: doSetor("loja"),
      },
      {
        id: "loja-faturamento-curso",
        label: "Faturamento por curso",
        href: "/loja/cadastros/faturamento-curso",
        titulo: "Faturamento por curso",
        desc: "Performance da loja durante o curso",
        visivel: doSetor("loja"),
      },
      {
        id: "loja-receitas-extras",
        label: "Receitas extras",
        href: "/loja/cadastros/receitas-extras",
        titulo: "Receitas extras",
        desc: "Premium, aluguel e Sentido de Brincar",
        visivel: doSetor("loja"),
      },
      {
        id: "loja-fechamento",
        label: "Fechamento",
        href: "/loja/cadastros/fechamento",
        titulo: "Fechamento mensal",
        desc: "Faturamento e metas batidas do mês",
        visivel: doSetor("loja"),
      },
    );
  }

  if (key === "pedagogico") {
    base.push(
      {
        id: "ped-avaliacoes",
        label: "Avaliações de curso",
        href: "/pedagogico/cadastros/avaliacoes",
        titulo: "Avaliações de curso",
        desc: "Notas GGB — cadastro nativo no lugar de colar planilha",
        visivel: doSetor("pedagogico"),
      },
      {
        id: "ped-avaliacoes-evento",
        label: "Avaliações de evento",
        href: "/pedagogico/cadastros/avaliacoes-evento",
        titulo: "Avaliações de evento",
        desc: "Pesquisas de evento — cadastro e importação",
        visivel: doSetor("pedagogico"),
      },
    );
  }

  if (key === "marketing") {
    base.push(
      {
        id: "mkt-visao-geral",
        label: "Visão geral",
        href: "/marketing/visao-geral",
        titulo: "Redes sociais — visão geral",
        desc: "Contas, alcance e fila das redes oficiais",
        visivel: comPermissao("social.ver"),
      },
      {
        id: "mkt-publicar",
        label: "Publicar",
        href: "/marketing/publicar",
        titulo: "Publicar nas redes",
        desc: "Criar e agendar postagens",
        visivel: comPermissao("social.publicar"),
      },
      {
        id: "mkt-postagens",
        label: "Postagens e análise",
        href: "/marketing/postagens",
        titulo: "Postagens e análise",
        desc: "Histórico e desempenho do que saiu",
        visivel: comPermissao("social.ver"),
      },
      {
        id: "mkt-mensagens",
        label: "Mensagens",
        href: "/marketing/mensagens",
        titulo: "Mensagens das redes",
        desc: "Caixa de entrada e respostas",
        visivel: comPermissao("social.ver"),
      },
      {
        id: "mkt-campanhas-redes",
        label: "Campanhas",
        href: "/marketing/campanhas-redes",
        titulo: "Campanhas das redes",
        desc: "Investimento e resultado das campanhas sociais",
        visivel: comPermissao("social.ver"),
      },
    );
  }

  return base;
}

export const MENU_PRIMARIO: readonly MenuPrimario[] = [
  {
    id: "paineis",
    label: "Painéis",
    Icone: LayoutDashboard,
    visivel: (ctx) =>
      ctx.pode("executivo.ver") ||
      ctx.pode("territorial.ver") ||
      ctx.pode("organograma.ver"),
    filhos: [
      {
        id: "executivo",
        label: "Hub Executivo",
        href: "/executivo",
        titulo: "Hub Executivo",
        visivel: comPermissao("executivo.ver"),
      },
      {
        id: "territorial",
        label: "Inteligência Territorial",
        href: "/territorial",
        desc: "Mapa de empresas e conexões do território",
        visivel: comPermissao("territorial.ver"),
      },
      {
        id: "organograma",
        label: "Organograma",
        href: "/organograma",
        desc: "Setores, funções, funcionários e agentes de IA",
        visivel: comPermissao("organograma.ver"),
      },
    ],
  },
  ...HUBS.flatMap((h) => {
    const hub: MenuPrimario = { id: h.key, label: h.nome, Icone: h.Icone,
      visivel: h.key === "marketing" ? (ctx: ContextoMenu) => doSetor("marketing")(ctx) || ctx.pode("social.ver") : h.key === "estoque" ? (ctx: ContextoMenu) => doSetor("estoque")(ctx) || ctx.pode("compras.operar") : doSetor(h.key),
      filhos: h.key === "estoque" ? [
        { id:"estoque-resumo",label:"Visão Geral",href:"/estoque",Icone:h.Icone,titulo:"Estoque integrado",desc:"Saldos reais, reservas e demandas de Compras",visivel:(ctx:ContextoMenu)=>doSetor("estoque")(ctx)||ctx.pode("compras.operar") },
        { id:"estoque-verificacoes",label:"Verificações pendentes",href:"/compras/todas",desc:"Solicitações aguardando conferência do saldo",visivel:comPermissao("compras.operar") },
        { id:"estoque-recebimentos",label:"Recebimentos",href:"/compras/recebimentos",desc:"Entradas aguardadas dos pedidos de compra",visivel:comPermissao("compras.operar") },
      ] : filhosHub(h.key, h.nome, h.Icone, h.desc) };
    if (h.key !== "estoque") return [hub];
    return [hub, { id: "compras", label: "Compras", Icone: ShoppingCart, visivel: comPermissao("compras.ver"), filhos: [
      { id: "compras-visao", label: "Visão Geral", href: "/compras", visivel: comPermissao("compras.ver") },
      { id: "compras-nova", label: "Nova Solicitação", href: "/compras/nova", visivel: comPermissao("compras.solicitar") },
      { id: "compras-minhas", label: "Minhas Solicitações", href: "/compras/minhas", visivel: comPermissao("compras.ver") },
      { id: "compras-todas", label: "Todas as Solicitações", href: "/compras/todas", visivel: comPermissao("compras.operar") },
      { id: "compras-cotacoes", label: "Cotações", href: "/compras/cotacoes", visivel: comPermissao("compras.operar") },
      { id: "compras-aprovacoes", label: "Aprovações", href: "/compras/aprovacoes", visivel: comPermissao("compras.aprovar") },
      { id: "compras-pedidos", label: "Pedidos de Compra", href: "/compras/pedidos", visivel: comPermissao("compras.operar") },
      { id: "compras-recebimentos", label: "Recebimentos", href: "/compras/recebimentos", visivel: comPermissao("compras.operar") },
      { id: "compras-fornecedores", label: "Fornecedores", href: "/compras/fornecedores", visivel: comPermissao("compras.operar") },
      { id: "compras-config", label: "Configurações", href: "/compras/configuracoes", visivel: (ctx: ContextoMenu) => ctx.admin },
    ] }];
  }),
  {
    id: "pdv", label: "PDV", Icone: Receipt, visivel: comPermissao("pdv.ver"), filhos: [
      { id: "pdv-resumo", label: "Resumo", href: "/pdv", Icone: Receipt, titulo: "Ponto de venda", desc: "Vendas do balcão, caixa e formas de pagamento", visivel: comPermissao("pdv.ver") },
      { id: "pdv-caixa", label: "Frente de caixa", href: "/pdv/caixa", desc: "Abrir caixa, vender e fechar", visivel: comPermissao("pdv.operar") },
      { id: "pdv-vendas", label: "Vendas", href: "/pdv/vendas", desc: "Histórico de cupons", visivel: comPermissao("pdv.ver") },
    ],
  },
  {
    id: "financeiro-erp", label: "Financeiro ERP", Icone: Wallet, visivel: comPermissao("financeiro.erp.ver"), filhos: [
      { id: "fin-erp-central", label: "Contas a pagar/receber", href: "/financeiro-erp", Icone: Wallet, titulo: "Financeiro ERP", desc: "Títulos, baixas e fluxo de caixa", visivel: comPermissao("financeiro.erp.ver") },
      { id: "fin-erp-dre", label: "DRE", href: "/financeiro-erp/dre", desc: "Demonstrativo de resultado por competência", visivel: comPermissao("financeiro.erp.ver") },
    ],
  },
  {
    id: "integracoes",
    label: "Integrações",
    Icone: Plug,
    visivel: (ctx) =>
      ctx.pode("integracoes.ver", "integracoes.gerenciar") ||
      ctx.pode("whatsapp.gerenciar") ||
      ctx.pode("agentes.gerenciar") ||
      ctx.setores.includes("crm"),
    filhos: [
      {
        id: "fontes",
        label: "Fontes de dados",
        href: "/integracoes",
        Icone: PAGINA_INTEGRACOES.Icone,
        titulo: PAGINA_INTEGRACOES.nome,
        desc: PAGINA_INTEGRACOES.desc,
        visivel: comPermissao("integracoes.ver", "integracoes.gerenciar"),
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        href: "/integracoes/whatsapp",
        Icone: MessageCircle,
        desc: "Conexão do número e sessão do WhatsApp",
        visivel: comPermissao("whatsapp.gerenciar"),
      },
      {
        id: "agentes",
        label: "Agentes de IA",
        href: "/integracoes/agentes",
        Icone: Bot,
        desc: "Pareamento com a plataforma Aplopes AI",
        visivel: (ctx) => ctx.pode("agentes.gerenciar") || ctx.setores.includes("crm"),
      },
    ],
  },
  {
    id: "configuracoes",
    label: "Configurações",
    Icone: Settings2,
    visivel: (ctx) =>
      ctx.pode("brain.ver") ||
      ctx.pode("perfis.gerenciar") ||
      ctx.pode("usuarios.gerenciar") ||
      ctx.pode("notificacoes.enviar") ||
      ctx.pode("social.ver", "social.gerenciar") ||
      ctx.pode("processos.ver"),
    filhos: [
      {
        id: "processos-visao", label: "Central de Processos", href: "/processos", Icone: Workflow,
        desc: "Documentação, fluxos, manuais e implantação do ERP", visivel: comPermissao("processos.ver"),
      },
      { id: "processos-mapa", label: "Mapa de Processos", href: "/processos/mapa", visivel: comPermissao("processos.ver") },
      { id: "processos-setores", label: "Processos por Setor", href: "/processos/setores", visivel: comPermissao("processos.ver") },
      { id: "processos-manuais", label: "Procedimentos e Tutoriais", href: "/processos/manuais", visivel: comPermissao("processos.ver") },
      { id: "processos-indicadores", label: "Indicadores de Processos", href: "/processos/indicadores", visivel: comPermissao("processos.ver") },
      { id: "processos-historico", label: "Versões dos Processos", href: "/processos/historico", visivel: comPermissao("processos.ver") },
      { id: "processos-implantacao", label: "Implantação do ERP", href: "/processos/implantacao", visivel: comPermissao("processos.implantacao") },
      {
        id: "brain",
        label: "Memória institucional",
        href: "/configuracoes/brain",
        Icone: BookOpen,
        desc: "Busca, respostas com citação e registro do que a empresa sabe",
        visivel: comPermissao("brain.ver"),
      },
      {
        id: "perfis",
        label: "Perfis de acesso",
        href: "/configuracoes/perfis",
        Icone: ShieldCheck,
        desc: "O que cada perfil pode abrir e alterar",
        visivel: comPermissao("perfis.gerenciar"),
      },
      {
        id: "usuarios",
        label: "Usuários",
        href: "/configuracoes/usuarios",
        Icone: Users,
        desc: "Quem entra, com qual perfil e em quais setores",
        visivel: comPermissao("usuarios.gerenciar"),
      },
      {
        id: "comunicados",
        label: "Notificações",
        href: "/configuracoes/notificacoes",
        Icone: Bell,
        desc: "Comunicados enviados para o hub",
        visivel: comPermissao("notificacoes.enviar"),
      },
      {
        id: "redes-sociais-config",
        label: "Redes sociais",
        href: "/configuracoes/redes-sociais",
        titulo: "Redes sociais",
        desc: "API key e integração com o Zernio",
        visivel: comPermissao("social.ver", "social.gerenciar"),
      },
    ],
  },
];

/** Compat: grupos flat (alguns testes/código legado). */
export const GRUPOS_MENU = MENU_PRIMARIO.map((p) => ({
  id: p.id,
  titulo: () => p.label,
  itens: p.filhos,
}));

const TITULOS_FILHAS: { prefixo: string; titulo: string; desc: string }[] = [
  {
    prefixo: "/integracoes/agentes/conversas/kanban",
    titulo: "Kanban de conversas",
    desc: "Conversas dos agentes por etapa — o movimento espelha a plataforma",
  },
  {
    prefixo: "/integracoes/agentes/conversas",
    titulo: "Conversas",
    desc: "Atendimento com os agentes de IA",
  },
  {
    prefixo: "/executivo/metas",
    titulo: "Metas",
    desc: "Cadastro e revisão de metas do Hub Executivo",
  },
];

export function tituloDaRota(caminho: string): { titulo: string; desc: string } | undefined {
  return TITULOS_FILHAS.find((t) => caminho === t.prefixo || caminho.startsWith(`${t.prefixo}/`));
}

export function itensVisiveis(ctx: ContextoMenu): ItemMenu[] {
  return MENU_PRIMARIO.flatMap((p) =>
    p.visivel(ctx) ? p.filhos.filter((i) => i.visivel(ctx)) : [],
  );
}

export function idItemAtivo(caminho: string, itens: readonly ItemMenu[]): string | null {
  const alvo = caminho.length > 1 ? caminho.replace(/\/+$/, "") : caminho;
  let melhor: ItemMenu | null = null;
  for (const item of itens) {
    if (alvo !== item.href && !alvo.startsWith(`${item.href}/`)) continue;
    if (!melhor || item.href.length > melhor.href.length) melhor = item;
  }
  return melhor?.id ?? null;
}

export function itemPorId(id: string | null): ItemMenu | undefined {
  if (!id) return undefined;
  return MENU_PRIMARIO.flatMap((p) => p.filhos).find((i) => i.id === id);
}

export function primarioDoItem(itemId: string | null): MenuPrimario | undefined {
  if (!itemId) return undefined;
  return MENU_PRIMARIO.find((p) => p.filhos.some((f) => f.id === itemId));
}

export function primarioPorCaminho(caminho: string, ctx: ContextoMenu): MenuPrimario | undefined {
  const filhos = itensVisiveis(ctx);
  const id = idItemAtivo(caminho, filhos);
  return primarioDoItem(id) ?? MENU_PRIMARIO.find((p) => p.visivel(ctx));
}
