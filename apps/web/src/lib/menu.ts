import {
  Bell, BookOpen, Bot, LayoutDashboard, MessageCircle,
  FileText, Plug, Settings2, ShieldCheck, ShoppingCart, Users, Workflow, ShoppingBag,
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
  /* Primeiro filho = a VISÃO GERAL do setor (o Hub de BI: pódio, gráficos,
     placar). Para a maioria dos hubs `/<key>` já renderiza o Hub, então o
     primeiro item aponta pra lá. O Comercial é a exceção: `/comercial` é uma
     rota ESTÁTICA (o módulo pipeline/leads/vendas) que, no Next.js, vence a
     dinâmica `/[hub]` — por isso o Hub Comercial mora em `/comercial/hub`. */
  const hrefVisaoGeral = key === "comercial" ? "/comercial/hub" : `/${key}`;
  const idVisaoGeral = key === "comercial" ? "com-hub" : `${key}-resumo`;

  const base: ItemMenu[] = key === "loja" ? [] : [
    {
      id: idVisaoGeral,
      label: "Visão geral",
      href: hrefVisaoGeral,
      Icone,
      titulo: nome,
      desc,
      visivel: doSetor(key),
    },
  ];

  if (key === "comercial") {
    base.push(
      {
        id: "com-pipeline",
        label: "Pipeline",
        href: "/comercial/pipeline",
        titulo: "Pipeline Comercial",
        desc: "Kanban e lista de oportunidades por funil",
        visivel: (ctx) => ctx.pode("comercial.ver", "comercial.operar", "comercial.gerenciar"),
      },
      // "Novo Lead" saiu do sidebar: virou botão dentro do Pipeline (onde o lead
      // vira oportunidade); o hub e o spotlight seguem linkando /comercial/leads.
      // "Sympla — Eventos" saiu: apontava p/ /comercial/sympla, que NÃO existe
      // no disco (link morto / 404).
      {
        id: "com-vendas",
        label: "Vendas",
        href: "/comercial/vendas",
        titulo: "Vendas",
        desc: "Lista, status e aprovação de vendas fechadas",
        visivel: (ctx) =>
          ctx.pode("comercial.ver", "comercial.gerenciar", "comercial.vendas.aprovar", "comercial.relatorios"),
      },
    );
  }

  if (key === "financeiro") {
    // ERP (Contas a pagar/receber, DRE, Conciliação Stone) fundido no MESMO hub
    // Financeiro — antes eram dois itens separados no rail ("Financeiro (Painel)"
    // + "Financeiro ERP"). Cada filho mantém seu próprio gating (setor p/ painel,
    // financeiro.erp.ver p/ o ERP).
    base.push(
      {
        id: "fin-erp-central",
        label: "Contas a pagar/receber",
        href: "/financeiro-erp",
        titulo: "Financeiro ERP",
        desc: "Títulos, baixas e fluxo de caixa",
        visivel: comPermissao("financeiro.erp.ver"),
      },
      {
        id: "fin-erp-dre",
        label: "DRE",
        href: "/financeiro-erp/dre",
        titulo: "DRE",
        desc: "Demonstrativo de resultado por competência",
        visivel: comPermissao("financeiro.erp.ver"),
      },
      {
        id: "fin-erp-conc-stone",
        label: "Conciliação Stone",
        href: "/financeiro-erp/conciliacao-stone",
        titulo: "Conciliação Stone",
        desc: "Vendas na maquininha: bruto, taxas e liquidação",
        visivel: comPermissao("financeiro.erp.ver"),
      },
    );
  }

  if (key === "loja") {
    base.push(
      {
        id: "loja-produtos",
        label: "Produtos da Loja (cadastrar)",
        href: "/loja/produtos",
        titulo: "Produtos da Loja",
        desc: "Cadastrar, editar e organizar os produtos vendidos (PDV e Cardápio), com saldo Loja / Depósito",
        visivel: (ctx: ContextoMenu) => doSetor("loja")(ctx) || ctx.pode("loja.produtos.ver"),
      },

      {
        id: "loja-vendas",
        label: "Vendas",
        href: "/loja/vendas",
        Icone: ShoppingBag,
        titulo: "Vendas da Loja",
        desc: "Histórico de todas as vendas com status de lançamento no Omie",
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
        id: "loja-retirada",
        label: "Retirada por QR",
        href: "/loja/retirada",
        titulo: "Retirada por QR",
        desc: "Escaneie o comprovante do cliente para conferir a compra e entregar",
        visivel: (ctx: ContextoMenu) => ctx.pode("loja.pedidos.operar"),
      },
      {
        id: "loja-codigo",
        label: "Atender por código",
        href: "/loja/codigo",
        titulo: "Atendimento por código",
        desc: "Digite o código de 3 dígitos do cliente para ver, editar e imprimir o pedido",
        visivel: (ctx: ContextoMenu) => ctx.pode("loja.pedidos.operar"),
      },
      {
        id: "loja-pdv-movel",
        label: "PDV móvel (app)",
        href: "/pdv-movel/vender",
        titulo: "PDV móvel",
        desc: "App instalável para celular/tablet: vender, fila e retirada por QR",
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
        // Abrir cardápio, TV e QR agora vivem DENTRO desta tela (botões por
        // operação) — os itens soltos "Abrir cardápio" e "Painel / TV" saíram
        // do menu por serem só atalhos redundantes (rotas /loja/cardapio e
        // /loja/tv seguem no disco p/ deep-link).
        desc: "Eventos, cardápio digital público, painel/TV e QR",
        visivel: (ctx: ContextoMenu) => doSetor("loja")(ctx) || ctx.pode("loja.pedidos.ver"),
      },
      // Metas mensais, Metas por curso e Fechamento eram 3 itens soltos —
      // agora vivem em abas numa tela só ("Planejamento e metas"). As rotas
      // /loja/cadastros/{metas-mes,metas-curso,fechamento} redirecionam p/ lá.
      {
        id: "loja-planejamento",
        label: "Planejamento e metas",
        href: "/loja/planejamento",
        titulo: "Planejamento e metas",
        desc: "Metas mensais, metas por curso e fechamento do mês — em abas",
        visivel: doSetor("loja"),
      },
    );
  }

  if (key === "pedagogico") {
    base.push(
      // ---- P0 — Secretaria Digital ----
      {
        id: "ped-dashboard",
        label: "Dashboard Pedagógico",
        href: "/pedagogico/dashboard",
        titulo: "Dashboard Pedagógico",
        desc: "Turmas, alunos, confirmações e indicadores em tempo real",
        visivel: comPermissao("pedagogico.ver"),
      },
      {
        id: "ped-turmas",
        label: "Turmas",
        href: "/pedagogico/turmas",
        titulo: "Agenda e Turmas",
        desc: "Calendário, abertura, gestão de turmas e escala de monitores",
        visivel: comPermissao("pedagogico.ver"),
      },
      {
        id: "ped-alunos",
        label: "Alunos / Jornada",
        href: "/pedagogico/alunos",
        titulo: "Alunos e Jornada",
        desc: "Lista operacional de alunos, confirmações e status da jornada",
        visivel: comPermissao("pedagogico.ver"),
      },
      {
        id: "ped-credenciamento",
        label: "Credenciamento",
        href: "/pedagogico/credenciamento",
        titulo: "Credenciamento",
        desc: "Check-in rápido via QR Code, CPF ou nome — mobile-first",
        visivel: comPermissao("pedagogico.operar"),
      },
      {
        id: "ped-presenca",
        label: "Presença",
        href: "/pedagogico/presenca",
        titulo: "Presença",
        desc: "Registro de presença por dia e sessão",
        visivel: comPermissao("pedagogico.operar"),
      },
      // "Represados" saiu do menu: virou uma ABA dentro de "Customer Success"
      // (/pedagogico/cs?aba=represados). A rota /pedagogico/represados segue no
      // disco p/ os deep-links do dashboard.
      {
        id: "ped-transferencias",
        label: "Transferências",
        href: "/pedagogico/transferencias",
        titulo: "Transferências de Turma",
        desc: "Solicitações, aprovações e histórico de transferências",
        visivel: comPermissao("pedagogico.operar"),
      },
      {
        id: "ped-monitores",
        label: "Monitores",
        href: "/pedagogico/monitores",
        titulo: "Monitores",
        desc: "Cadastro, seleção e escala de monitores por turma",
        visivel: comPermissao("pedagogico.operar"),
      },
      {
        id: "ped-secretaria",
        label: "Secretaria do Aluno",
        href: "/pedagogico/secretaria",
        titulo: "Secretaria do Aluno",
        desc: "Visão 360° do aluno: treinamentos, presença, certificados e histórico",
        visivel: comPermissao("pedagogico.operar"),
      },
      {
        id: "ped-solicitacoes",
        label: "Solicitações",
        href: "/pedagogico/solicitacoes",
        titulo: "Central de Solicitações",
        desc: "Certificados, declarações, transferências e suporte",
        visivel: comPermissao("pedagogico.operar"),
      },
      {
        id: "ped-cs",
        label: "Customer Success",
        href: "/pedagogico/cs",
        titulo: "Customer Success",
        desc: "Alunos que exigem atenção: não compareceu, validade próxima, etc.",
        visivel: comPermissao("pedagogico.cs"),
      },
      // ---- Legado: avaliações ----
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
        label: "Redes sociais",
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
      {
        id: "mkt-config-conexao",
        label: "Configurar conexão",
        href: "/configuracoes/redes-sociais",
        titulo: "Conexão das redes",
        desc: "Chave do Zernio e conta usada para publicar",
        visivel: comPermissao("social.ver", "social.gerenciar"),
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
        desc: "Setores, cargos, funcionários e agentes de IA",
        visivel: comPermissao("organograma.ver"),
      },
    ],
  },
  ...HUBS.flatMap((h) => {
    const hub: MenuPrimario = { id: h.key, label: h.nome, Icone: h.Icone,
      visivel: h.key === "marketing" ? (ctx: ContextoMenu) => doSetor("marketing")(ctx) || ctx.pode("social.ver") : h.key === "estoque" ? (ctx: ContextoMenu) => doSetor("estoque")(ctx) || ctx.pode("compras.operar") : h.key === "financeiro" ? (ctx: ContextoMenu) => doSetor("financeiro")(ctx) || ctx.pode("financeiro.erp.ver") : doSetor(h.key),
      filhos: h.key === "estoque" ? [
        { id:"estoque-resumo",label:"Estoque geral (consulta)",href:"/estoque",Icone:h.Icone,titulo:"Estoque geral",desc:"Visão geral dos saldos de produtos. Para cadastrar produto e mover estoque entre Loja e Depósito, use Loja → Produtos",visivel:(ctx:ContextoMenu)=>doSetor("estoque")(ctx)||ctx.pode("compras.operar") },
        { id:"estoque-inventario",label:"Inventário",href:"/estoque/inventario",Icone:h.Icone,titulo:"Inventário",desc:"Bipe o produto, confira o saldo e informe a contagem real — o sistema ajusta o estoque. Também dá para trocar a foto e o código de barras.",visivel:(ctx:ContextoMenu)=>doSetor("estoque")(ctx)||ctx.pode("compras.operar") },
        // "Verificações pendentes" (/compras/todas) e "Recebimentos" (/compras/recebimentos)
        // saíram daqui: eram cópias exatas de itens do grupo Compras (rail ao lado).
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
  // O grupo "Financeiro ERP" foi FUNDIDO no hub "Financeiro" (rail único):
  // Contas a pagar/receber, DRE e Conciliação Stone agora são filhos do hub
  // financeiro (ver filhosHub, bloco key === "financeiro").
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
        titulo: "Fontes de dados",
        desc: "Conexões com sistemas externos (ex.: Conta Azul). Verde = funcionando",
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
      ctx.pode("fiscal.emitir", "fiscal.gerenciar") ||
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
        id: "fiscal-config",
        label: "Fiscal — cupom e nota",
        href: "/configuracoes/fiscal",
        Icone: FileText,
        desc: "Cupom fiscal (NFC-e) e cupom não fiscal: certificado A1, CSC e emitente",
        visivel: comPermissao("fiscal.gerenciar", "fiscal.emitir"),
      },
      {
        id: "comunicados",
        label: "Enviar comunicado",
        href: "/configuracoes/notificacoes",
        titulo: "Comunicados",
        Icone: Bell,
        desc: "Envie avisos para um perfil, setor, pessoa ou todos",
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
