"use client";

/* ============ TEMA MUI (módulos copiados do crm-aplopes) ============
   Os componentes de conversas/agentes vieram do crm-aplopes SEM alteração —
   eles são MUI. Este arquivo é o porte do src/theme/theme.ts da origem com
   uma única mudança de essência: a PALETA, que aqui é a do FebraHub
   (dourado/verniz de globals.css), num esquema claro e um escuro.

   Decisões do porte:
   - `colorSchemeSelector: "data-tema-mui"`: o FebraHub troca de tema pelo
     atributo `data-tema` ("claro"/"escuro") no <html>; o MUI não entende
     esses valores, então ele ganha um atributo PRÓPRIO (data-tema-mui) que
     o <SincronizaTema/> mantém espelhado no data-tema do app.
   - SEM CssBaseline: o tema vale só para os componentes MUI montados; o
     resto do FebraHub (inline styles + CSS vars) segue intocado.
   - Paleta com HEX literal (não var(--gold)): o MUI calcula hover/contraste
     a partir da cor, e `augmentColor` não sabe ler custom property. Os hex
     são os MESMOS de globals.css — mudou lá, muda aqui. */

import { useEffect, type ReactNode } from "react";
import {
  createTheme,
  ThemeProvider,
  useColorScheme,
  type Shadows,
} from "@mui/material/styles";
import { ptBR as corePtBR } from "@mui/material/locale";

/* --------- paleta FebraHub (espelho de globals.css, por tema) --------- */

const CLARO = {
  gold: "#8A6A1E",
  fundo: "#FAF8F5",
  papel: "#FFFFFF",
  texto: "#1B1813",
  textoSuave: "#5C5A60",
  divisor: "rgba(23, 20, 14, 0.13)",
  up: "#17784A",
  down: "#C0392B",
  warn: "#8A6410",
  azul: "#2A6FB5",
};

const ESCURO = {
  gold: "#E4C06A",
  fundo: "#08080A",
  papel: "#101013",
  texto: "#F5F3EE",
  textoSuave: "#8B8B90",
  divisor: "rgba(255, 255, 255, 0.08)",
  up: "#6FCF97",
  down: "#E06C75",
  warn: "#E6B04D",
  azul: "#6BA8E5",
};

/** Tinta sobre fundo dourado — o dourado é identidade e não muda de tema. */
const SOBRE_OURO = "#100C04";

/* Tags do sistema: degradê cinza + texto escuro (sem cor semântica por status). */
const CHIP_TAG = {
  text: "#2a2620",
  border: "rgba(23, 20, 14, 0.12)",
  gradient: "linear-gradient(180deg, rgba(23, 20, 14, 0.08), rgba(23, 20, 14, 0.16))",
  textDark: "#ebe4d8",
  borderDark: "rgba(255, 255, 255, 0.10)",
  gradientDark: "linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05))",
} as const;

type ChipTone = "success" | "error" | "warning" | "info" | "primary" | "secondary";

/** Chip padronizado — o tone da prop é ignorado na pintura (só mantém a API). */
function statusChipSx(_tone: ChipTone) {
  return {
    backgroundImage: CHIP_TAG.gradient,
    backgroundColor: "transparent",
    color: CHIP_TAG.text,
    borderColor: CHIP_TAG.border,
    "&.MuiChip-outlined": {
      backgroundImage: CHIP_TAG.gradient,
      backgroundColor: "transparent",
      borderColor: CHIP_TAG.border,
    },
    "& .MuiChip-icon, & .MuiChip-deleteIcon": {
      color: "inherit",
    },
    '[data-tema-mui="dark"] &': {
      backgroundImage: CHIP_TAG.gradientDark,
      backgroundColor: "transparent",
      color: CHIP_TAG.textDark,
      borderColor: CHIP_TAG.borderDark,
      "&.MuiChip-outlined": {
        backgroundImage: CHIP_TAG.gradientDark,
        backgroundColor: "transparent",
        borderColor: CHIP_TAG.borderDark,
      },
    },
  } as const;
}

/* Fonte dos controles de formulário, um degrau abaixo do corpo (origem). */
const CONTROL_FONT_SIZE = 13;
const CONTROL_ICON_SIZE = 20;

