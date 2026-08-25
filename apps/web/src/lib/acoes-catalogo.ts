/**
 * Catálogo de Ações/Funções do FebraHub
 * =====================================
 * Cada ação tem: id, label, desc (opcional), keywords, href (ou handler),
 * icone (nome Lucide), permissao[] (qualquer uma → visível) e grupo.
 *
 * CONVENÇÃO: ao implementar uma nova funcionalidade, adicione-a aqui
 * no grupo correspondente. A BuscaGlobal (Ctrl+K) exibirá automaticamente
 * para quem tiver permissão.
 */

import type { ContextoMenu } from "@/lib/menu";

export type AcaoGrupo =
  | "loja"
  | "compras"
  | "estoque"
  | "financeiro"
  | "comercial"
  | "crm"
  | "marketing"
  | "pedagogico"
  | "configuracoes"
  | "integrações"
  | "relatorios"
  | "sistema";

export interface Acao {
  id: string;
  label: string;
  desc?: string;
  /** Palavras-chave extras para a busca (além de label+desc). */
  keywords?: string[];
  /** Destino da navegação. Mutuamente exclusivo com `handler`. */
  href?: string;
  /** Ação inline (ex.: abrir modal, chamar API). Mutuamente exclusivo com `href`. */
  handler?: string; // identificador usado pelo componente consumidor
  /** Nome do ícone Lucide (string — importado dinamicamente pelo componente). */
  icone: string;
  grupo: AcaoGrupo;
  /** Função de visibilidade — mesma assinatura que ItemMenu.visivel. */
  visivel: (ctx: ContextoMenu) => boolean;
}

const sempre = () => true;
const comPermissao =
  (...permissoes: string[]) =>
  (ctx: ContextoMenu) =>
    ctx.pode(...permissoes);
const doSetor =
  (setor: string) =>
  (ctx: ContextoMenu): boolean =>
    ctx.admin || ctx.setores.includes(setor);

// ─── LOJA ─────────────────────────────────────────────────────────────────────
const acoes_loja: Acao[] = [
  {
    id: "loja-nova-venda",
    label: "Nova venda (PDV / Balcão)",
    desc: "Abre o caixa para registrar uma venda rápida",
    keywords: ["pdv", "caixa", "vender", "venda", "balcao", "balcão"],
    href: "/loja/balcao",
    icone: "ShoppingCart",
    grupo: "loja",
    visivel: comPermissao("loja.pedidos.operar"),
  },
  {
    id: "loja-fila",
    label: "Fila de preparação",
    desc: "Acompanhar pedidos em tempo real",
    keywords: ["fila", "pedido", "preparo", "retirada"],
    href: "/loja/fila",
    icone: "ListOrdered",
    grupo: "loja",
    visivel: (ctx) => doSetor("loja")(ctx) || ctx.pode("loja.pedidos.ver"),
  },
  {
    id: "loja-dashboard",
    label: "Dashboard da Loja",
    desc: "Faturamento, mais vendidos, PIX × cartão",
    keywords: ["relatorio", "faturamento", "loja", "dashboard"],
    href: "/loja/dashboard",
    icone: "BarChart2",
    grupo: "loja",
    visivel: (ctx) => doSetor("loja")(ctx) || ctx.pode("loja.pedidos.ver"),
  },
  {
    id: "loja-adicionar-produto",
    label: "Adicionar produto (Loja)",
    desc: "Cadastra um novo produto no catálogo da loja",
    keywords: ["produto", "cadastrar", "adicionar", "criar", "catalogo", "catálogo"],
    href: "/loja/produtos",
    icone: "PackagePlus",
    grupo: "loja",
    visivel: (ctx) => doSetor("loja")(ctx) || ctx.pode("loja.produtos.ver"),
  },
  {
    id: "loja-produtos",
    label: "Catálogo de Produtos",
    desc: "Ver e editar produtos, categorias e estoque da loja",
    keywords: ["produto", "estoque", "loja", "catalogo", "catálogo"],
    href: "/loja/produtos",
    icone: "Package",
    grupo: "loja",
    visivel: (ctx) => doSetor("loja")(ctx) || ctx.pode("loja.produtos.ver"),
  },
  {
    id: "loja-operacoes",
    label: "Operações e Cardápio",
    desc: "Eventos, cardápio digital público e painel/TV",
    keywords: ["operacao", "cardapio", "evento", "operação"],
    href: "/loja/operacoes",
    icone: "CalendarCheck",
    grupo: "loja",
    visivel: (ctx) => doSetor("loja")(ctx) || ctx.pode("loja.pedidos.ver"),
  },
  {
    id: "loja-auditoria",
    label: "Auditoria da Loja",
    desc: "Trilha de pagamentos, cancelamentos e estornos",
    keywords: ["auditoria", "cancelamento", "estorno", "pagamento"],
    href: "/loja/auditoria",
    icone: "ShieldAlert",
    grupo: "loja",
    visivel: comPermissao("loja.pedidos.gerenciar"),
  },
  {
    id: "loja-metas",
    label: "Metas Mensais",
    desc: "Mínima, básica e máster por mês",
    keywords: ["meta", "mensal", "objetivo"],
    href: "/loja/cadastros/metas-mes",
    icone: "Target",
    grupo: "loja",
    visivel: doSetor("loja"),
  },
];

