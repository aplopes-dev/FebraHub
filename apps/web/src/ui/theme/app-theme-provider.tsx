"use client";

import CssBaseline from "@mui/material/CssBaseline";
import {
  ThemeProvider as MuiThemeProvider,
  type Theme,
} from "@mui/material/styles";
import type { ReactNode } from "react";
import { IconsProvider } from "../icons/icons-provider";
import type { IconVariant } from "../icons/registry";

export type AppThemeProviderProps = {
  /** Tema do app — criado com `createAppTheme(overrides)`. */
  theme: Theme;
  children: ReactNode;
  /** Quando `false`, não injeta `CssBaseline`. Default: `true`. */
  withCssBaseline?: boolean;
  /**
   * Estilo Solar padrão dos `<Icon />`.
   * Pode ser sobrescrito por ícone via prop `variant`.
   * Default: `linear`.
   */
  iconVariant?: IconVariant;
};

/**
 * Provider de tema do design system.
 *
 * O DS não embute marca: o tema vem de fora (`src/theme`), o que mantém o
 * `src/ui` reutilizável e a identidade num lugar só.
 */
export function AppThemeProvider({
  theme,
  children,
  withCssBaseline = true,
  iconVariant,
}: AppThemeProviderProps) {
  return (
    <MuiThemeProvider theme={theme}>
      {withCssBaseline ? <CssBaseline /> : null}
      <IconsProvider variant={iconVariant}>{children}</IconsProvider>
    </MuiThemeProvider>
  );
}
