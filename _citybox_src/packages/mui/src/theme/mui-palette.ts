import type { PaletteColor, PaletteColorOptions } from "@mui/material/styles";

/**
 * Palette do DualSidebar: `main`/`light`/`dark` para acentos + `background`
 * exclusivo do fundo da coluna 2 + `border` + `panelShadow` da borda direita.
 */
export type SidebarPaletteColor = PaletteColor & {
  /** Fundo da segunda coluna (painel). */
  background: string;
  /** Borda direita da coluna 2 (`transparent` = sem borda visível). */
  border: string;
  /**
   * Sombra à direita da coluna 2 (CSS `box-shadow`).
   * Use `none` para desligar; ajuste blur/alpha para intensidade.
   */
  panelShadow: string;
};

export type SidebarPaletteColorOptions = PaletteColorOptions & {
  background?: string;
  border?: string;
  panelShadow?: string;
};

declare module "@mui/material/styles" {
  interface Palette {
    sidebar: SidebarPaletteColor;
    /** Superfície neutra (chips, badges, fundos suaves). */
    muted: PaletteColor;
  }

  interface PaletteOptions {
    sidebar?: SidebarPaletteColorOptions;
    muted?: PaletteColorOptions;
  }

  interface TypeBackground {
    /** Fundo do header do DualDashboardLayout (pode diferir do canvas). */
    header: string;
  }
}

declare module "@mui/material/Chip" {
  interface ChipPropsColorOverrides {
    muted: true;
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    muted: true;
  }
}

export {};
