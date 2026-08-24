import { createTheme, type Theme, type ThemeOptions } from "@mui/material/styles";
import { baseTokens } from "./tokens";

function resolvePaletteMode(overrides: ThemeOptions[]): "light" | "dark" {
  for (let i = overrides.length - 1; i >= 0; i -= 1) {
    const mode = overrides[i]?.palette?.mode;
    if (mode === "dark" || mode === "light") {
      return mode;
    }
  }
  return "light";
}

/**
 * Cria o tema MUI do app consumidor.
 *
 * O pacote fornece `baseTokens`; cada frontend passa `overrides` com a
 * identidade visual própria (palette, typography, shape, components…).
 *
 * No modo escuro a paleta clara hardcoded de `baseTokens` (texto `#1A1C1E`,
 * `action.active` preto) **não** entra no merge — o MUI gera os defaults
 * escuros (incluindo `action` e `text`), o pacote injeta fallbacks de
 * `muted`/`sidebar` (chaves custom), e só então aplicam-se as cores de marca.
 */
export function createAppTheme(...overrides: ThemeOptions[]): Theme {
  const mode = resolvePaletteMode(overrides);

  if (mode === "dark") {
    const { palette: _lightPalette, ...baseWithoutPalette } = baseTokens;
    return createTheme(
      {
        ...baseWithoutPalette,
        palette: {
          mode: "dark",
          muted: {
            main: "#1F2937",
            light: "#374151",
            dark: "#111827",
            contrastText: "#9CA3AF",
          },
          sidebar: {
            main: "#1F2937",
            light: "#374151",
            dark: "#0F172A",
            contrastText: "#E2E8F0",
            background: "#111827",
            border: "#1F2937",
            panelShadow: "none",
          },
        },
      },
      ...overrides,
    );
  }

  return createTheme(baseTokens, ...overrides);
}

export type { Theme, ThemeOptions };
