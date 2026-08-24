"use client";

import CssBaseline from "@mui/material/CssBaseline";
import {
  ThemeProvider as MuiThemeProvider,
  type Theme,
} from "@mui/material/styles";
import type { ReactNode } from "react";
import { IconsProvider } from "../icons/icons-provider";
import type { IconVariant } from "../icons/registry";

export type CityboxMuiProviderProps = {
  /** Tema exclusivo do app — criado com `createAppTheme(overrides)`. */
  theme: Theme;
  children: ReactNode;
  /** Quando `false`, não injeta `CssBaseline`. Default: `true`. */
  withCssBaseline?: boolean;
  /**
   * Estilo Solar padrão dos `<Icon />` do app.
   * Pode ser sobrescrito por ícone via prop `variant`.
   * Default: `linear`.
   */
  iconVariant?: IconVariant;
};

/**
 * Provider de tema do @citybox/mui.
 * Cada app cria o próprio `theme` e passa aqui — o pacote não embute marca.
 */
export function CityboxMuiProvider({
  theme,
  children,
  withCssBaseline = true,
  iconVariant,
}: CityboxMuiProviderProps) {
  return (
    <MuiThemeProvider theme={theme}>
      {withCssBaseline ? <CssBaseline enableColorScheme /> : null}
      <IconsProvider variant={iconVariant}>{children}</IconsProvider>
    </MuiThemeProvider>
  );
}