const softShadows = [
  "none",
  "0 1px 2px rgba(26, 26, 26, 0.04)",
  "0 2px 8px rgba(26, 26, 26, 0.05)",
  "0 4px 12px rgba(26, 26, 26, 0.06)",
  "0 6px 16px rgba(26, 26, 26, 0.06)",
  "0 8px 20px rgba(26, 26, 26, 0.07)",
  "0 10px 24px rgba(26, 26, 26, 0.07)",
  "0 12px 28px rgba(26, 26, 26, 0.08)",
  "0 14px 32px rgba(26, 26, 26, 0.08)",
  "0 16px 36px rgba(26, 26, 26, 0.08)",
  "0 18px 40px rgba(26, 26, 26, 0.09)",
  "0 20px 44px rgba(26, 26, 26, 0.09)",
  "0 22px 48px rgba(26, 26, 26, 0.09)",
  "0 24px 52px rgba(26, 26, 26, 0.1)",
  "0 26px 56px rgba(26, 26, 26, 0.1)",
  "0 28px 60px rgba(26, 26, 26, 0.1)",
  "0 30px 64px rgba(26, 26, 26, 0.1)",
  "0 32px 68px rgba(26, 26, 26, 0.1)",
  "0 34px 72px rgba(26, 26, 26, 0.1)",
  "0 36px 76px rgba(26, 26, 26, 0.1)",
  "0 38px 80px rgba(26, 26, 26, 0.1)",
  "0 40px 84px rgba(26, 26, 26, 0.1)",
  "0 42px 88px rgba(26, 26, 26, 0.1)",
  "0 44px 92px rgba(26, 26, 26, 0.1)",
  "0 46px 96px rgba(26, 26, 26, 0.1)",
] as Shadows;

