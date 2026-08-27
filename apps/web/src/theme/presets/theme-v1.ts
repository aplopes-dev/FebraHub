import { createAppTheme, type ThemeOptions } from "@/ui/theme";
import { DEFAULT_BRAND_COLOR, DEFAULT_BRAND_PALETTE } from "../brand-color";
import { semanticPalette } from "../semantic-palette";

/** Cor de marca padrão deste preset — o ouro da marca. */
export const themeV1BrandColor = DEFAULT_BRAND_COLOR;

/**
 * Preset **v1** — o tema do sistema.
 *
 * Cores e medidas do design NodeX (Figma), frame `Dashboard - Features`
 * (nó `37166:23304`): superfícies brancas sobre uma moldura escura, uma única
 * cor de traço (`Stroke/Primary`) e o cinza `Neutral Lv1` nos cabeçalhos.
 *
 * - Conteúdo branco sobre a moldura escura do inset (`sidebar.canvas`)
 * - Sidebar escura (rail 68px + painel 240px), do design NodeX (Figma),
 *   nó `37041:5385`. As cores já vêm com o fundo achatado — o arquivo pinta
 *   `rgba(27,27,27,0.24)` sobre um fundo escuro do próprio container.
 * - Primária: o ouro da marca — `main` chapado para bordas, texto e `alpha()`;
 *   degradê metálico nas superfícies preenchidas. Em runtime `AppProviders`
 *   sobrescreve com a cor escolhida pelo usuário.
 * - Semântica pastel e `shape.borderRadius` 8 (os componentes leem
 *   `theme.shape.borderRadius`, ninguém fixa raio na mão).
 */
export const themeV1Options = {
  palette: {
    /**
     * A marca — chapada em `main` e metálica em `gradient`. Em runtime
     * `AppProviders` sobrescreve com a cor escolhida pelo usuário.
     */
    primary: DEFAULT_BRAND_PALETTE,
    ...semanticPalette,
    background: {
      default: "#FFFFFF",
      paper: "#FFFFFF",
      header: "#FFFFFF",
    },
    text: {
      primary: "#1B1B1B",
      secondary: "#5F655A",
    },
    /** `Stroke/Primary` do design — borda do inset, dos cards e da tabela. */
    divider: "#EDF2F0",
    sidebar: {
      /** Moldura do inset — o fundo que aparece em volta do conteúdo. */
      canvas: "#1B1B1B",
      // Coluna 1 (rail)
      rail: "#1B1D1D",
      /** Itens em repouso: branco rebaixado — só o ativo fica 100%. */
      railContrastText: "rgba(255, 255, 255, 0.64)",
      /** Caixa 32×32 do ícone ativo. */
      railActive: "#404040",
      railActiveContrastText: "#FFFFFF",
      railBorder: "#383D3D",
      railActiveBorder: "#787878",
      railActiveRing: "#1B1B1B",

      // Coluna 2 (painel)
      background: "#1B1E1E",
      contrastText: "#FFFFFF",
      border: "transparent",
      panelShadow: "none",
      itemContrastText: "#D0D1D3",
      /** Hover dos itens do painel — a sidebar é escura nos dois modos. */
      itemHover: "rgba(255, 255, 255, 0.04)",
      itemActive: "#3E4040",
      itemActiveBorder: "#616161",
      itemActiveContrastText: "#FFFFFF",
      groupLabel: "#8A8C91",

      main: "#3E4040",
      light: "#515C62",
      dark: "#1B1B1B",
    },
    /**
     * `Icon/Secondary` do design. Sem isto, ícone de `IconButton`, seta de
     * `Select` e `ListItemIcon` usam o cinza padrão do MUI, que não é o do
     * desenho.
     */
    action: {
      active: "#5F655A",
    },
    /** `Background/Surface/Neutral Lv1` e `Lv3` — cabeçalhos e fundos suaves. */
    muted: {
      main: "#F3F4F4",
      light: "#FAFAFA",
      dark: "#E9EBEA",
      contrastText: "#5F655A",
    },
  },
  shape: {
    borderRadius: 8,
  },
} satisfies ThemeOptions;

/** Tema estático (sem a cor de marca dinâmica) — útil em testes. */
export const themeV1 = createAppTheme(themeV1Options);

/**
 * Camada escura do mesmo preset.
 *
 * Cores do design NodeX (Figma), frame dark `Dashboard - Features`
 * (nó `37286:80555`), medidas no render:
 *
 * - **A sidebar não muda.** Rail `#1B1D1D` e painel `#1B1E1E` são os mesmos
 *   dos dois modos — no design ela já nasce escura, e é isso que faz o app
 *   claro e o escuro serem o mesmo desenho.
 * - **A moldura do inset também não muda** (`#1B1B1B`). No escuro ela fica
 *   mais clara que o conteúdo (`#121212`): o container afunda em vez de
 *   flutuar, e quem o delineia é o traço.
 * - Superfícies: `Background/Surface/Default` `#121212` para container, header
 *   e cards — o box de conteúdo é da mesma cor do fundo, separado só pela
 *   borda, exatamente como no modo claro.
 * - Traço: `Stroke/Primary` `#2D302C` — estrutura e campos.
 * - Texto: `#E8EAE9` / `#D0D1D3`.
 */
export const themeV1DarkOptions = {
  palette: {
    mode: "dark",
    background: {
      default: "#121212",
      paper: "#121212",
      header: "#121212",
    },
    sidebar: {
      // Repetido de propósito: deixa explícito que a moldura é a mesma nos
      // dois modos, em vez de parecer esquecimento.
      canvas: "#1B1B1B",
    },
    text: {
      primary: "#E8EAE9",
      secondary: "#D0D1D3",
      disabled: "#8A8C91",
    },
    divider: "#2D302C",
    /** `Neutral Lv1` (cabeçalho de tabela) e `Lv3` (fundos suaves). */
    muted: {
      main: "#1C1D1C",
      light: "#1A1A1A",
      dark: "#282A28",
      contrastText: "#D0D1D3",
    },
    /**
     * Semântica invertida: a convenção do sistema é `light` = fundo do badge e
     * `dark` = texto (ver `semantic-palette`). No escuro os pastéis viram
     * fundos profundos e o texto sobe para o tom claro — sem isto um "pago"
     * seria uma etiqueta branca brilhante no meio da tabela.
     */
    success: { main: "#34D399", light: "#10281F", dark: "#6EE7B7" },
    error: { main: "#F87171", light: "#2B1618", dark: "#FCA5A5" },
    warning: { main: "#FBBF24", light: "#2A2010", dark: "#FCD34D" },
    info: { main: "#60A5FA", light: "#131F33", dark: "#93C5FD" },
    action: {
      /**
       * `Icon/Secondary` do design escuro. O padrão do MUI no escuro é branco
       * puro — os ícones do header saltavam à frente do próprio texto.
       */
      active: "#D0D1D3",
      disabled: "#8A8C91",
      // Hovers discretos o bastante para não competir com `muted`.
      hover: "rgba(255, 255, 255, 0.05)",
      selected: "rgba(255, 255, 255, 0.09)",
    },
  },
} satisfies ThemeOptions;

/** Tema escuro estático — útil em testes. */
export const themeV1Dark = createAppTheme(themeV1Options, themeV1DarkOptions);