// ─── COMPRAS ──────────────────────────────────────────────────────────────────
const acoes_compras: Acao[] = [
  {
    id: "compras-nova-solicitacao",
    label: "Nova solicitação de compra",
    desc: "Abre o formulário de solicitação de compra",
    keywords: ["solicitacao", "solicitação", "pedir", "comprar", "nova"],
    href: "/compras/nova",
    icone: "ClipboardPlus",
    grupo: "compras",
    visivel: comPermissao("compras.solicitar"),
  },
  {
    id: "compras-cotacoes",
    label: "Cotações",
    desc: "Ver e gerenciar cotações de compra",
    keywords: ["cotacao", "cotação", "fornecedor", "preco", "preço"],
    href: "/compras/cotacoes",
    icone: "FileSearch",
    grupo: "compras",
    visivel: comPermissao("compras.operar"),
  },
  {
    id: "compras-aprovacoes",
    label: "Aprovações de Compra",
    desc: "Solicitações aguardando aprovação",
    keywords: ["aprovar", "aprovacao", "aprovação"],
    href: "/compras/aprovacoes",
    icone: "CheckSquare",
    grupo: "compras",
    visivel: comPermissao("compras.aprovar"),
  },
  {
    id: "compras-pedidos",
    label: "Pedidos de Compra",
    desc: "Pedidos gerados e enviados a fornecedores",
    keywords: ["pedido", "compra", "fornecedor", "ordem"],
    href: "/compras/pedidos",
    icone: "Truck",
    grupo: "compras",
    visivel: comPermissao("compras.operar"),
  },
  {
    id: "compras-recebimentos",
    label: "Recebimentos",
    desc: "Dar entrada de mercadoria recebida",
    keywords: ["receber", "recebimento", "entrada", "chegou"],
    href: "/compras/recebimentos",
    icone: "PackageCheck",
    grupo: "compras",
    visivel: comPermissao("compras.operar"),
  },
  {
    id: "compras-fornecedores",
    label: "Fornecedores",
    desc: "Cadastro e histórico de fornecedores",
    keywords: ["fornecedor", "cadastrar", "adicionar", "fornecedores"],
    href: "/compras/fornecedores",
    icone: "Building2",
    grupo: "compras",
    visivel: comPermissao("compras.operar"),
  },
  {
    id: "compras-todas",
    label: "Todas as Solicitações",
    desc: "Visão gerencial de todas as solicitações de compra",
    keywords: ["solicitacao", "todas", "gerenciar"],
    href: "/compras/todas",
    icone: "Layers",
    grupo: "compras",
    visivel: comPermissao("compras.operar"),
  },
];

// ─── ESTOQUE ──────────────────────────────────────────────────────────────────
const acoes_estoque: Acao[] = [
  {
    id: "estoque-visao",
    label: "Visão Geral do Estoque",
    desc: "Saldos reais, reservas e demandas de Compras",
    keywords: ["estoque", "saldo", "inventario", "inventário"],
    href: "/estoque",
    icone: "Warehouse",
    grupo: "estoque",
    visivel: (ctx) => doSetor("estoque")(ctx) || ctx.pode("compras.operar"),
  },
];

// ─── FINANCEIRO ───────────────────────────────────────────────────────────────
const acoes_financeiro: Acao[] = [
  {
    id: "financeiro-contas",
    label: "Contas a pagar/receber",
    desc: "Títulos, baixas e fluxo de caixa",
    keywords: ["pagar", "receber", "conta", "titulo", "título", "fluxo", "caixa"],
    href: "/financeiro-erp",
    icone: "Wallet",
    grupo: "financeiro",
    visivel: comPermissao("financeiro.erp.ver"),
  },
  {
    id: "financeiro-dre",
    label: "DRE — Demonstrativo de Resultado",
    desc: "Resultado por competência, receitas e despesas",
    keywords: ["dre", "resultado", "demonstrativo", "receita", "despesa"],
    href: "/financeiro-erp/dre",
    icone: "TrendingUp",
    grupo: "financeiro",
    visivel: comPermissao("financeiro.erp.ver"),
  },
];

