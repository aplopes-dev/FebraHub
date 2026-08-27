import type { PaletteColor, PaletteColorOptions } from "@mui/material/styles";

/**
 * Palette do DualSidebar: `main`/`light`/`dark` para acentos + `background`
 * exclusivo do fundo da coluna 2 + `border` + `panelShadow` da borda direita.
 */
export type SidebarPaletteColor = PaletteColor & {
  /**
   * Fundo atrás de tudo — aparece como moldura em volta do container de
   * conteúdo (layout "inset"): a sidebar encosta nele e o container flutua
   * por cima, com margem e cantos arredondados.
   */
  canvas: string;
  /** Fundo da primeira coluna (rail de módulos). */
  rail: string;
  /** Ícone + rótulo do rail em repouso. */
  railContrastText: string;
  /** Fundo do módulo selecionado no rail. */
  railActive: string;
  /** Ícone + rótulo do módulo selecionado. */
  railActiveContrastText: string;
  /** Borda direita do rail (`transparent` = sem borda). */
  railBorder: string;
  /** Borda da caixa 32×32 do ícone ativo no rail. */
  railActiveBorder: string;
  /** Anel externo (2px) da caixa do ícone ativo no rail. */
  railActiveRing: string;
  /** Ícone + rótulo dos itens do painel em repouso. */
  itemContrastText: string;
  /**
   * Fundo do item do painel sob o cursor. É token porque a sidebar não é
   * escura em todo preset: um `alpha(white)` fixo some numa sidebar clara.
   */
  itemHover: string;
  /** Fundo do item selecionado no painel. */
  itemActive: string;
  /** Borda do item selecionado no painel (`transparent` = sem borda). */
  itemActiveBorder: string;
  /** Ícone + rótulo do item selecionado no painel. */
  itemActiveContrastText: string;
  /** Rótulo dos grupos (subheader) do painel. */
  groupLabel: string;
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
  canvas?: string;
  rail?: string;
  railContrastText?: string;
  railActive?: string;
  railActiveContrastText?: string;
  railBorder?: string;
  railActiveBorder?: string;
  railActiveRing?: string;
  itemContrastText?: string;
  itemHover?: string;
  itemActive?: string;
  itemActiveBorder?: string;
  itemActiveContrastText?: string;
  groupLabel?: string;
  background?: string;
  border?: string;
  panelShadow?: string;
};

declare module "@mui/material/styles" {
  /**
   * Preenchimento em degradê de uma cor da palette.
   *
   * O MUI só aceita cor chapada em `main` — `alpha()`, contraste e bordas
   * dependem disso. Uma marca metálica (ouro, prata) precisa de um degradê
   * para ler como tal, então ele vive num token à parte: `main` continua
   * sendo a cor de verdade e o degradê pinta só as superfícies preenchidas
   * (`background-image`, que cai sobre o `background-color`).
   *
   * Ausente = superfície chapada, o comportamento padrão do MUI.
   */
  interface PaletteColor {
    /** `background-image` das superfícies preenchidas com esta cor. */
    gradient?: string;
    /** O mesmo degradê sob o cursor. Sem ele, o hover repete `gradient`. */
    gradientHover?: string;
  }

  interface SimplePaletteColorOptions {
    gradient?: string;
    gradientHover?: string;
  }

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
