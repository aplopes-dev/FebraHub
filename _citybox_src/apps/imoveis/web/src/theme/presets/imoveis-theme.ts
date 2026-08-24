import { createAppTheme, type ThemeOptions } from '@citybox/mui/theme';
import { imoveisSemanticPalette } from '../semantic-palette';
import { listifyAutofillSurfaceStyles } from '../listify-field-styles';
import {
  buildListifyMuiShadows,
  listifyFontFamily,
  listifyGreyscale,
  listifyPrimary,
  listifyRadii,
  listifySemantic,
  listifyShadows,
  listifyTypographyScale,
} from '../tokens';

const type = listifyTypographyScale;

/**
 * Tema Imóveis — Design Guide Listify (Figma).
 *
 * - Cores: Primary / Greyscale / Alert / Sky
 * - Tipografia: Manrope (h1–h6 + body)
 * - Radius default: 2xl (20px) — cards/topbar
 * - Shadows: xs…3xl no array MUI
 * - Spacing MUI permanece 8px (compat. `sx` existente). Escala Listify
 *   (4px base) está em `listifySpacingPx` — use tokens ou px explícitos.
 */
export const imoveisThemeOptions = {
  shape: {
    borderRadius: listifyRadii['2xl'],
  },
  shadows: buildListifyMuiShadows() as ThemeOptions['shadows'],
  palette: {
    primary: {
      main: listifyPrimary[300],
      light: listifyPrimary[100],
      dark: listifyPrimary[200],
      contrastText: '#FFFFFF',
    },
    ...imoveisSemanticPalette,
    background: {
      default: listifySemantic.canvas,
      paper: listifySemantic.paper,
      header: listifySemantic.paper,
    },
    secondary: {
      main: listifyGreyscale[25],
      light: listifyGreyscale[0],
      dark: listifyGreyscale[50],
      contrastText: listifyGreyscale[800],
    },
    muted: {
      main: listifyGreyscale[25],
      light: listifyGreyscale[0],
      dark: listifyGreyscale[50],
      contrastText: listifyGreyscale[400],
    },
    text: {
      primary: listifySemantic.textPrimary,
      secondary: listifySemantic.textSecondary,
    },
    divider: listifyGreyscale[50],
    sidebar: {
      main: listifyGreyscale[25],
      light: listifyGreyscale[0],
      dark: listifyGreyscale[50],
      contrastText: listifyGreyscale[800],
      background: listifySemantic.paper,
      border: listifyGreyscale[100],
      panelShadow: listifyShadows.none,
    },
  },
  typography: {
    fontFamily: listifyFontFamily,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: { ...type.h1, fontFamily: listifyFontFamily },
    h2: { ...type.h2, fontFamily: listifyFontFamily },
    h3: { ...type.h3, fontFamily: listifyFontFamily },
    h4: { ...type.h4, fontFamily: listifyFontFamily },
    h5: { ...type.h5, fontFamily: listifyFontFamily },
    h6: { ...type.h6, fontFamily: listifyFontFamily },
    subtitle1: {
      ...type.bodyLarge,
      fontFamily: listifyFontFamily,
    },
    subtitle2: {
      ...type.bodySmall,
      fontFamily: listifyFontFamily,
    },
    body1: {
      ...type.bodyMedium,
      fontFamily: listifyFontFamily,
    },
    body2: {
      ...type.bodySmall,
      fontFamily: listifyFontFamily,
    },
    caption: {
      ...type.bodyXSmall,
      fontFamily: listifyFontFamily,
    },
    button: {
      fontFamily: listifyFontFamily,
      fontWeight: 500,
      fontSize: 16,
      lineHeight: 1.6,
      letterSpacing: 0,
      textTransform: 'none' as const,
    },
    overline: {
      ...type.bodyXSmall,
      fontFamily: listifyFontFamily,
      textTransform: 'none' as const,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: listifyFontFamily,
          fontWeight: 400,
          letterSpacing: 0,
        },
        /**
         * Autofill do Chromium/Safari pinta fundo azul/amarelo no valor
         * preenchido — neutraliza em inputs nativos e MUI.
         */
        'input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active, textarea:-webkit-autofill, textarea:-webkit-autofill:hover, textarea:-webkit-autofill:focus, textarea:-webkit-autofill:active, select:-webkit-autofill, select:-webkit-autofill:hover, select:-webkit-autofill:focus, select:-webkit-autofill:active':
          {
            transition: 'background-color 99999s ease-in-out 0s',
          },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          borderRadius: listifyRadii.full,
          ...(ownerState.variant === 'contained' && ownerState.color === 'primary'
            ? {
                boxShadow: listifyShadows.none,
                '&:hover': {
                  boxShadow: listifyShadows.none,
                },
              }
            : {
                boxShadow: listifyShadows.none,
                '&:hover': {
                  boxShadow: listifyShadows.xs,
                },
              }),
          variants: [
            {
              props: { variant: 'contained', color: 'inherit' },
              style: {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.secondary.main
                    : theme.palette.secondary.light,
                color: theme.palette.text.primary,
                boxShadow: listifyShadows.none,
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? theme.palette.secondary.dark
                      : theme.palette.secondary.main,
                  boxShadow: listifyShadows.none,
                },
              },
            },
            {
              props: { variant: 'outlined', color: 'inherit' },
              style: {
                color: theme.palette.text.primary,
                borderColor: theme.palette.divider,
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.secondary.light
                    : theme.palette.background.paper,
                '&:hover': {
                  borderColor: theme.palette.divider,
                  backgroundColor: theme.palette.secondary.main,
                },
              },
            },
          ],
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: listifyRadii.full,
        },
      },
    },
    /**
     * Ícones de ação (copiar, visualizar senha, lixeira, etc.):
     * cor de texto secundária + hover na superfície neutra do sistema.
     */
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.secondary,
          borderRadius: listifyRadii.full,
          '&:hover': {
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.text.primary,
          },
          '&.Mui-disabled': {
            color: theme.palette.action.disabled,
          },
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: listifyRadii.full,
          color: theme.palette.text.primary,
          /**
           * Fundo do campo permanece na superfície do root; o input filho
           * sem cor de fundo evita o azul do browser no foco/autofill.
           */
          '& .MuiOutlinedInput-input': {
            color: theme.palette.text.primary,
            WebkitTextFillColor: theme.palette.text.primary,
            backgroundColor: 'transparent',
            ...listifyAutofillSurfaceStyles(
              theme.palette.mode === 'dark'
                ? theme.palette.secondary.light
                : theme.palette.background.paper,
              theme.palette.text.primary,
            ),
          },
        }),
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.primary,
        }),
        input: ({ theme }) => ({
          color: theme.palette.text.primary,
          WebkitTextFillColor: theme.palette.text.primary,
          backgroundColor: 'transparent',
          ...listifyAutofillSurfaceStyles(
            theme.palette.mode === 'dark'
              ? theme.palette.secondary.light
              : theme.palette.background.paper,
            theme.palette.text.primary,
          ),
          '&.Mui-disabled': {
            color: theme.palette.text.secondary,
            WebkitTextFillColor: theme.palette.text.secondary,
          },
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.primary,
          borderColor: theme.palette.divider,
        }),
        head: ({ theme }) => ({
          color: theme.palette.text.secondary,
        }),
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.primary,
        }),
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.secondary,
          '&.Mui-focused': {
            color: theme.palette.primary.main,
          },
        }),
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: listifyRadii['2xl'],
        },
        elevation1: { boxShadow: listifyShadows.xs },
        elevation2: { boxShadow: listifyShadows.sm },
        elevation4: { boxShadow: listifyShadows.md },
        elevation8: { boxShadow: listifyShadows.lg },
        elevation12: { boxShadow: listifyShadows.xl },
        elevation16: { boxShadow: listifyShadows['2xl'] },
        elevation24: { boxShadow: listifyShadows['3xl'] },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: listifyRadii['2xl'],
          boxShadow: listifyShadows.xs,
        },
      },
    },
    /** Fallback visual se alguém importar Dialog cru — preferir `@/components/ui/modal`. */
    MuiDialog: {
      defaultProps: {
        fullWidth: true,
        maxWidth: 'sm',
        slotProps: {
          /** Só no Dialog — não aplicar em Select/Menu/Popover (MuiBackdrop global vazava overlay). */
          backdrop: {
            sx: {
              backgroundColor: 'rgba(13, 13, 18, 0.12)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            },
          },
        },
      },
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: '28px',
          border:
            theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(255, 255, 255, 0.35)',
          backgroundColor:
            theme.palette.mode === 'dark'
              ? 'rgba(26, 27, 37, 0.94)'
              : 'rgba(255, 255, 255, 0.42)',
          backdropFilter: 'blur(42.599998474121094px)',
          WebkitBackdropFilter: 'blur(42.599998474121094px)',
          boxShadow:
            theme.palette.mode === 'dark'
              ? listifyShadows.lg
              : '0px 2px 8.2px 0px #32323226',
          backgroundImage: 'none',
          padding: 32,
          gap: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }),
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: 0,
          fontSize: '1.25rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.4,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: 0,
          '&.MuiDialogContent-root': { padding: 0 },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: 0,
          gap: 12,
          '& > :not(style)': { margin: 0 },
        },
      },
    },
  },
} satisfies ThemeOptions;

