import { createAppTheme, type ThemeOptions } from "@citybox/mui/theme";
import { comercioSemanticPalette } from "../semantic-palette";

/**
 * Preset **v1** — tema original do shell Dual.
 *
 * - App: fundo branco
 * - Header: branco
 * - Coluna 2: `#F8FAFB` + borda + sombra bem leve
 * - Primária: `#3F43BF` (+ light `#7376D2`)
 * - Semântica: pastel (`success`/`error`/`warning`/`info`)
 * - `shape.borderRadius`: tokens MUI dos componentes (`theme.shape.borderRadius`)
 */
export const comercioThemeV1Options = {
  palette: {
    primary: {
      main: "#3F43BF",
      light: "#7376D2",
      dark: "#2B2E86",
      contrastText: "#FFFFFF",
    },
    ...comercioSemanticPalette,
    background: {
      default: "#FFFFFF",
      paper: "#FFFFFF",
      header: "#FFFFFF",
    },
    sidebar: {
      main: "#E6ECF5",
      light: "#F1F4F9",
      dark: "#D0D9E8",
      contrastText: "#686B75",
      background: "#F8FAFB",
      border: "#D0D9E8",
    },
    muted: {
      main: "#F5F5F5",
      light: "#FAFAFA",
      dark: "#E0E0E0",
      contrastText: "#5C6370",
    },
  },
  shape: {
    borderRadius: 8,
  },
} satisfies ThemeOptions;

/** Tema estático (sem cor de marca dinâmica) — útil em Storybook/tests. */
export const comercioThemeV1 = createAppTheme(comercioThemeV1Options);