// ─── CONFIGURAÇÕES ────────────────────────────────────────────────────────────
const acoes_configuracoes: Acao[] = [
  {
    id: "config-usuarios",
    label: "Gerenciar Usuários",
    desc: "Quem acessa o FebraHub e com qual perfil",
    keywords: ["usuario", "usuário", "funcionario", "funcionário", "acesso"],
    href: "/configuracoes/usuarios",
    icone: "Users",
    grupo: "configuracoes",
    visivel: comPermissao("usuarios.gerenciar"),
  },
  {
    id: "config-perfis",
    label: "Perfis de Acesso",
    desc: "O que cada perfil pode abrir e alterar",
    keywords: ["perfil", "permissao", "permissão", "acesso"],
    href: "/configuracoes/perfis",
    icone: "ShieldCheck",
    grupo: "configuracoes",
    visivel: comPermissao("perfis.gerenciar"),
  },
  {
    id: "config-fiscal",
    label: "Configurar Fiscal (NFC-e)",
    desc: "Certificado A1, CSC, emitente e cupom fiscal",
    keywords: ["fiscal", "nota", "nfce", "nfc-e", "certificado", "cupom"],
    href: "/configuracoes/fiscal",
    icone: "FileText",
    grupo: "configuracoes",
    visivel: comPermissao("fiscal.gerenciar", "fiscal.emitir"),
  },
  {
    id: "config-notificacoes",
    label: "Notificações / Comunicados",
    desc: "Enviar comunicados para o hub",
    keywords: ["notificacao", "notificação", "comunicado", "aviso"],
    href: "/configuracoes/notificacoes",
    icone: "Bell",
    grupo: "configuracoes",
    visivel: comPermissao("notificacoes.enviar"),
  },
  {
    id: "config-brain",
    label: "Memória Institucional",
    desc: "Busca e registro do conhecimento da empresa",
    keywords: ["brain", "memoria", "memória", "conhecimento", "manual", "procedimento"],
    href: "/configuracoes/brain",
    icone: "BookOpen",
    grupo: "configuracoes",
    visivel: comPermissao("brain.ver"),
  },
  {
    id: "config-processos",
    label: "Central de Processos",
    desc: "Documentação, fluxos, manuais e implantação",
    keywords: ["processo", "fluxo", "manual", "procedimento", "implantacao"],
    href: "/processos",
    icone: "Workflow",
    grupo: "configuracoes",
    visivel: comPermissao("processos.ver"),
  },
  {
    id: "config-redes-sociais",
    label: "Configurar Redes Sociais",
    desc: "API key e integração com o Zernio",
    keywords: ["social", "redes", "instagram", "facebook", "zernio"],
    href: "/configuracoes/redes-sociais",
    icone: "Share2",
    grupo: "configuracoes",
    visivel: comPermissao("social.ver", "social.gerenciar"),
  },
];

// ─── INTEGRAÇÕES ──────────────────────────────────────────────────────────────
const acoes_integracoes: Acao[] = [
  {
    id: "int-whatsapp",
    label: "WhatsApp — Integração",
    desc: "Conectar número e gerenciar sessão",
    keywords: ["whatsapp", "zap", "conexao", "conexão", "numero", "número"],
    href: "/integracoes/whatsapp",
    icone: "MessageCircle",
    grupo: "integrações",
    visivel: comPermissao("whatsapp.gerenciar"),
  },
  {
    id: "int-agentes",
    label: "Agentes de IA",
    desc: "Pareamento com a plataforma Aplopes AI",
    keywords: ["agente", "ia", "bot", "aplopes", "chatbot"],
    href: "/integracoes/agentes",
    icone: "Bot",
    grupo: "integrações",
    visivel: (ctx) => ctx.pode("agentes.gerenciar") || ctx.setores.includes("crm"),
  },
  {
    id: "int-fontes",
    label: "Fontes de Dados",
    desc: "Integrações e fontes de dados externas",
    keywords: ["integracao", "integração", "fonte", "dado", "api"],
    href: "/integracoes",
    icone: "Plug",
    grupo: "integrações",
    visivel: comPermissao("integracoes.ver", "integracoes.gerenciar"),
  },
];

// ─── MARKETING ────────────────────────────────────────────────────────────────
const acoes_marketing: Acao[] = [
  {
    id: "mkt-publicar",
    label: "Publicar nas Redes Sociais",
    desc: "Criar e agendar postagens",
    keywords: ["post", "publicar", "postar", "instagram", "facebook", "agendar"],
    href: "/marketing/publicar",
    icone: "Send",
    grupo: "marketing",
    visivel: comPermissao("social.publicar"),
  },
  {
    id: "mkt-mensagens",
    label: "Mensagens das Redes",
    desc: "Caixa de entrada e respostas",
    keywords: ["mensagem", "inbox", "resposta", "comentario", "comentário"],
    href: "/marketing/mensagens",
    icone: "Inbox",
    grupo: "marketing",
    visivel: comPermissao("social.ver"),
  },
  {
    id: "mkt-campanhas",
    label: "Campanhas",
    desc: "Investimento e resultado das campanhas sociais",
    keywords: ["campanha", "ads", "anuncio", "anúncio", "investimento"],
    href: "/marketing/campanhas-redes",
    icone: "Megaphone",
    grupo: "marketing",
    visivel: comPermissao("social.ver"),
  },
];

