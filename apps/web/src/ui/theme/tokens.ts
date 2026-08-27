import type { ThemeOptions } from "@mui/material/styles";
import { outlinedInputClasses } from "@mui/material/OutlinedInput";
import "@mui/x-date-pickers/themeAugmentation";
import "./mui-palette";
import {
  buttonLargeVariantStyle,
  formControlMediumInputLabelStyles,
  formControlMediumOutlinedVariantStyle,
  formControlSmallInputLabelStyles,
  formControlSmallOutlinedVariantStyle,
  getPickersOutlinedStyleOverrides,
  resolvePickersInputSize,
} from "./control-sizes";

/**
 * Tokens base do @/ui.
 * Cada app consumidor sobrescreve via `createAppTheme(overrides)` —
 * o pacote NÃO impõe uma marca única; só oferece defaults sensatos.
 */
export const baseTokens = {
  palette: {
    mode: "light",
    primary: {
      main: "#1565C0",
      light: "#5E92F3",
      dark: "#003C8F",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#455A64",
      light: "#718792",
      dark: "#1C313A",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#D32F2F",
    },
    warning: {
      main: "#ED6C02",
    },
    info: {
      main: "#0288D1",
    },
    success: {
      main: "#2E7D32",
    },
    background: {
      default: "#F5F7FA",
      paper: "#FFFFFF",
      header: "#FFFFFF",
    },
    /**
     * Superfície do DualSidebar — cinza neutro com leve puxada para a
     * primária. `background` = fundo da coluna 2 (painel).
     */
    sidebar: {
      canvas: "#E8EDF5",
      main: "#E8EDF5",
      light: "#F3F6FA",
      dark: "#D5DCE8",
      contrastText: "#1A1C1E",
      background: "#F5F7FB",
      border: "#D5DCE8",
      panelShadow: "none",
      railActiveBorder: "transparent",
      railActiveRing: "transparent",
      itemContrastText: "#5C6370",
      itemHover: "rgba(26, 28, 30, 0.04)",
      itemActive: "#E4E6EA",
      itemActiveBorder: "transparent",
      itemActiveContrastText: "#1A1C1E",
      groupLabel: "#8A8C91",
    },
    muted: {
      main: "#F5F5F5",
      light: "#FAFAFA",
      dark: "#E0E0E0",
      contrastText: "#5C6370",
    },
    text: {
      primary: "#1A1C1E",
      secondary: "#5C6370",
    },
    divider: "rgba(0, 0, 0, 0.08)",
  },
  typography: {
    /**
     * A fonte é carregada pelo app consumidor (`next/font`) e exposta em
     * `--font-archivo`; o fallback cobre quem não define a variável.
     */
    fontFamily: [
      "var(--font-archivo, Archivo)",
      "Inter",
      "Roboto",
      "Helvetica",
      "Arial",
      "sans-serif",
    ].join(","),
    h1: { fontWeight: 700, fontSize: "2.25rem", lineHeight: 1.2 },
    h2: { fontWeight: 700, fontSize: "1.875rem", lineHeight: 1.25 },
    h3: { fontWeight: 600, fontSize: "1.5rem", lineHeight: 1.3 },
    h4: { fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.35 },
    h5: { fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.4 },
    h6: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.4 },
    body1: { fontSize: "1rem", lineHeight: 1.5 },
    body2: { fontSize: "0.875rem", lineHeight: 1.5 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: {
    /**
     * Raio padrão do projeto — fonte única.
     * Componentes usam `theme.shape.borderRadius` (não hardcode).
     * Apps sobrescrevem em `createAppTheme({ shape: { borderRadius: N } })`.
     */
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    /**
     * Botões: default `medium` (~36px). `size="large"` = 44px (altura dos campos).
     * Campos `size="small"` = 36px (altura do botão medium).
     */
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
          variants: [
            {
              props: { size: "large" },
              style: buttonLargeVariantStyle(),
            },
            /**
             * Marca com degradê (ver `PaletteColor.gradient`): o preenchimento
             * entra como `background-image`, por cima do `background-color`
             * que o MUI já pinta — assim o ripple, o foco e o estado
             * desabilitado continuam derivando de `primary.main`.
             */
            ...(theme.palette.primary.gradient
              ? [
                  {
                    props: { variant: "contained", color: "primary" },
                    style: {
                      backgroundImage: theme.palette.primary.gradient,
                      "&:hover": {
                        backgroundImage:
                          theme.palette.primary.gradientHover ??
                          theme.palette.primary.gradient,
                      },
                      "&.Mui-disabled": {
                        backgroundImage: "none",
                      },
                    },
                  },
                ]
              : []),
            {
              props: { variant: "outlined", color: "inherit" },
              style: {
                color: theme.palette.text.primary,
                borderColor: theme.palette.divider,
                backgroundColor: theme.palette.background.paper,
                "&:hover": {
                  borderColor: theme.palette.divider,
                  backgroundColor: theme.palette.muted.main,
                },
              },
            },
            {
              props: { variant: "outlined" },
              style: {
                "&:hover": {
                  backgroundColor: theme.palette.muted.main,
                },
              },
            },
            {
              props: { variant: "text", color: "inherit" },
              style: {
                color: theme.palette.text.primary,
                "&:hover": {
                  backgroundColor: theme.palette.muted.main,
                },
              },
            },
          ],
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
        }),
      },
    },
    /**
     * Campos: default (`medium`) = 44px; `size="small"` = 36px (altura do botão).
     * Ver `control-sizes.ts`.
     */
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
          /**
           * Campo em repouso usa o traço do tema (`Stroke/Primary` do design),
           * e não o `rgba(0,0,0,.23)` / `rgba(255,255,255,.23)` do MUI — que no
           * modo escuro dá uma borda cinza clara, mais forte que a do desenho.
           *
           * A regra mora aqui, e não no slot `notchedOutline`: o MUI pinta a
           * borda pelo root com um seletor descendente
           * (`& .notchedOutline`), que ganha de um override no slot por
           * especificidade. Hover e foco continuam com as regras do MUI, que
           * são mais específicas ainda.
           */
          [`& .${outlinedInputClasses.notchedOutline}`]: {
            borderColor: theme.palette.divider,
          },
          variants: [
            {
              props: { size: "medium" },
              style: formControlMediumOutlinedVariantStyle(),
            },
            {
              props: { size: "small" },
              style: formControlSmallOutlinedVariantStyle(),
            },
          ],
        }),
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
          variants: [
            {
              props: { size: "medium" },
              style: formControlMediumOutlinedVariantStyle(),
            },
            {
              props: { size: "small" },
              style: formControlSmallOutlinedVariantStyle(),
            },
          ],
        }),
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
        }),
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: formControlMediumInputLabelStyles,
        sizeSmall: formControlSmallInputLabelStyles,
      },
    },
    /**
     * MUI X DatePicker — espelha densidade dos campos (`medium` 44px / `small` 36px).
     * @see https://mui.com/x/migration/migration-pickers-v7/#theme-migration
     */
    MuiPickersTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiPickersOutlinedInput: {
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          borderRadius: theme.shape.borderRadius,
          "& .MuiPickersOutlinedInput-notchedOutline": {
            borderColor: theme.palette.divider,
          },
          ...getPickersOutlinedStyleOverrides(
            resolvePickersInputSize(ownerState),
          ).root,
        }),
        sectionsContainer: ({ ownerState }) =>
          getPickersOutlinedStyleOverrides(resolvePickersInputSize(ownerState))
            .sectionsContainer,
      },
    },
    MuiPickersFilledInput: {
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          borderRadius: theme.shape.borderRadius,
          ...getPickersOutlinedStyleOverrides(
            resolvePickersInputSize(ownerState),
          ).root,
        }),
        sectionsContainer: ({ ownerState }) =>
          getPickersOutlinedStyleOverrides(resolvePickersInputSize(ownerState))
            .sectionsContainer,
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
          variants: theme.palette.primary.gradient
            ? [
                {
                  props: { variant: "filled", color: "primary" },
                  style: {
                    backgroundImage: theme.palette.primary.gradient,
                  },
                },
              ]
            : [],
        }),
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
        }),
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
        }),
        list: ({ theme }) => ({
          padding: theme.spacing(0.5),
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing(0.3),
        }),
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
        }),
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        // Sidebar / drawers de borda — sem raio.
        // O molecule `Drawer` (@/ui) sobrescreve com inset + raio flutuante.
        paper: {
          borderRadius: 0,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
        }),
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
        }),
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
        },
      },
    },
  },
} satisfies ThemeOptions;

export type DesignSystemTokens = typeof baseTokens;
