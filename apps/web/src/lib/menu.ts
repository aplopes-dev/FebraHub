import {
  Bell, BookOpen, Bot, LayoutDashboard, MapPinned, MessageCircle, Network, Share2, ShieldCheck, Users,
  type LucideIcon,
} from "lucide-react";
import { HUBS, PAGINA_INTEGRACOES } from "@/lib/hubs";

/* ============ MENU CENTRALIZADO ============
   Uma única estrutura tipada decide o que aparece na sidebar, para quem, e
   qual item está ativo. Antes, cada item comparava a rota do seu jeito — o
   "Fontes de dados" olhava só o 1º segmento e acendia em QUALQUER rota de
   /integracoes, junto com o filho verdadeiro (dois irmãos ativos ao mesmo
   tempo). Aqui a regra é uma só: casa por segmento inteiro e, entre os que
   casam, vence o href mais longo — a rota mais específica prevalece, e só
   existe UM ativo por vez. */

export interface ContextoMenu {
  admin: boolean;
  /** Setores do cadastro MAIS os que o perfil de acesso concede. */
  setores: readonly string[];
  /** Tem ao menos uma das permissões? Vem de `pode()` (hooks/auth), a mesma
   *  regra do PermissaoGuard da API. */
  pode: (...permissoes: string[]) => boolean;
}

export interface ItemMenu {
  id: string;
  label: string;
  href: string;
  Icone: LucideIcon;
  /** Título e subtítulo do cabeçalho da página quando este item está ativo. */
  titulo?: string;
  desc?: string;
  visivel: (ctx: ContextoMenu) => boolean;
}

export interface GrupoMenu {
  id: string;
  titulo: (ctx: ContextoMenu) => string;
  itens: readonly ItemMenu[];
}

/* Cada item declara a PERMISSÃO que o abre — a mesma que a API exige na rota
   correspondente. Antes o critério era `admin`, e só existiam dois níveis:
   diretoria ou o próprio hub. Agora "quem vê o Territorial" é uma decisão de
   perfil, editável na tela de Perfis de acesso, sem tocar neste arquivo. */
const comPermissao = (...permissoes: string[]) => (ctx: ContextoMenu) => ctx.pode(...permissoes);
/** Hub setorial: vale o setor do cadastro OU a permissão do perfil. É o
 *  espelho de podeVer() no backend. */
const doSetor = (setor: string) => (ctx: ContextoMenu) =>
  ctx.admin || ctx.setores.includes(setor);

