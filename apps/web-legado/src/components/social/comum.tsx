"use client";

/* Vocabulário compartilhado das seis abas: como uma rede se chama, que cor e
   ícone ela tem, e como número, data e dinheiro aparecem.

   Existe separado porque a mesma decisão ("o que mostrar quando a métrica é
   null") precisa ser a MESMA na visão geral, na análise e nas campanhas. Num
   painel de alcance, zero e "não medido" contam histórias diferentes — e só
   uma delas é verdade. */

import type { CSSProperties } from "react";
import {
  AtSign, Facebook, Globe, Instagram, Linkedin, MessageCircle, Music2, Send, Twitter, Youtube,
  type LucideIcon,
} from "lucide-react";
import { C, alfaDe } from "@/lib/tema";

/** Nome de gente para o id que o Zernio usa. Fora daqui, capitaliza o id. */
const NOME_REDE: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X (Twitter)",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  threads: "Threads",
  pinterest: "Pinterest",
  reddit: "Reddit",
  bluesky: "Bluesky",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  googlebusiness: "Google Meu Negócio",
  snapchat: "Snapchat",
  discord: "Discord",
  slack: "Slack",
  metaads: "Meta Ads",
  googleads: "Google Ads",
  tiktokads: "TikTok Ads",
  linkedinads: "LinkedIn Ads",
  pinterestads: "Pinterest Ads",
  xads: "X Ads",
  openaiads: "OpenAI Ads",
};

export const nomeRede = (rede: string): string =>
  NOME_REDE[rede] ?? rede.charAt(0).toUpperCase() + rede.slice(1);

/* Cores de marca, não do tema: aqui a cor é IDENTIFICAÇÃO (qual rede é esta),
   não hierarquia visual. Trocar de tema não pode mudar o azul do Facebook. */
const COR_REDE: Record<string, string> = {
  instagram: "#e1306c",
  facebook: "#1877f2",
  twitter: "#71767b",
  youtube: "#ff4d4d",
  linkedin: "#0a85c2",
  tiktok: "#25f4ee",
  threads: "#9b8cff",
  pinterest: "#e60023",
  reddit: "#ff4500",
  bluesky: "#0085ff",
  telegram: "#29a9eb",
  whatsapp: "#25d366",
  googlebusiness: "#34a853",
  snapchat: "#f7d117",
};

export const corRede = (rede: string): string =>
  COR_REDE[rede] ?? COR_REDE[rede.replace(/ads$/, "")] ?? C.muted;

const ICONE_REDE: Record<string, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: Music2,
  threads: AtSign,
  telegram: Send,
  whatsapp: MessageCircle,
};

export const iconeRede = (rede: string): LucideIcon =>
  ICONE_REDE[rede] ?? ICONE_REDE[rede.replace(/ads$/, "")] ?? Globe;

/* ── números ────────────────────────────────────────────────────────────── */

/** Compacto: 12,4 mil / 1,2 mi. Um seguidor a mais não muda decisão nenhuma,
 *  e o número inteiro rouba a largura da coluna. */
export function compacto(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (Math.abs(n) >= 10_000) return `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return n.toLocaleString("pt-BR");
}

export const inteiro = (n: number | null | undefined): string =>
  n === null || n === undefined || !Number.isFinite(n) ? "—" : n.toLocaleString("pt-BR");

export const porcento = (n: number | null | undefined, casas = 2): string =>
  n === null || n === undefined || !Number.isFinite(n)
    ? "—"
    : `${n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;

export function dinheiro(n: number | null | undefined, moeda: string | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  try {
    return n.toLocaleString("pt-BR", {
      style: "currency",
      currency: moeda ?? "BRL",
      maximumFractionDigits: 2,
    });
  } catch {
    // Moeda que o Intl não conhece: mostra o número com o código ao lado em
    // vez de estourar a renderização da tabela inteira.
    return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${moeda ?? ""}`.trim();
  }
}

/* ── datas ──────────────────────────────────────────────────────────────── */

export function quando(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** "há 2h", "há 3d". Para lista, onde a data exata não importa. */
export function desde(iso: string | null | undefined): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  const min = Math.round(ms / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min}min`;
  const h = Math.round(min / 60);
  if (h < 48) return `há ${h}h`;
  return `há ${Math.round(h / 24)}d`;
}

/** `datetime-local` → ISO. O input entrega hora LOCAL sem fuso; o `new Date`
 *  do navegador a interpreta no fuso da máquina, que é o que a pessoa quis. */
export const paraIso = (local: string): string => new Date(local).toISOString();

/** Agora + `minutos`, no formato que o `datetime-local` aceita. */
export function localEm(minutos: number): string {
  const d = new Date(Date.now() + minutos * 60_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ── selos ──────────────────────────────────────────────────────────────── */

const COR_STATUS: Record<string, string> = {
  published: C.up,
  publicada: C.up,
  scheduled: C.gold,
  agendada: C.gold,
  publishing: C.gold,
  draft: C.muted,
  rascunho: C.muted,
  failed: C.down,
  falhou: C.down,
  partial: C.warn,
  parcial: C.warn,
  pending: C.muted,
  active: C.up,
  paused: C.warn,
};

const ROTULO_STATUS: Record<string, string> = {
  published: "Publicada",
  scheduled: "Agendada",
  publishing: "Publicando",
  draft: "Rascunho",
  failed: "Falhou",
  partial: "Parcial",
  pending: "Na fila",
  active: "Ativa",
  paused: "Pausada",
  archived: "Arquivada",
  deleted: "Excluída",
  unknown: "Sem status",
};

export const rotuloStatus = (s: string): string => ROTULO_STATUS[s] ?? s;
export const corStatusSocial = (s: string): string => COR_STATUS[s] ?? C.muted;

export function Selo({ texto, cor: _cor, titulo }: { texto: string; cor: string; titulo?: string }) {
  return (
    <span title={titulo} className="fh-tag" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5 }}>
      {texto}
    </span>
  );
}

export function SeloRede({ rede, compactoTexto }: { rede: string; compactoTexto?: boolean }) {
  const Icone = iconeRede(rede);
  const cor = corRede(rede);
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px",
        borderRadius: 999, fontSize: 10.5, fontWeight: 800, whiteSpace: "nowrap",
        color: cor, background: alfaDe(cor, 0.12), border: `1px solid ${alfaDe(cor, 0.3)}`,
      }}
    >
      <Icone size={11} />
      {!compactoTexto && nomeRede(rede)}
    </span>
  );
}

