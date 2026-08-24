import { createAppTheme, type ThemeOptions } from "@citybox/mui/theme";
import { comercioSemanticPalette } from "../semantic-palette";

/**
 * Preset **v2** — canvas suave.
 *
 * - App: fundo `#F8FAFB` (era o sidebar.background do v1)
 * - Coluna 2: branco (sem borda; sombra um pouco mais presente)
 * - Header: branco
 * - Primária: mesma família do v1 (para comparar só layout de superfícies)
 * - Semântica: pastel (`success`/`error`/`warning`/`info`)
 * - `shape.borderRadius`: tokens MUI dos componentes (`theme.shape.borderRadius`)
 */
export const comercioThemeV2Options = {
  palette: {
    primary: {
      main: "#3F43BF",
      light: "#7376D2",
      dark: "#2B2E86",
      contrastText: "#FFFFFF",
    },
    ...comercioSemanticPalette,
    background: {
      default: "#F8FAFB",
      paper: "#FFFFFF",
      header: "#FFFFFF",
    },
    sidebar: {
      main: "#E6ECF5",
      light: "#F1F4F9",
      dark: "#D0D9E8",
      contrastText: "#686B75",
      background: "#FFFFFF",
      border: "transparent",
      // Sem borda — sombra um pouco mais intensa (ainda clara).
      panelShadow: "6px 0 20px rgba(15, 23, 42, 0.02)",
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
export const comercioThemeV2 = createAppTheme(comercioThemeV2Options);