const temaMui = createTheme(
  {
    cssVariables: {
      colorSchemeSelector: "data-tema-mui",
    },
    colorSchemes: {
      light: {
        palette: {
          mode: "light",
          primary: { main: CLARO.gold, contrastText: "#FFFFFF" },
          secondary: {
            main: CLARO.texto,
            light: "#3E3A32",
            dark: "#0E0C09",
            contrastText: "#FAF8F5",
          },
          background: { default: CLARO.fundo, paper: CLARO.papel },
          text: { primary: CLARO.texto, secondary: CLARO.textoSuave },
          divider: CLARO.divisor,
          success: { main: CLARO.up, contrastText: "#FFFFFF" },
          error: { main: CLARO.down, contrastText: "#FFFFFF" },
          warning: { main: CLARO.warn, contrastText: "#FFFFFF" },
          info: { main: CLARO.azul, contrastText: "#FFFFFF" },
          action: {
            hover: "rgba(23, 20, 14, 0.04)",
            selected: "rgba(138, 106, 30, 0.10)",
          },
        },
      },
      dark: {
        palette: {
          mode: "dark",
          primary: { main: ESCURO.gold, contrastText: SOBRE_OURO },
          secondary: {
            main: ESCURO.texto,
            light: "#FFFDF8",
            dark: "#C9C7C0",
            contrastText: "#08080A",
          },
          background: { default: ESCURO.fundo, paper: ESCURO.papel },
          text: { primary: ESCURO.texto, secondary: ESCURO.textoSuave },
          divider: ESCURO.divisor,
          success: { main: ESCURO.up, contrastText: "#08080A" },
          error: { main: ESCURO.down, contrastText: "#08080A" },
          warning: { main: ESCURO.warn, contrastText: "#08080A" },
          info: { main: ESCURO.azul, contrastText: "#08080A" },
          action: {
            hover: "rgba(255, 255, 255, 0.05)",
            selected: "rgba(228, 192, 106, 0.12)",
          },
        },
      },
    },
    breakpoints: {
      values: { xs: 0, sm: 600, md: 600, lg: 1200, xl: 1536 },
    },
    shape: { borderRadius: 8 },
    shadows: softShadows,
    typography: {
      fontFamily: "var(--fonte-sans), 'Manrope', system-ui, sans-serif",
      h1: { fontWeight: 700, letterSpacing: "-0.02em" },
      h2: { fontWeight: 700, letterSpacing: "-0.02em" },
      h3: { fontWeight: 700, letterSpacing: "-0.01em" },
      h4: { fontWeight: 700, letterSpacing: "-0.01em" },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: "none" },
    },
    components: {
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: "none" },
          rounded: { borderRadius: 8 },
          outlined: { border: "1px solid var(--mui-palette-divider)" },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0, variant: "outlined" },
        styleOverrides: {
          root: { backgroundImage: "none", borderRadius: 8 },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true, variant: "outlined" },
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 999,
            fontWeight: 600,
            paddingInline: 20,
          },
          sizeSmall: { paddingInline: 14 },
          sizeLarge: { paddingInline: 28 },
          text: {
            border: "1px solid currentColor",
            "&.MuiButton-colorInherit": {
              borderColor: "var(--mui-palette-divider)",
            },
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: "inherit" },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: "var(--mui-palette-background-paper)",
            color: "var(--mui-palette-text-primary)",
            borderBottom: "1px solid var(--mui-palette-divider)",
            boxShadow: "none",
            borderRadius: 0,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: "none",
            backgroundColor: "var(--mui-palette-background-paper)",
            borderRight: "1px solid var(--mui-palette-divider)",
            boxShadow: "none",
            borderRadius: 0,
            borderTop: "none",
            borderBottom: "none",
            borderLeft: "none",
          },
        },
      },
      MuiListSubheader: {
        styleOverrides: {
          root: {
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontSize: 12,
            fontWeight: 600,
            lineHeight: "36px",
            color: "var(--mui-palette-text-disabled)",
            backgroundColor: "transparent",
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            marginInline: 8,
            minHeight: 40,
            fontSize: "0.875rem",
            "& .MuiListItemText-primary": {
              fontSize: "0.875rem",
              fontWeight: 500,
            },
            "& .MuiListItemIcon-root": {
              minWidth: 36,
              "& .MuiSvgIcon-root": { fontSize: "1.25rem" },
            },
            "&.Mui-selected": {
              backgroundColor: "var(--mui-palette-action-selected)",
              color: "var(--mui-palette-primary-main)",
              "&:hover": {
                backgroundColor:
                  "color-mix(in srgb, var(--mui-palette-text-primary) 10%, transparent)",
              },
              "& .MuiListItemIcon-root": {
                color: "var(--mui-palette-primary-main)",
              },
              "& .MuiTypography-root": {
                color: "var(--mui-palette-primary-main)",
              },
              "& .MuiSvgIcon-root": {
                color: "var(--mui-palette-primary-main)",
              },
              "& .MuiAvatar-root": {
                backgroundColor: "var(--mui-palette-primary-main)",
              },
            },
          },
        },
      },
      MuiMenu: { styleOverrides: { paper: { borderRadius: "8px" } } },
      MuiPopover: { styleOverrides: { paper: { borderRadius: "8px" } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: "8px" } } },
      MuiTypography: {
        styleOverrides: {
          // caption/overline renderizam <span>: sem display block o noWrap
          // não trunca com "…" (overflow não vale para inline).
          noWrap: { display: "block" },
        },
      },
      MuiInputBase: { styleOverrides: { root: { fontSize: CONTROL_FONT_SIZE } } },
      MuiFormLabel: { styleOverrides: { root: { fontSize: CONTROL_FONT_SIZE } } },
      MuiFormControlLabel: {
        styleOverrides: { label: { fontSize: CONTROL_FONT_SIZE } },
      },
      MuiMenuItem: { styleOverrides: { root: { fontSize: CONTROL_FONT_SIZE } } },
      MuiAutocomplete: {
        styleOverrides: {
          option: { fontSize: CONTROL_FONT_SIZE },
          noOptions: { fontSize: CONTROL_FONT_SIZE },
          loading: { fontSize: CONTROL_FONT_SIZE },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            "&:not(.MuiCheckbox-sizeSmall) .MuiSvgIcon-root": {
              fontSize: CONTROL_ICON_SIZE,
            },
          },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            "&:not(.MuiRadio-sizeSmall) .MuiSvgIcon-root": {
              fontSize: CONTROL_ICON_SIZE,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: "transparent",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--mui-palette-divider)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--mui-palette-text-secondary)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderWidth: 1,
              borderColor: "var(--mui-palette-primary-main)",
            },
          },
        },
      },
      MuiAlert: {
        defaultProps: { variant: "outlined" },
        styleOverrides: { root: { borderRadius: 8, boxShadow: "none" } },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 500,
            "& .MuiChip-label": { paddingLeft: 12, paddingRight: 12 },
            "&.MuiChip-sizeSmall .MuiChip-label": {
              paddingLeft: 10,
              paddingRight: 10,
            },
            "& .MuiChip-icon": { marginLeft: 10, marginRight: -2 },
            "&.MuiChip-sizeSmall .MuiChip-icon": {
              marginLeft: 8,
              marginRight: -2,
            },
          },
          colorSuccess: statusChipSx("success"),
          colorError: statusChipSx("error"),
          colorWarning: statusChipSx("warning"),
          colorInfo: statusChipSx("info"),
          colorPrimary: statusChipSx("primary"),
          colorSecondary: statusChipSx("secondary"),
          colorDefault: statusChipSx("primary"),
        },
      },
    },
  },
  // pt-BR nos componentes com texto próprio (paginação etc.).
  corePtBR,
);

/* ---------------------- sincronização com o data-tema ---------------------- */

/** Espelha o tema do FebraHub (html[data-tema], ou o do sistema quando o
 *  atributo não existe) no modo do MUI. Vive DENTRO do ThemeProvider porque
 *  useColorScheme precisa do contexto. */
function SincronizaTema() {
  const { setMode } = useColorScheme();

  useEffect(() => {
    const preferencia = window.matchMedia("(prefers-color-scheme: dark)");
    const aplicar = () => {
      const atributo = document.documentElement.getAttribute("data-tema");
      const escuro = atributo ? atributo === "escuro" : preferencia.matches;
      setMode(escuro ? "dark" : "light");
    };
    aplicar();
    const observador = new MutationObserver(aplicar);
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-tema"],
    });
    preferencia.addEventListener("change", aplicar);
    return () => {
      observador.disconnect();
      preferencia.removeEventListener("change", aplicar);
    };
  }, [setMode]);

  return null;
}

export function ProvedorMui({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={temaMui} defaultMode="system" disableTransitionOnChange>
      <SincronizaTema />
      {children}
    </ThemeProvider>
  );
}
