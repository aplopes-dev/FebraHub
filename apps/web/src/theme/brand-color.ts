/**
 * Cor de marca do sistema.
 *
 * Vira a `primary` do tema MUI. O padrão é o **ouro** deste projeto — um
 * degradê metálico, não uma cor chapada. A escolha é do usuário
 * (Configurações → Dados da empresa) e vive em
 * `localStorage.company_brand_color`, propagada pelo evento
 * `brand-color-changed` (ver `brand-color-store`).
 */
export type BrandPalette = {
  /**
   * A cor de verdade — cor **chapada**, sempre. É dela que saem o `alpha()`
   * dos fundos suaves, a borda do campo em foco e o texto em `primary.main`;
   * o degradê pinta só as superfícies preenchidas.
   */
  main: string;
  light: string;
  dark: string;
  /** Texto sobre `main`. Ausente = branco. */
  contrastText?: string;
  /**
   * `background-image` das superfícies preenchidas (botão contained, chip
   * filled). Ausente = superfície chapada, como em qualquer cor do catálogo
   * que não seja metálica.
   */
  gradient?: string;
  /** O mesmo degradê sob o cursor. Ausente = repete `gradient`. */
  gradientHover?: string;
};

export type BrandColorOption = {
  /** Hex em maiúsculas — é a chave persistida. */
  value: string;
  label: string;
  palette: BrandPalette;
};

/** Texto sobre uma cor de marca que não diga o seu. */
const DEFAULT_CONTRAST_TEXT = "#FFFFFF";

/**
 * Ouro da marca — o padrão do projeto.
 *
 * O `main` é o ouro fosco, escuro o bastante para servir de texto e borda
 * sobre branco; o degradê é que faz o metal, alternando o ouro velho das
 * pontas com o brilho quase creme do meio. O ângulo (135°) põe o brilho na
 * diagonal, como luz batendo na peça.
 *
 * Todos os tons do degradê são claros o bastante para levar o texto escuro do
 * `contrastText` — é por isso que ele não desce até o marrom.
 */
export const GOLD_BRAND_COLOR = "#A87F1F";

const GOLD_PALETTE: BrandPalette = {
  main: GOLD_BRAND_COLOR,
  light: "#D8B44A",
  dark: "#7A5A12",
  contrastText: "#1B1B1B",
  gradient:
    "linear-gradient(135deg, #B8901F 0%, #D9B441 22%, #F5E7A8 50%, #D9B441 78%, #B8901F 100%)",
  gradientHover:
    "linear-gradient(135deg, #A17C18 0%, #C39C2C 22%, #E4D189 50%, #C39C2C 78%, #A17C18 100%)",
};

/** Cor de marca padrão do sistema. */
export const DEFAULT_BRAND_COLOR = GOLD_BRAND_COLOR;

/**
 * Cores oferecidas na tela de configuração — fonte única do seletor (label) e
 * do tema (paleta). A primeira é o padrão. Só o ouro é metálico; as demais são
 * chapadas.
 */
export const BRAND_COLOR_OPTIONS: readonly BrandColorOption[] = [
  {
    value: GOLD_BRAND_COLOR,
    label: "Ouro (padrão)",
    palette: GOLD_PALETTE,
  },
  {
    value: "#1B1E1E",
    label: "Neutro",
    palette: { main: "#1B1E1E", light: "#3E4040", dark: "#0F1111" },
  },
  {
    value: "#2563EB",
    label: "Azul",
    palette: { main: "#2563EB", light: "#60A5FA", dark: "#1E40AF" },
  },
  {
    value: "#0EA5E9",
    label: "Céu",
    palette: { main: "#0EA5E9", light: "#38BDF8", dark: "#0369A1" },
  },
  {
    value: "#4F46E5",
    label: "Índigo",
    palette: { main: "#4F46E5", light: "#818CF8", dark: "#3730A3" },
  },
  {
    value: "#9333EA",
    label: "Roxo",
    palette: { main: "#9333EA", light: "#C084FC", dark: "#6B21A8" },
  },
  {
    value: "#7C3AED",
    label: "Violeta",
    palette: { main: "#7C3AED", light: "#A78BFA", dark: "#5B21B6" },
  },
  {
    value: "#DB2777",
    label: "Rosa",
    palette: { main: "#DB2777", light: "#F472B6", dark: "#9D174D" },
  },
  {
    value: "#DC2626",
    label: "Vermelho",
    palette: { main: "#DC2626", light: "#F87171", dark: "#991B1B" },
  },
  {
    value: "#FF2741",
    label: "Vermelho vivo",
    palette: { main: "#FF2741", light: "#FF4158", dark: "#EB243C" },
  },
  {
    value: "#D97706",
    label: "Âmbar",
    palette: { main: "#D97706", light: "#FBBF24", dark: "#92400E" },
  },
  {
    value: "#16A34A",
    label: "Verde",
    palette: { main: "#16A34A", light: "#4ADE80", dark: "#166534" },
  },
  {
    value: "#059669",
    label: "Esmeralda",
    palette: { main: "#059669", light: "#34D399", dark: "#065F46" },
  },
  {
    value: "#0D9488",
    label: "Turquesa",
    palette: { main: "#0D9488", light: "#2DD4BF", dark: "#115E59" },
  },
  {
    value: "#475569",
    label: "Ardósia",
    palette: { main: "#475569", light: "#94A3B8", dark: "#1E293B" },
  },
  {
    value: "#52525B",
    label: "Zinco",
    palette: { main: "#52525B", light: "#A1A1AA", dark: "#27272A" },
  },
  {
    value: "#57534E",
    label: "Pedra",
    palette: { main: "#57534E", light: "#A8A29E", dark: "#292524" },
  },
  {
    value: "#374151",
    label: "Grafite",
    palette: { main: "#374151", light: "#6B7280", dark: "#1F2937" },
  },
];

const PALETTE_BY_VALUE = new Map(
  BRAND_COLOR_OPTIONS.map((option) => [option.value, option.palette]),
);

/** Paleta padrão já resolvida — usada como `primary` estática do preset. */
export const DEFAULT_BRAND_PALETTE: BrandPalette =
  PALETTE_BY_VALUE.get(DEFAULT_BRAND_COLOR)!;

/** A cor está no catálogo? É o que separa uma escolha de um resíduo. */
export function isBrandColor(brandColor: string): boolean {
  return PALETTE_BY_VALUE.has(brandColor.toUpperCase());
}

/**
 * Paleta de uma cor escolhida, com os campos opcionais já resolvidos. Cor fora
 * do catálogo (hex digitado à mão) vira uma paleta chapada — melhor que cair
 * no padrão e ignorar a escolha.
 */
export function resolveBrandPalette(
  brandColor: string,
): BrandPalette & { contrastText: string } {
  const palette = PALETTE_BY_VALUE.get(brandColor.toUpperCase()) ?? {
    main: brandColor,
    light: brandColor,
    dark: brandColor,
  };

  return { ...palette, contrastText: palette.contrastText ?? DEFAULT_CONTRAST_TEXT };
}