/** Surfaces dark — greyscale invertido mantendo alert tokens. */
export const imoveisDarkPaletteOverrides = {
  background: {
    default: listifyGreyscale[900],
    paper: listifyGreyscale[800],
    header: listifyGreyscale[800],
  },
  /**
   * Neutros no dark: evitar 700/800 (apagados no canvas) e 500 (claro demais).
   * main = controles secundários; light = superfícies um pouco mais baixas; dark = hover.
   */
  secondary: {
    main: listifyGreyscale[600],
    light: listifyGreyscale[700],
    dark: listifyGreyscale[500],
    contrastText: listifyGreyscale[0],
  },
  muted: {
    main: listifyGreyscale[700],
    light: listifyGreyscale[600],
    dark: listifyGreyscale[500],
    contrastText: listifyGreyscale[200],
  },
  text: {
    primary: listifyGreyscale[0],
    secondary: listifyGreyscale[300],
  },
  /**
   * action.* default do MUI light (preto) vazava no dark e pintava
   * IconButtons (copiar link, mostrar senha) de preto.
   */
  action: {
    active: listifyGreyscale[300],
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(255, 255, 255, 0.12)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.08)',
    focus: 'rgba(255, 255, 255, 0.12)',
  },
  divider: listifyGreyscale[700],
  sidebar: {
    main: listifyGreyscale[600],
    light: listifyGreyscale[700],
    dark: listifyGreyscale[500],
    contrastText: listifyGreyscale[0],
    background: listifyGreyscale[800],
    border: listifyGreyscale[700],
    panelShadow: listifyShadows.none,
  },
} as const;

/** Tema estático light (sem accent dinâmico) — Storybook / tests. */
export const imoveisTheme = createAppTheme(imoveisThemeOptions);
