import {
  Bot, LayoutDashboard, MapPinned, MessageCircle,
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
  setores: readonly string[];
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

const soAdmin = (ctx: ContextoMenu) => ctx.admin;
const adminOuSetor = (setor: string) => (ctx: ContextoMenu) =>
  ctx.admin || ctx.setores.includes(setor);

export const GRUPOS_MENU: readonly GrupoMenu[] = [
  {
    id: "paineis",
    titulo: () => "Painéis",
    itens: [
      { id: "executivo", label: "Hub Executivo", href: "/executivo", Icone: LayoutDashboard, visivel: soAdmin },
      // Porte do hub.aplopes.com — exclusivo da diretoria, como o Executivo.
      { id: "territorial", label: "Inteligência Territorial", href: "/territorial", Icone: MapPinned,
        desc: "Mapa de empresas e conexões do território", visivel: soAdmin },
    ],
  },
  {
    id: "setores",
    titulo: (ctx) => (ctx.admin ? "Setores" : "Seu hub"),
    itens: HUBS.map((h) => ({
      id: h.key, label: h.nome, href: `/${h.key}`, Icone: h.Icone, desc: h.desc,
      visivel: adminOuSetor(h.key),
    })),
  },
  {
    id: "integracoes",
    titulo: () => "Integrações",
    itens: [
      { id: "fontes", label: "Fontes de dados", href: "/integracoes",
        Icone: PAGINA_INTEGRACOES.Icone, titulo: PAGINA_INTEGRACOES.nome,
        desc: PAGINA_INTEGRACOES.desc, visivel: soAdmin },
      { id: "whatsapp", label: "WhatsApp", href: "/integracoes/whatsapp", Icone: MessageCircle,
        desc: "Conexão do número e sessão do WhatsApp", visivel: soAdmin },
      // Conversas e Kanban NÃO têm item próprio (decisão do Rafael, 02/08):
      // o acesso é pelos cards da tela de Agentes de IA. Como as rotas são
      // filhas de /integracoes/agentes, o matcher por prefixo mantém o item
      // "Agentes de IA" aceso nelas — e o cabeçalho usa o título delas.
      { id: "agentes", label: "Agentes de IA", href: "/integracoes/agentes", Icone: Bot,
        desc: "Pareamento com a plataforma Aplopes AI", visivel: (ctx) => ctx.admin || ctx.setores.includes("crm") },
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
