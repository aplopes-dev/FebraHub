import { createTheme, type Theme, type ThemeOptions } from "@mui/material/styles";
import { deepmerge } from "@mui/utils";
import { baseTokens } from "./tokens";

/**
 * Cria o tema MUI do app.
 *
 * `baseTokens` entra como base e cada `override` é aplicado por cima —
 * identidade visual, camada de modo escuro, cor de marca em runtime.
 *
 * **As options são mescladas antes de `createTheme`, de propósito.**
 * `createTheme(base, a, b)` resolve a palette só do primeiro argumento e faz
 * `deepmerge` cru dos demais sobre o tema pronto. Com o modo escuro numa
 * camada de override, isso significava uma palette derivada do modo claro com
 * algumas cores trocadas à mão: `action.active` continuava o preto do claro
 * (ícones sumindo no fundo escuro) e as bordas de campo, o
 * `rgba(0,0,0,0.23)` do claro. Mesclando primeiro, o MUI vê `mode: "dark"`
 * antes de derivar qualquer coisa.
 *
 * @example
 * export const appTheme = createAppTheme({
 *   palette: { primary: { main: "#0B5FFF" } },
 * });
 */
export function createAppTheme(...overrides: ThemeOptions[]): Theme {
  const merged = overrides.reduce<ThemeOptions>(
    (acc, override) => deepmerge(acc, override),
    baseTokens as ThemeOptions,
  );
  return createTheme(merged);
}

export type { Theme, ThemeOptions };
