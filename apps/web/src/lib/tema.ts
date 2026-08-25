/* ============ DESIGN TOKENS ============
   A paleta é a mesma do protótipo aprovado — qualquer valor daqui aparece
   em dezenas de lugares por inline style. Mudar um token muda o painel
   inteiro; é de propósito.

   O valor deixou de ser hex literal e passou a apontar para a custom
   property (definida em src/app/globals.css, um conjunto por tema). As
   CHAVES são exatamente as de antes: nenhum componente precisou mudar
   import nem uso. Trocar de tema é trocar `data-tema` no <html> — não passa
   por React, então não re-renderiza nada. */
export const C = {
  void: "var(--void)",
  panel: "var(--panel)",
  /** Superfície OPACA para modais/dialogs (sobre o véu). --panel e --card são
   *  translúcidos de propósito para cards sobre a página; usados como fundo de
   *  modal deixam o conteúdo "vazar" e parecer transparente. Use este. */
  modalFundo: "var(--modal-fundo)",
  card: "var(--card)",
  cardLine: "var(--card-line)",
  hair: "var(--hair)",
  gold: "var(--gold)",
  goldTop: "var(--gold-top)",
  goldBase: "var(--gold-base)",
  text: "var(--text)",
  bright: "var(--bright)",
  muted: "var(--muted)",
  faint: "var(--faint)",
  dim: "var(--dim)",
  down: "var(--down)",
  warn: "var(--warn)",
  up: "var(--up)",
} as const;

/* Transparência sobre um token. Colar "1F" no fim do hex era o jeito antigo;
   com var() isso vira `var(--gold)1F` — cor inválida, o elemento some. Por isso globals.css
   publica também os componentes RGB soltos (`--gold-rgb: 228 192 106`) e o
   alpha entra pela sintaxe de barra do CSS Color 4.
   `token` é o nome da variável sem o `--` e sem o `-rgb`: alfa("gold", .12). */
export const alfa = (token: string, a: number) => `rgb(var(--${token}-rgb) / ${a})`;

/* Mesma ideia para cor que só se conhece em runtime (vem de corNivel /
   corStatus / de uma prop): ali não dá pra saber o NOME do token, só o
   `var(--x)` já resolvido. `color-mix` aceita var() como entrada e devolve a
   mesma cor com o alpha pedido. */
export const alfaDe = (cor: string, a: number) =>
  `color-mix(in srgb, ${cor} ${Math.round(a * 100)}%, transparent)`;

/* Texto/ícone sobre fundo dourado. O dourado de FUNDO não escurece no tema
   claro (é a identidade do produto e rende 8.9:1 com esta tinta por cima),
   então esta cor é a mesma nos dois temas. */
export const SOBRE_OURO = "var(--sobre-ouro)";
export const SOBRE_OURO_2 = "var(--sobre-ouro-2)";

/* Fundo da página (Shell e Login): o brilho dourado do canto superior é que
   muda de tema — no claro sai mais fraco, senão vira um borrão amarelo. */
export const FUNDO_APP = "var(--fundo-app)";

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
export const ARRED_META = "var(--azul)";
// Mesma cor, outro papel: a linha do ano anterior nas barras de evolução.
export const AZUL_ANTERIOR = "var(--azul)";

// Paleta das fatias de "Formas de pagamento" — dourado desbotando pro cinza.
export const PALETA_FORMAS: readonly string[] = [C.gold, C.goldBase, C.muted, "var(--sem-status)", C.up, C.warn];

// Cores da quebra de receita por fonte no Hub Loja.
export const CORES_FONTE: readonly string[] = [C.gold, C.up, ARRED_META, C.warn, "var(--roxo)", C.faint];

/* Nível da meta (planilha da gestora): Máster > Básica > Mínima > Abaixo >
   Sem meta. Máster é verde FORTE (distinto do verde da Básica). */
export const VERDE_FORTE = "var(--verde-forte)";
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
