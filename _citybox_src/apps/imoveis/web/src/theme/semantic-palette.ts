/**
 * Status colors — Listify Alert + Sky (Figma Design Guide).
 *
 * - `light` → badge/chip background (scale 0/25)
 * - `main` → accent (scale 100/200)
 * - `dark` → text on soft / saturated
 */

import {
  listifyError,
  listifySky,
  listifySuccess,
  listifyWarning,
} from './tokens/colors';

export const imoveisSemanticPalette = {
  success: {
    main: listifySuccess[200],
    light: listifySuccess[0],
    dark: listifySuccess[300],
    contrastText: '#FFFFFF',
  },
  error: {
    main: listifyError[100],
    light: listifyError[0],
    dark: listifyError[200],
    contrastText: '#FFFFFF',
  },
  warning: {
    main: listifyWarning[100],
    light: listifyWarning[0],
    dark: listifyWarning[200],
    contrastText: listifyWarning[300],
  },
  info: {
    main: listifySky[100],
    light: listifySky[0],
    dark: listifySky[200],
    contrastText: '#FFFFFF',
  },
} as const;

/** Dark-mode status — superfícies profundas + acentos claros. */
export const imoveisSemanticPaletteDark = {
  success: {
    main: listifySuccess[50],
    light: listifySuccess[300],
    dark: listifySuccess[50],
    contrastText: listifySuccess[300],
  },
  error: {
    main: listifyError[50],
    light: listifyError[300],
    dark: listifyError[50],
    contrastText: listifyError[300],
  },
  warning: {
    main: listifyWarning[50],
    light: listifyWarning[300],
    dark: listifyWarning[50],
    contrastText: listifyWarning[300],
  },
  info: {
    main: listifySky[50],
    light: listifySky[300],
    dark: listifySky[50],
    contrastText: listifySky[300],
  },
} as const;
