/* ============ DESIGN TOKENS ============
   A paleta é a mesma do protótipo aprovado — qualquer valor daqui aparece
   em dezenas de lugares por inline style. Mudar um token muda o painel
   inteiro; é de propósito. */
export const C = {
  void: "#08080A",
  panel: "rgba(14,14,16,.72)",
  card: "rgba(255,255,255,.028)",
  cardLine: "rgba(255,255,255,.08)",
  hair: "rgba(255,255,255,.05)",
  gold: "#E4C06A",
  goldTop: "#F2D488",
  goldBase: "#B8934A",
  text: "#F5F3EE",
  bright: "#EDEBE4",
  muted: "#8B8B90",
  faint: "#6A6A70",
  dim: "#5B5B62",
  down: "#E06C75",
  warn: "#E6B04D",
  up: "#6FCF97",
} as const;

/* As duas famílias entram por `next/font/google` (layout.tsx), que publica
   as variáveis CSS abaixo no <html>. O fallback literal mantém o desenho de
   pé se a fonte não carregar. */
export const GROTESK = "var(--fonte-grotesk), 'Space Grotesk', system-ui, sans-serif";
export const SANS = "var(--fonte-sans), 'Manrope', system-ui, sans-serif";

// Altura máxima do CORPO de um painel de BI. O conteúdo rola dentro do
// card (overflow interno) em vez de esticar a página — é o que faz o Hub
// caber numa tela. Um só valor pra todos os hubs herdarem o mesmo ritmo.
export const ALTURA_PAINEL = 260;

// Linha de meta: azul discreto, distinto do dourado da receita.
export const ARRED_META = "#6BA8E5";
// Mesma cor, outro papel: a linha do ano anterior nas barras de evolução.
export const AZUL_ANTERIOR = "#6BA8E5";

// Paleta das fatias de "Formas de pagamento" — dourado desbotando pro cinza.
export const PALETA_FORMAS: readonly string[] = [C.gold, C.goldBase, "#8B8B90", "#55555c", C.up, C.warn];

// Cores da quebra de receita por fonte no Hub Loja.
export const CORES_FONTE: readonly string[] = [C.gold, C.up, ARRED_META, C.warn, "#B98AD9", C.faint];

/* Nível da meta (planilha da gestora): Máster > Básica > Mínima > Abaixo >
   Sem meta. Máster é verde FORTE (distinto do verde da Básica). */
export const VERDE_FORTE = "#3DBE6B";
export const NIVEL_COR: Record<string, string> = {
  "máster": VERDE_FORTE, master: VERDE_FORTE,
  "básica": C.up, basica: C.up,
  "mínima": C.warn, minima: C.warn,
  abaixo: C.down, "sem meta": C.muted,
};
// Casa por nome (com ou sem acento), sem regex de combinantes.
export const corNivel = (n: unknown): string => NIVEL_COR[String(n ?? "").trim().toLowerCase()] ?? C.muted;

// Selo de validade da Maestria: verde (Válido), âmbar (Perto de vencer),
// vermelho (Vencido = benefício expirado, oportunidade de renovação).
export const COR_STATUS_MAESTRIA: Record<string, string> = {
  "válido": C.up, valido: C.up, "perto de vencer": C.warn, vencido: C.down,
};
export const corStatus = (s: unknown): string =>
  COR_STATUS_MAESTRIA[String(s ?? "").trim().toLowerCase()] ?? C.muted;
