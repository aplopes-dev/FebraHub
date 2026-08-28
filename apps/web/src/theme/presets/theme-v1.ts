import { createAppTheme, type ThemeOptions } from "@/ui/theme";
import { BORDER_COLOR, BORDER_COLOR_DARK } from "../border-color";
import { DEFAULT_BRAND_COLOR, DEFAULT_BRAND_PALETTE } from "../brand-color";
import { semanticPalette } from "../semantic-palette";

/** Cor de marca padrão deste preset — o ouro da marca. */
export const themeV1BrandColor = DEFAULT_BRAND_COLOR;

/**
 * Preset **v1** — o tema do sistema.
 *
 * Cores e medidas do design NodeX (Figma), frame `Dashboard - Features`
 * (nó `37166:23304`), com a paleta clara trazida para o creme do projeto: uma
 * única cor de traço (`BORDER_COLOR`) e o `Neutral Lv1` nos cabeçalhos.
 *
 * - Conteúdo em creme (`#F9F8F4`) sobre a moldura escura do inset
 *   (`sidebar.canvas`); os boxes (cards, painéis) um tom mais fechado,
 *   em `#F2F1ED`
 * - Sidebar escura (rail 68px + painel 240px), do design NodeX (Figma),
 *   nó `37041:5385`. As cores já vêm com o fundo achatado — o arquivo pinta
 *   `rgba(27,27,27,0.24)` sobre um fundo escuro do próprio container.
 * - Primária: o ouro da marca (`#DAA428`), chapado. Em runtime `AppProviders`
 *   sobrescreve com a cor escolhida pelo usuário.
 * - Semântica pastel e `shape.borderRadius` 8 (os componentes leem
 *   `theme.shape.borderRadius`, ninguém fixa raio na mão).
 */
export const themeV1Options = {
  palette: {
    /**
     * A marca. Em runtime `AppProviders` sobrescreve com a cor escolhida pelo
     * usuário.
     */
    primary: DEFAULT_BRAND_PALETTE,
    ...semanticPalette,
    background: {
      /**
       * Fundo do sistema — o creme quente do projeto, não branco. É ele que
       * aparece no `main` e sob as superfícies elevadas; o branco puro deixava
       * a tela dura e não dava chão para o card.
       */
      default: "#F9F8F4",
      /**
       * Superfície de box — card, painel de listagem, menu, diálogo.
       *
       * Creme um tom **mais fechado** que o fundo: o box não sobe por luz, e
       * sim por peso — é a mancha mais escura que o delimita, com o traço
       * (`divider`) só fechando a borda. O branco foi testado aqui e
       * descartado.
       */
      paper: "#F2F1ED",
      /** O header acompanha o fundo — a casca clara não tem branco. */
      header: "#F9F8F4",
    },
    text: {
      primary: "#1B1B1B",
      secondary: "#5F655A",
    },
    /**
     * Traço de estrutura e traço de controle saem da **mesma** constante
     * (`BORDER_COLOR`): borda do inset, dos cards, da tabela, dos separadores,
     * a linha embaixo do header e o contorno dos campos. Por ser translúcida,
     * ela se ajusta a cada superfície sem precisar de um tom por fundo.
     */
    divider: BORDER_COLOR,
    controlBorder: BORDER_COLOR,
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
    /**
     * Cabeçalhos de tabela e fundos suaves — na família creme, e não no cinza
     * frio de antes: sobre `background.paper` o cinza-azulado ficava do mesmo
     * peso do card e o cabeçalho da tabela desaparecia dentro dele.
     */
    muted: {
      main: "#E7E4D9",
      light: "#F5F4EF",
      dark: "#DAD6C8",
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
      /**
       * Superfície de box — card, painel de listagem, menu, diálogo.
       *
       * **A mesma ideia do claro, invertida.** Lá o box sobe por peso: é a
       * mancha mais *escura* que o delimita. No escuro não há para onde
       * escurecer a partir do fundo, então o peso vira luz — o box é o tom
       * mais claro, e o traço (`divider`) só fecha a borda.
       *
       * O degrau é o mesmo do claro (~6% de contraste contra o fundo). Sem
       * ele, `paper` repetia o `default` e o box ficava só no traço.
       */
      paper: "#171817",
      /** O header acompanha o fundo, como no claro. */
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
    /**
     * Os dois traços repetidos no escuro de propósito: sem isto herdariam o
     * preto translúcido da camada clara — o merge só troca o que a camada
     * escura redefine — e sumiriam no fundo.
     */
    divider: BORDER_COLOR_DARK,
    controlBorder: BORDER_COLOR_DARK,
    /**
     * `Neutral Lv1` (cabeçalho de tabela) e `Lv3` (fundos suaves), subidos
     * junto com o `paper`: os tons antigos ficavam a 3% dele e o cabeçalho de
     * tabela sumia dentro do card. Os degraus acompanham os do claro — 11%
     * de `paper` para `main`, 12% de `main` para `dark`.
     */
    muted: {
      main: "#212221",
      light: "#151615",
      dark: "#2A2B2A",
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