export const GRUPOS_MENU: readonly GrupoMenu[] = [
  {
    id: "paineis",
    titulo: () => "Painéis",
    itens: [
      { id: "executivo", label: "Hub Executivo", href: "/executivo", Icone: LayoutDashboard,
        visivel: comPermissao("executivo.ver") },
      // Porte do hub.aplopes.com.
      { id: "territorial", label: "Inteligência Territorial", href: "/territorial", Icone: MapPinned,
        desc: "Mapa de empresas e conexões do território", visivel: comPermissao("territorial.ver") },
      // Roda radial no estilo do /brain do Founder OS: setores (menos CRM),
      // funções, funcionários e agentes de IA — editável na própria tela.
      { id: "organograma", label: "Organograma", href: "/organograma", Icone: Network,
        desc: "Setores, funções, funcionários e agentes de IA", visivel: comPermissao("organograma.ver") },
      // Zernio: publicação, mensagens diretas e campanhas pagas. Fica em
      // Painéis (e não em Integrações) porque o dia a dia da tela é
      // acompanhar e publicar — configurar é uma aba dentro dela.
      { id: "social", label: "Redes sociais", href: "/social", Icone: Share2,
        desc: "Publicação, mensagens e campanhas das redes oficiais",
        visivel: comPermissao("social.ver") },
    ],
  },
  {
    // O título segue o ALCANCE, não o papel: quem enxerga um hub tem "Seu
    // hub"; quem enxerga vários tem "Setores". Antes dependia de ser admin,
    // e um perfil com vários `setor.*.ver` via oito hubs sob "Seu hub".
    id: "setores",
    titulo: (ctx) => (ctx.setores.filter((s) => s !== "geral").length > 1 ? "Setores" : "Seu hub"),
    itens: HUBS.map((h) => ({
      id: h.key, label: h.nome, href: `/${h.key}`, Icone: h.Icone, desc: h.desc,
      visivel: doSetor(h.key),
    })),
  },
  {
    id: "integracoes",
    titulo: () => "Integrações",
    itens: [
      { id: "fontes", label: "Fontes de dados", href: "/integracoes",
        Icone: PAGINA_INTEGRACOES.Icone, titulo: PAGINA_INTEGRACOES.nome,
        desc: PAGINA_INTEGRACOES.desc, visivel: comPermissao("integracoes.ver", "integracoes.gerenciar") },
      { id: "whatsapp", label: "WhatsApp", href: "/integracoes/whatsapp", Icone: MessageCircle,
        desc: "Conexão do número e sessão do WhatsApp", visivel: comPermissao("whatsapp.gerenciar") },
      // Conversas e Kanban NÃO têm item próprio (decisão do Rafael, 02/08):
      // o acesso é pelos cards da tela de Agentes de IA. Como as rotas são
      // filhas de /integracoes/agentes, o matcher por prefixo mantém o item
      // "Agentes de IA" aceso nelas — e o cabeçalho usa o título delas.
      { id: "agentes", label: "Agentes de IA", href: "/integracoes/agentes", Icone: Bot,
        desc: "Pareamento com a plataforma Aplopes AI",
        visivel: (ctx) => ctx.pode("agentes.gerenciar") || ctx.setores.includes("crm") },
    ],
  },
  {
    id: "configuracoes",
    titulo: () => "Configurações",
    itens: [
      // GBrain: a memória institucional. Fica em Configurações e não em
      // Painéis porque não é um painel de BI — é onde se consulta e se
      // registra o que a empresa sabe.
      { id: "brain", label: "Memória institucional", href: "/configuracoes/brain", Icone: BookOpen,
        desc: "Busca, respostas com citação e registro do que a empresa sabe",
        visivel: comPermissao("brain.ver") },
      { id: "perfis", label: "Perfis de acesso", href: "/configuracoes/perfis", Icone: ShieldCheck,
        desc: "O que cada perfil pode abrir e alterar", visivel: comPermissao("perfis.gerenciar") },
      { id: "usuarios", label: "Usuários", href: "/configuracoes/usuarios", Icone: Users,
        desc: "Quem entra, com qual perfil e em quais setores", visivel: comPermissao("usuarios.gerenciar") },
      { id: "comunicados", label: "Notificações", href: "/configuracoes/notificacoes", Icone: Bell,
        desc: "Comunicados enviados para o hub", visivel: comPermissao("notificacoes.enviar") },
    ],
  },
];

/** Títulos das rotas filhas sem item de menu (cabeçalho e topbar mobile). */
const TITULOS_FILHAS: { prefixo: string; titulo: string; desc: string }[] = [
  { prefixo: "/integracoes/agentes/conversas/kanban", titulo: "Kanban de conversas", desc: "Conversas dos agentes por etapa — o movimento espelha a plataforma" },
  { prefixo: "/integracoes/agentes/conversas", titulo: "Conversas", desc: "Atendimento com os agentes de IA" },
];

export function tituloDaRota(caminho: string): { titulo: string; desc: string } | undefined {
  return TITULOS_FILHAS.find((t) => caminho === t.prefixo || caminho.startsWith(`${t.prefixo}/`));
}

/** Itens visíveis para o perfil, achatados na ordem dos grupos. */
export function itensVisiveis(ctx: ContextoMenu): ItemMenu[] {
  return GRUPOS_MENU.flatMap((g) => g.itens.filter((i) => i.visivel(ctx)));
}

/**
 * O ÚNICO item ativo para o caminho atual: casa por segmento inteiro
 * (`/integracoes` não casa `/integracoes-x`, e `/integracoes/whatsapp` não
 * acende o pai) e, entre os que casam, vence o href mais longo. Query string
 * não participa — `usePathname` já vem sem ela.
 */
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
  return GRUPOS_MENU.flatMap((g) => g.itens).find((i) => i.id === id);
}