/** Cartão de número do topo das abas. */
export function Cartao({
  rotulo, valor, nota, cor,
}: {
  rotulo: string;
  valor: string;
  nota?: string;
  cor?: string;
}) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.cardLine}`, borderRadius: 14,
      padding: "13px 15px", minWidth: 0,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 800, color: C.faint, textTransform: "uppercase",
        letterSpacing: ".5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {rotulo}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: cor ?? C.bright, marginTop: 5, lineHeight: 1.1 }}>
        {valor}
      </div>
      {nota && <div style={{ fontSize: 10.5, color: C.faint, marginTop: 3 }}>{nota}</div>}
    </div>
  );
}

export const GRADE_CARTOES: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
  marginBottom: 16,
};

/* ── estado de consulta ─────────────────────────────────────────────────── */

/** O mínimo que `estadoDe` precisa de um `useQuery` — evita amarrar o helper
 *  ao tipo genérico do React Query, que muda de forma a cada major. */
interface ConsultaCrua {
  isPending: boolean;
  fetchStatus: "fetching" | "paused" | "idle";
  error: Error | null;
  failureReason?: Error | null;
}

/**
 * Traduz um `useQuery` para os props do <Estado>. Existe por duas razões que
 * só apareceram com a tela rodando:
 *
 *  1. o portão é `isPending` (não tem dado) e NÃO `isLoading` (não tem dado E
 *     está buscando). Na janela entre uma tentativa e a repetição, `isLoading`
 *     é falso e `error` ainda é nulo — a tela caía no ramo dos filhos e
 *     desenhava um painel vazio afirmando "a chave está aceita, mas não há
 *     rede conectada". Afirmar isso sem ter recebido resposta é mentira;
 *  2. `fetchStatus === "paused"` é o React Query esperando a conexão voltar.
 *     Ele não repete e nunca preenche `error`, então a tela ficaria girando
 *     para sempre. Aqui isso vira um erro com nome — a pessoa entende que o
 *     problema é a rede dela, não o painel.
 */
export function estadoDe(q: ConsultaCrua): { carregando: boolean; erro: Error | null } {
  if (q.fetchStatus === "paused") {
    return {
      carregando: false,
      erro: new Error(
        "Sem conexão com o servidor. O painel volta sozinho assim que a rede " +
          "voltar." + (q.failureReason ? ` Última falha: ${q.failureReason.message}` : ""),
      ),
    };
  }
  return { carregando: q.isPending, erro: q.error };
}

/** Aviso de topo — sucesso ou erro, mesmo desenho das outras telas. */
export function Aviso({ erro, children }: { erro: boolean; children: React.ReactNode }) {
  const cor = erro ? C.down : C.up;
  return (
    <div style={{
      display: "flex", gap: 9, alignItems: "flex-start", padding: "10px 13px", marginBottom: 14,
      borderRadius: 11, fontSize: 12.5, lineHeight: 1.5,
      color: cor, background: alfaDe(cor, 0.08), border: `1px solid ${alfaDe(cor, 0.3)}`,
    }}>
      {children}
    </div>
  );
}