// ─── COMERCIAL ────────────────────────────────────────────────────────────────
const acoes_comercial: Acao[] = [
  {
    id: "com-dashboard",
    label: "Dashboard Comercial",
    desc: "KPIs de leads, pipeline, vendas e conversão",
    keywords: ["comercial", "pipeline", "leads", "vendas", "dashboard", "kpi"],
    href: "/comercial",
    icone: "TrendingUp",
    grupo: "comercial",
    visivel: comPermissao(
      "comercial.ver",
      "comercial.operar",
      "comercial.gerenciar",
      "comercial.vendas.aprovar",
      "comercial.relatorios",
    ),
  },
  {
    id: "com-pipeline",
    label: "Pipeline Comercial",
    desc: "Kanban e lista de oportunidades por funil",
    keywords: ["pipeline", "kanban", "oportunidade", "funil", "comercial"],
    href: "/comercial/pipeline",
    icone: "Kanban",
    grupo: "comercial",
    visivel: comPermissao("comercial.ver", "comercial.operar", "comercial.gerenciar"),
  },
  {
    id: "com-novo-lead",
    label: "Novo Lead",
    desc: "Capturar rapidamente um novo lead no pipeline",
    keywords: ["lead", "novo", "capturar", "prospect", "comercial", "cliente"],
    href: "/comercial/leads",
    icone: "UserPlus",
    grupo: "comercial",
    visivel: comPermissao("comercial.operar", "comercial.gerenciar"),
  },
  {
    id: "com-vendas",
    label: "Vendas",
    desc: "Lista, status e aprovação de vendas fechadas",
    keywords: ["venda", "vendas", "comercial", "aprovar", "fechamento"],
    href: "/comercial/vendas",
    icone: "ShoppingBag",
    grupo: "comercial",
    visivel: comPermissao(
      "comercial.ver",
      "comercial.gerenciar",
      "comercial.vendas.aprovar",
      "comercial.relatorios",
    ),
  },
];

// ─── PEDAGÓGICO ───────────────────────────────────────────────────────────────
const acoes_pedagogico: Acao[] = [
  {
    id: "ped-avaliacoes",
    label: "Avaliações de Curso",
    desc: "Notas GGB — cadastro nativo",
    keywords: ["avaliacao", "avaliação", "nota", "curso", "aluno"],
    href: "/pedagogico/cadastros/avaliacoes",
    icone: "GraduationCap",
    grupo: "pedagogico",
    visivel: doSetor("pedagogico"),
  },
  {
    id: "ped-avaliacoes-evento",
    label: "Avaliações de Evento",
    desc: "Pesquisas de evento — cadastro e importação",
    keywords: ["evento", "pesquisa", "avaliacao", "avaliação", "participante"],
    href: "/pedagogico/cadastros/avaliacoes-evento",
    icone: "Star",
    grupo: "pedagogico",
    visivel: doSetor("pedagogico"),
  },
];

// ─── CATÁLOGO COMPLETO ────────────────────────────────────────────────────────
export const ACOES_CATALOGO: readonly Acao[] = [
  ...acoes_loja,
  ...acoes_compras,
  ...acoes_estoque,
  ...acoes_financeiro,
  ...acoes_comercial,
  ...acoes_configuracoes,
  ...acoes_integracoes,
  ...acoes_marketing,
  ...acoes_pedagogico,
];

/** Rótulos legíveis dos grupos. */
export const GRUPO_LABEL: Record<AcaoGrupo, string> = {
  loja: "Loja",
  compras: "Compras",
  estoque: "Estoque",
  financeiro: "Financeiro",
  comercial: "Comercial",
  crm: "CRM",
  marketing: "Marketing",
  pedagogico: "Pedagógico",
  configuracoes: "Configurações",
  "integrações": "Integrações",
  relatorios: "Relatórios",
  sistema: "Sistema",
};

/** Filtra e pontua resultados para o contexto do usuário. */
export function buscarAcoes(
  texto: string,
  ctx: ContextoMenu,
  limite = 12,
): Acao[] {
  const q = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return ACOES_CATALOGO.filter((a) => {
    if (!a.visivel(ctx)) return false;
    const haystack = [a.label, a.desc ?? "", ...(a.keywords ?? [])]
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return haystack.includes(q);
  }).slice(0, limite);
}
