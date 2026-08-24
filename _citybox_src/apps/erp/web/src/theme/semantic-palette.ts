/**
 * Cores semânticas pastel do ERP Comércio.
 *
 * - `light` → fundo de badge/chip (pastel, alto contraste com `dark`)
 * - `main` → bolinha, ícone, accent
 * - `dark` → texto sobre `light`
 *
 * Compartilhado pelos presets v1/v2 (marca dinâmica não sobrescreve).
 */
export const comercioSemanticPalette = {
  success: {
    main: "#34D399",
    light: "#ECFDF5",
    dark: "#047857",
    contrastText: "#FFFFFF",
  },
  error: {
    main: "#F87171",
    light: "#FEF2F2",
    dark: "#B91C1C",
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#FBBF24",
    light: "#FFFBEB",
    dark: "#B45309",
    contrastText: "#1A1C1E",
  },
  info: {
    main: "#60A5FA",
    light: "#EFF6FF",
    dark: "#1D4ED8",
    contrastText: "#FFFFFF",
  },
} as const;
